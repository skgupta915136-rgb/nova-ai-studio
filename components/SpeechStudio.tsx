
import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import Modal from './Modal';
import Spinner from './ui/Spinner';
import Tabs from './ui/Tabs';
import { decode, decodeAudioData, bufferToWav } from '../utils/audio';
import { fileToBase64 } from '../utils/file';

const API_KEY = process.env.GEMINI_API_KEY || '';

const VOICES = ['Kore', 'Puck', 'Zephyr', 'Charon', 'Fenrir'];
const SAMPLE_RATE = 24000;

interface SpeechStudioProps {
  isOpen: boolean;
  onClose: () => void;
  activeVoice: string;
  onVoiceChange: (voice: string) => void;
}

const SpeechStudio: React.FC<SpeechStudioProps> = ({ isOpen, onClose, activeVoice, onVoiceChange }) => {
  const [activeTab, setActiveTab] = useState('Text to Speech');
  const [text, setText] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clean up object URL to prevent memory leaks
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setError(null);
    setIsLoading(false);
    // Reset specific states if needed
  };

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setAudioFile(file);
        setTranscription(null);
        setError(null);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setIsLoading(true);

    try {
        const ai = new GoogleGenAI({ apiKey: API_KEY });

        if (activeTab === 'Text to Speech') {
            if (!text.trim()) {
                throw new Error('Please enter some text to generate speech.');
            }
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
                setAudioUrl(null);
            }

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-preview-tts',
                contents: [{ parts: [{ text }] }],
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: { voiceName: activeVoice },
                        },
                    },
                },
            });

            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

            if (base64Audio) {
                // The API returns raw PCM data, so we need to convert it to a playable format like WAV.
                const audioBytes = decode(base64Audio);
                const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: SAMPLE_RATE });
                const audioBuffer = await decodeAudioData(audioBytes, audioCtx, SAMPLE_RATE, 1);
                const wavBlob = bufferToWav(audioBuffer);
                const url = URL.createObjectURL(wavBlob);
                setAudioUrl(url);
                audioCtx.close();
            } else {
                throw new Error('No audio data was returned from the API.');
            }

        } else if (activeTab === 'Transcribe') {
            if (!audioFile) {
                throw new Error('Please upload an audio file to transcribe.');
            }

            const base64Audio = await fileToBase64(audioFile);
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: {
                    parts: [
                        { inlineData: { mimeType: audioFile.type, data: base64Audio } },
                        { text: "Transcribe this audio file verbatim." }
                    ]
                }
            });

            setTranscription(response.text || "No transcription available.");
        }

    } catch (e: any) {
      console.error(e);
      setError(e.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => (
    <div className="space-y-4">
        {activeTab === 'Text to Speech' && (
            <>
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Hello! I am Zeno, your AI assistant..."
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    rows={4}
                />
                <div className="flex items-center space-x-2">
                    <label htmlFor="voice-select" className="text-slate-300">Voice:</label>
                    <select 
                    id="voice-select" 
                    value={activeVoice} 
                    onChange={(e) => onVoiceChange(e.target.value)} 
                    className="bg-slate-700 border border-slate-600 rounded p-2 text-white outline-none focus:ring-2 focus:ring-sky-500"
                    >
                        {VOICES.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                </div>
            </>
        )}

        {activeTab === 'Transcribe' && (
            <div className="space-y-4">
                 <div className="p-6 border-2 border-dashed border-slate-600 rounded-lg text-center hover:border-slate-500 transition-colors bg-slate-800/50">
                    <input 
                        type="file" 
                        accept="audio/*" 
                        onChange={handleAudioFileChange} 
                        className="text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-600 file:text-white hover:file:bg-sky-700 cursor-pointer"
                    />
                    {audioFile && <p className="mt-2 text-sky-300 text-sm font-medium">{audioFile.name}</p>}
                </div>
            </div>
        )}

        <button onClick={handleSubmit} disabled={isLoading} className="w-full px-5 py-3 rounded-lg font-semibold text-white bg-sky-600 hover:bg-sky-700 disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors flex justify-center items-center">
            {isLoading ? <Spinner /> : (activeTab === 'Text to Speech' ? 'Generate Speech' : 'Transcribe Audio')}
        </button>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Speech Studio">
        <Tabs tabs={['Text to Speech', 'Transcribe']} activeTab={activeTab} onTabChange={handleTabChange} />
        <div className="mt-6">{renderContent()}</div>
        
        {error && <p className="mt-4 p-3 bg-red-900/30 border border-red-800 rounded text-red-300 text-sm text-center">{error}</p>}
        
        {activeTab === 'Text to Speech' && audioUrl && (
            <div className="mt-6 p-4 bg-slate-800 rounded-xl border border-slate-700">
                <h3 className="font-semibold mb-3 text-sky-300">Result</h3>
                <audio controls src={audioUrl} className="w-full" />
            </div>
        )}

        {activeTab === 'Transcribe' && transcription && (
            <div className="mt-6 p-4 bg-slate-800 rounded-xl border border-slate-700">
                <h3 className="font-semibold mb-3 text-sky-300">Transcription</h3>
                <div className="p-3 bg-black/30 rounded-lg text-slate-300 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                    {transcription}
                </div>
            </div>
        )}
    </Modal>
  );
};

export default SpeechStudio;
