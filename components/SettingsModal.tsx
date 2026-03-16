
import React from 'react';
import Modal from './Modal';
import Toggle from './ui/Toggle';
import { ChatSettings, User } from '../types';

const VOICES = ['Kore', 'Puck', 'Zephyr', 'Charon', 'Fenrir'];

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClearHistory: () => void;
  activeVoice: string;
  onVoiceChange: (voice: string) => void;
  chatSettings: ChatSettings;
  onSettingsChange: (settings: ChatSettings) => void;
  currentUser: User | null;
  onLogout: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
    isOpen, 
    onClose, 
    onClearHistory,
    activeVoice,
    onVoiceChange,
    chatSettings,
    onSettingsChange,
    currentUser,
    onLogout
}) => {

  const handleProChange = (checked: boolean) => {
      onSettingsChange({
          ...chatSettings,
          usePro: checked,
          useLite: checked ? false : chatSettings.useLite
      });
  };

  const handleLiteChange = (checked: boolean) => {
      onSettingsChange({
          ...chatSettings,
          useLite: checked,
          usePro: checked ? false : chatSettings.usePro
      });
  };

  const handleToggle = (key: keyof ChatSettings) => (checked: boolean) => {
      onSettingsChange({ ...chatSettings, [key]: checked });
  };


  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings">
      <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
        {/* User Profile */}
        {currentUser && (
            <div className="bg-slate-800/80 p-4 rounded-lg border border-slate-700 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <img src={currentUser.avatar} alt="Avatar" className="w-10 h-10 rounded-full border border-slate-500" />
                    <div>
                        <p className="text-white font-medium text-sm">{currentUser.name}</p>
                        <p className="text-slate-400 text-xs">{currentUser.email}</p>
                    </div>
                </div>
                <button 
                    onClick={onLogout}
                    className="text-xs bg-red-900/30 hover:bg-red-900/50 text-red-300 px-3 py-1.5 rounded border border-red-800/30 transition-colors"
                >
                    Sign Out
                </button>
            </div>
        )}

        {/* Model Intelligence */}
        <div>
            <h4 className="text-lg font-medium text-white mb-3">Model Intelligence</h4>
            <div className="space-y-3 bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                 <div className="flex items-center justify-between">
                    <Toggle label="Deep Thought (Pro)" checked={chatSettings.usePro} onChange={handleProChange} />
                    <span className="text-xs text-slate-400">Gemini 3.0 Pro</span>
                 </div>
                 <div className="flex items-center justify-between">
                    <Toggle label="Flash Lite (Fast)" checked={chatSettings.useLite} onChange={handleLiteChange} />
                    <span className="text-xs text-slate-400">Gemini 2.5 Lite</span>
                 </div>
                 <p className="text-xs text-slate-500 mt-2">
                    {chatSettings.usePro ? "Using high-reasoning model with thinking budget." : 
                     chatSettings.useLite ? "Optimized for speed and efficiency." : "Standard balanced model (Gemini 2.5 Flash)."}
                 </p>
            </div>
        </div>

        {/* Grounding Tools */}
        <div>
            <h4 className="text-lg font-medium text-white mb-3">Grounding Tools</h4>
            <div className="space-y-3 bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                 <Toggle label="Google Search" checked={chatSettings.useSearch} onChange={handleToggle('useSearch')} />
                 <Toggle label="Google Maps" checked={chatSettings.useMaps} onChange={handleToggle('useMaps')} />
                 <p className="text-xs text-slate-500 mt-2">
                    Enabling grounding tools will use the standard Flash model.
                 </p>
            </div>
        </div>

        {/* Audio Output */}
        <div>
             <h4 className="text-lg font-medium text-white mb-3">Audio & Voice</h4>
             <div className="space-y-4 bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                <div className="flex items-center justify-between">
                    <Toggle label="Read Responses Aloud" checked={chatSettings.useTts} onChange={handleToggle('useTts')} />
                </div>
                
                <div className="pt-3 border-t border-slate-700/50">
                    <label className="block text-sm text-slate-300 mb-2">Voice Persona</label>
                    <select 
                        value={activeVoice}
                        onChange={(e) => onVoiceChange(e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    >
                        {VOICES.map(voice => (
                            <option key={voice} value={voice}>{voice}</option>
                        ))}
                    </select>
                </div>
             </div>
        </div>

        {/* Chat History */}
        <div className="pt-4 border-t border-slate-700">
            <h4 className="text-lg font-medium text-white mb-2">Data Management</h4>
            <p className="text-sm text-slate-400 mb-4">
                Clear your local conversation history.
            </p>
            <button
                onClick={() => {
                    onClearHistory();
                    onClose();
                }}
                className="w-full py-2 px-4 bg-red-900/20 border border-red-800/50 text-red-300 hover:bg-red-900/40 hover:text-red-200 rounded-lg transition-all duration-200 text-sm font-medium"
            >
                Clear Chat History
            </button>
        </div>
        
        <div className="pt-2 text-center">
            <p className="text-xs text-slate-600">
                NOVA AI Studio v1.0
            </p>
        </div>
      </div>
    </Modal>
  );
};

export default SettingsModal;
