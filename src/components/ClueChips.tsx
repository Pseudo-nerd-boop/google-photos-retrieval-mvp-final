import React from 'react';
import { StructuredClues } from '../lib/types';
import { Tag, Calendar, MapPin, User, Activity, Image as ImageIcon, Sparkles, CheckCircle2 } from 'lucide-react';

interface ClueChipsProps {
  clues: StructuredClues;
  recoveryStepCount?: number;
  className?: string;
}

export const ClueChips: React.FC<ClueChipsProps> = ({ clues, recoveryStepCount = 0, className = '' }) => {
  const chipItems: { label: string; icon: React.ReactNode; color: string }[] = [];

  // Person / Self identity
  if (clues.people && clues.people.length > 0) {
    const peopleStr = clues.people.map(p => (p === 'me' || p === 'self' ? 'You' : p)).join(', ');
    chipItems.push({
      label: peopleStr,
      icon: <User className="w-3.5 h-3.5" />,
      color: 'bg-pink-50 text-pink-700 border-pink-200',
    });
  }

  // Location
  if (clues.location?.city || clues.location?.name) {
    const locStr = [clues.location.name, clues.location.city].filter(Boolean).join(', ');
    chipItems.push({
      label: locStr,
      icon: <MapPin className="w-3.5 h-3.5" />,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    });
  }

  // Activity / Object
  if (clues.activities && clues.activities.length > 0) {
    chipItems.push({
      label: clues.activities.join(', '),
      icon: <Activity className="w-3.5 h-3.5" />,
      color: 'bg-amber-50 text-amber-700 border-amber-200',
    });
  }

  // Timeframe
  if (clues.time_frame) {
    const tf = clues.time_frame;
    const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const parts = [
      tf.season,
      tf.month ? monthNames[tf.month] || `Month ${tf.month}` : null,
      tf.year
    ].filter(Boolean);

    if (parts.length > 0) {
      chipItems.push({
        label: parts.join(' '),
        icon: <Calendar className="w-3.5 h-3.5" />,
        color: 'bg-purple-50 text-purple-700 border-purple-200',
      });
    }
  }

  // Category
  if (clues.category) {
    chipItems.push({
      label: clues.category,
      icon: <ImageIcon className="w-3.5 h-3.5" />,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
    });
  }

  // Visual Tags
  if (clues.visual_tags && clues.visual_tags.length > 0) {
    chipItems.push({
      label: clues.visual_tags.slice(0, 3).join(', '),
      icon: <Tag className="w-3.5 h-3.5" />,
      color: 'bg-slate-100 text-slate-700 border-slate-200',
    });
  }

  if (chipItems.length === 0) return null;

  return (
    <div className={`bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span>Here's what I understood</span>
        </div>
        {recoveryStepCount > 0 && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            Accumulated {chipItems.length} clues
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {chipItems.map((chip, i) => (
          <span
            key={i}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${chip.color} shadow-xs transition-all hover:scale-105`}
          >
            {chip.icon}
            <span className="capitalize">{chip.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
};
