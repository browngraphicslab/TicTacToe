import * as React from "react";
import * as ReactDOM from "react-dom";
import Board from "./components/board";

/**
 * This is a React component, invoked by writing JSX. JSX is a superset
 * of HTML, so it includes things like <div></div>, <img />, etc, but
 * it also accepts these custom built chunks of HTML wrapped up into
 * something called a component.
 * 
 * https://www.w3schools.com/react/react_components.asp 
 * 
 * Components are a little bit like conventional classes, but at its core,
 * a component is just a reusable chunk of code that renders some templated visual. This visual
 * is defined in a render() method, but you can also add public / private / etc. functions and instance variables
 * to your component, just like a class, to factor out logic that either
 * assists in the rendering or reacts to events triggered by rendered elements.
 * 
 * Confused about .ts and .tsx files? Think of the difference in terms of the "all squares are rectangles
 * but not all rectangles are squares" model: you cannot write JSX (again, think even
 * more flexible / powerful HTML) in a .ts file, but you
 * can write regular Typescript in both .ts and .tsx files.
 * For example, React Components are written in .tsx files, since they contain JSX, but you can (and should!) write
 * any additional Typescript logic in the bodies of your component classes, thus also within the .tsx file. As you'll
 * see later on in the project, however, I've also factored out a particularly long function into its own separate
 * logic.ts file, which I can import and use in my component's .tsx file.
 * 
 * So here we have a simple Tic Tac Toe game.
 * 
 * NOTE: To play as X, left click. To play as O, right click.
 * 
 * The project contains the following component hierarchy:
 * 
 * Board
 *  Square
 * 
 * In the render() method of my Board component, I've figured out a template detailing
 * what a board should look like. But what if I don't want to be locked into the conventional
 * 3 by 3 board? Do I have to hard-code everything into my component? No! The whole point of components
 * is that they are flexible, and react (seems like this word is coming up a lot!) to information around, or
 * more specifically, above them. Components receive this information from
 * their parents through readonly (for the component, not necessarily for the parent) 'props', or properties.
 * Here, I can tell my board how many squares it should render in each dimension by passing in the
 * number 3 as a size property.
 * 
 * Change it to 4 and rebuild to see the 4 by 4 board!
 * 
 * Now take a look at board.tsx and square.tsx to dive deeper into examples of the structure, features and patterns
 * of React components.
 */
const whatToRender = <Board size={3} background={"#000033"} />;

/**
 * Unlike in a JQuery project, this line is the only time you should ever directly interact with the DOM. In your components,
 * use React references instead, and only if you must.
 * https://reactjs.org/docs/refs-and-the-dom.html
 */
const whereToRender = document.getElementById("root");

/**
 * Think of this as an equivalent to launch(String[] argv) { ... } in Java. This is the
 * very highest level method that gets called.
 * 
 * Browsers have a DOM, or Document Object Model, that's basically just the entire state of
 * the HTML being rendered on screen. But we're writing in React, not working directly with regular HTML
 * DOM elements...so how does the browser know how to take our components and add their output to
 * the DOM? This line right here.
 * 
 * https://reactjs.org/docs/react-dom.html#render 
 */
ReactDOM.render(whatToRender, whereToRender);