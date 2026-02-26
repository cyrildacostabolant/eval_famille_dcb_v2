
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import { Sparkles, Send, Loader2, Search, Globe, Copy, Check } from 'lucide-react';

const GeminiSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [sources, setSources] = useState<{ uri: string; title: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    setLoading(true);
    setResponse(null);
    setSources([]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: query,
        config: {
          systemInstruction: "Tu es un assistant pédagogique. Pour les formules mathématiques et scientifiques, utilise TOUJOURS le format LaTeX avec les délimiteurs '$' pour les formules en ligne et '$$' pour les formules en bloc. Assure-toi que les formules complexes sont bien lisibles.",
          tools: [{ googleSearch: {} }],
        },
      });

      setResponse(result.text || "Aucune réponse générée.");
      
      // Extract URLs from grounding chunks
      const chunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        const extractedSources = chunks
          .filter((chunk: any) => chunk.web)
          .map((chunk: any) => ({
            uri: chunk.web.uri,
            title: chunk.web.title,
          }));
        setSources(extractedSources);
      }
    } catch (error) {
      console.error("Gemini Search Error:", error);
      setResponse("Une erreur est survenue lors de la recherche. Veuillez vérifier votre connexion ou réessayer plus tard.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (response) {
      navigator.clipboard.writeText(response);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 animate-fade-in">
      <header className="mb-8">
        <div className="flex items-center gap-2 text-indigo-600 font-bold mb-1">
          <Sparkles size={18} />
          <span className="uppercase tracking-wider text-[10px]">Assistant Intelligent</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Recherche Gemini</h1>
        <p className="text-slate-500 mt-1">Posez vos questions et obtenez des réponses sourcées pour vos évaluations.</p>
      </header>

      <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden mb-8">
        <form onSubmit={handleSearch} className="p-4 flex gap-3 items-center">
          <div className="relative flex-grow">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <Search size={20} />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ex: Quelles sont les causes de la Révolution Française ?"
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-indigo-500/30 outline-none transition-all font-medium text-slate-800"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white p-4 rounded-2xl transition-all shadow-lg shadow-indigo-200 flex items-center justify-center min-w-[56px]"
          >
            {loading ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}
          </button>
        </form>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
            <Sparkles className="absolute inset-0 m-auto text-indigo-600 animate-pulse" size={24} />
          </div>
          <p className="font-bold animate-pulse">Gemini analyse votre requête...</p>
        </div>
      )}

      {response && !loading && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 p-8 relative group">
            <button
              onClick={copyToClipboard}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
              title="Copier la réponse"
            >
              {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
            </button>
            
            <div className="markdown-body prose prose-slate max-w-none">
              <Markdown 
                remarkPlugins={[remarkMath, remarkGfm]} 
                rehypePlugins={[rehypeKatex]}
              >
                {response}
              </Markdown>
            </div>
          </div>

          {sources.length > 0 && (
            <div className="bg-slate-50 rounded-[32px] p-6 border border-slate-100">
              <div className="flex items-center gap-2 text-slate-500 font-bold mb-4 text-xs uppercase tracking-widest">
                <Globe size={14} />
                <span>Sources consultées</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sources.map((source, idx) => (
                  <a
                    key={idx}
                    href={source.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:shadow-sm transition-all group"
                  >
                    <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                      <Globe size={16} />
                    </div>
                    <div className="overflow-hidden">
                      <div className="font-bold text-slate-800 text-xs truncate">{source.title}</div>
                      <div className="text-[10px] text-slate-400 truncate">{source.uri}</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!response && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          {[
            "Génère 5 questions sur le cycle de l'eau pour un niveau CM2.",
            "Explique la photosynthèse simplement.",
            "Quelles sont les dates clés de la Seconde Guerre Mondiale ?"
          ].map((suggestion, i) => (
            <button
              key={i}
              onClick={() => setQuery(suggestion)}
              className="p-4 bg-white border border-slate-200 rounded-2xl text-left hover:border-indigo-300 hover:bg-indigo-50/30 transition-all text-sm text-slate-600 font-medium"
            >
              "{suggestion}"
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default GeminiSearch;
