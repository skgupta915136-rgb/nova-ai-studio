
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration, Tool } from '@google/genai';
import { AppState, ChatSettings, User } from './types';
import { decode, decodeAudioData, createPcmBlob } from './utils/audio';
import ConversationView from './components/ConversationView';
import StatusIndicator from './components/StatusIndicator';
import SettingsModal from './components/SettingsModal';
import LoginScreen from './components/LoginScreen';
import IconButton from './components/ui/IconButton';
import Clock from './components/Clock';
import CameraControls from './components/CameraControls';
import Modal from './components/Modal';
import Notification from './components/Notification';
import CalculatorApp from './components/apps/CalculatorApp';
import NotesApp from './components/apps/NotesApp';
import WeatherApp from './components/apps/WeatherApp';
import SearchApp from './components/apps/SearchApp';
import NewsApp from './components/apps/NewsApp';
import ChatApp from './components/apps/ChatApp';
import LauncherApp from './components/apps/LauncherApp';
import ImageStudio from './components/ImageStudio';
import VideoStudio from './components/VideoStudio';
import SpeechStudio from './components/SpeechStudio';
import SmartLight from './components/SmartLight';
import PCControls from './components/PCControls';

import { Sparkles } from 'lucide-react';

const API_KEY = process.env.GEMINI_API_KEY || '';

const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;

const DEFAULT_CHAT_SETTINGS: ChatSettings = {
  useSearch: false,
  useMaps: false,
  usePro: false,
  useLite: false,
  useTts: true,
};

