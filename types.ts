
export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error' | 'closing' | 'closed';

export type GroundingChunk = {
  // FIX: Make uri and title optional to match @google/genai's GroundingChunk type.
  web?: { uri?: string; title?: string };
  maps?: { uri?: string; title?: string };
};

export type ConversationTurn = {
  speaker: 'user' | 'zeno';
  text: string;
  isFinal?: boolean; // For live transcription
  groundingChunks?: GroundingChunk[];
};

export interface ChatSettings {
  usePro: boolean; // Deep Thought
  useLite: boolean; // Flash Lite
  useTts: boolean; // Speak
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export type ActiveModal = 'settings' | 'calculator' | 'notes' | 'image-studio' | 'video-studio' | 'speech-studio' | 'weather' | 'search' | 'news' | 'chat-pro' | 'apps' | 'youtube' | 'chrome' | 'whatsapp' | 'telegram' | 'instagram' | 'folder' | null;

export type AppState = {
    connectionStatus: ConnectionStatus;
    conversation: ConversationTurn[];
    isSpeaking: boolean;
    error: string | null;
    activeModal: ActiveModal;
    userLocation: { latitude: number; longitude: number; } | null;
    voice: string;
    chatSettings: ChatSettings;
    currentUser: User | null;
};
