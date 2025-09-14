export function scheduleMacroTask(callback: () => void): void {
    const channel = new MessageChannel();
    channel.port1.onmessage = callback;
    channel.port2.postMessage(undefined);
}
