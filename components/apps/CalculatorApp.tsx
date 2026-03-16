import React, { useState } from 'react';

// FIX: Moved Button component outside of CalculatorApp to prevent re-rendering issues and fix type inference.
// Also, created a dedicated interface for props for better readability.
interface ButtonProps {
  onClick: () => void;
  className?: string;
  children?: React.ReactNode;
}

const Button = ({ onClick, className, children }: ButtonProps) => (
    <button onClick={onClick} className={`bg-slate-600 hover:bg-slate-500 text-white font-bold py-4 rounded-lg text-xl transition-colors ${className}`}>
        {children}
    </button>
);

const CalculatorApp: React.FC = () => {
  const [display, setDisplay] = useState('0');

  const handleInput = (value: string) => {
    if (display === '0' || display === 'Error') {
      setDisplay(value);
    } else {
      setDisplay(display + value);
    }
  };
  
  const handleClear = () => setDisplay('0');

  const handleCalculate = () => {
    try {
      // Using new Function is slightly safer than direct eval for this context
      const result = new Function('return ' + display.replace(/x/g, '*').replace(/÷/g, '/'))();
      setDisplay(String(result));
    } catch {
      setDisplay('Error');
    }
  };

  return (
    <div className="w-full max-w-xs mx-auto bg-slate-800 rounded-lg p-4 space-y-4">
      <div className="bg-slate-900 text-white text-4xl text-right rounded p-4 font-mono break-all h-24 flex items-center justify-end">
        {display}
      </div>
      <div className="grid grid-cols-4 gap-2">
        <Button onClick={handleClear} className="bg-red-600/80 hover:bg-red-500">C</Button>
        <Button onClick={() => handleInput('(')} className="bg-slate-700 hover:bg-slate-600">(</Button>
        <Button onClick={() => handleInput(')')} className="bg-slate-700 hover:bg-slate-600">)</Button>
        <Button onClick={() => handleInput('÷')} className="bg-slate-700 hover:bg-slate-600">÷</Button>

        <Button onClick={() => handleInput('7')}>7</Button>
        <Button onClick={() => handleInput('8')}>8</Button>
        <Button onClick={() => handleInput('9')}>9</Button>
        <Button onClick={() => handleInput('x')} className="bg-slate-700 hover:bg-slate-600">x</Button>

        <Button onClick={() => handleInput('4')}>4</Button>
        <Button onClick={() => handleInput('5')}>5</Button>
        <Button onClick={() => handleInput('6')}>6</Button>
        <Button onClick={() => handleInput('-')} className="bg-slate-700 hover:bg-slate-600">-</Button>

        <Button onClick={() => handleInput('1')}>1</Button>
        <Button onClick={() => handleInput('2')}>2</Button>
        <Button onClick={() => handleInput('3')}>3</Button>
        <Button onClick={() => handleInput('+')} className="bg-slate-700 hover:bg-slate-600">+</Button>

        <Button onClick={() => handleInput('0')} className="col-span-2">0</Button>
        <Button onClick={() => handleInput('.')}>.</Button>
        <Button onClick={handleCalculate} className="bg-sky-600 hover:bg-sky-500">=</Button>
      </div>
    </div>
  );
};

export default CalculatorApp;