import { fetchCanvasInfo, fetchCanvasPixels } from './api';
import { rgbaToAbgr } from './color';

export async function takeCanvasSnapshot(): Promise<ImageData> {
    const info = await fetchCanvasInfo();
    const pixels = await fetchCanvasPixels(info.uri);

    const width = info.view.shape[1][0];
    const height = info.view.shape[1][1];

    const imageData = new ImageData(width, height);
    const dataView = new Uint32Array(imageData.data.buffer);

    const colors = info.view.palette.map((item) => rgbaToAbgr(item.value));

    // each pixel value is an index into the colors array
    pixels.forEach((pixel, index) => {
        dataView[index] = colors[pixel];
    });

    return imageData;
}
