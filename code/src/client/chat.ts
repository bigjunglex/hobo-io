import { sendMessage } from "./networking";

const form = document.getElementById('chat-input')! as ChatForm;
const chat = document.getElementById('chat')!;
const msgList = document.getElementById('msg-list')!;
const input = form.elements.message;

form.addEventListener('submit', submitMessage)


function submitMessage(event: SubmitEvent) {
    event.preventDefault();
    const data = input.value;

    if (data.trim() === '') return;

    sendMessage(data);
    input.value = '';    
}

export function onChatMessage(data: ChatMessage) {
    const { username, message, time } = data;
    const t = new Intl.DateTimeFormat('default', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    }).format(new Date(time));


    const msgEl = document.createElement('li');
    msgEl.innerText = `[${t}] ${username}: ${message}`
    msgList.appendChild(msgEl)
    msgEl.scrollIntoView({ block: 'end', behavior: 'instant' })
}

export function setChatHidden(hidden: boolean): void {
    if (hidden) {
        chat.classList.add('hidden')
    } else {
        chat.classList.remove('hidden')
    }
}