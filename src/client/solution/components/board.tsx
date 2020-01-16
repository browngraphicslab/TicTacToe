/**
 * https://www.typescriptlang.org/docs/handbook/modules.html#import
 */
import * as React from "react";
import "../style/board.scss"; // import css directly like this
import { observer } from "mobx-react"; // this is how your import a module's standard export
import Square from "./square"; // this is how you import a module's *default* export
import { Identity, Location, src } from "../logic/utilities";
import { checkForEndConditions } from "../logic/analysis";
import { observable, action, reaction, IReactionDisposer, computed } from "mobx";

/**
 * One of the issues with plain JavaScript objects is that they can literally
 * hold anything. This is flexible, but it can be hard to know what to expect
 * when you're given an object without context, and can make it a lot easier
 * to accidentally pass in the wrong type (string[] vs string, for example).
 * 
 * Interfaces to the rescue!
 * 
 * These types are just contracts that say, hey, if you're an object of this type,
 * you should expect me to have the following keys that map to the values of the given
 * type. This is a simple example. You can define more generic interfaces, and then use
 * one in the definition of the other!
 * 
 * // defines a generic interface
 * interface DataValue<T> {
 *     value: T;
 *     modifiedTime: number;
 *     id: string;
 * }
 * 
 * // uses the generic interface in the definition of another generic interface
 * interface DataDictionary<T> {
 *     [key: string]: DataValue<T>
 * }
 * 
 * // and you can use it as follows...
 * const dictionary: DataDictionary<string> = {}
 * const id = "1234-5678-9102";
 * const datum: DataElement<string> = {
 *     value: "Hello World!",
 *     modifiedTime: Date.now(),
 *     id
 * }
 * dictionary[id] = datum;
 * 
 * ...
 * 
 * const retrieved = dictionary[id]
 * console.log(retrieved.value) // outputs Hello World! 
 * 
 * Take a look here for all the cool interfaces you can define!
 * https://www.typescriptlang.org/docs/handbook/interfaces.html
 * 
 * Here, an interface is used to specify what types of properties
 * the component should expect to receive, and thus what the parent needs
 * to provide.
 */
interface BoardProps {
    background: string;
    dimensions: number;
    /**
     * Note that the following ? suffixes mean the parameter is optional, and doesn't need to be supplied.
     * http://dotnetpattern.com/typescript-optional-parameters
     */
    opacity?: number;
    height?: string;
    onGameEnd?: (winner: Identity) => any;
}

/**
 * To the exent possible, avoid magic numbers
 * and factor out values into constants.
 */
const squarePadding = 5;

/**
 * All components that we work with should be marked @observer so that they can React to mobx's state management.
 * You might correctly note that this class has no @observable instance variables, so it does not need to be
 * @observer to function. However, in practice, you might need to unexpectedly add observable functionality to your component
 * and add an @observable instance variable, and it's very easy to have perfect code that won't work because your component
 * that once didn't have to observe observable variables now does, and isn't.
 */
@observer
export default class Board extends React.Component<BoardProps> {
    /**
     * These are instance variables, just like in Java (or any other major language).
     * Note that some are marked @observable, and others are not. In a nutshell, observables are tracked
     * by mobx, and changing their values will tell React to re-render, so changes to their values will
     * be reflected on screen, changing either themselves or other values that rely on them.
     * https://mobx.js.org/refguide/observable.html
     */
    @observable private elapsedMoves = 0;
    @observable private dragTargetX = 0;
    @observable private dragTargetY = 0;
    @observable private currentPlayer = Identity.X;
    @observable private pixelSideLength?: number;

    /**
     * React References (refs) answer the question "How can I take the JSX that I'm rendering
     * and reference it directly in my TypeScript logic?". Here, the ref is being used to
     * access the bounding box of the div in this.onResize(), which would not be possible from the JSX alone.
     * https://reactjs.org/docs/refs-and-the-dom.html 
     */
    private containerRef = React.createRef<HTMLDivElement>();
    private gameState: Identity[][];
    private maxMoveCount = 0;
    /**
     * When a component unmounts, it's important to clean up after your
     * reactions so that they don't continue to execute. Helpfully, reaction(...)
     * returns a so-called disposer, which is a just a function you can call to
     * end the reaction. That's why this dimensionUpdateDisposer is called in componentWillUnmount()
     * https://mobx.js.org/refguide/reaction.html 
     */
    private dimensionUpdateDisposer: IReactionDisposer;
    private isGameOver = false;

