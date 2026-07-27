import React from 'react';

export const SubmissionSuccess: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full glass-panel p-8 rounded-2xl text-center space-y-4">
        <h1 className="text-2xl font-bold text-emerald-400">Assigned Successfully!</h1>
        <p className="text-sm text-slate-300">Your group allocation details are ready.</p>
      </div>
    </div>
  );
};
