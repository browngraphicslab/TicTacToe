export namespace Utilities {

    export function url(target: string) {
        return `url(images/${target})`;
    }

}

export interface Location {
    row: number;
    column: number;
}

export enum Identity {
    None = "none",
    X = "x",
    O = "o"
}