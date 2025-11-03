
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
    const { type, prompt, messages, systemMessage } = req.body;
    let endpoint;
    let payload;

    // Define o endpoint e o payload com base no tipo de requisição
    if (type === 'image') {
      endpoint = 'https://api.openai.com/v1/images/generations';
      payload = {
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
      };
    } else if (type === 'chat') {
      endpoint = 'https://api.openai.com/v1/chat/completions';
      payload = {
        model: 'gpt-3.5-turbo',
        messages: [
          // Usa a mensagem de sistema fornecida ou uma padrão
          { role: 'system', content: systemMessage || 'Você é um assistente prestativo que responde em português.' },
          // Inclui as mensagens do usuário
          ...messages
        ],
      };
    } else {
      return res.status(400).json({ error: 'Tipo de requisição inválido. Deve ser "image" ou "chat".' });
    }

    // Envia a requisição para a API da OpenAI
    const openaiResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await openaiResponse.json();

    // Se a resposta da OpenAI não for bem-sucedida, retorna um erro
    if (!openaiResponse.ok) {
      console.error('Erro na API da OpenAI:', data);
      return res.status(openaiResponse.status).json({ error: 'A API da OpenAI retornou um erro.', details: data });
    }

    // Retorna os dados da OpenAI para o frontend
    res.status(200).json(data);

  } catch (error) {
    console.error('Erro no Servidor:', error);
    res.status(500).json({ error: 'Ocorreu um erro interno no servidor.', details: error.message });
  }
};
