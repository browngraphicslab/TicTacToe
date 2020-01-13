import * as React from "react";
import "../style/board.scss";
import { observer } from "mobx-react";

/**
 * TODO: Define the properties your board will accept.
 */
interface BoardProps {
}

@observer
export default class Board extends React.Component<BoardProps> {
    /**
     * TODO: Declare instance variables here (if / as needed).
     * @observable private instanceVar1 = "changing me won't update my rendered value :("
     * private instanceVar2 = "changing me will update my rendered value :)"
     */

    /**
     * TODO: Create a constructor that initializes a 2-dimensional matrix
     * to record game state and any other instance variables (if / as needed).
     */

    /**
     * TODO: Define at least one helper arrow function that can be passed down
     * to <Square /> instances that contains logic to handle each move.
     * Consider the following, potentially each in its own helper method:
     * 1) Updating the game state
     * 2) Checking the updated game state for end conditions
     * 3) If the game is over, notify the user in some way that the game has ended and who won 
     */

    /**
     * Implement a private accessor that programmatically builds the board
     * (consider creating an n by n grid of <Square /> instances
     * by building n rows (<div>'s) each containing n <Square />'s) and returns it
     * to the render() method.
     * 
     * You should not use just the <span> as given. It's a meaningless placeholder!
     */
    private get board() {
        return <span style={{ backgroundColor: "white" }} >Hey, I should be a board!</span>;
    }

    /**
     * Use render to display the board. The wrapper <div>
     * will be styled by a css selector by the same name in
     * ../../style/stencil/board.scss.
     */
    render() {
        return (
            <div className={"board-container"}>{this.board}</div>
        );
    }

}
