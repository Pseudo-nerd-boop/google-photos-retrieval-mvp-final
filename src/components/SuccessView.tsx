import React from 'react';
import { ScoredPhotoItem } from '../lib/types';
import { CheckCircle, RotateCcw, Sparkles } from 'lucide-react';

interface SuccessViewProps {
  confirmedCandidate: ScoredPhotoItem;
  onResetTask: () => void;
  recoveryStepCount: number;
}

export const SuccessView: React.FC<SuccessViewProps> = ({
  confirmedCandidate,
  onResetTask,
  recoveryStepCount,
}) => {
  const photo = confirmedCandidate.photo;

  return (
    <div className="max-w-xl mx-auto bg-white rounded-3xl border border-emerald-200 p-8 shadow-xl text-center space-y-6 animate-in zoom-in-95 duration-200">
      {/* Success Badge */}
      <div className="inline-flex p-3.5 bg-emerald-100 text-emerald-600 rounded-full shadow-inner">
        <CheckCircle className="w-10 h-10" />
      </div>

      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-slate-900">Photo found!</h2>
        <p className="text-sm text-slate-600">
          Retrieved in {recoveryStepCount === 0 ? 'initial search' : `${recoveryStepCount} refinement step(s)`}.
        </p>
      </div>

      {/* Target Photo Preview Card */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-slate-900 max-w-sm mx-auto">
        <img
          src={`/${photo.filename}`}
          alt={photo.title}
          className="w-full h-56 object-cover"
        />
        <div className="p-4 text-left bg-white space-y-1.5">
          <h4 className="font-bold text-slate-900 text-base">{photo.title}</h4>
          <p className="text-xs text-slate-500">{photo.location.name}, {photo.location.city} • {photo.date}</p>

          {confirmedCandidate.matched_clues && confirmedCandidate.matched_clues.length > 0 && (
            <div className="pt-2 border-t border-slate-100 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Found using:
              </span>
              <div className="flex flex-wrap gap-1">
                {confirmedCandidate.matched_clues.map((clue, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
                  >
                    ✓ {clue}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-2">
        <button
          onClick={onResetTask}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold shadow-md transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Search another memory</span>
        </button>
      </div>
    </div>
  );
};
