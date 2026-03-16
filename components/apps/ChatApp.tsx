import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { Brain, Send, Sparkles, User, Bot, Trash2, Plus, MessageSquare, Edit3, Check, X, Menu } from 'lucide-react';
import Spinner from '../ui/Spinner';

const API_KEY = process.env.GEMINI_API_KEY || '';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  thinking?: string;
}

interface Conversation {
  id: string;
  name: string;
  messages: Message[];
  timestamp: number;
}

const ChatApp: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('nova_pro_chats');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setConversations(parsed);
        if (parsed.length > 0) {
          setCurrentChatId(parsed[0].id);
        }
      } catch (e) {
        console.error("Failed to parse saved chats", e);
      }
    }
  }, []);

  // Save conversations to localStorage
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem('nova_pro_chats', JSON.stringify(conversations));
    }
  }, [conversations]);

  const currentChat = conversations.find(c => c.id === currentChatId);
  const messages = currentChat?.messages || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const createNewChat = () => {
    const newChat: Conversation = {
      id: Date.now().toString(),
      name: `New Chat ${conversations.length + 1}`,
      messages: [],
      timestamp: Date.now()
    };
    setConversations([newChat, ...conversations]);
    setCurrentChatId(newChat.id);
  };

  const deleteChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = conversations.filter(c => c.id !== id);
    setConversations(updated);
    if (currentChatId === id) {
      setCurrentChatId(updated.length > 0 ? updated[0].id : null);
    }
  };

  const startEditing = (chat: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingChatId(chat.id);
    setEditName(chat.name);
  };

  const saveName = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editingChatId) return;
    setConversations(conversations.map(c => 
      c.id === editingChatId ? { ...c, name: editName || c.name } : c
    ));
    setEditingChatId(null);
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    let chatId = currentChatId;
    let currentConversations = [...conversations];

    // Create a new chat if none exists
    if (!chatId) {
      const newChat: Conversation = {
        id: Date.now().toString(),
        name: input.substring(0, 30) + (input.length > 30 ? '...' : ''),
        messages: [],
        timestamp: Date.now()
      };
      chatId = newChat.id;
      currentConversations = [newChat, ...conversations];
      setConversations(currentConversations);
      setCurrentChatId(chatId);
    }

    const userMessage: Message = { role: 'user', content: input };
    const updatedConversations = currentConversations.map(c => {
      if (c.id === chatId) {
        return { ...c, messages: [...c.messages, userMessage], timestamp: Date.now() };
      }
      return c;
    });
    
    setConversations(updatedConversations);
    setInput('');
    setIsLoading(true);

    try {
      const chatToUpdate = updatedConversations.find(c => c.id === chatId);
      const ai = new GoogleGenAI({ apiKey: API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: (chatToUpdate?.messages || []).map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }]
        })),
        config: {
          thinkingConfig: isThinking ? { thinkingLevel: ThinkingLevel.HIGH } : undefined,
          systemInstruction: "You are NOVA Pro, the most advanced version of the AI assistant inside NOVA AI Studio. You must ALWAYS identify yourself as NOVA Pro, never as Gemini or a Google AI. You have deep reasoning capabilities. When thinking mode is on, you will provide thorough, well-reasoned answers."
        }
      });

      const assistantMessage: Message = { 
        role: 'assistant', 
        content: response.text || 'I am sorry, I could not generate a response.',
      };

      setConversations(prev => prev.map(c => {
        if (c.id === chatId) {
          return { ...c, messages: [...c.messages, assistantMessage], timestamp: Date.now() };
        }
        return c;
      }));
    } catch (error: any) {
      console.error("Chat failed:", error);
      setConversations(prev => prev.map(c => {
        if (c.id === chatId) {
          return { ...c, messages: [...c.messages, { 
            role: 'assistant', 
            content: `Error: ${error.message || 'Something went wrong.'}` 
          }] };
        }
        return c;
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[600px] bg-slate-900 rounded-xl overflow-hidden border border-slate-800">
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 border-r border-slate-800 bg-slate-950 flex flex-col overflow-hidden`}>
        <div className="p-4">
          <button 
            onClick={createNewChat}
            className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-lg transition-all border border-slate-700 font-medium text-sm"
          >
            <Plus size={18} />
            New Chat
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto px-2 space-y-1 custom-scrollbar">
          {conversations.map(chat => (
            <div 
              key={chat.id}
              onClick={() => setCurrentChatId(chat.id)}
              className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${currentChatId === chat.id ? 'bg-purple-600/20 border border-purple-500/30 text-purple-100' : 'hover:bg-slate-800 text-slate-400 border border-transparent'}`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <MessageSquare size={16} className={currentChatId === chat.id ? 'text-purple-400' : 'text-slate-500'} />
                {editingChatId === chat.id ? (
                  <input 
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="bg-slate-700 text-white text-xs p-1 rounded outline-none w-32"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="text-xs font-medium truncate">{chat.name}</span>
                )}
              </div>
              
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {editingChatId === chat.id ? (
                  <>
                    <button onClick={saveName} className="p-1 hover:text-green-400"><Check size={14} /></button>
                    <button onClick={(e) => { e.stopPropagation(); setEditingChatId(null); }} className="p-1 hover:text-red-400"><X size={14} /></button>
                  </>
                ) : (
                  <>
                    <button onClick={(e) => startEditing(chat, e)} className="p-1 hover:text-sky-400"><Edit3 size={14} /></button>
                    <button onClick={(e) => deleteChat(chat.id, e)} className="p-1 hover:text-red-400"><Trash2 size={14} /></button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/80 backdrop-blur-md">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
            >
              <Menu size={20} />
            </button>
            <div className="bg-gradient-to-br from-purple-500 to-blue-500 p-2 rounded-lg shadow-lg shadow-purple-500/20">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-white flex items-center gap-2">
                NOVA Pro
                <span className="bg-purple-500/20 text-purple-400 text-[10px] px-1.5 py-0.5 rounded border border-purple-500/30 uppercase tracking-wider font-black">Thinking Mode</span>
              </h2>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Powered by Gemini 3.1 Pro</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
              <button 
                  onClick={() => setIsThinking(!isThinking)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${isThinking ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'bg-slate-800 text-slate-400'}`}
                  title="Toggle Deep Reasoning"
              >
                  <Brain size={14} />
                  {isThinking ? 'Thinking On' : 'Thinking Off'}
              </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
              <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center">
                  <Brain size={40} className="text-slate-600" />
              </div>
              <div>
                  <p className="text-slate-300 font-medium text-lg">Deep Reasoning Mode</p>
                  <p className="text-sm text-slate-500 max-w-xs mx-auto">Ask complex questions, solve math problems, or get detailed analysis with NOVA Pro.</p>
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ${msg.role === 'user' ? 'bg-sky-600' : 'bg-purple-600'}`}>
                    {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <div className={`p-4 rounded-2xl shadow-xl border ${msg.role === 'user' ? 'bg-sky-600/10 border-sky-500/30 text-sky-50' : 'bg-slate-800/80 border-slate-700 text-slate-100'}`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-3 max-w-[85%]">
                <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0 animate-pulse">
                  <Bot size={16} />
                </div>
                <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-2xl shadow-xl flex items-center gap-3">
                  <Spinner />
                  <span className="text-xs text-purple-400 font-bold animate-pulse uppercase tracking-widest">NOVA is thinking deeply...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 backdrop-blur-md">
          <form onSubmit={handleSend} className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask NOVA Pro anything..."
              className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-4 pl-4 pr-14 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all shadow-inner"
            />
            <button 
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-purple-600 p-2.5 rounded-xl hover:bg-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-600/20"
            >
              <Send size={20} />
            </button>
          </form>
          <p className="text-[10px] text-center text-slate-600 mt-3 font-medium">
              Pro mode uses advanced reasoning and may take longer to respond.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatApp;
