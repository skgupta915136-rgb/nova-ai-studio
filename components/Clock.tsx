import React, { useState, useEffect } from 'react';

const ClockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-sky-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const Clock: React.FC = () => {
    const [date, setDate] = useState(new Date());

    useEffect(() => {
        const timerId = setInterval(() => {
            setDate(new Date());
        }, 1000);

        return () => {
            clearInterval(timerId);
        };
    }, []);

    const timeString = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
    });

    const dateString = date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    });

    return (
        <div className="flex items-center bg-black/40 backdrop-blur-sm p-3 rounded-lg border border-slate-700/50 text-white shadow-lg">
            <ClockIcon />
            <div>
                <p className="text-xl font-semibold leading-none tracking-wider font-mono">{timeString}</p>
                <p className="text-xs text-slate-300 leading-none mt-1">{dateString}</p>
            </div>
        </div>
    );
};

export default Clock;
