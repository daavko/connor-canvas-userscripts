import { mdiCamera, mdiCog } from '@mdi/js';
import dccusStyles from './dccus.css';
import type { TemplateClass } from './modules/global';
import { el } from './modules/html';
import { createInfoIcon } from './modules/info-icon';
import { GLOBAL_MESSENGER } from './modules/message';
import { BooleanSetting, NumberSetting, Settings, type SettingUpdateCallback, StringSetting } from './modules/settings';
import {
    createBooleanSetting,
    createLineBreak,
    createRangeSetting,
    createSettingsText,
    createSettingsUI,
    createStringSetting,
    getOrCreateSettingsContainer,
} from './modules/settings-ui';
import { takeCanvasSnapshot } from './modules/snapshot';
import { addStylesheet } from './modules/stylesheets';
import type { SvelteStore } from './modules/svelte-store';
import { scheduleMacroTask } from './modules/task';

const canvasSnapshotButton = createInfoIcon('Take snapshot', mdiCamera, {
    clickable: true,
});
const canvasSettingsButton = createInfoIcon('Settings', mdiCog, {
    clickable: true,
});

const builtinSounds: string[] = [];

let templateStore: SvelteStore<TemplateClass[]> | null = null;
let TemplateClassType: typeof TemplateClass | null = null;

window.dccusSetTemplatesStore = (store): void => {
    templateStore = store;
};
window.dccusSetTemplateClass = (templateClassType): void => {
    TemplateClassType = templateClassType;
};

function createHowlSettingSrcCallback(howlIndex: number): SettingUpdateCallback<string> {
    return (_, newValue): void => {
        changeHowlSrc(howlIndex, newValue);
    };
}

function createHowlSettingVolumeCallback(howlIndex: number): SettingUpdateCallback<number> {
    return (_, newValue): void => {
        changeHowlVolume(howlIndex, newValue);
    };
}

const templateSettings = Settings.create('template', {
    deduplicateTemplates: new BooleanSetting(true),
});

const soundSettings = Settings.create('sound', {
    selectSoundUrl: new StringSetting('', [createHowlSettingSrcCallback(0)]),
    selectSoundVolume: new NumberSetting(1, [createHowlSettingVolumeCallback(0)]),
    deselectSoundUrl: new StringSetting('', [createHowlSettingSrcCallback(1)]),
    deselectSoundVolume: new NumberSetting(1, [createHowlSettingVolumeCallback(1)]),
    errorSoundUrl: new StringSetting('', [createHowlSettingSrcCallback(2)]),
    errorSoundVolume: new NumberSetting(1, [createHowlSettingVolumeCallback(2)]),
    clickSoundUrl: new StringSetting('', [createHowlSettingSrcCallback(3)]),
    clickSoundVolume: new NumberSetting(1, [createHowlSettingVolumeCallback(3)]),
    placeOkSoundUrl: new StringSetting('', [createHowlSettingSrcCallback(4)]),
    placeOkSoundVolume: new NumberSetting(1, [createHowlSettingVolumeCallback(4)]),
    placeErrorSoundUrl: new StringSetting('', [createHowlSettingSrcCallback(5)]),
    placeErrorSoundVolume: new NumberSetting(1, [createHowlSettingVolumeCallback(5)]),
    cooldownSoundUrl: new StringSetting('', [createHowlSettingSrcCallback(6)]),
    cooldownSoundVolume: new NumberSetting(1, [createHowlSettingVolumeCallback(6)]),
    bombBeginSoundUrl: new StringSetting('', [createHowlSettingSrcCallback(7)]),
    bombBeginSoundVolume: new NumberSetting(1, [createHowlSettingVolumeCallback(7)]),
    bombSoundUrl: new StringSetting('', [createHowlSettingSrcCallback(8)]),
    bombSoundVolume: new NumberSetting(1, [createHowlSettingVolumeCallback(8)]),
    inaccuracySoundUrl: new StringSetting('', [createHowlSettingSrcCallback(9)]),
    inaccuracySoundVolume: new NumberSetting(1, [createHowlSettingVolumeCallback(9)]),
    colorBanSoundUrl: new StringSetting('', [createHowlSettingSrcCallback(10)]),
    colorBanSoundVolume: new NumberSetting(1, [createHowlSettingVolumeCallback(10)]),
    freezeSoundUrl: new StringSetting('', [createHowlSettingSrcCallback(11)]),
    freezeSoundVolume: new NumberSetting(1, [createHowlSettingVolumeCallback(11)]),
    popupsSoundUrl: new StringSetting('', [createHowlSettingSrcCallback(12)]),
    popupsSoundVolume: new NumberSetting(1, [createHowlSettingVolumeCallback(12)]),
});