    // take a look at the object destructuring link in ./square.tsx at
    // the top of the render method to gain some insight onto this { size, ...remaining } syntax
    constructor(props: BoardProps) {
        // if you explictly define a constructor in a subclass, the first line must be super(), and here, we must pass in our props to React.
        super(props);
        // build a 'size by size' matrix to model the state of the game board
        this.gameState = this.constructBoardLogic();
        window.addEventListener("resize", this.onResize);

        /**
         * Reactions answer the question "Wouldn't it be nice to run some code every time (an) @observable value(s) change(s)"?
         * The syntax might look weird at first, but building a reaction just means writing two functions and passing them into the
         * imported reaction() function. The first, or data, function contains all the
         * *observable* 'triggers' you care about, and will return some value. The second function will take, as an input, that same value
         * returned from the first function, and contains all the logic you want to execute in response to the change.
         * 
         * In plain English, this next line can be explained as: "Every time the number of dimensions passed in changes, we have to
         * re-build the board with the updated dimensions". Note that this works only if the variable passed in AS the prop is @observable
         * (Look at the third instance variable in AdvancedBoard.tsx), since reactions react only to changes in @observable variables
         * 
         * https://mobx.js.org/refguide/reaction.html
         */
        this.dimensionUpdateDisposer = reaction(
            () => this.props.dimensions,
            () => this.gameState = this.constructBoardLogic()
        )
    }

    /**
     * The following two functions are built-in React component lifecycle functions.
     * Technically, so is render()! In short, they're helpful, built in hooks that
     * React calls automatically at different points in your component's rendering lifecycle.
     * https://programmingwithmosh.com/javascript/react-lifecycle-methods/ 
     */

    componentDidMount() {
        this.onResize();
    }

    componentWillUnmount() {
        this.dimensionUpdateDisposer();
    }

    /**
     * This 'get' signature defines a TypeScript accessor. It's like an instance
     * variable on steroids! It might look like a regular function, but you invoke it as this.hasGameStarted,
     * for example, NOT this.hasGameStarted().
     * https://www.typescriptlang.org/docs/handbook/classes.html#accessors 
     */
    @computed
    public get hasGameStarted() {
        return this.elapsedMoves > 0;
    }

    @computed
    private get squareSideLength() {
        const { dimensions } = this.props;
        const { pixelSideLength: length } = this;
        if (!length) {
            return 0
        }
        /**
         * Here's one row of a board with three squares:
         * 
         * [-|===|--|===|--|===|-]
         * 
         * [ denotes the perimeter of the entire board
         * - denotes the square's padding, 5 by default
         * === denotes the square's width
         * 
         * So, each square is given by -|===|-, or 2 * squarePadding + ?, where ? is the
         * square's actual side length, the value this accessor is trying to compute.
         * Because we know what the total pixel length of one side of the entire board has to be (this.pixelSideLength)
         * we know that each square's side length is given by (length / <sum of all padding>) / <number of squares we need>
         * For n squares, there are 2n lengths of padding introduced to the grid (above, see the 6 -'s given 3 -|===|-)
         * So this becomes (length - (2 * dimensions * squarePadding)) / dimensions.
         */
        // 
        return (length - (squarePadding * dimensions * 2)) / dimensions;
    }

    @computed
    private get opacity() {
        const { opacity } = this.props;
        if (opacity === undefined) {
            return 1;
        }
        return opacity;
    }

    @computed
    private get height() {
        const { height } = this.props;
        if (height === undefined) {
            return "100%";
        }
        return height;
    }

    /**
     * This uses the passed-in dimensions
     * to build a two dimensional array (matrix)
     * to keep track of the underlying board state.
     */
    private constructBoardLogic = () => {
        const outer = Array<Array<Identity>>();
        const { dimensions } = this.props;
        for (let row = 0; row < dimensions; row++) {
            outer.push(Array<Identity>(dimensions).fill(Identity.None));
        }
        this.maxMoveCount = dimensions * dimensions;
        return outer;
    }

