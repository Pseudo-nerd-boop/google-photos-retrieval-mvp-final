import React, { useState, useEffect } from 'react';
import { Search, Sparkles, RefreshCw, X } from 'lucide-react';
import { BenchmarkTask } from '../lib/types';

interface SearchHeaderProps {
  onSearch: (queryText: string) => void;
  onSelectPresetTask?: (task: BenchmarkTask) => void;
  presetTasks?: BenchmarkTask[];
  isLoading: boolean;
  activeQuery?: string;
  onClearSearch?: () => void;
}

export const SearchHeader: React.FC<SearchHeaderProps> = ({
  onSearch,
  onSelectPresetTask,
  presetTasks = [],
  isLoading,
  activeQuery = '',
  onClearSearch,
}) => {
  const [inputQuery, setInputQuery] = useState(activeQuery);
  const [loadingStep, setLoadingStep] = useState<string>('Understanding your memory…');

  useEffect(() => {
    setInputQuery(activeQuery);
  }, [activeQuery]);

  useEffect(() => {
    if (isLoading) {
      setLoadingStep('Understanding your memory…');
      const timer = setTimeout(() => {
        setLoadingStep('Finding matching photos…');
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim()) return;
    onSearch(inputQuery.trim());
  };

  const handleSelectPreset = (task: BenchmarkTask) => {
    setInputQuery(task.prompt);
    if (onSelectPresetTask) {
      onSelectPresetTask(task);
    } else {
      onSearch(task.prompt);
    }
  };

  const samplePrompts = [
    "Find the photo of me riding a bicycle in Goa.",
    "That photo of me with my college friends having dinner...",
    "Find the picture from my birthday where everyone was around the cake.",
    "I remember a screenshot of a payment confirmation from last year.",
  ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Prominent Search Bar */}
      <form onSubmit={handleSubmit} className="relative w-full">
        <div className="relative flex items-center bg-white rounded-full border border-slate-300 shadow-md hover:shadow-lg focus-within:shadow-xl focus-within:border-blue-500 transition-all px-4 py-2">
          <div className="text-slate-400 p-1">
            <Search className="w-5 h-5 text-blue-600" />
          </div>

          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Search your photos by describing what you remember…"
            className="flex-1 px-3 py-2 text-base text-slate-900 placeholder-slate-400 bg-transparent focus:outline-none"
          />

          {inputQuery && (
            <button
              type="button"
              onClick={() => {
                setInputQuery('');
                if (onClearSearch) onClearSearch();
              }}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 mr-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            type="submit"
            disabled={isLoading || !inputQuery.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">Searching</span>
              </>
            ) : (
              <span>Search</span>
            )}
          </button>
        </div>
      </form>

      {/* Loading Sequence Feedback */}
      {isLoading && (
        <div className="flex items-center justify-center gap-2 text-sm font-medium text-blue-700 py-2 bg-blue-50/80 rounded-xl border border-blue-100 animate-pulse">
          <Sparkles className="w-4 h-4 animate-spin text-blue-600" />
          <span>{loadingStep}</span>
        </div>
      )}

      {/* Rotating Sample Memory Prompts */}
      {!isLoading && !activeQuery && (
        <div className="space-y-2 pt-1 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>Try searching your memory</span>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {samplePrompts.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setInputQuery(prompt);
                  onSearch(prompt);
                }}
                className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-white text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200 shadow-sm transition-all text-left"
              >
                "{prompt}"
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
