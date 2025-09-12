import * as v from 'valibot';

const API_HOST = 'https://api.cdawgva.com';

const rawPaletteItemSchema = v.object({
    name: v.string(),
    value: v.number(), // packed as 0xRRGGBBAA
});

const canvasInfoResponseSchema = v.object({
    uri: v.string(),
    view: v.object({
        shape: v.tuple([v.tuple([v.number(), v.number()]), v.tuple([v.number(), v.number()])]),
        palette: v.pipe(
            v.record(v.string(), rawPaletteItemSchema),
            v.transform((record) => Object.values(record)),
        ),
    }),
});
export type CanvasInfoResponse = v.InferOutput<typeof canvasInfoResponseSchema>;

export async function fetchCanvasInfo(): Promise<CanvasInfoResponse> {
    const response = await fetch(`${API_HOST}/boards/default`);
    if (!response.ok) {
        throw new Error(`Failed to fetch canvas info: ${response.status} ${response.statusText}`);
    }

    const data: unknown = await response.json();
    const parseResult = v.safeParse(canvasInfoResponseSchema, data);
    if (!parseResult.success) {
        throw new Error('Failed to parse canvas info response', { cause: parseResult.issues });
    }

    return parseResult.output;
}

export async function fetchCanvasPixels(baseUri: string): Promise<Uint8Array> {
    const response = await fetch(`${API_HOST}${baseUri}/data/colors`);
    if (!response.ok) {
        throw new Error(`Failed to fetch canvas pixels: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return new Uint8Array(arrayBuffer);
}
