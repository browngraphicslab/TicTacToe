import * as React from "react";
import * as ReactDOM from "react-dom";
import MainView from "./board";

/**
 * Think of this as an equivalent to launch(String[] argv) { ... } in Java. This is the
 * very highest level method that gets called.
 * 
 * Browsers have a DOM, or Document Object Model, that's basically just the entire state of
 * the HTML being rendered on screen. But we're writing in React, not working directly with regular HTML
 * DOM elements...so how does the browser know how to take our components and add their output to
 * the DOM? This line right here.
 */
ReactDOM.render(<MainView size={3} background={"#000033"} />, document.getElementById("root"));