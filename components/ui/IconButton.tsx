
import React from 'react';

interface IconButtonProps {
    onClick: () => void;
    disabled: boolean;
    title: string;
    children: React.ReactNode;
}

const IconButton: React.FC<IconButtonProps> = ({ onClick, disabled, title, children }) => {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            title={title}
            className="p-3 rounded-full bg-gray-700 text-gray-300 transition-all duration-300 shadow-lg transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-opacity-50 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed disabled:transform-none hover:bg-sky-700 hover:text-white"
        >
            {children}
        </button>
    );
};

export default IconButton;
