import React from 'react';
import { ActiveModal } from '../../types';

interface LauncherAppProps {
  onOpenApp: (app: ActiveModal) => void;
}

const LauncherApp: React.FC<LauncherAppProps> = ({ onOpenApp }) => {
  const apps = [
    { id: 'calculator', icon: '789', label: 'Calculator' },
    { id: 'notes', icon: '📝', label: 'Notes' },
    { id: 'weather', icon: '☁️', label: 'Weather' },
    { id: 'search', icon: '🔍', label: 'Search' },
    { id: 'news', icon: '📰', label: 'News' },
    { id: 'chat-pro', icon: '🧠', label: 'Pro Chat' },
    { id: 'image-studio', icon: '🎨', label: 'Image Studio' },
    { id: 'video-studio', icon: '🎬', label: 'Video Studio' },
    { id: 'speech-studio', icon: '🎙️', label: 'Speech Studio' },
    { id: 'settings', icon: '⚙️', label: 'Settings' },
    { id: 'youtube', icon: '▶️', label: 'YouTube', isWeb: true, url: 'https://www.youtube.com' },
    { id: 'chrome', icon: '🌐', label: 'Chrome', isWeb: true, url: 'https://www.google.com' },
    { id: 'whatsapp', icon: '💬', label: 'WhatsApp', isWeb: true, url: 'https://web.whatsapp.com' },
    { id: 'telegram', icon: '✈️', label: 'Telegram', isWeb: true, url: 'https://web.telegram.org' },
    { id: 'instagram', icon: '📸', label: 'Instagram', isWeb: true, url: 'https://www.instagram.com' },
    { id: 'folder', icon: '📁', label: 'Folder', isWeb: true, url: 'folder' },
  ];

  const handleAppClick = (app: any) => {
    if (app.isWeb) {
        if (app.url === 'folder') {
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = true;
            input.click();
        } else {
            window.open(app.url, '_blank');
        }
    } else {
        onOpenApp(app.id as ActiveModal);
    }
  };

  return (
    <div className="grid grid-cols-3 gap-6 p-2 h-96 overflow-y-auto">
      {apps.map((app) => (
        <button
          key={app.id}
          onClick={() => handleAppClick(app)}
          className="flex flex-col items-center gap-2 group transition-all"
        >
          <div className="w-16 h-16 flex items-center justify-center bg-slate-800 rounded-2xl group-hover:bg-sky-600 group-hover:-translate-y-1 transition-all text-3xl shadow-xl border border-slate-700">
            {app.icon}
          </div>
          <span className="text-xs font-bold text-slate-400 group-hover:text-sky-400 uppercase tracking-widest">
            {app.label}
          </span>
        </button>
      ))}
    </div>
  );
};

export default LauncherApp;
