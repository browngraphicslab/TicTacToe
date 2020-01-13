/**
 * https://www.typescriptlang.org/docs/handbook/modules.html#import
 */
import * as React from "react";
import "../style/board.scss";
import { observer } from "mobx-react";
import Square from "./square";
import { Identity, Location } from "../logic/utilities";
import { checkForEndConditions } from "../logic/analysis";

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
    size: number;
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
    private gameState: Identity[][];
    private maxMoveCount: number;
    private elapsedMoves = 0;

    // take a look at the object destructuring link in ./square.tsx at
    // the top of the render method to gain some insight onto this { size, ...remaining } syntax
    constructor({ size, ...remaining }: BoardProps) {
        // if you explictly define a constructor in a subclass, the first line must be super(), and here, we must pass in our props to React.
        super({ size, ...remaining });
        // build a 'size by size' matrix to model the state of the game board
        this.gameState = Array<Array<Identity>>();
        for (let row = 0; row < size; row++) {
            this.gameState.push(Array<Identity>(size).fill(Identity.None));
        }
        this.maxMoveCount = size * size;
    }

    /**
     * This records a move, taking note of the location of the square
     * associated with the move, as well as the identity of the player
     * that triggered it. 
     */
    private handleMove = (identity: Identity, { row, column }: Location) => {
        this.elapsedMoves++
        const { gameState } = this;
        // if you want to see messages in the browser development console (super helpful for
        // debugging!), just drop a quick console.log. Note that the backticks, or ``, allow for
        // templating syntax (like a nicer version of Java's String.format())
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals
        console.log(`Hey, square (${row}, ${column}) goes to Player ${identity.toUpperCase()}!`);

        // update the board state to reflect the move
        gameState[row][column] = identity;

        // this is what's called an inner assignment: not only do we execute checkForEndCondition(gameState),
        // we also assign the value it returns to 'winner' in one fell swoop, and then use that value
        // when evaluating the comparison of identities
        let winner: Identity;
        if ((winner = checkForEndConditions(gameState)) !== Identity.None) {
            this.notifyPlayerEndGame(`Congratulations, Player ${winner.toUpperCase()}! You've won!`);
        } else if (this.elapsedMoves === this.maxMoveCount) {
            this.notifyPlayerEndGame("Well, it's a draw!");
        }
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
    private notifyPlayerEndGame = (message: string) => {
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
    private get board() {
        const { size } = this.props;
        if (size < 3) {
            return <h1>Your board must be at least 3 by 3 squares...</h1>
        }
        const board: JSX.Element[] = [];
        for (let row = 0; row < size; row++) {
            const rowContents: JSX.Element[] = [];
            for (let column = 0; column < size; column++) {
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
                    />
                );
            }
            board.push(<div className={"row"}>{...rowContents}</div>);    
        }
        // this final value has wrapped up the entire hierarchy (a 3 by 3 example is given):
        // <div class="board">
        //     <div class="row">
        //          <Square ... />
        //          <Square ... /> 
        //          <Square ... />
        //     </div> 
        //     <div class="row">
        //          <Square ...>
        //          <Square ...> 
        //          <Square ...> 
        //     </div>
        //     <div class="row">
        //          <Square ...>
        //          <Square ...> 
        //          <Square ...> 
        //     </div>
        // </div>
        // note that this is NOT 
        return <div className={"board"}>{...board}</div>;
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
        return (
            // literal JSX
            <div
                // here's how we hook into the css (scss) styling
                // we've written: this "cointainer" string matches the
                // css selector we're importing on line 5 from ../style/board.scss
                className={"container"}
                style={{ background }}
            >
                {/* rather than writing literal JSX, we can use an accessor or a function that *returns* JSX */}
                {this.board}
            </div>
        );
    }

}
