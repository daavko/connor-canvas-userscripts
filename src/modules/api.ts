import * as v from 'valibot';

const API_HOST = 'https://api.cdawgva.com';

const rawPaletteItemSchema = v.object({
    name: v.string(),
    value: v.number(), // packed as 0xRRGGBBAA
});
export type RawPaletteItem = v.InferOutput<typeof rawPaletteItemSchema>;

const paletteSchema = v.pipe(
    v.record(v.string(), rawPaletteItemSchema),
    v.transform((record) => Object.values(record)),
);

const defaultBoardInfoResponseSchema = v.object({
    uri: v.string(),
    view: v.object({
        shape: v.array(v.tuple([v.number(), v.number()])),
        palette: paletteSchema,
    }),
});
export type DefaultBoardInfoResponse = v.InferOutput<typeof defaultBoardInfoResponseSchema>;

const boardInfoResponseSchema = v.object({
    name: v.string(),
    shape: v.array(v.tuple([v.number(), v.number()])),
    palette: paletteSchema,
});
export type BoardInfoResponse = v.InferOutput<typeof boardInfoResponseSchema>;

const boardsResponseSchema = v.object({
    items: v.array(defaultBoardInfoResponseSchema),
});
export type BoardsResponse = v.InferOutput<typeof boardsResponseSchema>;

export async function fetchBoards(): Promise<BoardsResponse> {
    const response = await fetch(`${API_HOST}/boards`);
    if (!response.ok) {
        throw new Error(`Failed to fetch boards: ${response.status} ${response.statusText}`);
    }

    const data: unknown = await response.json();
    const parseResult = v.safeParse(boardsResponseSchema, data);
    if (!parseResult.success) {
        throw new Error('Failed to parse boards response', { cause: parseResult.issues });
    }

    return parseResult.output;
}

export async function fetchDefaultBoardInfo(): Promise<DefaultBoardInfoResponse> {
    const response = await fetch(`${API_HOST}/boards/default`);
    if (!response.ok) {
        throw new Error(`Failed to fetch canvas info: ${response.status} ${response.statusText}`);
    }

    const data: unknown = await response.json();
    const parseResult = v.safeParse(defaultBoardInfoResponseSchema, data);
    if (!parseResult.success) {
        throw new Error('Failed to parse canvas info response', { cause: parseResult.issues });
    }

    return parseResult.output;
}

export async function fetchBoardInfo(boardId: number): Promise<BoardInfoResponse> {
    const response = await fetch(`${API_HOST}/boards/${boardId}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch board info: ${response.status} ${response.statusText}`);
    }

    const data: unknown = await response.json();
    const parseResult = v.safeParse(boardInfoResponseSchema, data);
    if (!parseResult.success) {
        throw new Error('Failed to parse board info response', { cause: parseResult.issues });
    }

    return parseResult.output;
}

export async function fetchBoardPixels(boardId: number): Promise<Uint8Array> {
    const response = await fetch(`${API_HOST}/boards/${boardId}/data/colors`);
    if (!response.ok) {
        throw new Error(`Failed to fetch canvas pixels: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return new Uint8Array(arrayBuffer);
}
