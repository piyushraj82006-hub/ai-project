/* ============================================
   Google Gemini AI Integration
   ============================================ */

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const MODELS = ['gemini-2.0-flash', 'gemini-2.0-flash-lite'];

function getApiUrl(model = MODELS[0]) {
  return `${GEMINI_BASE_URL}/${model}:generateContent`;
}


const SUMMARY_SYSTEM_PROMPT = `You are an expert academic document analyzer. Analyze the given text and return a structured JSON object.

IMPORTANT: Return ONLY valid JSON, no markdown wrappers around the JSON block.

The JSON must conform exactly to these fields:
{
  "documentTitle": "The title or subject of the document",
  "metadata": {
    "courseCode": "if found",
    "credits": "if found",
    "totalHours": "if found"
  },
  
  "markdownContent": "The COMPLETE, highly detailed, beautifully formatted markdown analysis of the entire document. INCLUDE everything relevant: markdown tables, mathematical formulas (using $ and $$), structured notes, solved examples, deep insights, and comprehensive explanations. This should read like a premium textbook, study guide, or solved exam paper. Use extensive Markdown formatting (Headers, Lists, Bold, Blockquotes).",

  "keyTakeaways": ["A short, punchy bullet point", "Another concise point", "etc"],
  "modules": [
    {
      "title": "Module/Section title",
      "description": "Brief description of what this module covers",
      "topics": ["topic 1", "topic 2"]
    }
  ],
  "keyConcepts": [
    {
      "term": "concept name",
      "definition": "brief explanation"
    }
  ],
  "keyInsights": ["insight 1", "insight 2"],
  "practiceQuestions": [
    {
      "question": "The exact question from the text",
      "answer": "A clear, educational step-by-step answer or explanation"
    }
  ]
}

Rules:
- The 'markdownContent' field is the MOST IMPORTANT output. It must be extremely comprehensive, structured beautifully with markdown headers, bullet points, and math/tables where appropriate. Solved examples should be highly detailed inside this markdown string.
- The other array fields ('modules', 'keyConcepts', 'practiceQuestions', 'keyTakeaways', 'keyInsights') are ONLY used in the backend to visually draw a Mind Map. Populate them accurately based on the text, but keep them concise. Do NOT invent arrays if they do not exist in the document (leave empty []).
- If the document contains exam papers, assignments, or practice questions, SOLVE them clearly within the 'markdownContent' and map the top ones into the 'practiceQuestions' array.`;

/**
 * Core API call with model and API key fallback, followed by OpenAI fallback
 */
async function callAIWithFallback(apiKeys, systemPrompt, userPrompt, parseMode = 'object', pdfBase64 = null) {
  let lastError;

  for (const apiKey of apiKeys) {
    if (!apiKey) continue;
    
    for (const model of MODELS) {
      try {
        console.log(`[Gemini] Trying model: ${model} with key starting in ${apiKey.substring(0, 10)}...`);
        const response = await fetch(`${getApiUrl(model)}?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: systemPrompt }]
            },
            contents: [{
              parts: [
                { text: userPrompt },
                ...(pdfBase64 ? [{ inlineData: { mimeType: 'application/pdf', data: pdfBase64 } }] : [])
              ]
            }],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 4096,
              responseMimeType: 'application/json',
            }
          })
        });

        if (response.status === 429) {
          const err = await response.json().catch(() => ({}));
          const msg = err.error?.message || '';
          console.warn(`[Gemini] Rate limit or quota hit for ${model} on this key. Trying next option...`);
          lastError = new Error(`Quota or rate limit hit: ${msg}`);
          if (apiKeys.length > 1) {
            break; 
          }
          continue;
        }

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          lastError = new Error(err.error?.message || `Gemini API error: ${response.status}`);
          continue;
        }

        const data = await response.json();
        return parseGeminiResponse(data, parseMode);
      } catch (err) {
        lastError = err;
        console.error(`[Gemini] ${model} failed:`, err.message);
      }
    }
  }

  // Groq Fallback (cannot process native PDFs)
  const groqKey = import.meta.env.VITE_GROQ_API_KEY;
  if (groqKey && !pdfBase64) {
    try {
      const groqBody = {
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
      };

      if (parseMode === 'object') {
        groqBody.response_format = { type: 'json_object' };
      }

      console.log(`[Groq] Gemini failed or exhausted. Falling back to Groq (llama-3.3-70b-versatile)...`);
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`
        },
        body: JSON.stringify(groqBody)
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const rawText = data.choices?.[0]?.message?.content;
      if (!rawText) throw new Error('No response from OpenAI API');
      
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(rawText);
      } catch {
        const pattern = parseMode === 'array' ? /\[[\s\S]*\]/ : /\{[\s\S]*\}/;
        const match = rawText.match(pattern);
        if (match) parsedResponse = JSON.parse(match[0]);
        else throw new Error('Failed to parse OpenAI response as JSON');
      }

      // OpenAI strictly enforces returning an object if type is json_object.
      // If we expect an array (for reels), OpenAI will likely wrap it in an object like { "reels": [...] }
      if (parseMode === 'array' && !Array.isArray(parsedResponse)) {
        return parsedResponse.reels || parsedResponse.data || Object.values(parsedResponse)[0] || [];
      }
      return parsedResponse;

    } catch (err) {
      console.error(`[OpenAI Fallback] Failed:`, err.message);
      lastError = new Error(`Both Gemini and OpenAI failed. Last error: ${err.message}`);
    }
  }

  throw lastError || new Error('All Gemini models failed and no OpenAI fallback configured.');
}

