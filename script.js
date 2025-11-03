
// --------------------------------------
// Lógica da Sidebar
// --------------------------------------
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    
    sidebar.classList.toggle('open');
    
    if (sidebar.classList.contains('open')) {
        overlay.style.display = 'block';
    } else {
        overlay.style.display = 'none';
    }
}
document.getElementById('overlay').addEventListener('click', toggleSidebar);

// Store initial content
const mainContent = document.querySelector('.main-content');
const initialMainContentHTML = mainContent.innerHTML;

// --------------------------------------
// Lógica do Botão de Envio
// --------------------------------------
const chatInput = document.getElementById('chatInput');
const sendButton = document.getElementById('sendButton');
const voiceIcons = document.getElementById('voiceIcons');

chatInput.addEventListener('input', function() {
    if (chatInput.value.trim().length > 0) {
        sendButton.style.display = 'flex'; 
        voiceIcons.style.display = 'none';
    } else {
        sendButton.style.display = 'none';
        voiceIcons.style.display = 'flex';
    }
});

// --------------------------------------
// Lógica dos Botões de Funcionalidade
// --------------------------------------
function addFeatureButtonListeners() {
    const featureButtons = document.querySelectorAll('.feature-button');

    featureButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const featureText = event.currentTarget.textContent.trim();

            if (featureText === 'Criar imagem') {
                const imagePrompt = prompt("O que você gostaria de criar?");
                if (imagePrompt) {
                    chatInput.value = `criar imagem ${imagePrompt}`;
                    chatInput.dispatchEvent(new Event('input'));
                    sendMessage();
                }
            } else {
                chatInput.value = featureText;
                chatInput.dispatchEvent(new Event('input'));
                sendMessage();
            }
        });
    });
}

addFeatureButtonListeners(); // Initial call

// --------------------------------------
// Lógica para Novo Projeto / Novo Chat
// --------------------------------------
function startNewChat() {
    mainContent.innerHTML = initialMainContentHTML;
    addFeatureButtonListeners();
    const sidebar = document.getElementById('sidebar');
    if (sidebar.classList.contains('open')) {
        toggleSidebar();
    }
}

const sidebarItems = document.querySelectorAll('.sidebar-item');
sidebarItems.forEach(item => {
    const itemText = item.textContent.trim();
    if (itemText === 'Novo projeto' || itemText === 'Novo chat') {
        item.addEventListener('click', (event) => {
            event.preventDefault();
            startNewChat();
        });
    }
});

// --------------------------------------
// Lógica do Botão '+' e Modal
// --------------------------------------
const addButton = document.querySelector('.add-button');
const modal = document.getElementById('addOptionsModal');
const modalGallery = document.getElementById('modalGallery');
const modalCamera = document.getElementById('modalCamera');
const galleryInput = document.getElementById('galleryInput');
const cameraInput = document.getElementById('cameraInput');

addButton.addEventListener('click', () => {
    modal.style.display = 'flex';
});

// Fecha o modal se o usuário clicar fora dele
window.addEventListener('click', (event) => {
    if (event.target == modal) {
        modal.style.display = 'none';
    }
});

modalGallery.addEventListener('click', () => galleryInput.click());
modalCamera.addEventListener('click', () => cameraInput.click());

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) {
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        displayMessage(e.target.result, 'user');
    }
    reader.readAsDataURL(file);

    modal.style.display = 'none'; // Esconde o modal após a seleção
    event.target.value = ''; // Reseta o valor do input
}

galleryInput.addEventListener('change', handleFileSelect);
cameraInput.addEventListener('change', handleFileSelect);


// --------------------------------------
// Lógica do Chat com OpenAI
// --------------------------------------
let apiKey = localStorage.getItem('openai_api_key');

sendButton.addEventListener('click', sendMessage);

