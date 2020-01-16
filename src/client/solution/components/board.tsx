/**
 * https://www.typescriptlang.org/docs/handbook/modules.html#import
 */
import * as React from "react";
import "../style/board.scss"; // import css directly like this
import { observer } from "mobx-react"; // this is how your import a module's standard export
import Square from "./square"; // this is how you import a module's *default* export
import { Identity, Location, src, IdentityColors } from "../logic/utilities";
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
// exported this value since it's imported and used in setting up the event handler in Square.tsx
export const dropEventName = "dragTargetDropped";


/**
 * All components that we work with should be marked @observer so that they can React to mobx's state management.
 * Even if components lack @observable instance variables, it it is considered good practice to mark them
 * as @observers since you might need to add @observable instance variables down the road. At this point, if your
 * component is not an observer and you expect it to be responsive to changes in @observables, it can seem like there
 * are serious issues with your code even if it's written correctly.
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
    // move counter (@observable only because it is needed as such in AdvancedBoard.tsx)
    @observable private elapsedMoves = 0;
    // set the x, y translation of the transform of the drag target
    @observable private dragTargetX = 0;
    @observable private dragTargetY = 0;
    // stores the identity of the player responsible for the current move
    @observable private currentPlayer = Identity.X; // Player X starts
    // stores the pixel length one side of the board grid can be, proportional to the window size
    @observable private pixelSideLength?: number;

    /**
     * React References (refs) answer the question "How can I take the JSX that I'm rendering
     * and reference it directly in my TypeScript logic?". Here, the ref is being used to
     * access the bounding box of the div in this.onResize(), which would not be possible from the JSX alone.
     * https://reactjs.org/docs/refs-and-the-dom.html 
     */
    private containerRef = React.createRef<HTMLDivElement>();
    // a matrix that logically mirrors the graphical state of the board
    private gameState: Identity[][];
    // a simple computation that, when compared to the elapsed move count, determines when the game has ended
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

    constructor(props: BoardProps) {
        // if you explictly define a constructor in a subclass, the first line must be super(),
        // at which point you pass your props up to the React.Component parent from which you inherit
        super(props);
        // with an n-dimensional board, builds an n by n matrix to model the state of the game board
        this.gameState = this.constructBoardLogic();
        // set up the functionality that keeps the board appropriately sized when window dimensions change
        window.addEventListener("resize", this.computePixelSideLength);

        /**
         * Mobx reactions answer the question "Wouldn't it be nice to run some code every time (an) @observable value(s) change(s)"?
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
     * Technically, so is render()! In short, they're helpful, built in hooks to execute custom logic that
     * React calls automatically at different points in your component's rendering lifecycle.
     * https://programmingwithmosh.com/javascript/react-lifecycle-methods/ 
     */

    componentDidMount() {
        // set the board to the appropriate initial size when the component first mounts
        this.computePixelSideLength();
    }

    componentWillUnmount() {
        /**
         * This won't really be necessary in this case, since the board component
         * never actually unmounts (disappears) in *this* application, but in general this is
         * where you should call all reaction disposers.
         */
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

    /**
     * This @computed tag is another mobx state management feature.
     * Whenever you use an accessor that returns a value based off of
     * @observables, mobx will cache or store the value, and when the accessor is called
     * again, if none of the underlying observable values have changed, the stored
     * value will be returned (avoiding needless re-computation).
     * https://mobx.js.org/refguide/computed-decorator.html
     */
    @computed
    private get squareSideLength() {
        const { dimensions } = this.props;
        const { pixelSideLength: length } = this;
        if (!length) {
            return 0
        }
        /**
         * To explain the calculation, note that we're given
         * a target side length, and we have to now figure out
         * how big each of squares should be given that there will be n (for some fixed n)
         * squares displayed, each one having some equal padding on either side, all of which
         * sums up to the side length.
         * 
         * For example, here's one row of a board with three squares:
         * 
         * [-|===|--|===|--|===|-]
         * 
         * [ denotes the perimeter of the entire board
         * | denotes a square's side
         * - denotes the square's padding, 5 by default
         * === denotes the square's width
         * 
         * So, each square is given by -|===|-, or 2 * squarePadding + ?, where ? is the
         * square's actual side length, the value this accessor is trying to compute.
         * Because we know what the total pixel length of one side of the entire board has to be (this.pixelSideLength)
         * we know that each square's side length is given by (pixelSideLength - <sum of all padding>) / <number of squares we need>
         * For n squares, there are 2n lengths of padding introduced to the grid (above, see the 6 -'s given 3 -|===|-)
         * So this becomes (length - (2 * dimensions * squarePadding)) / dimensions.
         */
        // 
        return (length - (squarePadding * dimensions * 2)) / dimensions;
    }

    /**
     * "If we have opacity in our props, use it. Otherwise, 
     * return 1 by default."
     */
    @computed
    private get opacity() {
        const { opacity } = this.props;
        if (opacity === undefined) {
            return 1;
        }
        return opacity;
    }

    /**
     * "If we have height in our props, use it. Otherwise, 
     * return 100% by default."
     */
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
        this.maxMoveCount = dimensions * dimensions; // an n by n board has at most n^2 squares / moves
        return outer;
    }

    /**
     * Whenever the window resizes, we want our grid of squares to
     * resize with it so that it's always precisely as large as it can be
     * while staying completely in view.
     * Here, we use the React reference we made earlier to get a handle
     * on the div that wraps all our content, and we can use the updated size
     * that the DOM reports for that div (i.e. after resize) to compute the necessary
     * values of the individual squares in the grid. 
     */
    @action
    private computePixelSideLength = () => {
        const { current } = this.containerRef;
        if (current) {
            const { width, height } = current.getBoundingClientRect();
            const horizontalPadding = 100;
            const verticalPadding = 50
            // whichever dimension is limiting decides the actual allocated pixel size for the board grid
            this.pixelSideLength = Math.min(width - 2 * horizontalPadding, height - 2 * verticalPadding);
        }
    }

    /**
     * This records a move, taking note of the location of the square
     * associated with the move, as well as the identity of the player
     * that triggered it. This is declared in this Board class to be able to
     * access game state and instance variables, but is invoked only in Square.tsx,
     * since it is passed in as a prop to <Square /> instances.
     */
    private handleMove = ({ row, column }: Location) => {
        this.elapsedMoves++ // increment the move counter
        const { gameState } = this;

        /**
         * If you want to see messages in the browser development console (super helpful for
         * debugging!), just drop in a quick console.log() statement, as follows. Note that the backticks,
         * or ``, found right above your tab key, allow for templating syntax (acts like an arguably nicer
         * version of Java's String.format()). This is sometimes also called string interpolation.
         * Expect an output like "Hey, square (0, 2) goes to Player X!".
         * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals 
         */
        console.log(`Hey, square (${row}, ${column}) goes to Player ${this.currentPlayer.toUpperCase()}!`);

        // update the board state to reflect the move
        gameState[row][column] = this.currentPlayer;

        /**
         * Toggle to the opponent using a ternary statement (a handy and concise way of writing if / else).
         * On the right hand side of the single equals sign, you have any arbitrary expression that evaluates to a
         * boolean: if that boolean evaluates to true, we assign the evaluation of the expression to the left of the colon,
         * otherwise, we assign the evaluation ofthe expression to the right. Note that this works in cases beyond assignment
         * in TypeScript too:
         * 
         * const printTrue = () => console.log("The boolean was true");
         * const printTrue = () => console.log("The boolean was false");
         * const flag = true;
         * flag ? printTrue() : printFalse(); // expected output is "The boolean was true" logged to the console
         * 
         * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Conditional_Operator 
         */
        this.currentPlayer = (this.currentPlayer === Identity.X) ? Identity.O : Identity.X;

        /**
         * Check for end of game conditions, and if the game is over, begin the exit routine.
         * Note that explicitly typing winner as Identity is optional, but can be helpful for
         * readability.
         */
        const winner: Identity = checkForEndConditions(gameState);
        if (winner !== Identity.None || this.elapsedMoves === this.maxMoveCount) {
            this.notifyPlayerEndGame(winner);
        }
    }

    /**
     * The next three functions enable the user to drag the dragTarget (that is otherwise a
     * standard <div/>) around the screen and ultimately drop it on a given square to make a move.
     */

    /**
     * You can listen and later unsubscribe to different events at the window or document level
     * https://www.w3schools.com/jsref/met_document_addeventlistener.asp
     */
    private startDrag = () => {
        /**
         * These calls to addEventListener are not exclusive - take the following code:
         * 
         * window.addEventListener("pointerdown", () => console.log("Hello"));
         * window.addEventListener("pointerdown", () => console.log("Hello"));
         * window.addEventListener("pointerdown", () => console.log("Hello"));
         * 
         * Now, when the user fires an on pointer down event, the console will print:
         * 
         * Hello
         * Hello
         * Hello
         * 
         * So, to eliminate any chance of having these duplicate handlers, we always remove
         * a window or document based (not JSX!) listener from the target before adding it. 
         */

        // remove listeners for safety
        window.removeEventListener("pointermove", this.onPointerMove);
        window.removeEventListener("pointerup", this.onPointerUp);

        // assign the listeners, triggered when the user moves the mouse or releases a click
        window.addEventListener("pointermove", this.onPointerMove);
        window.addEventListener("pointerup", this.onPointerUp);
    }

    /**
     * This handler records the mouse movement and edits the
     * offset of the dragTarget's transform accordingly, allowing it to move freely across
     * the screen. Since the dragTarget's offset values are @observable, when we change them, we need
     * to annotate the function in which they are changed as an
     * @action. Be aware that this does not work well for asynchronous code,
     * for which you should use mobx's runInAction() to apply to the synchronous pieces of code within
     * your function that actually carry out the assignment.
     * https://mobx.js.org/refguide/action.html 
     */
    @action
    private onPointerMove = ({ movementX, movementY }: PointerEvent) => {
        this.dragTargetX += movementX;
        this.dragTargetY += movementY;
    };

    /**
     * Here, we have to get a little creative when handling the 'drop' of the dragTarget onto a given square.
     * Since our 'dragging' just consists of moving the transform and not some drag event, the squares won't receive
     * a native drop event. So what do we do? If this HTML page were a cork board with paper squares on it, we basically
     * put a thumbtack in the board at the location where the pointer up event fired, and take a look at all the elements
     * (stacked in the Z direction) that intersect with the point at which this event occurs.
     * Since the squares don't overlap, we just find the guaranteed one element that corresponds to the board
     * square over which we dropped the dragger. Then, we can 'call out' to it by dispatching to it a
     * a custom event (an event for which it's listening), which will cause the square to call
     * (as a prop, from its perspective) this boards handleMove() with its location. Pretty cool!
     */
    @action
    private onPointerUp = ({ x, y }: PointerEvent) => {
        // determine, from all elements on screen that intersect with the event's point, which was a square
        // if this syntax looks weird, take a look at http://budiirawan.com/typescript-destructuring-array/
        const [square] = document.elementsFromPoint(x, y).filter(element => element.className === "square");
        /**
         * This next line of code might seem like odd syntax as well, but it's a concise
         * way of writing 
         * 
         * if (square !== null && this.square !== undefined) {
         *     square.dispatchEvent(...);
         * }
         * 
         * In JavaScript and TypeScript, there's a concept of truthy and falsey values
         * https://www.sitepoint.com/javascript-truthy-falsy/
         * For example, 0, null, undefined, "" (the empty string) and, of course, false, are all falsy, so
         * if you pass any of those into a conditional statement, the statement will return false.
         * 
         * So, that simplifies our case down to
         * 
         * if (square) {
         *     square.dispatchEvent(...);
         * }
         * 
         * Finally, though there's literally no difference other than being more concise,
         * you can use logical short circuiting to simulate the if / else logic.
         * 
         * square && square.dispatchEvent(...);
         * 
         * Here, as with any boolean evaluation, if square is false (or falsy, i.e. undefined), the entire
         * expression as a whole cannot return anything other than false, since false && <anything> will always
         * be false. TypeScript, and many other languages, will handle this intelligently by not even bothering
         * to evaluate the second clause of the expression, which, in our case, is square.dispatchEvent(...).
         * https://codeburst.io/javascript-short-circuit-evaluation-3709ffda6384  
         * 
         * So, this all boils down to: if square is not undefined, then evaluate the second clause, i.e. dispatch
         * the event. It's one of the many nice null checks built into the language: an equivalent would be:
         * 
         * square?.dispatchEvent(...);
         * 
         * https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html#optional-chaining 
         * 
         */
        square && square.dispatchEvent(new CustomEvent<{}>(dropEventName, { bubbles: true }));

        // once the drag has ended after pointer up, stop listening
        window.removeEventListener("pointermove", this.onPointerMove);
        window.removeEventListener("pointerup", this.onPointerUp);

        /**
         * Resets the drag target to its original untransformed state.
         * Either the user has dropped it successfully onto a square, or the user missed a square and
         * dropped it onto the backround. Either way, it needs to be reset.
         */
        this.dragTargetX = 0;
        this.dragTargetY = 0;
    };

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
        const isValid = dimensions > 2
        /**
         * If the dimensions are invalid, the board variable will not
         * be updated and the warning will be displayed
         */
        let board: JSX.Element[] = [<h1 className={"board-warning passive"}>Your board must be at least 3 by 3 squares...</h1>];
        if (isValid) {
            /**
             * Otherwise, the board will become an dimensions by dimensions grid of squares
             */
            board = [];
            for (let row = 0; row < dimensions; row++) {
                const rowContents: JSX.Element[] = [];
                for (let column = 0; column < dimensions; column++) {
                    rowContents.push(
                        /**
                         * Note that you can factor out your JSX outside of the literal render method. This is technically
                         * still within the umbrella of the render method since that's the only place this is called, but it's
                         * a nice way to keep things clean and logically separated.
                         * 
                         * You can see why having a reusable component is handy here: we can give Sqyare one customized information
                         * as props, but beyond those differences each Square will behave and render itself identically.
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
                    display: isValid ? "block" : "flex" // another ternary statement
                }}
            >{...board}</div>
        );
    }

    /**
     * This displays the small tile to the left of the board that
     * can be dropped onto a board square to make a move.
     */
    private get renderDragTarget() {
        const { startDrag, dragTargetX, dragTargetY, currentPlayer } = this;
        if (this.isGameOver) {
            return (null);
        }
        return (
            <div
                onPointerDown={startDrag}
                className={"drag-target"}
                /**
                 * You can move and resize elements on screen (such as this one) without actually
                 * changing their literal x, y, width and height properties. Instead, you
                 * can edit the transform for a nice, lightweight and flexible level of control.
                 * Note that these values (dragTargetX, dragTargetY) must be observable, so that
                 * when they change, React renders and updates the transform on screen.
                 * https://www.w3schools.com/cssref/css3_pr_transform.asp 
                 */
                style={{
                    transform: `translate(${dragTargetX}px, ${dragTargetY}px)`,
                    backgroundColor: IdentityColors.get(currentPlayer)
                }}
            >
                <img
                    className={"drag-hand passive"}
                    src={src(`${currentPlayer}.png`)} // more string templating (string interpolation)
                />
            </div>
        );
    }

    /**
     * This is where the magic happens: here, React looks for you
     * to tell it what to render. The return value is pure JSX, a sort of superset of HTML.
     * You can render HTML, or other custom sub-components, and pass in properties, insert custom
     * handlers for events, and much more!
     * https://reactjs.org/docs/introducing-jsx.html
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
                 * css selector we're importingfrom ../style/board.scss, and thus
                 * all the scss you've written for that selector will be applied to this
                 * div (as well as any others that share its name and are in files that also
                 * import the style sheet).
                 */
                className={"board-container"}
                /**
                 * But, for values that need to be changed dynamically based on
                 * logic in these component files, we can also forgo the style
                 * sheet and update the style prop of the JSX element at runtime:
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
