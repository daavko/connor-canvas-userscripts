export interface SvelteStore<T> {
    reset: () => void;
    subscribe: (callback: (value: T) => void) => () => void;
    set: (value: T) => void;
    update: (updater: (value: T) => T) => void;
}

export function getValue<T>(store: SvelteStore<T>): T {
    let value: T;
    store.subscribe((v) => (value = v))();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- value is always set in subscribe
    return value!;
}
