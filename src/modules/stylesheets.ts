const INSERTED_STYLESHEETS: string[] = [];

export function addStylesheet(name: string, css: string): void {
    if (INSERTED_STYLESHEETS.includes(name)) {
        return;
    }

    const sheet = new CSSStyleSheet();
    sheet.replaceSync(css);
    document.adoptedStyleSheets.push(sheet);
    INSERTED_STYLESHEETS.push(name);
}
