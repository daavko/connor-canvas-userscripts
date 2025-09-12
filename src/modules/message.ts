import { addStylesheet } from './stylesheets';
import { el } from './html';
import messageContainerStyle from './message.css';

export type MessageType = 'info' | 'success' | 'error';

const DEFAULT_INFO_MESSAGE_DURATION = 3000;
const DEFAULT_SUCCESS_MESSAGE_DURATION = 3000;
const DEFAULT_ERROR_MESSAGE_DURATION = 5000;

let MESSAGE_CONTAINER: Element | null = null;

export class Messenger {
    constructor(private readonly moduleTitle: string) {}

    showInfoMessage(message: string, duration = DEFAULT_INFO_MESSAGE_DURATION): void {
        showMessage(this.formatMessage(message), 'info', duration);
    }

    showSuccessMessage(message: string, duration = DEFAULT_SUCCESS_MESSAGE_DURATION): void {
        showMessage(this.formatMessage(message), 'success', duration);
    }

    showErrorMessage(message: string, context?: Error, duration = DEFAULT_ERROR_MESSAGE_DURATION): void {
        const formattedMessage = this.formatMessage(message);
        if (context) {
            console.error(formattedMessage, context, context.cause);
        }
        showMessage(formattedMessage, 'error', duration);
    }

    private formatMessage(message: string): string {
        return `[${this.moduleTitle}] ${message}`;
    }
}

export const GLOBAL_MESSENGER = new Messenger('DCCUS');

function showMessage(message: string, type: MessageType, duration: number): void {
    let messageDivTypeClass: string;
    switch (type) {
        case 'info':
            messageDivTypeClass = 'dccus__message--info';
            break;
        case 'success':
            messageDivTypeClass = 'dccus__message--success';
            break;
        case 'error':
            messageDivTypeClass = 'dccus__message--error';
            break;
        default:
            throw new Error(`Unknown message type: ${type as string}`);
    }

    const messageDiv = el('div', { class: ['dccus__message', messageDivTypeClass] }, [message]);

    const messageContainer = getOrInitMessageContainer();
    messageContainer.appendChild(messageDiv);
    setTimeout(() => {
        messageContainer.removeChild(messageDiv);
    }, duration);
}

function getOrInitMessageContainer(): Element {
    if (MESSAGE_CONTAINER) {
        return MESSAGE_CONTAINER;
    }

    const existingMessageContainer = document.querySelector('.dccus__message-container');
    if (existingMessageContainer) {
        MESSAGE_CONTAINER = existingMessageContainer;
    } else {
        MESSAGE_CONTAINER = createMessageContainer();
    }
    return MESSAGE_CONTAINER;
}

function createMessageContainer(): Element {
    addStylesheet('dccus__message-container', messageContainerStyle);

    const messageContainer = el('div', { class: 'dccus__message-container' });
    document.body.appendChild(messageContainer);

    return messageContainer;
}
