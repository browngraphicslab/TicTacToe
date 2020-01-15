/**
 * https://www.typescriptlang.org/docs/handbook/modules.html#import
 */
import * as React from "react";
import "../style/board.scss";
import { observer } from "mobx-react";
import Square from "./square";
import { Identity, Location, src, Server } from "../logic/utilities";
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
 * 
 * https://www.typescriptlang.org/docs/handbook/interfaces.html
 * 
 * Here, an interface is used to specify what types of properties
 * the component should expect to receive, and thus what the parent needs
 * to provide.
 */
interface BoardProps {
    background: string;
    dimensions: number;
    opacity?: number;
    height?: string;
}

/**
 * All components that we work with should be marked @observer so that they can React to mobx's state management.
 * You might correctly note that this class has no @observable instance variables, so it does not need to be
 * @observer to function. However, in practice, you might need to unexpectedly add observable functionality to your component
 * and add an @observable instance variable, and it's very easy to have perfect code that won't work because your component
 * that once didn't have to observe observable variables now does, and isn't.
 */
@observer
export default class Board extends React.Component<BoardProps> {
    // these are instance variables, just like in Java (or any other major language)
    @observable private pixelSideLength = 500;
    @observable private dragThumbX = 0;
    @observable private dragThumbY = 0;
    @observable private currentPlayer = Identity.X;
    @observable private elapsedMoves = 0;

    private containerRef = React.createRef<HTMLDivElement>();
    private gameState: Identity[][];
    private maxMoveCount = 0;
    private dimensionUpdateDisposer: IReactionDisposer;

    @computed
    public get gameStarted() {
        return this.elapsedMoves > 0;
    }

    private get opacity() {
        const { opacity } = this.props;
        if (opacity === undefined) {
            return 1;
        }
        return opacity;
    }

    private get height() {
        const { height } = this.props;
        if (height === undefined) {
            return "100%";
        }
        return height;
    }

    // take a look at the object destructuring link in ./square.tsx at
    // the top of the render method to gain some insight onto this { size, ...remaining } syntax
    constructor(props: BoardProps) {
        // if you explictly define a constructor in a subclass, the first line must be super(), and here, we must pass in our props to React.
        super(props);
        // build a 'size by size' matrix to model the state of the game board
        this.gameState = this.constructBoardLogic();
        window.addEventListener("resize", this.resize);
        this.dimensionUpdateDisposer = reaction(
            () => this.props.dimensions,
            () => this.gameState = this.constructBoardLogic()
        )
    }

    private constructBoardLogic = () => {
        const outer = Array<Array<Identity>>();
        const { dimensions } = this.props;
        for (let row = 0; row < dimensions; row++) {
            outer.push(Array<Identity>(dimensions).fill(Identity.None));
        }
        this.maxMoveCount = dimensions * dimensions;
        return outer;
    }

    @action
    private resize = () => {
        const { current } = this.containerRef;
        if (current) {
            const { width, height } = current.getBoundingClientRect();
            this.pixelSideLength = Math.min(width, height) - 100;
        }
    }

    /**
     * The following two functions are built-in React component lifecycle functions.
     * Technically, so is render()!
     * https://programmingwithmosh.com/javascript/react-lifecycle-methods/ 
     */

    componentDidMount() {
        this.resize();
    }

    componentWillUnmount() {
        this.dimensionUpdateDisposer();
    }

    /**
     * This records a move, taking note of the location of the square
     * associated with the move, as well as the identity of the player
     * that triggered it. 
     */
    private handleMove = ({ row, column }: Location) => {
        this.elapsedMoves++
        const { gameState } = this;
        // if you want to see messages in the browser development console (super helpful for
        // debugging!), just drop a quick console.log. Note that the backticks, or ``, allow for
        // templating syntax (like a nicer version of Java's String.format())
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals
        console.log(`Hey, square (${row}, ${column}) goes to Player ${this.currentPlayer.toUpperCase()}!`);

        // update the board state to reflect the move
        gameState[row][column] = this.currentPlayer;

        // toggle to the other player using a ternary statement
        this.currentPlayer = this.currentPlayer === Identity.X ? Identity.O : Identity.X;

        // this is what's called an inner assignment: not only do we execute checkForEndCondition(gameState),
        // we also assign the value it returns to 'winner' in one fell swoop, and then use that value
        // when evaluating the comparison of identities
        let winner: Identity;
        if ((winner = checkForEndConditions(gameState)) !== Identity.None || this.elapsedMoves === this.maxMoveCount) {
            this.notifyPlayerEndGame(winner);
        }
    }

