
import React, { useState, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import Modal from './Modal';
import Tabs from './ui/Tabs';
import Spinner from './ui/Spinner';
import { fileToBase64 } from '../utils/file';

const API_KEY = process.env.GEMINI_API_KEY || '';

const ASPECT_RATIOS = ["1:1", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9", "21:9"];
const IMAGE_SIZES = ["1K", "2K", "4K"];

interface ImageStudioProps {
  isOpen: boolean;
  onClose: () => void;
}

const ImageStudio: React.FC<ImageStudioProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('Generate');
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [imageSize, setImageSize] = useState("1K");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsApiKey, setNeedsApiKey] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
        setResult(null); 
      };
      reader.readAsDataURL(file);
    }
  };
  
  const resetState = useCallback(() => {
    setPrompt('');
    setImageFile(null);
    setImageUrl(null);
    setResult(null);
    setIsLoading(false);
    setError(null);
    setNeedsApiKey(false);
  }, []);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    resetState();
  };

  const handleSelectKey = async () => {
    try {
        await (window as any).aistudio.openSelectKey();
        setNeedsApiKey(false);
        setError(null);
        await handleSubmit();
    } catch (e) {
        console.error(e);
    }
  };

  const handleSubmit = async () => {
    // Validate inputs
    if ((activeTab === 'Generate' && !prompt) || 
        (activeTab === 'Edit' && (!imageFile || !prompt)) || 
        (activeTab === 'Analyze' && !imageFile)) {
         setError('Please provide all required inputs.');
         return;
    }
    
    setIsLoading(true);
    setError(null);
    setResult(null);
    setNeedsApiKey(false);

    try {
      // Check for API key requirement for gemini-3-pro-image-preview
      if (activeTab === 'Generate') {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        if (!hasKey) {
            setNeedsApiKey(true);
            setError('Please select an API key to use high-quality generation models.');
            setIsLoading(false);
            return;
        }
      }

      const ai = new GoogleGenAI({ apiKey: API_KEY });
      
      if (activeTab === 'Generate') {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: {
                parts: [{ text: prompt }],
            },
            config: {
                imageConfig: {
                    aspectRatio: aspectRatio as any,
                    imageSize: imageSize as any,
                }
            },
        });
        
        let foundImage = false;
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                setResult(`data:image/png;base64,${part.inlineData.data}`);
                foundImage = true;
                break;
            }
        }
        if (!foundImage) {
            throw new Error('No image was returned.');
        }

      } else if (activeTab === 'Edit' && imageFile) {
        const base64Image = await fileToBase64(imageFile);
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    { inlineData: { data: base64Image, mimeType: imageFile.type } },
                    { text: prompt },
                ],
            },
        });
        const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
        if (part?.inlineData) {
            setResult(`data:image/png;base64,${part.inlineData.data}`);
        } else {
            throw new Error('No image was returned from the edit operation.');
        }

      } else if (activeTab === 'Analyze' && imageFile) {
        const base64Image = await fileToBase64(imageFile);
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: {
                parts: [
                    { text: prompt || 'Describe this image in detail.' },
                    { inlineData: { data: base64Image, mimeType: imageFile.type } },
                ]
            }
        });
        setResult(response.text || "No description generated.");
      }
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'An unknown error occurred.');
      if (e.message?.includes("Requested entity was not found") || e.message?.includes("API key not valid")) {
          setNeedsApiKey(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => (
    <div className="space-y-4">
        {activeTab !== 'Analyze' && (
            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={activeTab === 'Generate' ? "A futuristic cityscape at sunset..." : "Add a pair of sunglasses..."}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-sky-500 focus:outline-none placeholder-slate-500"
                rows={3}
            />
        )}
        {activeTab === 'Analyze' && (
             <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe this image in detail... (Optional)"
                className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-sky-500 focus:outline-none placeholder-slate-500"
                rows={2}
            />
        )}

        {activeTab === 'Generate' && (
            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                    <label className="text-slate-300 text-sm">Aspect Ratio</label>
                    <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} className="bg-slate-700 border border-slate-600 rounded p-2 text-white focus:ring-2 focus:ring-sky-500 outline-none">
                        {ASPECT_RATIOS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>
                <div className="flex flex-col space-y-1">
                    <label className="text-slate-300 text-sm">Image Size</label>
                    <select value={imageSize} onChange={(e) => setImageSize(e.target.value)} className="bg-slate-700 border border-slate-600 rounded p-2 text-white focus:ring-2 focus:ring-sky-500 outline-none">
                        {IMAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>
        )}

        {(activeTab === 'Edit' || activeTab === 'Analyze') && (
            <div className="p-4 border-2 border-dashed border-slate-600 rounded-lg text-center hover:border-slate-500 transition-colors">
                <input type="file" accept="image/*" onChange={handleFileChange} className="text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-600 file:text-white hover:file:bg-sky-700 cursor-pointer"/>
                {imageUrl && <img src={imageUrl} alt="Upload preview" className="mt-4 max-h-48 mx-auto rounded-lg shadow-lg"/>}
            </div>
        )}
        
        {needsApiKey ? (
            <div className='text-center space-y-3 bg-slate-800/50 p-4 rounded-lg border border-yellow-600/30'>
                <p className="text-sm text-slate-300">A billing-enabled API key is required for high-quality generation models. <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className='text-sky-400 hover:underline'>Learn more</a>.</p>
                <button onClick={handleSelectKey} className="w-full px-5 py-3 rounded-lg font-semibold text-white bg-yellow-600 hover:bg-yellow-700 transition-colors shadow-lg">Select API Key</button>
            </div>
        ) : (
            <button onClick={handleSubmit} disabled={isLoading} className="w-full px-5 py-3 rounded-lg font-semibold text-white bg-sky-600 hover:bg-sky-700 disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-all shadow-lg flex justify-center items-center">
                {isLoading ? <Spinner /> : activeTab}
            </button>
        )}
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Image Studio">
        <Tabs tabs={['Generate', 'Edit', 'Analyze']} activeTab={activeTab} onTabChange={handleTabChange} />
        <div className="mt-6">{renderContent()}</div>
        {error && <div className="mt-4 p-3 bg-red-900/30 border border-red-800 rounded text-red-300 text-sm text-center">{error}</div>}
        {result && (
            <div className="mt-6 p-4 bg-slate-800 rounded-xl border border-slate-700">
                <h3 className="font-semibold mb-3 text-sky-300 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Result
                </h3>
                {activeTab === 'Analyze' ? (
                    <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">{result}</p>
                ) : (
                    <div className="relative group">
                         <img src={result} alt="Generated result" className="w-full rounded-lg shadow-xl" />
                         <a href={result} download={`nova-generated-${Date.now()}.png`} className="absolute bottom-2 right-2 bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/90" title="Download">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                         </a>
                    </div>
                )}
            </div>
        )}
    </Modal>
  );
};

export default ImageStudio;
