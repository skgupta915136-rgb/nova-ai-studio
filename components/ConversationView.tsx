
import React, { useRef, useEffect } from 'react';
import { ConversationTurn } from '../types';

interface ConversationViewProps {
  history: ConversationTurn[];
}

const NovaIcon = () => (
  <div className="w-8 h-8 rounded-full bg-purple-500 flex-shrink-0 flex items-center justify-center shadow-md">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM5 9a1 1 0 000 2h2a1 1 0 100-2H5zm10-1a1 1 0 10-2 0v2a1 1 0 102 0V8zM8 5a1 1 0 100 2h2a1 1 0 100-2H8z" clipRule="evenodd" />
    </svg>
  </div>
);

const UserIcon = () => (
  <div className="w-8 h-8 rounded-full bg-sky-500 flex-shrink-0 flex items-center justify-center shadow-md">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
    </svg>
  </div>
);


const ConversationView: React.FC<ConversationViewProps> = ({ history }) => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  return (
    <div className="flex-1 w-full max-w-3xl p-4 overflow-y-auto space-y-6 bg-black/30 backdrop-blur-sm rounded-xl">
      {history.map((turn, index) => (
        <div key={index} className={`flex items-start gap-3 ${turn.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
          {turn.speaker === 'nova' && <NovaIcon />}
          <div className="flex flex-col">
            <div 
              className={`px-4 py-3 rounded-2xl max-w-md md:max-w-lg shadow-lg break-words ${
                turn.speaker === 'user' 
                  ? 'bg-sky-600/80 rounded-br-none' 
                  : 'bg-gray-700/80 rounded-bl-none'
              }`}
            >
              <p className={`text-base ${!turn.isFinal ? 'opacity-70' : ''}`}>{turn.text}</p>
            </div>
            {turn.groundingChunks && turn.groundingChunks.length > 0 && (
                <div className="mt-2 text-xs text-gray-400 max-w-md md:max-w-lg">
                    <p className="font-semibold mb-1">Sources:</p>
                    <ul className="space-y-1 list-disc list-inside">
                        {turn.groundingChunks.map((chunk, i) => {
                            const source = chunk.web || chunk.maps;
                            // FIX: Ensure source and source.uri exist before rendering the link.
                            if (!source || !source.uri) return null;
                            return (
                                <li key={i} className="truncate">
                                    <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline">
                                        {source.title || source.uri}
                                    </a>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
          </div>
          {turn.speaker === 'user' && <UserIcon />}
        </div>
      ))}
      <div ref={endOfMessagesRef} />
    </div>
  );
};

export default ConversationView;