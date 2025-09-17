export function createRandomElementId(): string {
    return `dccus-${crypto.randomUUID()}`;
}

export function getHashParams(): Map<string, string> {
    const hash = window.location.hash;
    const params = new Map<string, string>();
    if (hash.startsWith('#')) {
        const hashParams = new URLSearchParams(hash.substring(1));
        for (const [key, value] of hashParams.entries()) {
            params.set(key, value);
        }
    }
    return params;
}
