
module.exports = async (req, res) => {
  // Define os cabeçalhos CORS para permitir requisições de qualquer origem
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Trata a requisição OPTIONS (preflight) para o CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Permite apenas o método POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  // Obtém a chave da API das variáveis de ambiente do servidor
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'A chave da API da OpenAI não está configurada no servidor.' });
  }

  try {
    // Extrai os dados do corpo da requisição
    const { type, prompt, messages, systemMessage, image } = req.body;
    let endpoint;
    let openaiResponse;

    if (type === 'image') {
      endpoint = 'https://api.openai.com/v1/images/generations';
      const payload = {
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
      };
      openaiResponse = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

    } else if (type === 'chat') {
      endpoint = 'https://api.openai.com/v1/chat/completions';
      const payload = {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemMessage || 'Você é um assistente prestativo que responde em português.' },
          ...messages
        ],
      };
      openaiResponse = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

    } else if (type === 'image-edit') {
        if (!image || !prompt) {
             return res.status(400).json({ error: 'Requisição de edição de imagem inválida. Requer imagem e prompt.' });
        }
        
        const imageResponse = await fetch(image); // 'image' is the data URL
        const imageBlob = await imageResponse.blob();

        const formData = new FormData();
        formData.append('prompt', prompt);
        formData.append('image', imageBlob, 'image.png'); // DALL-E 2 requires a PNG
        formData.append('model', 'dall-e-2');
        formData.append('n', 1);
        formData.append('size', '1024x1024');

        endpoint = 'https://api.openai.com/v1/images/edits';
        
        openaiResponse = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
            },
            body: formData,
        });

    } else {
      return res.status(400).json({ error: 'Tipo de requisição inválido. Deve ser "image", "chat" ou "image-edit".' });
    }

    const data = await openaiResponse.json();

    if (!openaiResponse.ok) {
      console.error('Erro na API da OpenAI:', data);
      if (type === 'image-edit' && data.error && data.error.message.includes('must be a square PNG')) {
          return res.status(openaiResponse.status).json({ error: 'A imagem precisa ser um arquivo PNG quadrado para edição. Por favor, ajuste a imagem e tente novamente.', details: data });
      }
      return res.status(openaiResponse.status).json({ error: 'A API da OpenAI retornou um erro.', details: data });
    }

    res.status(200).json(data);

  } catch (error) {
    console.error('Erro no Servidor:', error);
    res.status(500).json({ error: 'Ocorreu um erro interno no servidor.', details: error.message });
  }
};
