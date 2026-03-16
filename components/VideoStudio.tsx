
import React, { useState, useCallback, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import Modal from './Modal';
import Tabs from './ui/Tabs';
import Spinner from './ui/Spinner';
import { fileToBase64 } from '../utils/file';

const API_KEY = process.env.GEMINI_API_KEY || '';

const ASPECT_RATIOS = ["16:9", "9:16"];
const RESOLUTIONS = ["720p", "1080p"];
const POLLING_INTERVAL = 5000;

interface VideoStudioProps {
  isOpen: boolean;
  onClose: () => void;
}

const VideoStudio: React.FC<VideoStudioProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('Generate');
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState(ASPECT_RATIOS[0]);
  const [resolution, setResolution] = useState(RESOLUTIONS[0]);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [needsApiKey, setNeedsApiKey] = useState(false);
  
  const operationRef = useRef<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaUrl(reader.result as string);
        setResult(null); 
      };
      reader.readAsDataURL(file);
    }
  };

  const resetState = useCallback(() => {
    setPrompt('');
    setMediaFile(null);
    setMediaUrl(null);
    setResult(null);
    setIsLoading(false);
    setLoadingMessage('');
    setError(null);
    operationRef.current = null;
    setNeedsApiKey(false);
  }, []);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    resetState();
  };

  const pollOperation = async (ai: GoogleGenAI, initialOperation: any) => {
    operationRef.current = initialOperation;
    setLoadingMessage('Initializing generation...');
    
    while (operationRef.current && !operationRef.current.done) {
        await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
        if (!operationRef.current) break; 
        
        setLoadingMessage('Creating video frames... This may take a minute.');
        try {
            operationRef.current = await ai.operations.getVideosOperation({ operation: operationRef.current });
        } catch(e: any) {
             if (e.message?.includes("Requested entity was not found")) {
                setError("Session expired or API Key error. Please try again.");
                setNeedsApiKey(true);
                return null;
            }
            throw e;
        }
    }
    return operationRef.current;
  };

  const handleSelectKey = async () => {
    try {
        await (window as any).aistudio.openSelectKey();
        setNeedsApiKey(false);
        setError(null);
    } catch (e) {
        console.error(e);
    }
  };
  
  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setNeedsApiKey(false);

    try {
        const ai = new GoogleGenAI({ apiKey: API_KEY });

        // Veo generation requires paid key check
        if (activeTab === 'Generate' || activeTab === 'Animate') {
             const hasKey = await (window as any).aistudio.hasSelectedApiKey();
             if (!hasKey) {
                 setNeedsApiKey(true);
                 setError('Veo video generation requires a paid API key.');
                 setIsLoading(false);
                 return;
             }
        }

        if (activeTab === 'Generate' || activeTab === 'Animate') {
            const isAnimate = activeTab === 'Animate';
            if (isAnimate && !mediaFile) {
                setError('Please upload an image to animate.');
                setIsLoading(false);
                return;
            }

            let operation = await ai.models.generateVideos({
                model: 'veo-3.1-fast-generate-preview',
                prompt: prompt || (isAnimate ? 'Animate this image' : 'A cinematic video'),
                ...(isAnimate && mediaFile && {
                    image: {
                        imageBytes: await fileToBase64(mediaFile),
                        mimeType: mediaFile.type,
                    }
                }),
                config: {
                    numberOfVideos: 1,
                    resolution: resolution as any,
                    aspectRatio: aspectRatio as any,
                }
            });

            const finalOperation = await pollOperation(ai, operation);

            if (finalOperation?.response) {
                const videoUri = finalOperation.response.generatedVideos?.[0]?.video?.uri;
                if(videoUri) {
                    const videoResponse = await fetch(`${videoUri}&key=${API_KEY}`);
                    if (!videoResponse.ok) throw new Error('Failed to download generated video.');
                    const videoBlob = await videoResponse.blob();
                    setResult(URL.createObjectURL(videoBlob));
                } else {
                    throw new Error("Generation finished, but no video URI found.");
                }
            } else if (finalOperation && finalOperation.error) {
                 throw new Error(finalOperation.error.message || "Video generation failed.");
            }
        } else if (activeTab === 'Analyze') {
            if (!mediaFile) {
                setError('Please upload a video to analyze.');
                setIsLoading(false);
                return;
            }
            setLoadingMessage('Analyzing video content...');
            
            const base64Data = await fileToBase64(mediaFile);
            
            const response = await ai.models.generateContent({
                model: 'gemini-3-pro-preview',
                contents: {
                    parts: [
                        { inlineData: { mimeType: mediaFile.type, data: base64Data } },
                        { text: prompt || "Analyze this video and describe what happens in detail." }
                    ]
                }
            });
            
            setResult(response.text || "No analysis generated.");
        }
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'An unknown error occurred.');
      if (e.message?.includes("Requested entity was not found")) {
        setNeedsApiKey(true);
      }
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
      operationRef.current = null;
    }
  };

  const renderContent = () => (
    <div className="space-y-4">
        <div className="space-y-2">
            <label className="text-slate-300 text-sm font-medium">
                {activeTab === 'Animate' || activeTab === 'Analyze' ? 'Prompt (Optional)' : 'Prompt'}
            </label>
            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                    activeTab === 'Generate' ? "A neon hologram of a cat driving..." : 
                    activeTab === 'Animate' ? "Describe how the image should move..." :
                    "Describe what to look for in the video..."
                }
                className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-sky-500 focus:outline-none placeholder-slate-500"
                rows={3}
            />
        </div>

        {activeTab !== 'Analyze' && (
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-slate-300 text-sm font-medium">Aspect Ratio</label>
                    <select 
                        value={aspectRatio} 
                        onChange={(e) => setAspectRatio(e.target.value)} 
                        className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-white focus:ring-2 focus:ring-sky-500 outline-none"
                    >
                        {ASPECT_RATIOS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-slate-300 text-sm font-medium">Resolution</label>
                    <select 
                        value={resolution} 
                        onChange={(e) => setResolution(e.target.value)} 
                        className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-white focus:ring-2 focus:ring-sky-500 outline-none"
                    >
                        {RESOLUTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>
            </div>
        )}

        {(activeTab === 'Animate' || activeTab === 'Analyze') && (
            <div className="space-y-2">
                <label className="text-slate-300 text-sm font-medium">
                    {activeTab === 'Animate' ? 'Source Image' : 'Source Video'}
                </label>
                <div className="p-4 border-2 border-dashed border-slate-600 rounded-lg text-center hover:border-slate-500 transition-colors bg-slate-800/50">
                    <input 
                        type="file" 
                        accept={activeTab === 'Animate' ? "image/*" : "video/*"} 
                        onChange={handleFileChange} 
                        className="text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-600 file:text-white hover:file:bg-sky-700 cursor-pointer"
                    />
                    {mediaUrl && (
                        <div className="mt-4">
                            {activeTab === 'Animate' ? (
                                <img src={mediaUrl} alt="Preview" className="max-h-48 mx-auto rounded-lg shadow-lg" />
                            ) : (
                                <video src={mediaUrl} controls className="max-h-48 mx-auto rounded-lg shadow-lg" />
                            )}
                        </div>
                    )}
                </div>
            </div>
        )}

        {needsApiKey ? (
            <div className='text-center space-y-3 bg-slate-800/50 p-4 rounded-lg border border-yellow-600/30'>
                <p className="text-sm text-slate-300">
                    A billing-enabled API key is required for this feature. 
                    <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className='text-sky-400 hover:underline ml-1'>
                        Learn more
                    </a>
                </p>
                <button 
                    onClick={handleSelectKey} 
                    className="w-full px-5 py-3 rounded-lg font-semibold text-white bg-yellow-600 hover:bg-yellow-700 transition-colors shadow-lg"
                >
                    Select API Key
                </button>
            </div>
        ) : (
            <button 
                onClick={handleSubmit} 
                disabled={isLoading} 
                className="w-full px-5 py-3 rounded-lg font-semibold text-white bg-sky-600 hover:bg-sky-700 disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-all shadow-lg flex justify-center items-center mt-2"
            >
                {isLoading ? (
                    <div className="flex items-center space-x-2">
                        <Spinner />
                        <span>Processing...</span>
                    </div>
                ) : (
                    activeTab === 'Generate' ? 'Generate Video' : 
                    activeTab === 'Animate' ? 'Generate Video' : 'Analyze Video'
                )}
            </button>
        )}
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Video Studio">
        <Tabs tabs={['Generate', 'Animate', 'Analyze']} activeTab={activeTab} onTabChange={handleTabChange} />
        <div className="mt-6">{renderContent()}</div>
        
        {isLoading && (
            <div className="mt-6 p-4 bg-slate-800/50 rounded-lg text-center animate-pulse">
                 <p className="text-sky-300 font-medium">{loadingMessage}</p>
                 <p className="text-xs text-slate-400 mt-1">
                    {activeTab === 'Analyze' ? 'Analyzing frames...' : 'This process typically takes 1-2 minutes.'}
                 </p>
            </div>
        )}

        {error && (
            <div className="mt-6 p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-300 text-sm text-center">
                {error}
            </div>
        )}

        {result && (
            <div className="mt-6 p-4 bg-slate-800 rounded-xl border border-slate-700">
                <h3 className="font-semibold mb-3 text-sky-300 flex items-center">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                    </svg>
                    Result
                </h3>
                {activeTab === 'Analyze' ? (
                     <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">{result}</p>
                ) : (
                    <>
                        <div className="relative rounded-lg overflow-hidden bg-black aspect-video shadow-2xl">
                            <video src={result} controls autoPlay loop className="w-full h-full object-contain" />
                        </div>
                        <div className="mt-3 flex justify-end">
                            <a href={result} download={`veo-video-${Date.now()}.mp4`} className="text-sm text-sky-400 hover:text-sky-300 hover:underline">
                                Download MP4
                            </a>
                        </div>
                    </>
                )}
            </div>
        )}
    </Modal>
  );
};

export default VideoStudio;
