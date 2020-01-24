import * as React from "react";
import "../style/square.scss";
import "../style/shared.scss";
import { observable, action } from "mobx";
import { observer } from "mobx-react";
import { Identity, Location, src, IdentityColors } from "../logic/utilities";
import { dropEventName } from "./board";

/**
 * Out here, we're in the module, where we can just
 * define constants (these are peers in scope to our following class
 * declaration) and use them inside our class below.
 */
const opacityValues = {
    idle: 0.2,
    hover: 0.4,
    activated: 1,
};

interface SquareProps {
    currentPlayer: Identity;
    pixelSideLength: number;
    location: Location;
    notifyBoard(location: Location): void;
    isGameOver: boolean;
}

@observer
export default class Square extends React.Component<SquareProps> {
    @observable public identity: Identity = Identity.None;
    @observable private opacity = opacityValues.idle;
    @observable private transition = "0.5s opacity ease";

    private get canPlay(): boolean {
        return this.identity === Identity.None && !this.props.isGameOver;
    }

    @action
    private makeMove = (): void => {
        if (this.canPlay) {
            const { notifyBoard, location, currentPlayer } = this.props;
            this.identity = currentPlayer;
            this.opacity = opacityValues.activated;
            notifyBoard(location);
        }
    }

    private get content(): JSX.Element | null {
        const { pixelSideLength: length } = this.props;
        const { identity } = this;
        if (identity === Identity.None) {
            /**
             * This (null) is technically JSX, and indicates that React should just
             * render nothing and leave the DOM alone. Better practice than rendering
             * an empty <div></div>, for example, if you want there to be no effect (i.e.
             * a blank board square).
             */
            return (null);
        }
        const squareLength = length / 2;
        return (
            <img
                className={"letter passive"} // here we have two class names, so the .letter and .passive selectors apply to this image
                style={{
                    width: squareLength,
                    height: squareLength
                }}
                src={src(`${identity}.png`)}
            />
        );
    }

    render(): JSX.Element {
        /**
         * Does this 'const { myVar } = parent' look odd? Fair enough! But it's actually an awesome
         * feature of JavaScript and, thus, TypeScript. It's called
         * 'object destructuring syntax,' and is just a much cleaner way of saying
         * const opacity = this.opacity. It might seem small here, but with larger
         * objects, it can be quite handy.
         * https://codeburst.io/es6-destructuring-the-complete-guide-7f842d08b98f 
         */
        const { pixelSideLength: length } = this.props; // this is equivalent to 'const length = this.props.pixelSideLength'
        const { opacity, transition } = this;
        /**
         * Now, we'll start hooking into event code in the JSX below!
         * https://reactjs.org/docs/handling-events.html 
         */
        return (
            <div
                // this is where we tell the square to listen to the custom event we throw in the parent
                // component (in Board.tsx) when the drag target is dropped over a square
                ref={e => e && e.addEventListener(dropEventName, () => {
                    this.transition = "none";
                    this.makeMove();
                })}
                className={"square tile"}
                // when this <div> is clicked, execute the following function
                onClick={this.makeMove}
                // this is just the unintuitive built-in name for onRightClick()
                onContextMenu={e => {
                    /**
                     * Some events have default behaviors built into the browser, like popping up a context
                     * menu in this case. We don't want that to bother ours users when they right click, so 
                     * we can take the reference to the event object that we have, e, and tell it to prevent any
                     * default behavior associated with its firing. Also, be sure to learn about its friend e.stopPropagation().
                     * https://medium.com/@jacobwarduk/how-to-correctly-use-preventdefault-stoppropagation-or-return-false-on-events-6c4e3f31aedb
                     */
                    e.preventDefault();
                    this.makeMove()
                }}
                // hover events
                onPointerEnter={() => this.canPlay && (this.opacity = opacityValues.hover)}
                onPointerLeave={() => this.canPlay && (this.opacity = opacityValues.idle)}
                /**
                 * Again we have object destructuring syntax, but on the other side:
                 * this line is telling the style property to take in an object whose key is 'opacity', and
                 * whose value is given by the local variable 'opacity'. But, rather than writing
                 * style={{ opacity: opacity }}, TypeScript is smart enough to assign the variable with that name to that particular key.
                 */
                style={{
                    backgroundColor: IdentityColors.get(this.identity),
                    width: length,
                    height: length,
                    opacity,
                    transition
                }}
            >
                {this.content}
            </div>
        );
    }

}