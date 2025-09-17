import { fetchBoardInfo, fetchBoardPixels, fetchDefaultBoardInfo, type RawPaletteItem } from './api';
import { rgbaToAbgr } from './color';
import { BOARD_URI_REGEX } from './common';

export async function takeDefaultCanvasSnapshot(): Promise<ImageData> {
    const info = await fetchDefaultBoardInfo();
    const match = BOARD_URI_REGEX.exec(info.uri);
    if (match && match.length >= 2) {
        const boardId = parseInt(match[1], 10);
        return takeCanvasSnapshot(boardId);
    } else {
        throw new Error(`Failed to extract board ID from URI: ${info.uri}`);
    }
}

export async function takeCanvasSnapshot(boardId: number): Promise<ImageData> {
    const info = await fetchBoardInfo(boardId);
    const pixels = await fetchBoardPixels(boardId);
    return snapshotFromPixels(info.shape, info.palette, pixels);
}

function snapshotFromPixels(shape: [number, number][], palette: RawPaletteItem[], pixels: Uint8Array): ImageData {
    let width = 1;
    let height = 1;
    for (const [w, h] of shape) {
        width *= w;
        height *= h;
    }
    const tileWidth = shape[shape.length - 1][0];
    const tileHeight = shape[shape.length - 1][1];
    const tilesX = width / tileWidth;
    const tilesY = height / tileHeight;

    const imageData = new ImageData(width, height);
    const dataView = new Uint32Array(imageData.data.buffer);

    const colors = palette.map((item) => rgbaToAbgr(item.value));

    for (let tileY = 0; tileY < tilesY; tileY++) {
        for (let tileX = 0; tileX < tilesX; tileX++) {
            const tileIndex = tileY * tilesX + tileX;
            const tileOffset = tileIndex * tileWidth * tileHeight;
            for (let y = 0; y < tileHeight; y++) {
                const destY = tileY * tileHeight + y;
                const destRowStart = destY * width + tileX * tileWidth;
                const srcRowStart = tileOffset + y * tileWidth;
                for (let x = 0; x < tileWidth; x++) {
                    const destX = destRowStart + x;
                    const srcX = srcRowStart + x;
                    const pixel = pixels[srcX];
                    dataView[destX] = colors[pixel];
                }
            }
        }
    }

    return imageData;
}