    /**
     * Whenever the window resizes, we want our grid of squares to
     * resize with it so that it's always precisely as large as it can be
     * while staying completely in view.
     * Here, we use the React reference we made earlier to get a handle
     * on the div that wraps all our content, and we can use the updated size
     * the DOM reports for that div (i.e. after resize) to compute the necessary
     * values of the individual squares in the grid. 
     */
    @action
    private onResize = () => {
        const { current } = this.containerRef;
        if (current) {
            const { width, height } = current.getBoundingClientRect();
            this.pixelSideLength = Math.min(width - 200, height - 100);
        }
    }

    /**
     * This records a move, taking note of the location of the square
     * associated with the move, as well as the identity of the player
     * that triggered it. 
     */
    private handleMove = ({ row, column }: Location) => {
        this.elapsedMoves++ // increment the move counter
        const { gameState } = this;

        /**
         * If you want to see messages in the browser development console (super helpful for
         * debugging!), just drop a quick console.log. Note that the backticks, or ``, allow for
         * templating syntax (like a nicer version of Java's String.format()). This is sometimes
         * also called string interpolation.
         * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals 
         */
        console.log(`Hey, square (${row}, ${column}) goes to Player ${this.currentPlayer.toUpperCase()}!`);

        // update the board state to reflect the move
        gameState[row][column] = this.currentPlayer;

        /**
         * Toggle to the opponent using a ternary statement (a handy and concise way of writing if / else)
         * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Conditional_Operator 
         */
        this.currentPlayer = this.currentPlayer === Identity.X ? Identity.O : Identity.X;

        /**
         * Check for end of game conditions, and if the game is over, begin the exit routine.
         * This is what's called an inner assignment: not only do we execute checkForEndCondition(gameState),
         * we also assign the value it returns to 'winner' in one fell swoop, and then use that value
         * when evaluating the comparison of identities and in the call to notifyPlayerEndGame in the following line.
         */
        let winner: Identity;
        if ((winner = checkForEndConditions(gameState)) !== Identity.None || this.elapsedMoves === this.maxMoveCount) {
            this.notifyPlayerEndGame(winner);
        }
    }

    /**
     * This records the mouse movement and edits the
     * dragTarget's position accordingly. Since the dragTarget's
     * offset values are @observable when we change them, we need
     * to annotate the function in which they are changed as an
     * @action . Be aware that this does not work well for asynchronous code,
     * for which you should use mobx's runInAction()
     * https://mobx.js.org/refguide/action.html 
     */
    @action
    private onPointerMove = ({ movementX, movementY }: PointerEvent) => {
        this.dragTargetX += movementX;
        this.dragTargetY += movementY;
    };

    @action
    private onPointerUp = ({ x, y }: PointerEvent) => {
        /**
         * Here, we have to get a little creative when handling the 'drop' of the dragTarget onto a given square.
         * Since our 'dragging' just consists of moving the transform and not some drag event, the square's won't receive
         * a native drop event. So what do we do? If this HTML page were a cork board with paper squares on it, we basically
         * put a thumbtack in the board at the location where the pointer up event fired, and take a look at all the elements
         * (stacked in the Z direction) that intersect with the point at which this event occurs.
         * Since the squares don't overlap, we just find the guaranteed one element then find the one that corresponds to the board
         * square over which we dropped the dragger. Then, we can call out to it
         * with a custom event (for which it's listening), which will cause the square to call
         * (as a prop, from its perspective) this boards handleMove() with its location. Pretty cool!
         */
        const [square] = document.elementsFromPoint(x, y).filter(element => element.className === "square");
        square && square.dispatchEvent(new CustomEvent("play"))

        // once the drag has ended after pointer up, stop listening
        window.removeEventListener("pointermove", this.onPointerMove);
        window.removeEventListener("pointerup", this.onPointerUp);

        // reset the drag target to its original untransformed state
        this.dragTargetX = 0;
        this.dragTargetY = 0;
    };

    /**
     * You can listen to different events 
     */
    private startDrag = () => {
        window.removeEventListener("pointermove", this.onPointerMove);
        window.removeEventListener("pointerup", this.onPointerUp);
        window.addEventListener("pointermove", this.onPointerMove);
        window.addEventListener("pointerup", this.onPointerUp);
    }

