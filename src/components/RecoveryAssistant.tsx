import React, { useState } from 'react';
import { RecoverySuggestion, WeakResultEvaluation } from '../lib/types';
import { HelpCircle, ArrowRight, MessageSquare, RefreshCw, Sparkles } from 'lucide-react';

interface RecoveryAssistantProps {
  weakEval: WeakResultEvaluation;
  suggestions: RecoverySuggestion[];
  onApplyRefinement: (suggestion: RecoverySuggestion, userResponseText: string) => void;
  isLoading: boolean;
}

export const RecoveryAssistant: React.FC<RecoveryAssistantProps> = ({
  weakEval,
  suggestions,
  onApplyRefinement,
  isLoading,
}) => {
  const [selectedSuggestion, setSelectedSuggestion] = useState<RecoverySuggestion | null>(null);
  const [responseText, setResponseText] = useState<string>('');
  const [refiningStateText, setRefiningStateText] = useState<string>('Updating what I understood…');

  const handleSelectSuggestion = (sug: RecoverySuggestion) => {
    setSelectedSuggestion(sug);
    setResponseText('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSuggestion || !responseText.trim()) return;

    setRefiningStateText('Updating what I understood…');
    setTimeout(() => {
      setRefiningStateText('Searching again…');
    }, 600);

    onApplyRefinement(selectedSuggestion, responseText.trim());
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 via-indigo-50/60 to-white p-5 rounded-2xl border border-blue-200/80 shadow-sm space-y-4 animate-in fade-in duration-200">
      {/* Recovery Header */}
      <div className="flex items-start gap-3">
        <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-sm mt-0.5">
          <HelpCircle className="w-5 h-5" />
        </div>
        <div className="space-y-1 flex-1">
          <h3 className="font-bold text-base text-slate-900">
            {weakEval.reason_code === 'ZERO_MATCHES'
              ? 'No exact match found yet'
              : 'Need one more clue?'}
          </h3>
          <p className="text-sm text-slate-600">
            {weakEval.reason_code === 'ZERO_MATCHES'
              ? 'I couldn’t find an exact photo matching all clues. Pick a dimension below to refine your memory.'
              : 'I found several possible matches. What else do you remember about this photo?'}
          </p>
        </div>
      </div>

      {/* Suggestion Options */}
      {suggestions.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>AI Suggested Recovery Paths</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {suggestions.map((sug) => {
              const isSelected = selectedSuggestion?.id === sug.id;
              return (
                <button
                  key={sug.id}
                  type="button"
                  onClick={() => handleSelectSuggestion(sug)}
                  className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-blue-600 bg-white ring-2 ring-blue-500/20 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                      {sug.dimension.replace('_', ' ')}
                    </span>
                    <span className="text-sm font-semibold text-slate-800 block">
                      {sug.label}
                    </span>
                  </div>
                  <ArrowRight className={`w-4 h-4 transition-transform ${isSelected ? 'text-blue-600 translate-x-1' : 'text-slate-400'}`} />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Natural-Language Refinement Input */}
      {selectedSuggestion && (
        <form onSubmit={handleSubmit} className="pt-3 border-t border-blue-100 space-y-3">
          <div className="bg-white p-3.5 rounded-xl border border-blue-200 space-y-1.5 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-700">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{selectedSuggestion.label}</span>
            </div>
            <p className="text-sm font-semibold text-slate-800">
              {selectedSuggestion.prompt_question}
            </p>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder="Tell me anything else you remember…"
              className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              autoFocus
            />
            <button
              type="submit"
              disabled={isLoading || !responseText.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{refiningStateText}</span>
                </>
              ) : (
                <span>Submit refinement</span>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
