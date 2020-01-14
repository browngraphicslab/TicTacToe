# Tic Tac Toe

# CODE

If you're a new applicant to the lab, start by focusing exclusively on
the files in ./src/client. Once you're super familiar with those, you can
consider exploring the rest of the code base. Note that a lot of the configuration
files in the root directory are not important to know at this point.

.      &emsp;                     <== the root of the project, direct children are mostly configuration files and this README\n
    ./src                   <== all of your TypeScript source code lives
    ./static                <== Webpack will put the transpiled JavaScript output and copied assets here (images, etc.). Automatically populated, so you shouldn't need to touch it
    ./node_modules          <== running 'npm install' places

# GAME

After cloning the repository, from the project root directory, run:

npm install && npm run make

Open up the browser, go to http://localhost:1050 and start playing!

Instructions: Left click to place an X, and right click to place an O.

# EXTENSIONS

If you're looking for a challenge, try forking the repository for yourself and implementing:
1) Undo / redo of moves
2) Highlighting the winning row / column / diagonal
