import * as React from "react";
import "../style/square.scss";
import { observer } from "mobx-react";

interface SquareProps {
}

@observer
export default class Square extends React.Component<SquareProps> {
    /**
     * TODO: declare instance variables here (if / as needed).
     * @observable private instanceVar1 = "changing me won't update my rendered value :("
     * private instanceVar2 = "changing me will update my rendered value :)"
     */


    /**
     * TODO: define an arrow function that informs the parent component (in Board.tsx)
     * that a move has been made. Hint: props are readonly, but if you pass in a function
     * from Board as a prop, you can call it to capture a value down here in Square and effectively pass it back up. 
     */

    /**
     * TODO: write JSX that defines the view (and handles any events)
     * for an individual board square.
     */
    render() {
        return (<div className={"square"}>Hey I'm a square!</div>);
    }

}