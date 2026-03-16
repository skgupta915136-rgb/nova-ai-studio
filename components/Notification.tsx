import React, { useState, useEffect } from 'react';

interface NotificationProps {
  message: string;
  onClose: () => void;
}

const InfoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-sky-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);


const Notification: React.FC<NotificationProps> = ({ message, onClose }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        setVisible(true); // Trigger fade-in
        const timer = setTimeout(() => {
            setVisible(false); // Trigger fade-out
            // Allow fade-out animation to complete before calling onClose
            setTimeout(onClose, 300);
        }, 4700);

        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`transition-all duration-300 ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'} bg-sky-600/90 backdrop-blur-md text-white px-4 py-3 rounded-lg shadow-2xl flex items-center border border-sky-400/50`}>
            <InfoIcon />
            <p>{message}</p>
        </div>
    );
};

export default Notification;
