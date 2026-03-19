import React, { useState, useEffect } from 'react';

const NotesApp: React.FC = () => {
  const [notes, setNotes] = useState(() => {
    return localStorage.getItem('zeno-notes-app') || 'Type your notes here...';
  });

  useEffect(() => {
    const timer = setTimeout(() => {
        localStorage.setItem('zeno-notes-app', notes);
    }, 500); // Debounce saving to avoid excessive writes
    
    return () => clearTimeout(timer);
  }, [notes]);

  return (
    <div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="w-full h-64 bg-slate-800 border border-slate-600 rounded-lg p-4 text-white placeholder-gray-500 focus:ring-2 focus:ring-sky-500 focus:outline-none transition-shadow"
        placeholder="Type your notes here..."
      />
      <p className="text-xs text-slate-400 mt-2">Your notes are saved automatically in your browser.</p>
    </div>
  );
};

export default NotesApp;
