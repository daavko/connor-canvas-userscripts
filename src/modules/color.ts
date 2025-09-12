export function rgbaToAbgr(rgba: number): number {
    const r = (rgba >> 24) & 0xff;
    const g = (rgba >> 16) & 0xff;
    const b = (rgba >> 8) & 0xff;
    const a = rgba & 0xff;
    return (a << 24) | (b << 16) | (g << 8) | r;
}