function parseGeminiResponse(data, parseMode) {
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) throw new Error('No response from Gemini API');

  try {
    return JSON.parse(rawText);
  } catch {
    const pattern = parseMode === 'array' ? /\[[\s\S]*\]/ : /\{[\s\S]*\}/;
    const match = rawText.match(pattern);
    if (match) return JSON.parse(match[0]);
    throw new Error('Failed to parse AI response as JSON');
  }
}

export function getApiKeys() {
  const rawKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!rawKey) return [];
  // Split by comma and remove whitespace
  return rawKey.split(',').map(k => k.trim()).filter(Boolean);
}

/**
 * Summarize PDF text using Google Gemini API (with model fallback)
 */
export async function summarizeWithGemini(text, pdfBase64 = null) {
  const apiKeys = getApiKeys();
  if (apiKeys.length === 0) throw new Error('Gemini API key is not configured on the server. Please contact the administrator.');
  const userPrompt = pdfBase64 && !text 
    ? 'Analyze and summarize the attached scanned PDF document.'
    : `Analyze and summarize the following document text:\n\n${text}`;
    
  return callAIWithFallback(apiKeys, SUMMARY_SYSTEM_PROMPT, userPrompt, 'object', pdfBase64);
}

/**
 * Transform summary object into mind map tree structure
 * @param {object} summary - Structured summary object
 * @returns {object} Tree structure for D3 visualization
 */
