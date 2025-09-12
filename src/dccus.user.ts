import { mdiCamera } from '@mdi/js';
import dccusStyles from './dccus.css';
import { el } from './modules/html';
import { createInfoIcon } from './modules/info-icon';
import { GLOBAL_MESSENGER } from './modules/message';
import { takeCanvasSnapshot } from './modules/snapshot';
import { addStylesheet } from './modules/stylesheets';

const canvasSnapshotButton = createInfoIcon('Take snapshot', mdiCamera, {
    clickable: true,
});

function beforeCanvasLoad(): void {
    addStylesheet('dccus', dccusStyles);
}

function afterCanvasLoad(): void {
    canvasSnapshotButton.addToIconsContainer();
    canvasSnapshotButton.element.addEventListener('click', (event) => {
        if (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) {
            return;
        }

        takeCanvasSnapshot()
            .then(async (snapshotImageData) => {
                // convert the ImageData to a downloadable link
                const canvas = new OffscreenCanvas(snapshotImageData.width, snapshotImageData.height);
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    throw new Error('Failed to get canvas context');
                }
                ctx.putImageData(snapshotImageData, 0, 0);
                const blob = await canvas.convertToBlob({ type: 'image/png' });
                const snapshotImageUrl = URL.createObjectURL(blob);
                const link = el('a');
                link.href = snapshotImageUrl;
                link.download = `connor-canvas-snapshot-${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
                link.click();
                URL.revokeObjectURL(snapshotImageUrl);
                GLOBAL_MESSENGER.showSuccessMessage('Canvas snapshot taken and downloaded');
            })
            .catch((error: unknown) => {
                if (error instanceof Error) {
                    GLOBAL_MESSENGER.showErrorMessage('Failed to take canvas snapshot', error);
                } else {
                    GLOBAL_MESSENGER.showErrorMessage('Failed to take canvas snapshot due to an unknown error');
                }
            });
    });
}

function isLoaded(): boolean {
    return document.querySelector('body > .splash') === null;
}

beforeCanvasLoad();
const loaderInterval = setInterval(() => {
    if (isLoaded()) {
        clearInterval(loaderInterval);
        afterCanvasLoad();
    }
}, 500);
