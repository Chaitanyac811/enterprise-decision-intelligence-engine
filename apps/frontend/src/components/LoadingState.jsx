import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingState({ message = 'Computing analytics...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
      <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-3" />
      <p className="text-sm font-medium text-slate-600">{message}</p>
    </div>
  );
}
