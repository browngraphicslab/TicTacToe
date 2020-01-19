# Tic Tac Toe

## Introduction

Hello! These files are here to offer you a couple different resources. The directory `./src/client/solution` contains two different
well-commented solution files to give you a complete walkthrough of one implementation of Tic Tac Toe. However, if you want to try it out on your own first, edit any and all of the files in `./src/client/stencil` (with outlines, imports and some function signatures already in place) to write your own implementation!

## Structure
Here's a high level overview of the project's internal structure:

![Project Overview](/src/assets/images/overview.png)

## Installation

After cloning the repository, from the project root directory, run:

`npm install && npm run make`

Open up the browser, go to http://localhost:1050 and start playing!

 ## Run the solutions:
 
Run `npm run make` in the command line from the root folder of the project and go to http://localhost:1050/tic-tac-toe for the standard solution, or http://localhost:1050/tic-tac-toe/advanced for the slightly more complex version that talks to the server to store information across page refreshes.

## Run your implementation:

After making your changes, you'll need to compile ([transpile](https://howtodoinjava.com/typescript/transpiler-vs-compiler/)) your code and start the server. Run `npm run make` in the command line from the root folder of the project and go to http://localhost:1050/tic-tac-toe/stencil. 

## How to Play

X is given the first move, and the game will internally keep track of turns. Click on the desired square to move, or
drag the tile icon and drop it on the desired square.

## Extension Challenges

If you're looking for a challenge, try implementing:
1) Undo / redo of moves
2) Notify the user of end of more gracefully
3) Make each move timed: if the user takes too long, forfeit their move and give control to their opponent
4) Highlighting the winning row / column / diagonal
5) Adding routes to the server to send and receive more information
6) Swap out the database.json file for an actual MongoDB or Mongoose client

## Bugs

Please report any bugs to samwilkins333@gmail.com.
