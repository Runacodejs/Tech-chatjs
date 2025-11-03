
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

// Armazena o conteúdo inicial
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
let isWaitingForImagePrompt = false;
let isWaitingForEditPrompt = false;
let imageForEditing = null;

function addFeatureButtonListeners() {
    const featureButtons = document.querySelectorAll('.feature-button');

    featureButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const featureText = event.currentTarget.textContent.trim();

            if (document.querySelector('h1')) {
                mainContent.innerHTML = '';
            }

            if (featureText === 'Criar imagem') {
                displayMessage('Qual imagem você gostaria de criar?', 'ai');
                isWaitingForImagePrompt = true;
            } else {
                chatInput.value = featureText;
                chatInput.dispatchEvent(new Event('input'));
                sendMessage();
            }
        });
    });
}

addFeatureButtonListeners(); // Chamada inicial

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
    isWaitingForImagePrompt = false;
    isWaitingForEditPrompt = false;
    imageForEditing = null;
    chatHistory = []; // Limpa o histórico de chat
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
const modalEditImage = document.getElementById('modalEditImage');
const galleryInput = document.getElementById('galleryInput');
const cameraInput = document.getElementById('cameraInput');
const editImageInput = document.getElementById('editImageInput');

addButton.addEventListener('click', () => {
    modal.style.display = 'flex';
});

window.addEventListener('click', (event) => {
    if (event.target == modal) {
        modal.style.display = 'none';
    }
});

modalGallery.addEventListener('click', () => galleryInput.click());
modalCamera.addEventListener('click', () => cameraInput.click());
modalEditImage.addEventListener('click', () => editImageInput.click());

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        displayMessage(e.target.result, 'user');
    }
    reader.readAsDataURL(file);

    modal.style.display = 'none';
    event.target.value = '';
}

function handleImageForEditSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        imageForEditing = e.target.result; // Armazena a imagem como Base64
        isWaitingForEditPrompt = true;
        if (document.querySelector('h1')) {
            mainContent.innerHTML = '';
        }
        displayMessage(imageForEditing, 'user');
        displayMessage('O que você gostaria de fazer com esta imagem?', 'ai');
    }
    reader.readAsDataURL(file);

    modal.style.display = 'none';
    event.target.value = '';
}

galleryInput.addEventListener('change', handleFileSelect);
cameraInput.addEventListener('change', handleFileSelect);
editImageInput.addEventListener('change', handleImageForEditSelect);

// --------------------------------------
// Lógica do Chat com o Backend
// --------------------------------------
sendButton.addEventListener('click', sendMessage);

let chatHistory = [];

function sendMessage() {
    const message = chatInput.value;
    if (message.trim() === '') return;

    if (isWaitingForEditPrompt) {
        displayMessage(message, 'user');
        displayTypingIndicator();
        sendMessageToBackend(message, imageForEditing);
        isWaitingForEditPrompt = false;
        imageForEditing = null;
    } else {
        let finalMessage = message;
        if (isWaitingForImagePrompt) {
            finalMessage = `criar imagem ${message}`;
            isWaitingForImagePrompt = false;
        }
        displayMessage(finalMessage, 'user');
        displayTypingIndicator();
        chatHistory.push({ role: 'user', content: finalMessage });
        sendMessageToBackend(finalMessage);
    }

    chatInput.value = '';
    chatInput.dispatchEvent(new Event('input'));
}

