import { getApiKeys } from './gemini';

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * Split massive text into roughly 500-word logical chunks for optimal vector performance.
 */
function chunkText(text, maxWords = 400) {
  if (!text) return [];
  const paragraphs = text.split(/\n\s*\n/);
  const chunks = [];
  let currentChunk = '';

  for (const p of paragraphs) {
    if ((currentChunk + ' ' + p).split(/\s+/).length < maxWords) {
      currentChunk += (currentChunk ? '\n\n' : '') + p;
    } else {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = p;
    }
  }
  if (currentChunk) chunks.push(currentChunk.trim());
  return chunks;
}

/**
 * Get embeddings for an array of text chunks natively using Gemini's Embedding Model
 */
async function generateEmbeddings(chunks, apiKey) {
  try {
    const response = await fetch(`${GEMINI_BASE_URL}/gemini-embedding-001:batchEmbedContents?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: chunks.map(chunk => ({
          model: 'models/gemini-embedding-001',
          content: { parts: [{ text: chunk }] }
        }))
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Embedding failed');
    return data.embeddings.map(e => e.values);
  } catch (err) {
    console.error('Embedding error:', err);
    throw err;
  }
}

/**
 * Lightweight mathematical Cosine Similarity dot-product formula
 */
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Takes raw text, chunks it, hits the embedding API, and stores it in RAM.
 */
export async function initializeVectorStore(text) {
  const keys = getApiKeys();
  if (!keys.length) throw new Error('Gemini API key is not configured.');
  
  const chunks = chunkText(text);
  if (chunks.length === 0) return [];
  
  // To avoid maximum batch payload size, we embed them up to 100 chunks at a time.
  const embeddings = [];
  for (let i = 0; i < chunks.length; i += 100) {
    const batch = chunks.slice(i, i + 100);
    const batchEmbeddings = await generateEmbeddings(batch, keys[0]);
    embeddings.push(...batchEmbeddings);
  }
  
  return chunks.map((chunkText, i) => ({
    text: chunkText,
    vector: embeddings[i]
  }));
}

/**
 * Finds relevant vectors and forces the Chat model to analyze ONLY those snippets.
 */
export async function chatWithRAG(query, chatHistory, vectorStore, pdfBase64 = null) {
  const keys = getApiKeys();
  if (!keys.length) throw new Error('Gemini API key is not configured.');
  const apiKey = keys[0];

  let contextSnippet = '';
  
  // If we have a vectorized text document, perform local RAG similarity search
  if (vectorStore && vectorStore.length > 0) {
    const embedRes = await fetch(`${GEMINI_BASE_URL}/gemini-embedding-001:embedContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/gemini-embedding-001',
        content: { parts: [{ text: query }] }
      })
    });
    const embedData = await embedRes.json();
    if (!embedRes.ok) throw new Error(embedData.error?.message || 'Query embedding failed');
    const queryVector = embedData.embedding.values;

    const scoredChunks = vectorStore.map(chunk => ({
      ...chunk,
      score: cosineSimilarity(queryVector, chunk.vector)
    }));
    scoredChunks.sort((a, b) => b.score - a.score);
    
    // Pass the top 5 most highly correlated paragraphs explicitly into the Model Context
    const topChunks = scoredChunks.slice(0, 5).map(c => c.text);
    contextSnippet = topChunks.join('\n\n---\n\n');
  }

  // The strict prompt rules
  const systemInstruction = 
    `You are an expert strict AI assistant inside a study application. Answer the user's question using ONLY the provided document context.` +
    `\nIf the document does not contain the answer, you MUST specifically say exactly: "Answer not found in the provided document". Do not hallucinate external information. Do NOT apologize. Keep explanations concise, educational, and accurate.`;

  // --- Load Balancing / Fallback: Attempt to offload text generation to OpenRouter (dots-3) ---
  const orKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  // OpenRouter dots-3 cannot read pure raw image base64 arrays natively. If pdfBase64 exists, we MUST use Gemini Vision.
  if (orKey && !pdfBase64) {
    try {
      const orPayload = {
        model: 'dots-studio/dots-3-note-preview:free',
        messages: [
          { role: 'system', content: systemInstruction },
          ...chatHistory.map(msg => ({ role: msg.role === 'ai' ? 'assistant' : 'user', content: msg.content })),
          { role: 'user', content: contextSnippet ? `DOCUMENT CONTEXT EXCERPTS:\n${contextSnippet}\n\nQUESTION: ${query}` : `QUESTION: ${query}` }
        ],
        reasoning: { enabled: true },
        temperature: 0.1
      };
      
      const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${orKey}`,
          'HTTP-Referer': 'https://scroll-d95c6.web.app',
          'X-Title': 'Scroll.io'
        },
        body: JSON.stringify(orPayload)
      });
      const orData = await orRes.json();
      
      if (orRes.ok && orData.choices?.[0]?.message) {
        const msg = orData.choices[0].message;
        let content = msg.content;
        
        // dots-3 might return null content with reasoning details
        if (!content && msg.reasoning_details) {
          content = msg.reasoning_details.filter(r => r.type === 'text').map(r => r.text).join('');
        }
        
        if (content) {
          // Strip <think> tags before showing to user
          return content.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '').trim();
        }
      }
      throw new Error(orData.error?.message || JSON.stringify(orData));
    } catch (e) {
      console.warn(`[OpenRouter dots-3] Failed for chatWithRAG, falling back to Gemini: ${e.message}`);
    }
  } else if (pdfBase64) {
    console.log('Scanned PDF detected. OpenRouter bypassed natively to Gemini 2.0 Flash.');
  }

  // --- Fallback / Baseline: Execute natively on Gemini 2.0 Flash ---
  const payload = {
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents: [
      ...chatHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      })),
      {
        role: 'user',
        parts: [
          { text: contextSnippet ? `DOCUMENT CONTEXT EXCERPTS:\n${contextSnippet}\n\nQUESTION: ${query}` : `QUESTION: ${query}` },
          ...(pdfBase64 ? [{ inlineData: { mimeType: 'application/pdf', data: pdfBase64 } }] : [])
        ]
      }
    ],
    generationConfig: { temperature: 0.1 } // Very low temp to enforce strict factual recall without hallucination
  };

  const response = await fetch(`${GEMINI_BASE_URL}/gemini-3.6-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || 'Chat generation failed');
  
  if (!data.candidates || data.candidates.length === 0) {
      throw new Error("Safety filters blocked the generation or AI returned empty response.");
  }
  return data.candidates[0].content.parts[0].text;
}
