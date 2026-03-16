
import React, { useState } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage('');
    }
  };

  return (
    <div className="w-full max-w-3xl bg-black/30 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col md:flex-row items-end gap-3">
            <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
                }
            }}
            placeholder="Type your message here... (Shift+Enter for new line)"
            className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-sky-500 focus:outline-none transition-shadow resize-none"
            rows={2}
            disabled={disabled}
            />
            <button type="submit" disabled={disabled || !message.trim()} className="w-full md:w-auto h-full px-5 py-3 rounded-lg font-semibold text-white bg-sky-600 hover:bg-sky-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors self-stretch flex items-center justify-center">
                Send
            </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInput;
