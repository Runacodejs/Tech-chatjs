
// --------------------------------------
// Lógica da Sidebar (Mantido)
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


// --------------------------------------
// Lógica do Botão de Envio
// --------------------------------------
const chatInput = document.getElementById('chatInput');
const sendButton = document.getElementById('sendButton');
const voiceIcons = document.getElementById('voiceIcons');

// Monitora a entrada de texto
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
const featureButtons = document.querySelectorAll('.feature-button');

featureButtons.forEach(button => {
    button.addEventListener('click', (event) => {
        const featureText = event.currentTarget.textContent.trim();
        chatInput.value = featureText;
        chatInput.dispatchEvent(new Event('input'));
        sendMessage();
    });
});

// --------------------------------------
// Lógica do Chat com OpenAI
// --------------------------------------
let apiKey = localStorage.getItem('openai_api_key');

sendButton.addEventListener('click', sendMessage);

function sendMessage() {
    const message = chatInput.value;
    if (!apiKey) {
        apiKey = prompt("Please enter your OpenAI API key:");
        localStorage.setItem('openai_api_key', apiKey);
    }
    if (message) {
        displayMessage(message, 'user');
        sendMessageToOpenAI(message);
        chatInput.value = '';
    }
}

async function sendMessageToOpenAI(message) {
    const lowerCaseMessage = message.toLowerCase();
    let systemMessage = 'You are a helpful assistant that responds in Portuguese.';

    if (lowerCaseMessage.startsWith('criar imagem')) {
        // Handle image generation
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
        const imageUrl = data.data[0].url;
        displayMessage(imageUrl, 'ai');
        return;
    } 

    if (lowerCaseMessage.startsWith('programar')) {
        systemMessage = 'You are a helpful assistant that responds in Portuguese and helps with programming.';
    } else if (lowerCaseMessage.startsWith('ajudar a escrever')) {
        systemMessage = 'You are a helpful assistant that responds in Portuguese and helps with writing.';
    } else if (lowerCaseMessage.startsWith('resumir texto')) {
        systemMessage = 'You are a helpful assistant that responds in Portuguese and helps with summarizing text.';
    } else if (lowerCaseMessage.startsWith('aconselhar')) {
        systemMessage = 'You are a helpful assistant that responds in Portuguese and gives advice.';
    }

    // Handle chat completion
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
    displayMessage(data.choices[0].message.content, 'ai');
}


function displayMessage(message, sender) {
    const mainContent = document.querySelector('.main-content');
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', `${sender}-message`);

    if (message.startsWith('http')) {
        const image = document.createElement('img');
        image.src = message;
        image.alt = "Generated AI Image";
        image.style.maxWidth = "50%";
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
        }
    } else {
        messageElement.textContent = message;
    }

    mainContent.appendChild(messageElement);
}
