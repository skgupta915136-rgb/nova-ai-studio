
import React from 'react';

interface TabsProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="flex border-b border-slate-700">
      {tabs.map(tab => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === tab
              ? 'border-b-2 border-sky-400 text-sky-300'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
};

export default Tabs;
