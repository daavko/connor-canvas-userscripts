import type { GenericSchema } from 'valibot';
import * as v from 'valibot';
import { GLOBAL_MESSENGER } from './message';

export type SettingUpdateCallback<TValue> = (oldValue: TValue, newValue: TValue) => void;

export interface Setting<TValue, TSerializedValue> {
    readonly defaultValue: TValue;

    get(): TValue;
    set(value: TValue): void;
    reset(): void;
    addCallback(callback: SettingUpdateCallback<TValue>): void;
    removeCallback(callback: SettingUpdateCallback<TValue>): void;

    init(value: unknown): void;
    parseValue(value: unknown): TValue;
    serializeValue(value: TValue): TSerializedValue;
}

export abstract class SettingBase<TValue, TSerializedValue = TValue> implements Setting<TValue, TSerializedValue> {
    protected readonly valueUpdateCallbacks: Set<SettingUpdateCallback<TValue>>;

    protected currentValue: TValue;

    protected constructor(
        readonly defaultValue: TValue,
        protected readonly schema: GenericSchema<unknown, TValue>,
        valueUpdateCallbacks: SettingUpdateCallback<TValue>[] = [],
    ) {
        this.valueUpdateCallbacks = new Set(valueUpdateCallbacks);
        this.currentValue = defaultValue;
    }

    addCallback(callback: SettingUpdateCallback<TValue>): void {
        this.valueUpdateCallbacks.add(callback);
    }

    removeCallback(callback: SettingUpdateCallback<TValue>): void {
        this.valueUpdateCallbacks.delete(callback);
    }

    get(): TValue {
        return this.currentValue;
    }

    set(value: TValue): void {
        const oldValue = this.currentValue;
        if (oldValue === value) {
            return;
        }
        this.currentValue = value;
        this.notifyCallbacks(oldValue, value);
    }

    reset(): void {
        this.set(this.defaultValue);
    }

    init(value: unknown): void {
        this.currentValue = this.parseValue(value);
    }

    parseValue(value: unknown): TValue {
        const parsed = v.safeParse(this.schema, value);
        if (parsed.success) {
            return parsed.output;
        } else {
            console.error('Failed to parse setting value', parsed.issues);
            return this.defaultValue;
        }
    }

    serializeValue(value: TValue): TSerializedValue {
        // Default implementation, can be overridden by subclasses
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- safe for default typing
        return value as unknown as TSerializedValue;
    }

    protected notifyCallbacks(oldValue: TValue, newValue: TValue): void {
        for (const callback of this.valueUpdateCallbacks) {
            callback(oldValue, newValue);
        }
    }
}

export class BooleanSetting extends SettingBase<boolean> {
    constructor(defaultValue: boolean, valueUpdateCallbacks: SettingUpdateCallback<boolean>[] = []) {
        super(defaultValue, v.boolean(), valueUpdateCallbacks);
    }
}

export class NumberSetting extends SettingBase<number> {
    constructor(defaultValue: number, valueUpdateCallbacks: SettingUpdateCallback<number>[] = []) {
        super(defaultValue, v.number(), valueUpdateCallbacks);
    }
}

export class StringSetting extends SettingBase<string> {
    constructor(defaultValue: string, valueUpdateCallbacks: SettingUpdateCallback<string>[] = []) {
        super(defaultValue, v.string(), valueUpdateCallbacks);
    }
}

type SettingsWithSettingKeys<TSettingsClass, T extends Record<string, Setting<unknown, unknown>>> = TSettingsClass & {
    [K in keyof T]: T[K];
};

export class Settings<const TSettings extends Record<string, Setting<unknown, unknown>>> {
    private static readonly schema = v.pipe(v.string(), v.parseJson(), v.record(v.string(), v.unknown()));

    protected constructor(
        private readonly storageKey: string,
        readonly settings: TSettings,
    ) {
        this.init();

        for (const [, setting] of Object.entries(this.settings)) {
            setting.addCallback(() => {
                this.saveStoredValue(this.collectSerializedSettings());
            });
        }

        window.addEventListener('storage', (event) => {
            if (event.key !== this.storageKey || event.newValue == null) {
                return;
            }

            const parsedNewValue = v.safeParse(Settings.schema, event.newValue);
            if (!parsedNewValue.success) {
                console.error('Failed to parse settings from storage event', parsedNewValue.issues);
                return;
            }

            const newValue = { ...this.collectDefaultSerializedSettings(), ...parsedNewValue.output };
            for (const [key, setting] of Object.entries(this.settings)) {
                const value = newValue[key];
                setting.set(setting.parseValue(value));
            }
        });
    }

    static create<const TSettings extends Record<string, Setting<unknown, unknown>>>(
        storageKey: string,
        settings: TSettings & {
            [K in keyof Settings<TSettings> &
                keyof TSettings]: `Property with name "${K}" already exists on type Settings, can't use as a setting key`;
        },
    ): SettingsWithSettingKeys<Settings<TSettings>, TSettings> {
        const settingsObject = new Settings(`dccus_settings_${storageKey}`, settings);
        for (const [key, setting] of Object.entries(settings)) {
            if (Object.hasOwn(settingsObject, key)) {
                throw new Error(
                    `Property with name "${key}" already exists on Settings object, can't use as a setting key`,
                );
            }
            Object.defineProperty(settingsObject, key, {
                value: setting,
                writable: false,
            });
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- dynamic properties, not typeable
        return settingsObject as unknown as SettingsWithSettingKeys<Settings<TSettings>, TSettings>;
    }

    reset(): void {
        for (const setting of Object.values(this.settings)) {
            setting.reset();
        }
        this.saveStoredValue(this.collectSerializedSettings());
    }

    private init(): void {
        const storedValue = this.loadStoredValue();
        const resolvedValue = {
            ...this.collectDefaultSerializedSettings(),
            ...storedValue,
        };
        this.saveStoredValue(resolvedValue);
        for (const [key, setting] of Object.entries(this.settings)) {
            const value = resolvedValue[key];
            setting.init(value);
        }
    }

    private loadStoredValue(): Record<string, unknown> {
        const storedValue = localStorage.getItem(this.storageKey);
        if (storedValue == null) {
            return {};
        }

        const parsedValue = v.safeParse(Settings.schema, storedValue);
        if (parsedValue.success) {
            return parsedValue.output;
        } else {
            const errorMessage = `Stored settings for ${this.storageKey} are invalid`;
            GLOBAL_MESSENGER.showErrorMessage(errorMessage, new Error(errorMessage, { cause: parsedValue.issues }));
            return {};
        }
    }

    private saveStoredValue(value: Record<string, unknown>): void {
        localStorage.setItem(this.storageKey, JSON.stringify(value));
    }

    private collectSerializedSettings(): Record<string, unknown> {
        const serializedSettings: Record<string, unknown> = {};
        for (const [key, setting] of Object.entries(this.settings)) {
            serializedSettings[key] = setting.serializeValue(setting.get());
        }
        return serializedSettings;
    }

    private collectDefaultSerializedSettings(): Record<string, unknown> {
        const serializedSettings: Record<string, unknown> = {};
        for (const [key, setting] of Object.entries(this.settings)) {
            serializedSettings[key] = setting.serializeValue(setting.defaultValue);
        }
        return serializedSettings;
    }
}