async function sendMessageToBackend(message, image_data = null) {
    const lowerCaseMessage = message.toLowerCase();
    let systemMessage = 'Você é um especialista altamente qualificado em sua área. Forneça respostas detalhadas, bem estruturadas e com um alto nível de conhecimento. Responda em português.';
    let requestType = 'chat';
    let requestBody = {};

    if (image_data) {
        requestType = 'image-edit';
        systemMessage = 'Você é um especialista em edição de fotos. Sua tarefa é editar a imagem fornecida com base nas instruções do usuário. Retorne apenas a imagem editada, sem nenhum texto adicional.';
        requestBody = {
            type: 'image-edit',
            image: image_data,
            prompt: message
        };
    } else if (lowerCaseMessage.startsWith('criar imagem')) {
        requestType = 'image';
        const prompt = message.substring('criar imagem'.length).trim();
        requestBody = { type: 'image', prompt: prompt };
    } else {
        if (lowerCaseMessage.startsWith('programar')) {
            systemMessage = 'Você é um programador especialista e assistente de codificação. Seu objetivo é fornecer códigos de alta qualidade, bem documentados e eficientes. Você deve ser capaz de criar desde pequenos trechos de código até projetos completos, explicar conceitos de programação e ajudar a depurar e refatorar código. Responda em português e siga as melhores práticas de desenvolvimento de software.';
        } else if (lowerCaseMessage.startsWith('ajudar a escrever')) {
            systemMessage = 'Você é um escritor e editor experiente. Forneça textos claros, concisos e bem escritos, seguindo as melhores práticas da escrita profissional. Responda em português.';
        } else if (lowerCaseMessage.startsWith('resumir texto')) {
            systemMessage = 'Você é um especialista em análise e síntese de informações. Forneça resumos precisos e informativos, destacando os pontos-chave do texto. Responda em português.';
        } else if (lowerCaseMessage.startsWith('aconselhar')) {
            systemMessage = 'Você é um conselheiro experiente e especialista em desenvolvimento pessoal e profissional. Forneça conselhos práticos, bem fundamentados e acionáveis. Responda em português.';
        }
        requestBody = { type: 'chat', messages: chatHistory, systemMessage: systemMessage };
    }

    try {
        const response = await fetch('/api/index.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        removeTypingIndicator();

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Erro do backend:', errorData);
            displayMessage(`Erro: ${errorData.error}`, 'ai');
            return;
        }

        const data = await response.json();

        let aiResponse;
        if (requestType === 'image' || requestType === 'image-edit') {
            aiResponse = data.data[0].url;
        } else {
            aiResponse = data.choices[0].message.content;
            chatHistory.push({ role: 'assistant', content: aiResponse });
        }

        displayMessage(aiResponse, 'ai');

    } catch (error) {
        removeTypingIndicator();
        console.error('Erro ao enviar mensagem para o backend:', error);
        displayMessage('Desculpe, não consigo me conectar ao servidor. Verifique sua conexão ou tente novamente mais tarde.', 'ai');
    }
}

function displayMessage(message, sender) {
    const mainContent = document.querySelector('.main-content');
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', `${sender}-message`);

    if (sender === 'user' && document.querySelector('h1')) {
        mainContent.innerHTML = '';
    }

    if ((message.startsWith('http') || message.startsWith('data:image')) && sender === 'ai') {
        const imageContainer = document.createElement('div');
        imageContainer.classList.add('image-container');
        const image = document.createElement('img');
        image.src = message;
        image.alt = "Imagem Processada por IA";
        image.style.maxWidth = "50%";
        imageContainer.appendChild(image);

        const downloadButton = document.createElement('button');
        downloadButton.innerHTML = '<i class="fas fa-download"></i>';
        downloadButton.className = 'download-button';
        downloadButton.onclick = () => {
            const link = document.createElement('a');
            link.href = image.src;
            link.download = 'imagem_editada_ia.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };
        imageContainer.appendChild(downloadButton);
        messageElement.appendChild(imageContainer);

    } else if (message.startsWith('http') || message.startsWith('data:image')) {
        const image = document.createElement('img');
        image.src = message;
        image.alt = "Imagem";
        image.style.maxWidth = "100%";
        messageElement.appendChild(image);

    } else if (message.includes('```')) {
        const pre = document.createElement('pre');
        const code = document.createElement('code');
        const codeRegex = /```(.*?)```/s;
        const codeMatch = message.match(codeRegex);
        if (codeMatch) {
            let codeContent = codeMatch[1];
            const firstLine = codeContent.split('\n')[0];
            if (firstLine.match(/^[a-z]+$/)) {
                codeContent = codeContent.substring(firstLine.length + 1);
            }
            code.textContent = codeContent;
            pre.appendChild(code);
            messageElement.appendChild(pre);

            const copyButton = document.createElement('button');
            copyButton.textContent = 'Copiar';
            copyButton.className = 'copy-button';
            copyButton.onclick = () => {
                navigator.clipboard.writeText(code.textContent);
                copyButton.textContent = 'Copiado!';
                setTimeout(() => { copyButton.textContent = 'Copiar'; }, 2000);
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
