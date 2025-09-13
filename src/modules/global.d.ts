export interface SavedHowl {
    _src: string;
    _volume: number;
    _sprite: unknown;
    _duration: number;
    load: () => void;
}

export interface Howler {
    _howls: SavedHowl[];
}

declare global {
    interface Window {
        Howler: Howler;
    }
}
