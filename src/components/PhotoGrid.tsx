import React, { useState } from 'react';
import { ScoredPhotoItem } from '../lib/types';
import { Calendar, MapPin, CheckCircle2, ChevronDown, ChevronUp, Info } from 'lucide-react';

interface PhotoGridProps {
  candidates: ScoredPhotoItem[];
  onSelectCandidate: (candidate: ScoredPhotoItem) => void;
  selectedPhotoId?: string | null;
  title?: string;
}

export const PhotoGrid: React.FC<PhotoGridProps> = ({
  candidates,
  onSelectCandidate,
  selectedPhotoId,
  title = 'Possible matches',
}) => {
  const [expandedScoreId, setExpandedScoreId] = useState<string | null>(null);

  if (candidates.length === 0) {
    return (
      <div className="text-center py-16 px-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-xl">
          🔍
        </div>
        <p className="text-base font-bold text-slate-800">No matching photos found</p>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Try refining your memory clues or selecting a suggested recovery path.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <span>{title}</span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            {candidates.length}
          </span>
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {candidates.map((cand) => {
          const photo = cand.photo;
          const isSelected = selectedPhotoId === photo.id;
          const isScoreExpanded = expandedScoreId === photo.id;

          return (
            <div
              key={photo.id}
              className={`group relative flex flex-col bg-white rounded-2xl overflow-hidden border transition-all duration-200 hover:shadow-lg ${
                isSelected
                  ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-md'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Photo Image Card */}
              <div
                onClick={() => onSelectCandidate(cand)}
                className="relative aspect-[4/3] w-full bg-slate-100 overflow-hidden cursor-pointer"
              >
                <img
                  src={`/${photo.filename}`}
                  alt={photo.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-900/80 text-white backdrop-blur-sm">
                  {photo.category}
                </div>

                {isSelected && (
                  <div className="absolute top-2 right-2 bg-blue-600 text-white p-1 rounded-full shadow">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                )}
              </div>

              {/* Card Meta Content */}
              <div className="p-3.5 flex flex-col justify-between flex-1 space-y-2.5">
                <div onClick={() => onSelectCandidate(cand)} className="cursor-pointer">
                  <h4 className="font-semibold text-sm text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                    {photo.title}
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {photo.date}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {photo.location.city}
                    </span>
                  </div>
                </div>

                {/* Matched Clue Indicator Badges */}
                {cand.matched_clues && cand.matched_clues.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1">
                    {cand.matched_clues.slice(0, 3).map((clue, idx) => (
                      <span
                        key={idx}
                        className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-100"
                      >
                        ✓ {clue}
                      </span>
                    ))}
                    {cand.matched_clues.length > 3 && (
                      <span className="text-[10px] text-slate-400 font-medium self-center">
                        +{cand.matched_clues.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Secondary Explainability Score Drawer Toggle */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedScoreId(isScoreExpanded ? null : photo.id);
                    }}
                    className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <Info className="w-3 h-3" />
                    <span>Score: {cand.score}</span>
                    {isScoreExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  {isScoreExpanded && (
                    <div className="mt-2 p-2 bg-slate-50 rounded-lg border border-slate-200 text-[10px] text-slate-600 space-y-1 animate-in fade-in duration-150">
                      <div className="flex justify-between"><span>Category:</span> <span>{cand.score_breakdown.category_score}</span></div>
                      <div className="flex justify-between"><span>Date:</span> <span>{cand.score_breakdown.date_score}</span></div>
                      <div className="flex justify-between"><span>People:</span> <span>{cand.score_breakdown.people_score}</span></div>
                      <div className="flex justify-between"><span>Location:</span> <span>{cand.score_breakdown.location_score}</span></div>
                      <div className="flex justify-between"><span>Activity:</span> <span>{cand.score_breakdown.activity_score}</span></div>
                      <div className="flex justify-between"><span>Tags/OCR:</span> <span>{cand.score_breakdown.tags_ocr_score}</span></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
