import { Identity } from "./utilities";

export function checkForEndConditions(gameState: Identity[][], size: number) {
    let winner: Identity

    // check rows
    for (let row = 0; row < size; row++) {
        winner = gameState[row][0];
        if (winner !== Identity.None) {
            for (let column = 1; column < size; column++) {
                if (gameState[row][column] !== winner) {
                    winner = Identity.None;
                    break;
                }
            }
            if (winner !== Identity.None) {
                return winner;
            }
        }
    }

    // check columns
    for (let column = 0; column < size; column++) {
        winner = gameState[0][column];
        if (winner !== Identity.None) {
            for (let row = 1; row < size; row++) {
                if (gameState[row][column] !== winner) {
                    winner = Identity.None;
                    break;
                }
            }
            if (winner !== Identity.None) {
                return winner;
            }
        }
    }

    // check top left / bottom right diagonal
    winner = gameState[0][0];
    if (winner !== Identity.None) {
        for (let i = 1; i < size; i++) {
            if (gameState[i][i] !== winner) {
                winner = Identity.None;
                break;
            }
        }
        if (winner !== Identity.None) {
            return winner;
        }
    }

    // check bottom left / top right diagonal
    const end = size - 1
    winner = gameState[0][end];
    if (winner !== Identity.None) {
        for (let i = 1; i < size; i++) {
            if (gameState[i][end - i] !== winner) {
                winner = Identity.None;
                break;
            }
        }
        if (winner !== Identity.None) {
            return winner;
        }
    }

    // no winners
    return Identity.None;
} 