export function extractMindMapData(summary) {
  if (!summary) return null;

  const root = {
    name: summary.documentTitle || 'Document',
    children: []
  };

  // Modules branch
  if (summary.modules?.length) {
    root.children.push({
      name: 'Modules',
      type: 'modules',
      children: summary.modules.map(mod => ({
        name: mod.title || 'Untitled Module',
        type: 'module',
        children: (mod.topics || []).map(t => ({
          name: typeof t === 'string' ? t : t.name || 'Topic',
          type: 'topic'
        }))
      }))
    });
  }

  // Key Concepts branch
  if (summary.keyConcepts?.length) {
    root.children.push({
      name: 'Key Concepts',
      type: 'concepts',
      children: summary.keyConcepts.map(kc => ({
        name: kc.term || 'Concept',
        description: kc.definition,
        type: 'concept'
      }))
    });
  }

  // Key Takeaways branch
  if (summary.keyTakeaways?.length) {
    root.children.push({
      name: 'Key Takeaways',
      type: 'takeaways',
      children: summary.keyTakeaways.map(ins => ({
        name: typeof ins === 'string' ? (ins.length > 60 ? ins.slice(0, 57) + '...' : ins) : 'Takeaway',
        type: 'takeaway'
      }))
    });
  }

  // Objectives branch
  if (summary.courseObjectives?.length) {
    root.children.push({
      name: 'Objectives',
      type: 'objectives',
      children: summary.courseObjectives.map(obj => ({
        name: typeof obj === 'string' ? (obj.length > 60 ? obj.slice(0, 57) + '...' : obj) : 'Objective',
        type: 'objective'
      }))
    });
  }

  // Insights branch
  if (summary.keyInsights?.length) {
    root.children.push({
      name: 'Key Insights',
      type: 'insights',
      children: summary.keyInsights.map(ins => ({
        name: typeof ins === 'string' ? (ins.length > 60 ? ins.slice(0, 57) + '...' : ins) : 'Insight',
        type: 'insight'
      }))
    });
  }

  // Questions branch
  if (summary.practiceQuestions?.length) {
    root.children.push({
      name: 'Practice Questions',
      type: 'objectives', // reusing color
      children: summary.practiceQuestions.map(pq => ({
        name: pq.question?.length > 60 ? pq.question.slice(0, 57) + '...' : pq.question || 'Question',
        description: pq.answer,
        type: 'objective'
      }))
    });
  }

  // Outcomes branch
  if (summary.courseOutcomes?.length) {
    root.children.push({
      name: 'Outcomes',
      type: 'outcomes',
      children: summary.courseOutcomes.map(out => ({
        name: typeof out === 'string' ? (out.length > 60 ? out.slice(0, 57) + '...' : out) : 'Outcome',
        type: 'outcome'
      }))
    });
  }

  return root;
}

/* ============================================
   Reel Generation
   ============================================ */

const REEL_SYSTEM_PROMPT = `You are an expert educational content creator. Generate a series of scrollable educational reel cards from the given text.

IMPORTANT: Return ONLY a valid JSON array, no markdown, no code fences.

Each reel should cover a DISTINCT section or topic of the document. Create AT LEAST 5 reels.

Each reel must have this structure:
{
  "title": "Short punchy title (max 8 words)",
  "content": "3-5 engaging, conversational but educational sentences explaining this section",
  "keyPoints": ["Point 1", "Point 2", "Point 3"]
}

Rules:
- Each reel covers a DIFFERENT section — no overlap
- Use conversational but educational tone
- 2-4 keyPoints per reel
- Content should be self-contained — each reel is understandable on its own
- Make titles catchy and engaging
- Cover the MOST IMPORTANT concepts from the document`;

/**
 * Generate scrollable reel cards from PDF text using Gemini API (with model fallback)
 */
/* ============================================
   Quiz Generation
   ============================================ */

const QUIZ_SYSTEM_PROMPT = `You are an expert academic quiz creator. Generate a multiple-choice quiz from the given text.

IMPORTANT: Return ONLY a valid JSON array, no markdown, no code fences.

Create AT LEAST 10 questions. Each question must have this structure:
{
  "question": "The question text",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctIndex": 0,
  "explanation": "Brief explanation of the correct answer"
}

Rules:
- Questions should test understanding, not just recall
- Mix difficulty levels: easy, medium, hard
- Each question has exactly 4 options
- correctIndex is 0-based (0=A, 1=B, 2=C, 3=D)
- Explanations should be educational and concise
- Cover ALL major topics from the document
- Make distractors plausible but clearly wrong`;

/**
 * Generate quiz MCQs from document text using Gemini API
 */
export async function generateQuizWithGemini(text, pdfBase64 = null) {
  const apiKeys = getApiKeys();
  if (apiKeys.length === 0) throw new Error('Gemini API key is not configured on the server.');

  const userPrompt = pdfBase64 && !text 
    ? 'Create a quiz from the attached scanned PDF document.'
    : `Create a quiz from this document:\n\n${text}`;

  const parsed = await callAIWithFallback(apiKeys, QUIZ_SYSTEM_PROMPT, userPrompt, 'array', pdfBase64);
  const questions = Array.isArray(parsed) ? parsed : (parsed.questions || parsed.data || []);
  
  return questions.map((q, i) => ({
    question: q.question || `Question ${i + 1}`,
    options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ['Option A', 'Option B', 'Option C', 'Option D'],
    correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
    explanation: q.explanation || '',
  }));
}

