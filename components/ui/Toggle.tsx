
import React from 'react';

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

const Toggle: React.FC<ToggleProps> = ({ label, checked, onChange, disabled }) => {
  return (
    <label className="flex items-center cursor-pointer">
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={() => !disabled && onChange(!checked)}
          disabled={disabled}
        />
        <div className={`block w-10 h-6 rounded-full transition-colors ${disabled ? 'bg-gray-600' : (checked ? 'bg-sky-500' : 'bg-slate-600')}`}></div>
        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${checked ? 'translate-x-4' : ''}`}></div>
      </div>
      <div className={`ml-3 text-sm font-medium ${disabled ? 'text-gray-500' : 'text-slate-300'}`}>
        {label}
      </div>
    </label>
  );
};

export default Toggle;
