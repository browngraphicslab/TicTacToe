export namespace Utilities {

    export function url(image: string) {
        return `url(images/${image})`;
    }

    export function src(image: string) {
        return `/images/${image}`;
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