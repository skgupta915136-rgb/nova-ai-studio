import React from 'react';

interface SmartLightProps {
    on: boolean;
    color: string;
}

const SmartLight: React.FC<SmartLightProps> = ({ on, color }) => {
    return (
        <div className="flex items-center space-x-2">
            <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 shadow-lg ${on ? 'bg-gray-200' : 'bg-gray-800'}`}
                style={on ? { boxShadow: `0 0 15px 5px ${color}` } : {}}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-6 w-6 transition-colors duration-500 ${on ? 'text-yellow-400' : 'text-gray-500'}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    style={on ? { color: color } : {}}
                >
                    <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.657a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 14.95a1 1 0 001.414 1.414l.707-.707a1 1 0 00-1.414-1.414l-.707.707zM4 10a1 1 0 01-1 1H2a1 1 0 110-2h1a1 1 0 011 1zM10 18a1 1 0 01-1-1v-1a1 1 0 112 0v1a1 1 0 01-1 1zM8.293 15.707a1 1 0 001.414-1.414L9 13.586A5.002 5.002 0 0110 5a5 5 0 015 5c0 2.21-1.343 4.12-3.265 4.873a.5.5 0 01-.685-.492V13.5a3 3 0 00-3-3H8.293z" />
                </svg>
            </div>
            <span className="text-sm font-medium text-gray-300 bg-black/30 px-2 py-1 rounded">{on ? `Light On (${color})` : 'Light Off'}</span>
        </div>
    );
};

export default SmartLight;