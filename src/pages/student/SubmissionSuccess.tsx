import React from 'react';
import { useParams } from 'react-router-dom';
import { StudentInbox } from '../../components/student/StudentInbox';

export const SubmissionSuccess: React.FC = () => {
  const { tableId } = useParams<{ tableId: string }>();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/40 to-slate-100 text-slate-900 flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background Subtle Ambient Lights */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[55%] h-[55%] bg-indigo-200/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-200/30 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-md w-full bg-white/95 p-8 rounded-3xl text-center space-y-4 border border-slate-200 shadow-xl relative z-10 backdrop-blur-xl">
        <h1 className="text-2xl font-black text-slate-900">Assigned Successfully!</h1>
        <p className="text-sm font-semibold text-slate-600">Your group allocation details are ready and loaded.</p>
      </div>

      {tableId && <StudentInbox tableId={tableId} />}
    </div>
  );
};
