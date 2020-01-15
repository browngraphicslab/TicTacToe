import * as React from "react";
import "../style/stateful_board.scss";
import { observer } from "mobx-react";
import { observable, action, runInAction, autorun, computed } from "mobx";
import Board from "./board";
import { Server } from "../logic/utilities";

interface StatefulBoardProps {
    background: string;
}

@observer
export default class StatefulBoard extends React.Component<StatefulBoardProps> {
    @observable private opacity = 0;
    @observable private board = React.createRef<Board>();
    @observable private _dimensions = 3;

    private get dimensions() {
        return this._dimensions;
    }
    private set dimensions(dimensions: number) {
        runInAction(() => this._dimensions = dimensions);
        Server.Post("/state", { dimensions });
    }

    @computed
    private get gameStarted() {
        const { current } = this.board;
        return current ? current.gameStarted : false;
    }

    componentDidMount() {
        Server.Get("/dimensions").then(action(({ dimensions }) => {
            this.opacity = 1;
            this.dimensions = dimensions;
        }));
    }

    private get slider() {
        const visibility = !this.gameStarted ? "visible" : "hidden";
        return (
            <input
                style={{ visibility }}
                type={"range"}
                min={3}
                max={10}
                className={"slider"}
                onChange={({ target: { value } }) => this.dimensions = Number(value)}
                value={this.dimensions}
            />
        );
    }

    render() {
        return (
            <div className={"outer"}>
                <Board
                    ref={this.board}
                    dimensions={this._dimensions}
                    opacity={this.opacity}
                    height={this.gameStarted ? "100%" : "calc(100% - 40px)"}
                    background={this.props.background}
                />
                {this.slider}
            </div>
        );
    }

}