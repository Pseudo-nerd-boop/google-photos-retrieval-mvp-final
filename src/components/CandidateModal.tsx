import React from 'react';
import { ScoredPhotoItem } from '../lib/types';
import { X, Check, ArrowLeft, Calendar, MapPin, User, Activity, Tag } from 'lucide-react';

interface CandidateModalProps {
  candidate: ScoredPhotoItem | null;
  onClose: () => void;
  onConfirmSuccess: (candidate: ScoredPhotoItem) => void;
  onRejectCandidate: (candidate: ScoredPhotoItem) => void;
}

export const CandidateModal: React.FC<CandidateModalProps> = ({
  candidate,
  onClose,
  onConfirmSuccess,
  onRejectCandidate,
}) => {
  if (!candidate) return null;
  const photo = candidate.photo;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col md:flex-row max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-2 rounded-full bg-slate-900/60 text-white hover:bg-slate-900 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Large Photo Preview */}
        <div className="md:w-3/5 bg-slate-950 flex items-center justify-center relative min-h-[250px] md:min-h-[420px]">
          <img
            src={`/${photo.filename}`}
            alt={photo.title}
            className="w-full h-full object-contain max-h-[60vh] md:max-h-[80vh]"
          />
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-slate-900/80 text-white backdrop-blur-sm">
            {photo.category}
          </div>
        </div>

        {/* Metadata Details & Target Verification Panel */}
        <div className="md:w-2/5 p-6 flex flex-col justify-between space-y-4 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900 leading-snug">
                {photo.title}
              </h3>
              <p className="text-xs text-slate-500 mt-1">{photo.description}</p>
            </div>

            {/* Metadata Rows */}
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{photo.date} ({photo.season})</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{photo.location.name}, {photo.location.city}</span>
              </div>
              {photo.people.length > 0 && (
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>{photo.people.map(p => (p === 'self' || p === 'me' ? 'You' : p)).join(', ')}</span>
                </div>
              )}
              {photo.activities.length > 0 && (
                <div className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-slate-400" />
                  <span>{photo.activities.join(', ')}</span>
                </div>
              )}
            </div>

            {/* Why Matched Section */}
            {candidate.matched_clues && candidate.matched_clues.length > 0 && (
              <div className="pt-3 border-t border-slate-100 space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Why this photo matched
                </span>
                <div className="flex flex-wrap gap-1">
                  {candidate.matched_clues.map((clue, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100"
                    >
                      ✓ {clue}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Target Verification Decision Box */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <p className="text-sm font-semibold text-slate-800 text-center">
              Is this the photo you remembered?
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onRejectCandidate(candidate)}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Not this one</span>
              </button>
              <button
                type="button"
                onClick={() => onConfirmSuccess(candidate)}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>This is it</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
