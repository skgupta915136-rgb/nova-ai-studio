import React from 'react';

interface CameraControlsProps {
    isCameraOn: boolean;
    onToggle: () => void;
}

const CameraIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.55a1 1 0 011.45.89V16.1a1 1 0 01-1.45.89L15 14M5 8h6a2 2 0 012 2v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4a2 2 0 012-2z" />
    </svg>
);

const CameraOffIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a9.97 9.97 0 01-1.563 3.029m0 0l-2.145-2.145" />
    </svg>
);


const CameraControls: React.FC<CameraControlsProps> = ({ isCameraOn, onToggle }) => {
    return (
        <button
            onClick={onToggle}
            title={isCameraOn ? "Turn Camera Off" : "Turn Camera On"}
            className={`absolute left-0 p-3 rounded-full transition-all duration-300 shadow-lg transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-opacity-50 ${
                isCameraOn ? 'bg-sky-600 hover:bg-sky-700 text-white focus:ring-sky-500' : 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white focus:ring-gray-500'
            }`}
        >
            {isCameraOn ? <CameraIcon /> : <CameraOffIcon />}
        </button>
    );
};

export default CameraControls;
