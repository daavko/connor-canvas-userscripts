import type { SvelteStore } from './svelte-store';

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

export declare class TemplateClass {
    constructor(
        boardUrl: URL,
        imageUrl: string,
        show?: boolean,
        x?: number,
        y?: number,
        title?: string,
        width?: number,
        height?: number,
        conversion?: unknown,
    );

    boardUrl: URL;
    url: string;
    show: boolean;
    x: number;
    y: number;
    title: string;
    width: number;
    height: number;
    conversion: unknown;

    link(): string;
}
type TemplateClassType = typeof TemplateClass;

type TemplateStoreSetter = (store: SvelteStore<TemplateClass[]>) => void;
type TemplateClassSetter = (templateClassType: typeof TemplateClass) => void;

declare global {
    interface Window {
        Howler: Howler;
        dccusSetTemplatesStore: TemplateStoreSetter;
        dccusSetTemplateClass: TemplateClassSetter;
    }
}
