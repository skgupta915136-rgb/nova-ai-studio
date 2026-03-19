
import React, { useMemo } from 'react';

interface StatusIndicatorProps {
  isListening: boolean;
  isSpeaking: boolean;
  onStop?: () => void;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ isListening, isSpeaking, onStop }) => {
  const getStatusClasses = () => {
    if (isSpeaking) {
      return {
        ring: 'ring-purple-500',
        glow: 'shadow-[0_0_20px_5px] shadow-purple-500/50',
        text: 'Zeno is speaking... (Click to Stop)',
        textColor: 'text-purple-300',
      };
    }
    if (isListening) {
      return {
        ring: 'ring-green-500',
        glow: 'shadow-[0_0_20px_5px] shadow-green-500/50',
        text: 'Listening...',
        textColor: 'text-green-300',
      };
    }
    return {
      ring: 'ring-sky-500',
      glow: 'shadow-[0_0_20px_5px] shadow-sky-500/50',
      text: 'Zeno is waiting',
      textColor: 'text-sky-300',
    };
  };

  const { ring, glow, text, textColor } = getStatusClasses();
  const ringCount = 12;

  // Generate some random stars
  const stars = useMemo(() => Array.from({ length: 20 }).map(() => ({
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    animationDuration: `${Math.random() * 2 + 1}s`,
    animationDelay: `${Math.random() * 2}s`,
  })), []);

  // Memoize ring configuration to ensure stability across renders
  const rings = useMemo(() => {
    return Array.from({ length: ringCount }).map((_, i) => {
      const size = 60 + i * 30;
      // Faster animation: Base 2s, small increment.
      const animationDuration = 2 + i * 0.3; 
      // Random negative delay ensures rings start at different rotations immediately
      const animationDelay = -Math.random() * 5; 
      const rotationDirection = i % 2 === 0 ? 'normal' : 'reverse';
      
      // Ensure segments and gaps are substantial enough to see the rotation
      const segments = Math.floor(Math.random() * 3) + 3; // 3 to 5 segments
      const gap = Math.floor(Math.random() * 20) + 15; // 15 to 35 deg gap
      const dashArray = (360 - segments * gap) / segments;
      
      return {
        size,
        animationDuration,
        animationDelay,
        rotationDirection,
        dashArray,
        gap
      };
    });
  }, [ringCount]);

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div 
        className={`relative w-[400px] h-[400px] flex items-center justify-center scale-75 md:scale-100 ${isSpeaking ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`}
        onClick={() => isSpeaking && onStop && onStop()}
        title={isSpeaking ? "Click to stop speaking" : ""}
      >
        
        {/* Stars */}
        <div className="absolute inset-0 pointer-events-none">
            {stars.map((star, i) => (
                <div key={i} className="absolute w-1 h-1 bg-cyan-200/50 rounded-full animate-pulse" style={star}></div>
            ))}
        </div>

        {/* Rings */}
        {rings.map((r, i) => (
            <div key={i} 
                className="absolute rounded-full pointer-events-none"
                style={{
                    width: `${r.size}px`,
                    height: `${r.size}px`,
                    animation: `spin ${r.animationDuration}s linear infinite ${r.rotationDirection}`,
                    animationDelay: `${r.animationDelay}s`
                }}
            >
                <svg viewBox="0 0 100 100" className="w-full h-full">
                    <circle 
                        cx="50" cy="50" r="48" 
                        fill="none" 
                        stroke="rgba(0, 220, 255, 0.25)"
                        strokeWidth="1.5"
                        strokeDasharray={`${r.dashArray} ${r.gap}`}
                        pathLength="360"
                        strokeLinecap="round"
                    />
                </svg>
            </div>
        ))}

        {/* Central Orb */}
        <div className={`relative w-28 h-28 flex items-center justify-center`}>
          <div className={`absolute inset-0 rounded-full ${ring} ring-2 animate-ping opacity-75`}></div>
          <div className={`absolute inset-1 rounded-full ${ring} ring-1`}></div>
          <div className={`w-24 h-24 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-2xl font-bold transition-all duration-500 ${textColor} ${glow}`}>
            Zeno
          </div>
        </div>
      </div>
      <p className="text-lg font-medium text-gray-300 -mt-8 pointer-events-none">{text}</p>
    </div>
  );
};

export default StatusIndicator;
