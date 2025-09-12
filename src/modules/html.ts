type StringProperties<T> = { [K in keyof T as T[K] extends string ? (K extends number ? never : K) : never]: T[K] };

type CssKeys = keyof StringProperties<CSSStyleDeclaration>;

type AttributesRecord = Record<string, string | number | boolean | null | undefined>;

export interface ElementOptions {
    class?: string | string[];
    id?: string;
    style?: Partial<Record<CssKeys, string>>;
    styleCustomProperties?: Record<string, string>;
    attributes?: AttributesRecord;
}

type SVGElementChild = SVGElement | string;
type HTMLElementChild = HTMLElement | SVGElementChild;

export function el<T extends keyof HTMLElementTagNameMap>(
    name: T,
    options: ElementOptions,
    children?: HTMLElementChild[],
): HTMLElementTagNameMap[T];
export function el<T extends keyof HTMLElementTagNameMap>(
    name: T,
    children?: HTMLElementChild[],
): HTMLElementTagNameMap[T];
export function el<T extends keyof HTMLElementTagNameMap>(
    name: T,
    optionsOrChildren?: ElementOptions | HTMLElementChild[],
    maybeChildren?: HTMLElementChild[],
): HTMLElementTagNameMap[T] {
    const options = Array.isArray(optionsOrChildren) ? undefined : optionsOrChildren;
    const children = Array.isArray(optionsOrChildren) ? optionsOrChildren : maybeChildren;

    const element = document.createElement(name);
    if (options?.class != null) {
        if (Array.isArray(options.class)) {
            element.className = options.class.join(' ');
        } else {
            element.className = options.class;
        }
    }
    setCommonPropsAndChildren(element, options, children);
    return element;
}

export function svgEl<T extends keyof SVGElementTagNameMap>(
    name: T,
    options: ElementOptions,
    children?: SVGElementChild[],
): SVGElementTagNameMap[T];
export function svgEl<T extends keyof SVGElementTagNameMap>(
    name: T,
    children?: SVGElementChild[],
): SVGElementTagNameMap[T];
export function svgEl<T extends keyof SVGElementTagNameMap>(
    name: T,
    optionsOrChildren?: ElementOptions | SVGElementChild[],
    maybeChildren?: SVGElementChild[],
): SVGElementTagNameMap[T] {
    const options = Array.isArray(optionsOrChildren) ? undefined : optionsOrChildren;
    const children = Array.isArray(optionsOrChildren) ? optionsOrChildren : maybeChildren;

    const element = document.createElementNS('http://www.w3.org/2000/svg', name);
    if (options?.class != null) {
        if (Array.isArray(options.class)) {
            element.setAttribute('class', options.class.join(' '));
        } else {
            element.setAttribute('class', options.class);
        }
    }
    setCommonPropsAndChildren(element, options, children);
    return element;
}

function setCommonPropsAndChildren(
    element: HTMLElement | SVGElement,
    options?: ElementOptions,
    children?: HTMLElementChild[],
): void {
    if (options?.id != null) {
        element.id = options.id;
    }
    if (options?.style != null) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- safe, Object.entries isn't typed correctly
        for (const [key, value] of Object.entries(options.style) as [CssKeys, string | undefined][]) {
            if (value != null) {
                element.style[key] = value;
            }
        }
    }
    if (options?.styleCustomProperties) {
        for (const [key, value] of Object.entries(options.styleCustomProperties)) {
            element.style.setProperty(key, value);
        }
    }
    if (options?.attributes != null) {
        for (const [key, value] of Object.entries(options.attributes)) {
            if (typeof value === 'boolean' && value) {
                element.setAttribute(key, '');
            } else if (typeof value === 'string') {
                element.setAttribute(key, value);
            } else if (typeof value === 'number') {
                element.setAttribute(key, value.toString());
            }
        }
    }
    if (children) {
        element.append(...children);
    }
}