    @action
    private onPointerMove = (e: PointerEvent) => {
        this.dragThumbX += e.movementX;
        this.dragThumbY += e.movementY;
    };

    @action
    private onPointerUp = (e: PointerEvent) => {
        const [square] = document.elementsFromPoint(e.x, e.y).filter(element => element.className === "square");
        square && square.dispatchEvent(new CustomEvent("play"))
        window.removeEventListener("pointermove", this.onPointerMove);
        window.removeEventListener("pointerup", this.onPointerUp);
        this.dragThumbX = 0;
        this.dragThumbY = 0;
    };

    private startDrag = () => {
        window.removeEventListener("pointermove", this.onPointerMove);
        window.removeEventListener("pointerup", this.onPointerUp);
        window.addEventListener("pointermove", this.onPointerMove);
        window.addEventListener("pointerup", this.onPointerUp);
    }

    /**
     * This literally just says, hey, wait 500 milliseconds
     * before executing this function. In this case, we do this to allow
     * the animation fade in of the tile's identity to occur before ending the game.
     * 
     * Alert is just a helpful way of notifying the user with some message, and the user can't interact
     * with your app until / unless they click 'ok' on the alert.
     * https://www.w3schools.com/jsref/met_win_settimeout.asp
     * https://developer.mozilla.org/en-US/docs/Web/API/Window/alert 
     */
    private notifyPlayerEndGame = (winner: Identity) => {
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
        Server.Post("/winner", { winner });
        setTimeout(() => {
            alert(message);
            window.location.reload(); // you can programmatically refresh the page (to reset the game state) - cool!
        }, 500);
    }

    /**
     * This is a helper method that returns the JSX needed to display the board.
     * 
     * This looks like a regular function, but note the 'get' before
     * the name: this it's more like an instance variable on steriods!
     * It's a getter, or an instance variable that uses some logic before
     * returning the underlying value.
     * 
     * It's invoked by this.content, NOT this.content().
     * https://www.typescriptlang.org/docs/handbook/classes.html#accessors
     */
    @computed
    private get board() {
        const { pixelSideLength: length } = this;
        const { dimensions } = this.props;
        let board: JSX.Element[] = [<h1 className={"board-warning"}>Your board must be at least 3 by 3 squares...</h1>];
        if (dimensions > 2) {
            board = [];
            for (let row = 0; row < dimensions; row++) {
                const rowContents: JSX.Element[] = [];
                for (let column = 0; column < dimensions; column++) {
                    rowContents.push(
                        // note that you can write JSX literally outside of the render method (technically this is
                        // fully within the render method since that's the only place it's called). You can see why
                        // having a reusable component is handy here: we can give each one customized information, but
                        // each square will behave in almost identical ways.
                        <Square
                            // here we have a sort of inversion of control, where we pass in a callback function as a property
                            // and thus, we allow the child component to capture some of the parent's logic and call it on demand.
                            // so here, individual squares are responsible of notifying the board that they've been clicked. 
                            notifyBoard={this.handleMove}
                            location={{ row, column }}
                            pixelSideLength={(length - 5 * (dimensions * 2)) / dimensions}
                            currentPlayer={this.currentPlayer}
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
                    opacity: this.opacity
                }}
            >{...board}</div>
        );
    }

    private get dragTarget() {
        return (
            <div
                onPointerDown={this.startDrag}
                className={"drag-target"}
                style={{ transform: `translate(${this.dragThumbX}px, ${this.dragThumbY}px)` }}
            >
                <img
                    className={"drag-hand"}
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
                // here's how we hook into the static css (scss) style sheets
                // we've written: this "board-cointainer" string matches the
                // css selector we're importingfrom ../style/stateful-board.scss
                className={"board-container"}
                // but, for values that need to be changed dynamically based on
                // logic in these component files, we can also update the style
                // prop of the JSX element at runtime
                style={{ background, height }}
            >
                {/* rather than writing literal JSX, we can use an accessor or a function that *returns* JSX */}
                {this.dragTarget}
                {this.board}
            </div>
        );
    }

}