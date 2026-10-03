import React from 'react';
import { AlertCircle } from 'lucide-react';

interface OfflineBadgeProps {
  isFallbackMode: boolean;
}

export const OfflineBadge: React.FC<OfflineBadgeProps> = ({ isFallbackMode }) => {
  if (!isFallbackMode) return null;

  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
      <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
      <span>Basic Recovery (Offline Mode)</span>
    </div>
  );
};
