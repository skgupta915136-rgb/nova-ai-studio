import React from 'react';

interface PCControlsProps {
    volume: number;
}

const VolumeIcon = ({ volume }: { volume: number }) => {
    let icon;
    if (volume === 0) {
        icon = <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.93 15.93a.75.75 0 01-1.06 0l-2.12-2.12a.75.75 0 010-1.06l2.12-2.12a.75.75 0 011.06 1.06L15.44 12l.47.47a.75.75 0 010 1.06l-.98.98zM12 6.343a5.96 5.96 0 00-4.243 1.757 6 6 0 000 8.486A5.96 5.96 0 0012 18.343a6 6 0 004.243-10.243A5.96 5.96 0 0012 6.343z" />;
    } else if (volume < 50) {
        icon = <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.5 18.375h-1.5a4.125 4.125 0 01-4.125-4.125v-3.75a4.125 4.125 0 014.125-4.125h1.5m0 12l3.375-3.375m-3.375 0V6" />;
    } else {
        icon = <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.5 18.375h-1.5a4.125 4.125 0 01-4.125-4.125v-3.75a4.125 4.125 0 014.125-4.125h1.5m0 12l3.375-3.375m-3.375 0V6m5.25 1.5s1.5 1.5 1.5 3.75-1.5 3.75-1.5 3.75" />;
    }
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {icon}
        </svg>
    )
}

const PCControls: React.FC<PCControlsProps> = ({ volume }) => {
    return (
        <div className="flex items-center space-x-2 bg-black/40 backdrop-blur-sm p-2 rounded-lg border border-slate-700/50">
            <VolumeIcon volume={volume} />
            <div className="w-24 h-2 bg-gray-600 rounded-full">
                <div 
                    className="h-2 bg-sky-400 rounded-full transition-all"
                    style={{ width: `${volume}%` }}
                />
            </div>
            <span className="text-sm font-medium text-gray-300 w-8 text-right">{volume}%</span>
        </div>
    );
};

export default PCControls;
