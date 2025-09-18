import type { TemplateClass } from './global';
import type { SvelteStore } from './svelte-store';

let templateStore: SvelteStore<TemplateClass[]> | null = null;
let TemplateClassType: typeof TemplateClass | null = null;
let baseUrl: URL | null = null;

export function bindGlobalsSetters(): void {
    window.dccusSetTemplatesStore = (store): void => {
        templateStore = store;
    };
    window.dccusSetTemplateClass = (templateClassType): void => {
        TemplateClassType = templateClassType;
    };
    window.dccusSetBaseUrl = (url): void => {
        baseUrl = new URL(url);
    };
}

export function getTemplatesStore(): SvelteStore<TemplateClass[]> {
    if (!templateStore) {
        throw new Error('Template store is not set. Make sure to call dccusSetTemplatesStore from the Svelte app.');
    }
    return templateStore;
}

export function getTemplateClassType(): typeof TemplateClass {
    if (!TemplateClassType) {
        throw new Error('TemplateClass type is not set. Make sure to call dccusSetTemplateClass from the Svelte app.');
    }
    return TemplateClassType;
}

export function getBaseUrl(): URL {
    if (!baseUrl) {
        throw new Error('Base URL is not set. Make sure to call dccusSetBaseUrl from the Svelte app.');
    }
    return baseUrl;
}
