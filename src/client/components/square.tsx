/**
 * https://www.typescriptlang.org/docs/handbook/modules.html#import
 */
import * as React from "react";
import "../style/square.scss";
import { observable, action } from "mobx";
import { observer } from "mobx-react";
import { Identity, Location, Utilities } from "../logic/utilities";

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
 * type. This is a simple example. You can define more generic maps like
 * 
 * interface NumberDictionary { [key: string]: number }
 * 
 * Take a look here for all the cool interfaces you can define!
 * 
 * https://www.typescriptlang.org/docs/handbook/interfaces.html
 */
interface SquareProps {
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
     * This looks like a regular function, but note the 'get' before
     * the name: this it's more like an instance variable on steriods!
     * It's a getter, or an instance variable that uses some logic before
     * returning the underlying value.
     * 
     * It's invoked by this.content, NOT this.content().
     * https://www.typescriptlang.org/docs/handbook/classes.html#accessors
     */
    private get content() {
        const { identity } = this;
        if (identity === Identity.None) {
            // this null is technically JSX, and indicates that React should just
            // render nothing and leave the DOM alone. Better practice than rendering
            // an empty <div></div>, for example, if you want there to be no effect (i.e. 
            // a blank board square).
            return (null);
        }
        return (
            <img
                // here's how we hook into the css (scss) styling
                // we've written: this "letter" string matches the
                // css selector we're importing on line 2 from ./square.scss
                className={"letter"}
                src={Utilities.src(`${identity}.png`)}
            />
        );
    }

    /**
     * This is where the magic happens: this is where React looks for you
     * to tell it what to render. Unlike all the regular TypeScript so far
     * in this file, the return value is pure JSX, that superset of HTML.
     * You can render HTML, or other custom sub-components, and pass in properties, react
     * to events and much more!
     * https://reactjs.org/docs/rendering-elements.html 
     */
    render() {
        // does this look odd? Fair enough! But it's actually one of my
        // favorite features of JavaScript and, thus, TypeScript. It's called
        // 'object destructuring syntax,' and is just a much cleaner way of saying
        // const opacity = this.opacity. It might seem small here, but with larger
        // objects, it can be quite handy.
        // https://codeburst.io/es6-destructuring-the-complete-guide-7f842d08b98f 
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
                    // menu in this case. I don't want that to bother my user when he or she right clicks, so 
                    // I can take the reference to the event object that I have, e, and tell it to prevent any
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
                style={{ opacity }}
            >
                {this.content}
            </div>
        );
    }

}