    /**
     * Here, we wait 500 milliseconds before notifying the player on screen. In this case, we do this to allow
     * the animation fade in of the tile's identity to occur before ending the game.
     * https://www.w3schools.com/jsref/met_win_settimeout.asp
     * 
     * Alert is just a helpful way of notifying the user with some message, and the user can't interact
     * with your app until / unless they click 'ok' on the alert.
     * https://developer.mozilla.org/en-US/docs/Web/API/Window/alert 
     */
    private notifyPlayerEndGame = (winner: Identity) => {
        // prevents the user from clicking on other squares once the game has ended
        this.isGameOver = true;

        let message: string;
        switch (winner) {
            case Identity.X:
            case Identity.O:
                message = `Congratulations, Player ${winner.toUpperCase()}! You've won!`;
                break;
            case Identity.None:
            default:
                message = "Well, it's a draw!";
        }

        // notify the parent component if they've passed in a handler property
        const { onGameEnd } = this.props;
        onGameEnd && onGameEnd(winner);

        setTimeout(() => {
            alert(message);
            window.location.reload(); // you can programmatically refresh the page (to reset the game state) - cool!
        }, 500);
    }

    /**
     * This is a helper method that returns the JSX needed to display the board.
     */
    @computed
    private get renderBoard() {
        const { dimensions } = this.props;
        const { pixelSideLength: length } = this;
        const valid = dimensions > 2
        /**
         * If the dimensions are invalid, the board variable will not
         * be updated and the warning will be displayed
         */
        let board: JSX.Element[] = [<h1 className={"board-warning passive"}>Your board must be at least 3 by 3 squares...</h1>];
        if (valid) {
            board = [];
            for (let row = 0; row < dimensions; row++) {
                const rowContents: JSX.Element[] = [];
                for (let column = 0; column < dimensions; column++) {
                    rowContents.push(
                        /**
                         * note that you can write JSX literally outside of the render method (technically this is
                         * fully within the render method since that's the only place it's called). You can see why
                         * having a reusable component is handy here: we can give each one customized information, but
                         * each square will behave in almost identical ways.
                         */
                        <Square
                            /**
                             * Here we have a sort of inversion of control, where we pass in a callback function as a property
                             * and thus, we allow the child component to capture some of the parent's logic and call it on demand.
                             * So here, individual squares are responsible of notifying the board that they've been clicked. 
                             */
                            notifyBoard={this.handleMove}
                            location={{ row, column }}
                            pixelSideLength={this.squareSideLength}
                            currentPlayer={this.currentPlayer}
                            isGameOver={this.isGameOver}
                        />
                    );
                }
                board.push(<div className={"board-row"}>{...rowContents}</div>);
            }
        }
        return (
            <div
                className={"board"}
                style={{
                    width: length,
                    height: length,
                    opacity: this.opacity,
                    display: valid ? "block" : "flex"
                }}
            >{...board}</div>
        );
    }

    private get renderDragTarget() {
        return (
            <div
                onPointerDown={this.startDrag}
                className={"drag-target"}
                /**
                 * You can move and resize elements on screen without actually
                 * changing their literal x, y, width and height properties. Instead, you
                 * can edit the transform for a nice, lightweight and flexible level of control.
                 * Note that these values (dragTargetX, dragTargetY) must be observable, so that
                 * when they change, React renders and updates the transform on screen.
                 * https://www.w3schools.com/cssref/css3_pr_transform.asp 
                 */
                style={{ transform: `translate(${this.dragTargetX}px, ${this.dragTargetY}px)` }}
            >
                <img
                    className={"drag-hand passive"}
                    src={src("move.png")}
                />
            </div>
        );
    }

    /**
     * This is where the magic happens: this is where React looks for you
     * to tell it what to render. The return value is pure JSX, that superset of HTML.
     * You can render HTML, or other custom sub-components, and pass in properties, react
     * to events and much more!
     * https://reactjs.org/docs/rendering-elements.html 
     */
    render() {
        const { background } = this.props;
        const { height } = this;
        return (
            <div
                ref={this.containerRef}
                /**
                 * Here's how we hook into the static css (scss) style sheets
                 * we've written: this "board-cointainer" string matches the
                 * css selector we're importingfrom ../style/board.scss.
                 */
                className={"board-container"}
                /**
                 * But, for values that need to be changed dynamically based on
                 * logic in these component files, we can also update the style
                 * prop of the JSX element at runtime
                 */
                style={{ background, height }}
            >
                {/* rather than writing literal JSX, we can use an accessor or a function that *returns* JSX */}
                {this.renderDragTarget}
                {this.renderBoard}
            </div>
        );
    }

}