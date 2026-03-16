import React, { useState } from 'react';
import { Search, Globe, ExternalLink, ArrowRight } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

const API_KEY = 'AIzaSyAFiMmpabdKgZmCGYVASETt3VBmI2phJ7k';

interface SearchResult {
  title: string;
  snippet: string;
  url: string;
}

const SearchApp: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState('');

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setAnswer('');
    setResults([]);

    try {
      const ai = new GoogleGenAI({ apiKey: API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: query,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });

      setAnswer(response.text || 'No answer found.');
      
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        const searchResults: SearchResult[] = chunks
          .filter(chunk => chunk.web)
          .map(chunk => ({
            title: chunk.web?.title || 'Source',
            url: chunk.web?.uri || '#',
            snippet: '' // Snippet isn't always directly available in this format
          }));
        setResults(searchResults);
      }
    } catch (error) {
      console.error("Search failed:", error);
      setAnswer("Sorry, I encountered an error while searching.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[500px] bg-slate-900 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-slate-800">
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the web with NOVA..."
            className="w-full bg-slate-800 border border-slate-700 rounded-full py-3 pl-12 pr-4 text-white focus:ring-2 focus:ring-sky-500 focus:outline-none transition-all"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
          <button 
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-sky-600 p-2 rounded-full hover:bg-sky-500 transition-colors"
          >
            <ArrowRight size={18} />
          </button>
        </form>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-500"></div>
            <p className="text-slate-400">Searching the web...</p>
          </div>
        ) : answer ? (
          <div className="space-y-6">
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
              <div className="flex items-center space-x-2 mb-3 text-sky-400">
                <Globe size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">AI Summary</span>
              </div>
              <p className="text-slate-200 leading-relaxed">{answer}</p>
            </div>

            {results.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Sources</h3>
                <div className="grid gap-3">
                  {results.map((res, i) => (
                    <a 
                      key={i} 
                      href={res.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-between bg-slate-800 hover:bg-slate-700 p-3 rounded-lg border border-slate-700 transition-colors group"
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <h4 className="text-sm font-medium text-white truncate group-hover:text-sky-400 transition-colors">{res.title}</h4>
                        <p className="text-xs text-slate-500 truncate">{res.url}</p>
                      </div>
                      <ExternalLink size={14} className="text-slate-500 group-hover:text-sky-400" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
            <Search size={48} className="text-slate-700" />
            <div>
              <p className="text-slate-400 font-medium">What are you looking for today?</p>
              <p className="text-xs text-slate-600 mt-1">Try: "Latest space news" or "How to bake a cake"</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchApp;
