import * as React from "react";
import "./board.scss";
import { observable, action } from "mobx";
import { observer } from "mobx-react";
import { Identity, Location } from "./utilities";

export interface SquareProps {
    location: Location;
    notifyBoard(resolved: Identity, location: Location): void;
}

const opacityValues = {
    idle: 0.2,
    hover: 0.4,
    activated: 1,
};

@observer
export default class Square extends React.Component<SquareProps> {
    @observable public identity: Identity = Identity.None;
    @observable private opacity = opacityValues.idle;

    @action
    private displayIdentity = (target: Identity) => {
        if (this.identity === Identity.None) {
            const { notifyBoard, location } = this.props;
            this.identity = target;
            this.opacity = opacityValues.activated;
            notifyBoard(target, location);
        }
    }

    render() {
        const { identity, opacity } = this;
        return (
            <div
                className={"square"}
                onClick={() => this.displayIdentity(Identity.X)}
                onContextMenu={e => {
                    e.preventDefault();
                    this.displayIdentity(Identity.O)
                }}
                onPointerEnter={() => this.identity === Identity.None && (this.opacity = opacityValues.hover)}
                onPointerLeave={() => this.identity === Identity.None && (this.opacity = opacityValues.idle)}
                style={{ opacity }}
            >
                {identity === Identity.None ? (null) : <img src={`/images/${identity}.png`} className={"letter"}/>}
            </div>
        );
    }

}