function changeHowlSrc(howlIndex: number, url: string): void {
    if (url.length > 0) {
        window.Howler._howls[howlIndex]._src = url;
        window.Howler._howls[howlIndex]._duration = 0;
        window.Howler._howls[howlIndex]._sprite = {};
        window.Howler._howls[howlIndex].load();
    } else {
        window.Howler._howls[howlIndex]._src = builtinSounds[howlIndex];
        window.Howler._howls[howlIndex]._duration = 0;
        window.Howler._howls[howlIndex]._sprite = {};
        window.Howler._howls[howlIndex].load();
    }
}

function changeHowlVolume(howlIndex: number, volume: number): void {
    window.Howler._howls[howlIndex]._volume = volume;
}

function deduplicateTemplates(): void {
    templateStore?.update((v) => {
        const seen = new Map<string, TemplateClass>();
        for (const template of v) {
            seen.set(template.title, template);
        }
        return Array.from(seen.values());
    });
}

const TEMPLATE_ASSIGNMENT_REGEX = /(this\.templates=[^}]+)/;
const TEMPLATE_CLASS_REGEX =
    /(class ([a-zA-Z]+)\{constructor\([a-zA-Z]+,[a-zA-Z]+,[a-zA-Z]+=!0,[a-zA-Z]+=0,[a-zA-Z]+=0,[a-zA-Z]+=(""|''),[a-zA-Z]+=0,[a-zA-Z]+=0,[a-zA-Z]+=[a-zA-Z]+\.CIEDE2000\)\{.+?this\.processed\.texture}})/;

function replaceFrontendScript(script: HTMLScriptElement): void {
    const scriptContent = script.textContent;
    let newScriptContent = scriptContent.replace(
        TEMPLATE_ASSIGNMENT_REGEX,
        '$1;window.dccusSetTemplatesStore(this.templates);',
    );
    newScriptContent = newScriptContent.replace(TEMPLATE_CLASS_REGEX, '$1;window.dccusSetTemplateClass($2);');
    newScriptContent += ';window.dccusLoaderFn();';
    const newScript = document.createElement('script');
    newScript.type = 'module';
    newScript.crossOrigin = 'anonymous';
    newScript.textContent = newScriptContent;
    if (script.parentNode) {
        script.parentNode.replaceChild(newScript, script);
    } else {
        throw new Error('Failed to replace frontend script: parentNode is null');
    }
}

function beforeCanvasLoad(): void {
    addStylesheet('dccus', dccusStyles);
    const body = document.querySelector('body');
    if (body) {
        window.stop();
        body.innerHTML = '';
        const frontendScript = document.head.querySelector('script');
        if (frontendScript) {
            replaceFrontendScript(frontendScript);
        }
    } else {
        const beforeScriptHandler = (evt: Event): void => {
            if (evt.target instanceof HTMLScriptElement && !evt.target.textContent.includes('dccus')) {
                evt.preventDefault();
                document.removeEventListener('beforescriptexecute', beforeScriptHandler);
                replaceFrontendScript(evt.target);
            }
        };
        document.addEventListener('beforescriptexecute', beforeScriptHandler);
    }
}