function sendMessage() {
    const message = chatInput.value;
    if (!apiKey) {
        apiKey = prompt("Por favor, insira sua chave de API da OpenAI:");
        localStorage.setItem('openai_api_key', apiKey);
    }
    if (message) {
        displayMessage(message, 'user');
        displayTypingIndicator(); // Mostra o indicador de digitação
        sendMessageToOpenAI(message);
        chatInput.value = '';
    }
}

async function sendMessageToOpenAI(message) {
    const lowerCaseMessage = message.toLowerCase();
    let systemMessage = 'Você é um assistente prestativo que responde em português.';

    if (lowerCaseMessage.startsWith('criar imagem')) {
        // Lida com a geração de imagem
        const prompt = message.substring('criar imagem'.length).trim();
        const response = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'dall-e-3',
                prompt: prompt,
                n: 1,
                size: '1024x1024'
            })
        });
        const data = await response.json();
        removeTypingIndicator();
        const imageUrl = data.data[0].url;
        displayMessage(imageUrl, 'ai');
        return;
    } 

    if (lowerCaseMessage.startsWith('programar')) {
        systemMessage = 'Você é um assistente prestativo que responde em português e ajuda com programação.';
    } else if (lowerCaseMessage.startsWith('ajudar a escrever')) {
        systemMessage = 'Você é um assistente prestativo que responde em português e ajuda na escrita.';
    } else if (lowerCaseMessage.startsWith('resumir texto')) {
        systemMessage = 'Você é um assistente prestativo que responde em português e ajuda a resumir textos.';
    } else if (lowerCaseMessage.startsWith('aconselhar')) {
        systemMessage = 'Você é um assistente prestativo que responde em português e dá conselhos.';
    }

    // Lida com a completude do chat
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: systemMessage },
                { role: 'user', content: message }
            ]
        })
    });
    const data = await response.json();
    removeTypingIndicator();
    displayMessage(data.choices[0].message.content, 'ai');
}

function displayMessage(message, sender) {
    const mainContent = document.querySelector('.main-content');
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', `${sender}-message`);

    if (sender === 'user') {
        // Limpa a tela inicial se for a primeira mensagem do usuário
        if (document.querySelector('h1')) {
            mainContent.innerHTML = '';
        }
    }

    if (message.startsWith('http') || message.startsWith('data:image')) {
        const image = document.createElement('img');
        image.src = message;
        image.alt = "Imagem";
        image.style.maxWidth = "100%"; 
        if (sender === 'ai') {
             image.style.maxWidth = "50%";
             image.alt = "Imagem Gerada por IA";
        }
        messageElement.appendChild(image);
    } else if (message.includes('```')) {
        const pre = document.createElement('pre');
        const code = document.createElement('code');
        const codeRegex = /```(.*?)```/s;
        const codeMatch = message.match(codeRegex);
        if (codeMatch) {
            code.textContent = codeMatch[1];
            pre.appendChild(code);
            messageElement.appendChild(pre);

            const copyButton = document.createElement('button');
            copyButton.textContent = 'Copiar';
            copyButton.className = 'copy-button';
            copyButton.onclick = () => {
                navigator.clipboard.writeText(code.textContent);
                copyButton.textContent = 'Copiado!';
                setTimeout(() => {
                    copyButton.textContent = 'Copiar';
                }, 2000);
            };
            messageElement.appendChild(copyButton);
        }
    } else {
        messageElement.textContent = message;
    }

    mainContent.appendChild(messageElement);
    mainContent.scrollTop = mainContent.scrollHeight;
}

function displayTypingIndicator() {
    const mainContent = document.querySelector('.main-content');
    if (document.querySelector('h1')) {
            mainContent.innerHTML = '';
    }
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'typing-indicator-container');
    messageElement.innerHTML = `
        <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
        </div>
    `;
    mainContent.appendChild(messageElement);
    mainContent.scrollTop = mainContent.scrollHeight;
}

function removeTypingIndicator() {
    const typingIndicator = document.querySelector('.typing-indicator-container');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}
