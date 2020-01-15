import * as React from "react";
import "../style/advanced_board.scss";
import { observer } from "mobx-react";
import { observable, action, runInAction, computed } from "mobx";
import Board from "./board";
import { Server, Identity } from "../logic/utilities";

interface AdvancedBoardProps {
    background: string;
    minimumDimensions?: number;
    maximumDimensions?: number;
}

@observer
export default class AdvancedBoard extends React.Component<AdvancedBoardProps> {
    @observable private opacity = 0;
    @observable private board = React.createRef<Board>();
    @observable private _dimensions = 3;
    @observable private sliderMin?: number
    @observable private sliderMax?: number

    private get dimensions() {
        return this._dimensions;
    }
    private set dimensions(dimensions: number) {
        runInAction(() => this._dimensions = dimensions);
        Server.Post("/state", { dimensions });
    }

    @computed
    private get hasGameStarted() {
        const { current } = this.board;
        return current ? current.hasGameStarted : false;
    }

    componentDidMount() {
        Server.Get("/dimensions").then(action(({ dimensions }) => {
            this.opacity = 1;
            this.dimensions = dimensions;
        }));
    }

    private get computeSliderRange() {
        if (!(this.sliderMin && this.sliderMax)) {
            let { minimumDimensions: min, maximumDimensions: max } = this.props;
            min = min || 3;
            max = max || 7;
            if (min < 0) {
                min = 3;
            }
            if (max < min) {
                max = min;
            }
            this.sliderMin = min;
            this.sliderMax = max;
        }
        return { min: this.sliderMin, max: this.sliderMax };
    }

    private get shouldShowSlider() {
        const { min, max } = this.computeSliderRange;
        return !this.hasGameStarted && min < max;
    }

    private get renderSlider() {
        const visibility = this.shouldShowSlider ? "visible" : "hidden";
        const { min, max } = this.computeSliderRange;
        if (this.dimensions > max) {
            this.dimensions = max;
        } else if (this.dimensions < min) {
            this.dimensions = min;
        }
        return (
            <input
                style={{ visibility }}
                type={"range"}
                min={min}
                max={max}
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
                    height={this.shouldShowSlider ? "calc(100% - 40px)" : "100%"}
                    background={this.props.background}
                    onGameEnd={winner => Server.Post("/winner", { winner })}
                />
                {this.renderSlider}
            </div>
        );
    }

}