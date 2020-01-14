import * as React from "react";
import "../style/square.scss";
import { observable, action } from "mobx";
import { observer } from "mobx-react";
import { Identity, Location, src } from "../logic/utilities";

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
    pixelSideLength: number;
    location: Location;
    notifyBoard(resolved: Identity, location: Location): void;
}

@observer
export default class Square extends React.Component<SquareProps> {
    /**
     * Because we want our rendering to reflect changes in the values of these instance variables,
     * they must be marked as @observable (so that mobx knows when to tell React to re-render).
     * https://mobx.js.org/refguide/observable.html 
     */
    @observable public identity: Identity = Identity.None;
    @observable private opacity = opacityValues.idle;

    /**
     * Because we're changing values marked as @observable (namely, this.identity and this.opacity),
     * we have to mark this method as an @action to tell mobx to pay attention to this *state change*
     * and ultimately tell React to re-render.
     * https://mobx.js.org/refguide/action.html 
     */
    @action
    private displayIdentity = (target: Identity) => {
        if (this.identity === Identity.None) {
            const { notifyBoard, location } = this.props;
            this.identity = target;
            this.opacity = opacityValues.activated;
            notifyBoard(target, location);
        }
    }

    /**
     * This decides what to show in the middle of the square, based
     * on the internal state specified by this.identity.
     * 
     * Again, it is an accessor, not a proper function.
     */
    private get content() {
        const { pixelSideLength: length } = this.props;
        const { identity } = this;
        if (identity === Identity.None) {
            // this null is technically JSX, and indicates that React should just
            // render nothing and leave the DOM alone. Better practice than rendering
            // an empty <div></div>, for example, if you want there to be no effect (i.e. 
            // a blank board square).
            return (null);
        }
        const squareLength = length / 2;
        return (
            <img
                // here's how we hook into the css (scss) styling
                // we've written: this "letter" string matches the
                // css selector we're importing on line 2 from ../style/square.scss
                className={"letter"}
                style={{
                    width: squareLength,
                    height: squareLength
                }}
                src={src(`${identity}.png`)}
            />
        );
    }

    render() {
        // does this look odd? Fair enough! But it's actually an awesome
        // feature of JavaScript and, thus, TypeScript. It's called
        // 'object destructuring syntax,' and is just a much cleaner way of saying
        // const opacity = this.opacity. It might seem small here, but with larger
        // objects, it can be quite handy.
        // https://codeburst.io/es6-destructuring-the-complete-guide-7f842d08b98f 
        const { pixelSideLength: length } = this.props;
        const { opacity } = this;
        return (
            <div
                className={"square"}
                // our first event! i.e. when this <div> is clicked, execute the following function
                // https://reactjs.org/docs/handling-events.html 
                onClick={() => this.displayIdentity(Identity.X)}
                // this is just the unintuitive built-in name for onRightClick()
                onContextMenu={e => {
                    // some events have default behaviors built into the browser, like popping up a context
                    // menu in this case. We don't want that to bother ours users when they right click, so 
                    // we can take the reference to the event object that we have, e, and tell it to prevent any
                    // default behavior associated with its firing. Also, be sure to learn about its friend e.stopPropagation().
                    // https://medium.com/@jacobwarduk/how-to-correctly-use-preventdefault-stoppropagation-or-return-false-on-events-6c4e3f31aedb
                    e.preventDefault();
                    this.displayIdentity(Identity.O)
                }}
                // these are effectively the on / off hover events
                // the syntax in these functions might be odd at first, but it's a one-lined
                // way of writing:
                // if (this.identity === Identity.None) {
                //     this.opacity = opacityValues.hover;     
                // }
                onPointerEnter={() => this.identity === Identity.None && (this.opacity = opacityValues.hover)}
                onPointerLeave={() => this.identity === Identity.None && (this.opacity = opacityValues.idle)}
                // again we have object destructuring syntax, but on the other side:
                // this line is telling the style property to take in an object whose key is 'opacity', and
                // whose value is given by the local variable 'opacity' assigned on line 111. But, rather than writing
                // style={{ opacity: opacity }}, TypeScript is smart enough to assign the variable with that name to that particular key.
                style={{
                    width: length,
                    height: length,
                    opacity
                }}
            >
                {this.content}
            </div>
        );
    }

}