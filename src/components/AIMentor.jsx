import { useState, useEffect, useRef } from 'react';
import { Bot, X, Send, User, MessageCircle, RefreshCw, ChevronDown } from 'lucide-react';
import { toast } from '../lib/toast';

const SYSTEM_PROMPT = `You are Scroll.io's AI Academic Mentor, powered by OpenRouter dots-3 reasoning model.
Your role is to guide the student, give academic advice, help plan their studies, and motivate them.
Keep your responses concise, encouraging, and highly practical.
You remember their past conversations. Focus on helping them succeed in their semester.`;

export default function AIMentor() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef(null);
  
  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('mentor_history');
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch {
        console.error('Failed to parse mentor history');
      }
    } else {
      setMessages([{ role: 'ai', content: "Hi! I'm your academic mentor. How can I help you plan your studies today?" }]);
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('mentor_history', JSON.stringify(messages));
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleClearHistory = () => {
    if (window.confirm('Clear your chat history with the mentor?')) {
      const initial = [{ role: 'ai', content: "Hi! I'm your academic mentor. How can I help you plan your studies today?" }];
      setMessages(initial);
      localStorage.setItem('mentor_history', JSON.stringify(initial));
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const orKey = import.meta.env.VITE_OPENROUTER_API_KEY;
      if (!orKey) {
        throw new Error('OpenRouter API key is missing. Please set VITE_OPENROUTER_API_KEY in your environment.');
      }

      // Format history for the API
      const apiMessages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...updatedMessages.map(m => ({
          role: m.role === 'ai' ? 'assistant' : 'user',
          content: m.content
        }))
      ];

      const payload = {
        model: 'dots-studio/dots-3-note-preview:free',
        messages: apiMessages,
        reasoning: { enabled: true },
        temperature: 0.3
      };

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${orKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Scroll.io'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Failed to fetch response');
      }

      const data = await response.json();
      const msg = data.choices?.[0]?.message;
      
      let botContent = msg?.content;
      if (!botContent && msg?.reasoning_details?.length) {
        botContent = msg.reasoning_details.filter(r => r.type === 'text').map(r => r.text).join('');
      }

      if (!botContent) {
        throw new Error('Received empty response from the mentor API.');
      }

      // Clean reasoning tags
      botContent = botContent.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '').trim();

      setMessages(prev => [...prev, { role: 'ai', content: botContent }]);
      
    } catch (err) {
      console.error('Mentor Error:', err);
      toast.error(err.message || 'The mentor is currently unavailable.');
      setMessages(prev => [...prev, { role: 'ai', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button 
          className="mentor-fab"
          onClick={() => setIsOpen(true)}
          aria-label="Open AI Mentor"
        >
          <Bot size={24} />
        </button>
      )}

      {/* Chat Widget */}
      {isOpen && (
        <div className="mentor-widget animate-slideUp">
          <div className="mentor-header">
            <div className="mentor-title">
              <Bot size={18} />
              <span>AI Academic Mentor</span>
            </div>
            <div className="mentor-actions">
              <button onClick={handleClearHistory} title="Clear Chat History">
                <RefreshCw size={14} />
              </button>
              <button onClick={() => setIsOpen(false)} title="Close">
                <ChevronDown size={18} />
              </button>
            </div>
          </div>

          <div className="mentor-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`mentor-msg-row ${msg.role === 'user' ? 'user-row' : 'ai-row'}`}>
                {msg.role === 'ai' && <div className="mentor-avatar ai-avatar"><Bot size={14} /></div>}
                <div className={`mentor-bubble ${msg.role === 'user' ? 'user-bubble' : 'ai-bubble'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="mentor-msg-row ai-row">
                <div className="mentor-avatar ai-avatar"><Bot size={14} /></div>
                <div className="mentor-bubble ai-bubble typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="mentor-input-area" onSubmit={sendMessage}>
            <input
              type="text"
              placeholder="Ask for advice, planning help..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
            />
            <button type="submit" disabled={!input.trim() || isLoading} className="send-btn">
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