function afterCanvasLoad(): void {
    canvasSnapshotButton.addToIconsContainer();
    canvasSettingsButton.addToIconsContainer();
    createSettingsUI('dccus', 'DCCUS Settings', () => [
        createSettingsText('Template Settings'),
        createLineBreak(),
        createBooleanSetting(templateSettings.deduplicateTemplates, 'Deduplicate templates (works only on load)'),
        createLineBreak(),
        createLineBreak(),
        createLineBreak(),
        createSettingsText('Sound Settings'),
        createSettingsText('Leave the URL blank to use the default sound. Use a direct link to a sound file.'),
        createLineBreak(),
        createSettingsText('Color Select sound'),
        el('div', { class: 'dccus__sound-setting-group' }, [
            createStringSetting(soundSettings.selectSoundUrl, 'URL:'),
            createRangeSetting(soundSettings.selectSoundVolume, 'Volume', { min: 0, max: 1, step: 0.05 }),
        ]),
        createLineBreak(),
        createSettingsText('Color Deselect sound'),
        el('div', { class: 'dccus__sound-setting-group' }, [
            createStringSetting(soundSettings.deselectSoundUrl, 'URL:'),
            createRangeSetting(soundSettings.deselectSoundVolume, 'Volume', { min: 0, max: 1, step: 0.05 }),
        ]),
        createLineBreak(),
        createSettingsText('Error sound'),
        el('div', { class: 'dccus__sound-setting-group' }, [
            createStringSetting(soundSettings.errorSoundUrl, 'URL:'),
            createRangeSetting(soundSettings.errorSoundVolume, 'Volume', { min: 0, max: 1, step: 0.05 }),
        ]),
        createLineBreak(),
        createSettingsText('Click sound'),
        el('div', { class: 'dccus__sound-setting-group' }, [
            createStringSetting(soundSettings.clickSoundUrl, 'URL:'),
            createRangeSetting(soundSettings.clickSoundVolume, 'Volume', { min: 0, max: 1, step: 0.05 }),
        ]),
        createLineBreak(),
        createSettingsText('Place OK sound'),
        el('div', { class: 'dccus__sound-setting-group' }, [
            createStringSetting(soundSettings.placeOkSoundUrl, 'URL:'),
            createRangeSetting(soundSettings.placeOkSoundVolume, 'Volume', { min: 0, max: 1, step: 0.05 }),
        ]),
        createLineBreak(),
        createSettingsText('Place Error sound'),
        el('div', { class: 'dccus__sound-setting-group' }, [
            createStringSetting(soundSettings.placeErrorSoundUrl, 'URL:'),
            createRangeSetting(soundSettings.placeErrorSoundVolume, 'Volume', { min: 0, max: 1, step: 0.05 }),
        ]),
        createLineBreak(),
        createSettingsText('Pixel Ready sound'),
        el('div', { class: 'dccus__sound-setting-group' }, [
            createStringSetting(soundSettings.cooldownSoundUrl, 'URL:'),
            createRangeSetting(soundSettings.cooldownSoundVolume, 'Volume', { min: 0, max: 1, step: 0.05 }),
        ]),
        createLineBreak(),
        createSettingsText('Bomb Begin effect sound'),
        el('div', { class: 'dccus__sound-setting-group' }, [
            createStringSetting(soundSettings.bombBeginSoundUrl, 'URL:'),
            createRangeSetting(soundSettings.bombBeginSoundVolume, 'Volume', { min: 0, max: 1, step: 0.05 }),
        ]),
        createLineBreak(),
        createSettingsText('Bomb Explode effect sound'),
        el('div', { class: 'dccus__sound-setting-group' }, [
            createStringSetting(soundSettings.bombSoundUrl, 'URL:'),
            createRangeSetting(soundSettings.bombSoundVolume, 'Volume', { min: 0, max: 1, step: 0.05 }),
        ]),
        createLineBreak(),
        createSettingsText('Inaccuracy effect sound'),
        el('div', { class: 'dccus__sound-setting-group' }, [
            createStringSetting(soundSettings.inaccuracySoundUrl, 'URL:'),
            createRangeSetting(soundSettings.inaccuracySoundVolume, 'Volume', { min: 0, max: 1, step: 0.05 }),
        ]),
        createLineBreak(),
        createSettingsText('Color Ban effect sound'),
        el('div', { class: 'dccus__sound-setting-group' }, [
            createStringSetting(soundSettings.colorBanSoundUrl, 'URL:'),
            createRangeSetting(soundSettings.colorBanSoundVolume, 'Volume', { min: 0, max: 1, step: 0.05 }),
        ]),
        createLineBreak(),
        createSettingsText('Freeze effect sound'),
        el('div', { class: 'dccus__sound-setting-group' }, [
            createStringSetting(soundSettings.freezeSoundUrl, 'URL:'),
            createRangeSetting(soundSettings.freezeSoundVolume, 'Volume', { min: 0, max: 1, step: 0.05 }),
        ]),
        createLineBreak(),
        createSettingsText('Popups effect sound'),
        el('div', { class: 'dccus__sound-setting-group' }, [
            createStringSetting(soundSettings.popupsSoundUrl, 'URL:'),
            createRangeSetting(soundSettings.popupsSoundVolume, 'Volume', { min: 0, max: 1, step: 0.05 }),
        ]),
    ]);

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

    canvasSettingsButton.element.addEventListener('click', () => {
        getOrCreateSettingsContainer().classList.remove('dccus__settings-ui--hidden');
    });

    builtinSounds.push(...window.Howler._howls.map((howl) => howl._src));

    changeHowlSrc(0, soundSettings.selectSoundUrl.get());
    changeHowlVolume(0, soundSettings.selectSoundVolume.get());
    changeHowlSrc(1, soundSettings.deselectSoundUrl.get());
    changeHowlVolume(1, soundSettings.deselectSoundVolume.get());
    changeHowlSrc(2, soundSettings.errorSoundUrl.get());
    changeHowlVolume(2, soundSettings.errorSoundVolume.get());
    changeHowlSrc(3, soundSettings.clickSoundUrl.get());
    changeHowlVolume(3, soundSettings.clickSoundVolume.get());
    changeHowlSrc(4, soundSettings.placeOkSoundUrl.get());
    changeHowlVolume(4, soundSettings.placeOkSoundVolume.get());
    changeHowlSrc(5, soundSettings.placeErrorSoundUrl.get());
    changeHowlVolume(5, soundSettings.placeErrorSoundVolume.get());
    changeHowlSrc(6, soundSettings.cooldownSoundUrl.get());
    changeHowlVolume(6, soundSettings.cooldownSoundVolume.get());
    changeHowlSrc(7, soundSettings.bombBeginSoundUrl.get());
    changeHowlVolume(7, soundSettings.bombBeginSoundVolume.get());
    changeHowlSrc(8, soundSettings.bombSoundUrl.get());
    changeHowlVolume(8, soundSettings.bombSoundVolume.get());
    changeHowlSrc(9, soundSettings.inaccuracySoundUrl.get());
    changeHowlVolume(9, soundSettings.inaccuracySoundVolume.get());
    changeHowlSrc(10, soundSettings.colorBanSoundUrl.get());
    changeHowlVolume(10, soundSettings.colorBanSoundVolume.get());
    changeHowlSrc(11, soundSettings.freezeSoundUrl.get());
    changeHowlVolume(11, soundSettings.freezeSoundVolume.get());
    changeHowlSrc(12, soundSettings.popupsSoundUrl.get());
    changeHowlVolume(12, soundSettings.popupsSoundVolume.get());

    if (templateSettings.deduplicateTemplates.get()) {
        scheduleMacroTask(() => {
            deduplicateTemplates();
        });
    }
}

function isLoaded(): boolean {
    return document.querySelector('body > .splash') === null;
}

function startCheckingLoaded(): void {
    const loaderInterval = setInterval(() => {
        if (isLoaded()) {
            clearInterval(loaderInterval);
            afterCanvasLoad();
        }
    }, 500);
}
window.dccusLoaderFn = startCheckingLoaded;

beforeCanvasLoad();