// Define tools for Function Calling
const tools: Tool[] = [{
    functionDeclarations: [
        {
            name: "openApp",
            description: "Opens an application or studio within the NOVA interface. Use this when the user asks to open tools like calculator, notes, or creative studios.",
            parameters: {
                type: Type.OBJECT,
                properties: {
                    appName: {
                        type: Type.STRING,
                        description: "The identifier of the app to open.",
                        enum: ['calculator', 'notes', 'image-studio', 'video-studio', 'speech-studio', 'settings', 'weather', 'search', 'news', 'chat-pro', 'apps']
                    }
                },
                required: ["appName"]
            }
        },
        {
            name: "closeApp",
            description: "Closes the currently open application, modal, or studio.",
        },
        {
            name: "controlLight",
            description: "Controls the smart light in the room.",
            parameters: {
                type: Type.OBJECT,
                properties: {
                    on: { type: Type.BOOLEAN, description: "Whether to turn the light on or off." },
                    color: { type: Type.STRING, description: "The color of the light (e.g., 'red', 'blue', '#FF0000')." }
                },
                required: ["on"]
            }
        },
        {
            name: "setVolume",
            description: "Sets the system volume level.",
            parameters: {
                type: Type.OBJECT,
                properties: {
                    level: { type: Type.NUMBER, description: "The volume level from 0 to 100." }
                },
                required: ["level"]
            }
        },
        {
            name: "openWebsite",
            description: "Opens external websites or platforms in a new browser tab. Use this when the user asks to open YouTube, Chrome, WhatsApp, Telegram, Instagram, or a Folder/File Explorer.",
            parameters: {
                type: Type.OBJECT,
                properties: {
                    websiteName: {
                        type: Type.STRING,
                        description: "The name of the website or platform to open.",
                        enum: ['youtube', 'chrome', 'whatsapp', 'telegram', 'instagram', 'folder']
                    }
                },
                required: ["websiteName"]
            }
        }
    ]
}];

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>({
    connectionStatus: 'idle',
    conversation: (() => {
        try {
            const saved = localStorage.getItem('conversationHistory');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error("Failed to load conversation history:", e);
            return [];
        }
    })(),
    isSpeaking: false,
    error: null,
    activeModal: null,
    userLocation: null,
    voice: localStorage.getItem('nova_voice_preference') || 'Kore',
    chatSettings: (() => {
        try {
            const saved = localStorage.getItem('nova_chat_settings');
            return saved ? { ...DEFAULT_CHAT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_CHAT_SETTINGS;
        } catch (e) {
            return DEFAULT_CHAT_SETTINGS;
        }
    })(),
    currentUser: (() => {
        try {
            const saved = localStorage.getItem('nova_user');
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            return null;
        }
    })(),
  });

  const [isCameraOn, setIsCameraOn] = useState(false);
  const [lightState, setLightState] = useState({ on: false, color: '#fbbf24' });
  const [volume, setVolume] = useState(50);
  const [notifications, setNotifications] = useState<{ id: number; message: string }[]>([]);
  const [textInput, setTextInput] = useState('');
  
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);
  
  // Camera Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const videoIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('conversationHistory', JSON.stringify(appState.conversation));
    } catch (e) {
      console.error("Failed to save conversation history", e);
    }
  }, [appState.conversation]);

  useEffect(() => {
    try {
      localStorage.setItem('nova_voice_preference', appState.voice);
    } catch (e) {
      console.error("Failed to save voice preference", e);
    }
  }, [appState.voice]);

  useEffect(() => {
    try {
      localStorage.setItem('nova_chat_settings', JSON.stringify(appState.chatSettings));
    } catch (e) {
      console.error("Failed to save chat settings", e);
    }
  }, [appState.chatSettings]);

  const cleanUp = useCallback(() => {
    console.log('Cleaning up resources...');
    scriptProcessorRef.current?.disconnect();
    scriptProcessorRef.current = null;
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    inputAudioContextRef.current?.close().catch(console.error);
    inputAudioContextRef.current = null;
    outputAudioContextRef.current?.close().catch(console.error);
    outputAudioContextRef.current = null;
    sourcesRef.current.forEach(source => source.stop());
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;
    
    // Clean up camera
    if (videoIntervalRef.current) {
        clearInterval(videoIntervalRef.current);
        videoIntervalRef.current = null;
    }
    if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach(track => track.stop());
        videoStreamRef.current = null;
    }
    setIsCameraOn(false);
  }, []);

  const handleApiError = useCallback((e: any, context: 'connection' | 'session' | 'chat') => {
    const prefix = {
        connection: 'Connection failed',
        session: 'Failed to start session',
        chat: 'Chat error'
    }[context];
    console.error(`${prefix}:`, e);

    let errorMessage = `${prefix}: ${e.message || 'Unknown error'}`;
    if (e.message?.toLowerCase().includes('api key')) {
      errorMessage = 'The provided API Key is invalid or expired. Please check your configuration.';
    }
    
    setAppState(prev => ({ ...prev, error: errorMessage, connectionStatus: 'error' }));
    if(context !== 'chat') cleanUp();
  }, [cleanUp]);

  const handleToggleConversation = useCallback(async () => {
    const { connectionStatus } = appState;
    if (connectionStatus === 'connected' || connectionStatus === 'connecting') {
      setAppState(prev => ({...prev, connectionStatus: 'closing', error: null}));
      const session = await sessionPromiseRef.current;
      session?.close();
      sessionPromiseRef.current = null;
      cleanUp();
      setAppState(prev => ({...prev, connectionStatus: 'idle'}));
      return;
    }

    setAppState(prev => ({ ...prev, connectionStatus: 'connecting', error: null, conversation: [], isSpeaking: false }));

    if (!API_KEY) {
        handleApiError({ message: 'API Key is missing.'}, 'connection');
        return;
    }
    
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });

      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      const ai = new GoogleGenAI({ apiKey: API_KEY });
      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          tools: tools,
          responseModalities: [Modality.AUDIO],
          systemInstruction: 'You are NOVA, the AI assistant inside NOVA AI Studio. You must ALWAYS identify yourself as NOVA, never as Gemini or a Google AI. You are a friendly and helpful conversational AI assistant. You can open apps like Calculator, Notes, Image Studio, Video Studio, and Speech Studio when asked. You can also open external websites like YouTube, Chrome, WhatsApp, Telegram, Instagram, and Folder.',
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            console.log('Connection opened.');
            setAppState(prev => ({...prev, connectionStatus: 'connected'}));
            const source = inputAudioContextRef.current!.createMediaStreamSource(streamRef.current!);
            scriptProcessorRef.current = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const pcmBlob = createPcmBlob(inputData);
              sessionPromiseRef.current?.then((session) => session.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessorRef.current);
            scriptProcessorRef.current.connect(inputAudioContextRef.current!.destination);
          },
          onmessage: (message: LiveServerMessage) => handleServerMessage(message),
          onerror: (e: any) => handleApiError(e, 'connection'),
          onclose: () => {
            console.log('Connection closed.');
            setAppState(prev => ({...prev, connectionStatus: 'closed'}));
            cleanUp();
          },
        },
      });
      sessionPromiseRef.current.catch((e: Error) => handleApiError(e, 'session'));

    } catch (err: any) {
      console.error('Failed to start conversation:', err);
      handleApiError(err, 'connection');
    }
  }, [appState, cleanUp, handleApiError]);
  
  const addNotification = useCallback((message: string) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message }]);
  }, []);

  const removeNotification = useCallback((id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const handleSendText = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!textInput.trim()) return;

    const message = textInput.trim();
    setTextInput('');

    if (appState.connectionStatus === 'connected') {
      const session = await sessionPromiseRef.current;
      if (session) {
        // Use sendClientContent for text messages in this SDK version
        session.sendClientContent({
          turns: [{ role: 'user', parts: [{ text: message }] }],
          turnComplete: true
        });
        
        // Add the user's text message to the conversation view
        setAppState(prev => ({
          ...prev,
          conversation: [...prev.conversation, { speaker: 'user', text: message, isFinal: true }]
        }));
      }
    } else {
      addNotification("Please start the conversation first to chat.");
    }
  }, [textInput, appState.connectionStatus, addNotification]);

  const handleServerMessage = useCallback(async (message: LiveServerMessage) => {
    // Handle Tool Calls (Function Calling)
    if (message.toolCall) {
        const responses = message.toolCall.functionCalls.map(fc => {
            let result = { result: 'ok' };
            if (fc.name === 'openApp') {
                const appName = fc.args.appName as any;
                console.log(`Opening app: ${appName}`);
                setAppState(prev => ({ ...prev, activeModal: appName }));
                addNotification(`Opening ${appName}...`);
                result = { result: `Successfully opened ${appName}` };
            } else if (fc.name === 'openWebsite') {
                const websiteName = fc.args.websiteName as string;
                console.log(`Opening website: ${websiteName}`);
                
                let url = '';
                switch (websiteName) {
                    case 'youtube': url = 'https://www.youtube.com'; break;
                    case 'chrome': url = 'https://www.google.com'; break;
                    case 'whatsapp': url = 'https://web.whatsapp.com'; break;
                    case 'telegram': url = 'https://web.telegram.org'; break;
                    case 'instagram': url = 'https://www.instagram.com'; break;
                    case 'folder': url = 'folder'; break;
                }

                if (url === 'folder') {
                    addNotification(`Opening File Explorer...`);
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.multiple = true;
                    input.click();
                    result = { result: `Successfully opened File Explorer` };
                } else if (url) {
                    window.open(url, '_blank');
                    addNotification(`Opening ${websiteName}...`);
                    result = { result: `Successfully opened ${websiteName} in a new tab` };
                } else {
                    result = { result: `Failed to open ${websiteName}` };
                }
            } else if (fc.name === 'closeApp') {
                 console.log('Closing app');
                 setAppState(prev => ({ ...prev, activeModal: null }));
                 addNotification(`Closing application...`);
                 result = { result: `Closed application` };
            } else if (fc.name === 'controlLight') {
                const { on, color } = fc.args as any;
                setLightState(prev => ({ on: on ?? prev.on, color: color ?? prev.color }));
                addNotification(`Light turned ${on ? 'on' : 'off'}`);
                result = { result: `Light turned ${on ? 'on' : 'off'}${color ? ' with color ' + color : ''}` };
            } else if (fc.name === 'setVolume') {
                const { level } = fc.args as any;
                setVolume(level);
                addNotification(`Volume set to ${level}%`);
                result = { result: `Volume set to ${level}%` };
            }
            return {
                id: fc.id,
                name: fc.name,
                response: result
            }
        });
        
        sessionPromiseRef.current?.then(session => {
            session.sendToolResponse({
                functionResponses: responses
            });
        });
    }

    if (message.serverContent?.inputTranscription || message.serverContent?.outputTranscription) {
        const isInput = !!message.serverContent?.inputTranscription;
        const transcription = isInput ? message.serverContent.inputTranscription! : message.serverContent.outputTranscription!;
        const speaker = isInput ? 'user' : 'nova';
        
        setAppState(prev => {
            const newConversation = [...prev.conversation];
            const lastTurn = newConversation[newConversation.length - 1];

            if (lastTurn?.speaker === speaker && !lastTurn.isFinal) {
                lastTurn.text += transcription.text;
            } else {
                newConversation.push({ speaker, text: transcription.text, isFinal: false });
            }
            return {...prev, conversation: newConversation};
        });
    }

    if (message.serverContent?.turnComplete) {
      setAppState(prev => ({...prev, conversation: prev.conversation.map(turn => ({...turn, isFinal: true}))}));
    }
    
    const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
    if (base64Audio) {
      setAppState(prev => ({...prev, isSpeaking: true}));
      const outputCtx = outputAudioContextRef.current;
      if (!outputCtx) return;

      nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);

      const audioBuffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
      const source = outputCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(outputCtx.destination);

      source.addEventListener('ended', () => {
        sourcesRef.current.delete(source);
        if (sourcesRef.current.size === 0) {
            setAppState(prev => ({...prev, isSpeaking: false}));
        }
      });

      source.start(nextStartTimeRef.current);
      nextStartTimeRef.current += audioBuffer.duration;
      sourcesRef.current.add(source);
    }
    
    if (message.serverContent?.interrupted) {
        sourcesRef.current.forEach(source => source.stop());
        sourcesRef.current.clear();
        nextStartTimeRef.current = 0;
        setAppState(prev => ({...prev, isSpeaking: false}));
    }
  }, []);

  const stopTts = useCallback(() => {
    sourcesRef.current.forEach(source => {
        try { source.stop(); } catch(e) {}
    });
    sourcesRef.current.clear();
    setAppState(prev => ({...prev, isSpeaking: false}));
  }, []);

  const handleToggleCamera = useCallback(async () => {
    if (isCameraOn) {
        if (videoIntervalRef.current) {
            clearInterval(videoIntervalRef.current);
            videoIntervalRef.current = null;
        }
        if (videoStreamRef.current) {
            videoStreamRef.current.getTracks().forEach(track => track.stop());
            videoStreamRef.current = null;
        }
        setIsCameraOn(false);
    } else {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
            videoStreamRef.current = stream;
            setIsCameraOn(true);
        } catch (err: any) {
            console.error("Camera access failed", err);
            setAppState(prev => ({ ...prev, error: "Could not access camera. Please check permissions." }));
        }
    }
  }, [isCameraOn]);

  // Effect to manage video stream and interval
  useEffect(() => {
      if (isCameraOn && videoStreamRef.current && videoRef.current) {
          videoRef.current.srcObject = videoStreamRef.current;
          videoRef.current.play().catch(console.error);

          videoIntervalRef.current = window.setInterval(() => {
              if (canvasRef.current && videoRef.current) {
                  const ctx = canvasRef.current.getContext('2d');
                  if (ctx) {
                      canvasRef.current.width = videoRef.current.videoWidth;
                      canvasRef.current.height = videoRef.current.videoHeight;
                      ctx.drawImage(videoRef.current, 0, 0);
                      const base64 = canvasRef.current.toDataURL('image/jpeg', 0.6).split(',')[1];
                      
                      if (sessionPromiseRef.current) {
                          sessionPromiseRef.current.then((session: any) => {
                              try {
                                  session.sendRealtimeInput({ media: { mimeType: 'image/jpeg', data: base64 } });
                              } catch(e) {
                                  console.error("Error sending frame:", e);
                              }
                          });
                      }
                  }
              }
          }, 500); // 2 FPS
      }

      return () => {
          if (videoIntervalRef.current) {
              clearInterval(videoIntervalRef.current);
              videoIntervalRef.current = null;
          }
      };
  }, [isCameraOn]);

  const handleClearHistory = useCallback(() => {
    localStorage.removeItem('conversationHistory');
    setAppState(prev => ({ ...prev, conversation: [] }));
  }, []);

  const handleLogin = (user: User) => {
    localStorage.setItem('nova_user', JSON.stringify(user));
    setAppState(prev => ({ ...prev, currentUser: user }));
  };

  const handleLogout = () => {
    localStorage.removeItem('nova_user');
    setAppState(prev => ({ ...prev, currentUser: null, activeModal: null }));
  };

  if (!appState.currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const getButtonState = () => {
    switch (appState.connectionStatus) {
      case 'idle':
      case 'closed':
      case 'error':
        return { text: 'Start Conversation', style: 'bg-green-600 hover:bg-green-700', disabled: false };
      case 'connecting':
        return { text: 'Connecting...', style: 'bg-yellow-600', disabled: true };
      case 'connected':
        return { text: 'End Conversation', style: 'bg-red-600 hover:bg-red-700', disabled: false };
      case 'closing':
        return { text: 'Closing...', style: 'bg-gray-600', disabled: true };
      default:
        return { text: 'Start', style: 'bg-gray-600', disabled: true };
    }
  };

  const { text, style, disabled } = getButtonState();

  return (
    <div className="min-h-screen text-white flex flex-col items-center p-4 relative bg-black">
      <div className="absolute inset-0 bg-grid-pattern -z-10"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-[#080c18] via-transparent to-[#080c18] -z-10"></div>
      
      {/* Clock Widget */}
      <div className="absolute top-4 left-4 z-20 hidden md:block">
        <Clock />
      </div>

      {/* Settings Button */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-4">
        <IconButton 
            onClick={() => setAppState(prev => ({...prev, activeModal: 'settings'}))}
            disabled={false}
            title="Settings"
        >
            <SettingsIcon />
        </IconButton>
      </div>

      {/* Modals & Apps */}
      <SettingsModal
        isOpen={appState.activeModal === 'settings'}
        onClose={() => setAppState(prev => ({ ...prev, activeModal: null }))}
        onClearHistory={handleClearHistory}
        activeVoice={appState.voice}
        onVoiceChange={(v) => setAppState(prev => ({ ...prev, voice: v }))}
        chatSettings={appState.chatSettings}
        onSettingsChange={(newSettings) => setAppState(prev => ({ ...prev, chatSettings: newSettings }))}
        currentUser={appState.currentUser}
        onLogout={handleLogout}
      />
      
      <ImageStudio 
        isOpen={appState.activeModal === 'image-studio'} 
        onClose={() => setAppState(prev => ({ ...prev, activeModal: null }))} 
      />
      
      <VideoStudio 
        isOpen={appState.activeModal === 'video-studio'} 
        onClose={() => setAppState(prev => ({ ...prev, activeModal: null }))} 
      />
      
      <SpeechStudio 
        isOpen={appState.activeModal === 'speech-studio'} 
        onClose={() => setAppState(prev => ({ ...prev, activeModal: null }))}
        activeVoice={appState.voice}
        onVoiceChange={(v) => setAppState(prev => ({ ...prev, voice: v }))}
      />

      <Modal 
        isOpen={appState.activeModal === 'calculator'} 
        onClose={() => setAppState(prev => ({ ...prev, activeModal: null }))}
        title="Calculator"
      >
        <CalculatorApp />
      </Modal>

      <Modal 
        isOpen={appState.activeModal === 'notes'} 
        onClose={() => setAppState(prev => ({ ...prev, activeModal: null }))}
        title="Notes"
      >
        <NotesApp />
      </Modal>

      <Modal 
        isOpen={appState.activeModal === 'weather'} 
        onClose={() => setAppState(prev => ({ ...prev, activeModal: null }))}
        title="Weather"
      >
        <WeatherApp />
      </Modal>

      <Modal 
        isOpen={appState.activeModal === 'search'} 
        onClose={() => setAppState(prev => ({ ...prev, activeModal: null }))}
        title="Web Search"
        size="lg"
      >
        <SearchApp />
      </Modal>

      <Modal 
        isOpen={appState.activeModal === 'news'} 
        onClose={() => setAppState(prev => ({ ...prev, activeModal: null }))}
        title="News Feed"
        size="lg"
      >
        <NewsApp />
      </Modal>

      <Modal 
        isOpen={appState.activeModal === 'chat-pro'} 
        onClose={() => setAppState(prev => ({ ...prev, activeModal: null }))}
        title="NOVA Pro (Deep Reasoning)"
        size="lg"
      >
        <ChatApp />
      </Modal>

      <Modal 
        isOpen={appState.activeModal === 'apps'} 
        onClose={() => setAppState(prev => ({ ...prev, activeModal: null }))}
        title="Applications"
        size="md"
      >
        <LauncherApp onOpenApp={(app) => setAppState(prev => ({ ...prev, activeModal: app }))} />
      </Modal>

      {/* Camera Preview */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      {isCameraOn && (
          <div className="fixed bottom-24 right-4 w-40 md:w-60 z-50 rounded-xl overflow-hidden shadow-2xl border border-sky-500/30">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
          </div>
      )}

      {/* Notifications */}
      <div className="fixed top-20 right-4 z-[100] flex flex-col gap-2">
        {notifications.map(n => (
            <Notification key={n.id} message={n.message} onClose={() => removeNotification(n.id)} />
        ))}
      </div>

      <main className="flex-1 flex flex-col items-center justify-center w-full z-10 pb-20 md:pb-0">
        {appState.conversation.length > 0 ? (
          <ConversationView history={appState.conversation} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <StatusIndicator 
              isListening={appState.connectionStatus === 'connected' && !appState.isSpeaking} 
              isSpeaking={appState.isSpeaking} 
              onStop={stopTts}
            />
          </div>
        )}
         <p className="mt-6 text-red-400 font-medium max-w-md h-8 text-center">
          {appState.error}
         </p>
      </main>

      <footer className="w-full flex flex-col items-center justify-center p-4 sticky bottom-0 z-10 space-y-6">
        <div className="w-full max-w-2xl flex flex-col items-center gap-4">
            {/* Text Input Field */}
            <form 
                onSubmit={handleSendText}
                className={`w-full relative transition-all duration-500 ${appState.connectionStatus === 'connected' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
            >
                <input 
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Type a message to NOVA..."
                    className="w-full bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-2xl py-4 pl-6 pr-14 text-white focus:ring-2 focus:ring-sky-500 focus:outline-none shadow-2xl transition-all"
                />
                <button 
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-sky-600 p-2.5 rounded-xl hover:bg-sky-500 transition-all shadow-lg"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                </button>
            </form>

            <div className="relative w-full max-w-md flex items-center justify-center gap-4">
                <CameraControls isCameraOn={isCameraOn} onToggle={handleToggleCamera} />
                
                <button
                onClick={handleToggleConversation}
                disabled={disabled}
                className={`px-8 py-4 rounded-full text-xl font-semibold shadow-lg transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-opacity-50 ${style} ${disabled ? 'cursor-not-allowed opacity-60' : 'transform hover:scale-105'}`}
                >
                {text}
                </button>
            </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
