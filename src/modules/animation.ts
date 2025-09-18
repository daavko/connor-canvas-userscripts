import * as v from 'valibot';
import { getBaseUrl, getTemplateClassType, getTemplatesStore } from './globals';

let animationFrameId: number | null = null;

const animationPositioningInfoSchema = v.object({
    x: v.number(),
    y: v.number(),
    width: v.number(),
});
type PositioningInfo = v.InferOutput<typeof animationPositioningInfoSchema>;

const animationTimingInfoSchema = v.object({
    startTimestamp: v.number(),
    timeBetweenFrames: v.number(),
    loop: v.boolean(),
});

const animationFramesInfoSchema = v.object({
    baseUrl: v.string(),
    count: v.number(),
    fileExtension: v.string(),
});
type FramesInfo = v.InferOutput<typeof animationFramesInfoSchema>;

const animationInfoSchema = v.pipe(
    v.object({
        positioning: animationPositioningInfoSchema,
        timing: animationTimingInfoSchema,
        frames: animationFramesInfoSchema,
    }),
);
type AnimationInfo = v.InferOutput<typeof animationInfoSchema>;

interface AnimationState {
    currentFrameIndex: number;
    prefetchedNextFrame: boolean;
}

let animationState: AnimationState | null = null;

const ANIMATION_TEMPLATE_TITLE = 'dccus-animation-frame';

export async function fetchAnimationInfo(url: string): Promise<AnimationInfo> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch animation info from ${url}: ${response.status} ${response.statusText}`);
    }

    const data: unknown = await response.json();
    const parseResult = v.safeParse(animationInfoSchema, data);
    if (!parseResult.success) {
        throw new Error(`Failed to parse animation info from ${url}`, { cause: parseResult.issues });
    }

    return parseResult.output;
}

function animationFrameName(framesInfo: FramesInfo, index: number): string {
    const { baseUrl, count, fileExtension } = framesInfo;
    const paddedIndex = index.toString().padStart(count.toString().length, '0');
    return `${baseUrl}/${paddedIndex}.${fileExtension}`;
}

export function startAnimationLoop(animation: AnimationInfo): void {
    if (animationFrameId !== null) {
        cancelAnimationLoop();
    }

    setupTemplate(animation.positioning, animationFrameName(animation.frames, 0));
    animationState = { currentFrameIndex: 0, prefetchedNextFrame: false };
    updateAnimationFrame(animation);
    animationFrameId = window.requestAnimationFrame(() => {
        animationLoop(animation);
    });
}

export function cancelAnimationLoop(): void {
    if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
        animationState = null;
        removeTemplate();
    }
}

function animationLoop(animation: AnimationInfo): void {
    updateAnimationFrame(animation);
    animationFrameId = window.requestAnimationFrame(() => {
        animationLoop(animation);
    });
}

function updateAnimationFrame(animation: AnimationInfo): void {
    if (!animationState) {
        return;
    }
    const now = Date.now();

    if (now < animation.timing.startTimestamp) {
        if (animationState.currentFrameIndex !== 0) {
            animationState.currentFrameIndex = 0;
            updateFrameSrc(animationFrameName(animation.frames, 0));
        }
    } else {
        const timeSinceStart = now - animation.timing.startTimestamp;
        const framesElapsed = Math.floor(timeSinceStart / animation.timing.timeBetweenFrames);
        const timeToNextFrame =
            animation.timing.timeBetweenFrames - (timeSinceStart % animation.timing.timeBetweenFrames);

        if (!animationState.prefetchedNextFrame && timeToNextFrame < 10000) {
            // const nextFrameIndex = animation.timing.loop
            //     ? (framesElapsed + 1) % animation.frames.count
            //     : Math.min(framesElapsed + 1, animation.frames.count - 1);
            let nextFrameIndex: number | undefined;
            if (animation.timing.loop) {
                nextFrameIndex = (framesElapsed + 1) % animation.frames.count;
            } else {
                nextFrameIndex = framesElapsed + 1;
                if (nextFrameIndex >= animation.frames.count) {
                    nextFrameIndex = undefined;
                }
            }
            if (nextFrameIndex !== undefined) {
                const nextFrameSrc = animationFrameName(animation.frames, nextFrameIndex);
                fetch(nextFrameSrc).catch(console.error);
            }
            animationState.prefetchedNextFrame = true;
        }
        if (animation.timing.loop) {
            const frameIndex = framesElapsed % animation.frames.count;
            if (frameIndex !== animationState.currentFrameIndex) {
                animationState.currentFrameIndex = frameIndex;
                updateFrameSrc(animationFrameName(animation.frames, frameIndex));
            }
        } else {
            const frameIndex = Math.min(framesElapsed, animation.frames.count - 1);
            if (frameIndex !== animationState.currentFrameIndex) {
                animationState.currentFrameIndex = frameIndex;
                updateFrameSrc(animationFrameName(animation.frames, frameIndex));
            }
        }
    }
}

function setupTemplate(positioning: PositioningInfo, src: string): void {
    getTemplatesStore().update((value) => {
        const existingTemplate = value.find((template) => template.title === ANIMATION_TEMPLATE_TITLE);
        if (existingTemplate) {
            existingTemplate.url = src;
            existingTemplate.x = positioning.x;
            existingTemplate.y = positioning.y;
            existingTemplate.width = positioning.width;
            return [...value];
        } else {
            const TemplateClassType = getTemplateClassType();
            const newTemplate = new TemplateClassType(
                getBaseUrl(),
                src,
                true,
                positioning.x,
                positioning.y,
                ANIMATION_TEMPLATE_TITLE,
                positioning.width,
            );
            return [...value, newTemplate];
        }
    });
}

function removeTemplate(): void {
    getTemplatesStore().update((value) => {
        return value.filter((template) => template.title !== ANIMATION_TEMPLATE_TITLE);
    });
}

function updateFrameSrc(src: string): void {
    getTemplatesStore().update((value) => {
        return value.map((template) => {
            if (template.title === ANIMATION_TEMPLATE_TITLE) {
                template.url = src;
                return template;
            } else {
                return template;
            }
        });
    });
    if (animationState) {
        animationState.prefetchedNextFrame = false;
    }
}
