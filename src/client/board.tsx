import * as React from "react";
import "./board.scss";
import { observer } from "mobx-react";
import Square from "./square";
import { Identity, Location } from "./utilities";
import { checkForEndConditions } from "./logic";

export interface BoardProps {
    background: string;
    size: number;
}

@observer
export default class Board extends React.Component<BoardProps> {
    private gameState: Identity[][];
    private maxMoveCount: number;
    private elapsedMoves = 0;

    constructor({ size, ...remaining }: BoardProps) {
        super({ size, ...remaining });
        this.gameState = Array<Array<Identity>>();
        for (let row = 0; row < size; row++) {
            this.gameState.push(Array<Identity>(size).fill(Identity.None));
        }
        this.maxMoveCount = size * size;
    }

    private handleMove = (identity: Identity, { row, column }: Location) => {
        this.elapsedMoves++
        const { gameState } = this;
        const { size } = this.props;
        console.log(`Hey, square (${row}, ${column}) goes to Player ${identity.toUpperCase()}!`);
        gameState[row][column] = identity;

        let winner: Identity;
        if ((winner = checkForEndConditions(gameState, size)) !== Identity.None) {
            this.notifyPlayerEndGame(`Congratulations, Player ${winner.toUpperCase()}! You've won!`);
        } else if (this.elapsedMoves === this.maxMoveCount) {
            this.notifyPlayerEndGame("Well, it's a draw!");
        }
    }

    private notifyPlayerEndGame = (message: string) => {
        setTimeout(() => {
            alert(message);
            window.location.reload();
        }, 500);
    }

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
                    <Square
                        notifyBoard={this.handleMove}
                        location={{ row, column }}
                    />
                );
            }
            board.push(<div className={"row"}>{...rowContents}</div>);    
        }
        return <div className={"board"}>{...board}</div>;
    }

    render() {
        const { background } = this.props;
        return (
            <div
                className={"container"}
                style={{ background }}
            >
                {this.board}
            </div>
        );
    }

}