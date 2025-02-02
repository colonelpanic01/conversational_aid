const COHERE_API_KEY = import.meta.env.VITE_COHERE_TOKEN;

export const summarizeText = async (text) => {
  try {
    console.log('Making Cohere API call for summary...'); // Debug log
    const response = await fetch('https://api.cohere.ai/v1/chat', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${COHERE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `Summarize the following text into 3-4 key bullet points about the speaker: ${text}`,
        model: 'command',
        temperature: 0.3,
        connectors: [{ id: "web-search" }]
      })
    });

    if (!response.ok) {
      throw new Error(`Cohere API error: ${response.status}`);
    }

    const data = await response.json();
    // Parse the response to extract bullet points
    const bulletPoints = data.text
      .split('\n')
      .filter(point => point.trim().startsWith('•'))
      .map(point => point.replace('•', '').trim());

    return bulletPoints;
  } catch (error) {
    console.error('Error summarizing text:', error);
    return [];
  }
};

export const extractSpeakerName = async (text) => {
  try {
    console.log('Making Cohere API call for name extraction...'); // Debug log
    const response = await fetch('https://api.cohere.ai/v1/chat', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${COHERE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `Extract the speaker's name from this text if they introduce themselves (e.g., "my name is..."): ${text}. Return only the name or null if no introduction is found.`,
        model: 'command',
        temperature: 0.1
      })
    });

    if (!response.ok) {
      throw new Error(`Cohere API error: ${response.status}`);
    }

    const data = await response.json();
    const name = data.text.trim();
    return name === 'null' ? null : name;
  } catch (error) {
    console.error('Error extracting name:', error);
    return null;
  }
};