/**
 * Generate flashcards from document text using Gemini API
 */
export async function generateFlashcardsWithGemini(text, pdfBase64 = null) {
  const apiKeys = getApiKeys();
  if (apiKeys.length === 0) throw new Error('Gemini API key is not configured on the server.');

  const userPrompt = pdfBase64 && !text 
    ? 'Create flashcards from the attached scanned PDF document.'
    : `Create flashcards from this document:\n\n${text}`;

  const parsed = await callAIWithFallback(apiKeys, FLASHCARD_SYSTEM_PROMPT, userPrompt, 'array', pdfBase64);
  const cards = Array.isArray(parsed) ? parsed : (parsed.flashcards || parsed.data || []);
  
  return cards.map((c, i) => ({
    front: c.front || c.term || `Term ${i + 1}`,
    back: c.back || c.definition || 'Definition not available',
    category: c.category || 'General',
  }));
}

/**
 * Generate flashcards from summary object (client-side, no API call)
 */
export function generateFlashcardsFromSummary(summary) {
  if (!summary) return [];
  const cards = [];

  // Key Concepts -> Flashcards
  if (summary.keyConcepts?.length) {
    summary.keyConcepts.forEach(kc => {
      cards.push({
        front: kc.term || 'Concept',
        back: kc.definition || 'No definition available',
        category: 'Key Concepts',
      });
    });
  }

  // Key Takeaways -> Flashcards
  if (summary.keyTakeaways?.length) {
    summary.keyTakeaways.forEach((tk, i) => {
      cards.push({
        front: `Key Takeaway ${i + 1}`,
        back: typeof tk === 'string' ? tk : JSON.stringify(tk),
        category: 'Key Takeaways',
      });
    });
  }

  // Modules -> Flashcards
  if (summary.modules?.length) {
    summary.modules.forEach(mod => {
      cards.push({
        front: mod.title || 'Module',
        back: mod.description || (mod.topics || []).join(', '),
        category: 'Modules',
      });
    });
  }

  // Practice Questions -> Flashcards
  if (summary.practiceQuestions?.length) {
    summary.practiceQuestions.forEach(pq => {
      cards.push({
        front: pq.question || 'Question',
        back: pq.answer || 'No answer available',
        category: 'Practice Questions',
      });
    });
  }

  return cards;
}

const FLASHCARD_SYSTEM_PROMPT = `You are an expert academic study aid creator. Generate flashcards from the given text.

IMPORTANT: Return ONLY a valid JSON array, no markdown, no code fences.

Create AT LEAST 15 flashcards. Each flashcard must have this structure:
{
  "front": "The term, question, or concept",
  "back": "The definition, answer, or explanation",
  "category": "Category name (e.g., Key Terms, Definitions, Formulas, Concepts)"
}

Rules:
- Front should be concise (a term, short question, or concept name)
- Back should be clear and educational
- Group related cards by category
- Cover ALL important terms and concepts
- Mix difficulty levels
- Make backs detailed enough to learn from`;

export async function generateReelsWithGemini(text, pdfBase64 = null) {
  const apiKeys = getApiKeys();
  if (apiKeys.length === 0) throw new Error('Gemini API key is not configured on the server.');

  const userPrompt = pdfBase64 && !text 
    ? 'Create educational reels from the attached scanned PDF document.'
    : `Create educational reels from this document:\n\n${text}`;

  const parsed = await callAIWithFallback(apiKeys, REEL_SYSTEM_PROMPT, userPrompt, 'array', pdfBase64);
  const reels = Array.isArray(parsed) ? parsed : (parsed.reels || parsed.data || []);
  
  return reels.map((r, i) => ({
    title: r.title || `Section ${i + 1}`,
    content: r.content || 'Content unavailable',
    keyPoints: Array.isArray(r.keyPoints) ? r.keyPoints : [],
    index: i,
  }));
}
