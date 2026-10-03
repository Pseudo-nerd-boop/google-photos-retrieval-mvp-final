'use client';

import React, { useState, useEffect } from 'react';
import { SearchHeader } from '../components/SearchHeader';
import { ClueChips } from '../components/ClueChips';
import { PhotoGrid } from '../components/PhotoGrid';
import { RecoveryAssistant } from '../components/RecoveryAssistant';
import { CandidateModal } from '../components/CandidateModal';
import { SuccessView } from '../components/SuccessView';
import { OfflineBadge } from '../components/OfflineBadge';
import { Sidebar } from '../components/Sidebar';
import {
  StructuredClues,
  ScoredPhotoItem,
  SearchResult,
  RecoverySuggestion,
  BenchmarkTask,
  PhotoItem,
} from '../lib/types';
import { logTelemetryEvent, exportSessionEventsAsJson } from '../lib/analytics';
import benchmarkTasksData from '../../data/benchmark_tasks.json';
import photosData from '../../data/photos.json';
import { Download, Menu, Sparkles, User, Image as ImageIcon } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>('photos');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);
  const [activeQuery, setActiveQuery] = useState<string>('');
  const [currentClues, setCurrentClues] = useState<StructuredClues | null>(null);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [suggestions, setSuggestions] = useState<RecoverySuggestion[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<ScoredPhotoItem | null>(null);
  const [confirmedCandidate, setConfirmedCandidate] = useState<ScoredPhotoItem | null>(null);
  const [isFallbackMode, setIsFallbackMode] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [recoveryStepCount, setRecoveryStepCount] = useState<number>(0);
  const [activeBenchmarkTask, setActiveBenchmarkTask] = useState<BenchmarkTask | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  const presetTasks = benchmarkTasksData as BenchmarkTask[];
  const allPhotoItems = photosData as PhotoItem[];

  // Execute search pass
  const handlePerformSearch = async (queryText: string, task?: BenchmarkTask) => {
    setIsLoading(true);
    setActiveQuery(queryText);
    setActiveTab('search');
    setConfirmedCandidate(null);
    setSelectedCandidate(null);
    setRecoveryStepCount(0);
    if (task) setActiveBenchmarkTask(task);

    logTelemetryEvent('QUERY_SUBMIT', { query: queryText, task_id: task?.id || null });

    try {
      // 1. Extract clues via /api/recovery
      const recoveryRes = await fetch('/api/recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'EXTRACT_CLUES', query: queryText }),
      });
      const recoveryData = await recoveryRes.json();
      const extractedClues: StructuredClues = recoveryData.clues || {};
      setIsFallbackMode(Boolean(recoveryData.is_fallback_mode));
      setCurrentClues(extractedClues);

      // 2. Perform search via /api/search
      const searchRes = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryText, clues: extractedClues }),
      });
      const sResult: SearchResult = await searchRes.json();
      setSearchResult(sResult);

      logTelemetryEvent('INITIAL_RESULTS_LOADED', {
        candidate_count: sResult.candidates.length,
        is_weak: sResult.weak_result_eval.is_weak_result,
        reason: sResult.weak_result_eval.reason_code,
      });

      // 3. Generate recovery suggestions if weak result
      if (sResult.weak_result_eval.is_weak_result) {
        logTelemetryEvent('WEAK_RESULT_DETECTED', { reason: sResult.weak_result_eval.reason_code });

        const suggRes = await fetch('/api/recovery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'GENERATE_SUGGESTIONS',
            currentClues: extractedClues,
            missingDimensions: ['time_frame', 'category', 'people', 'location'],
          }),
        });
        const suggData = await suggRes.json();
        setSuggestions(suggData.suggestions || []);
      } else {
        setSuggestions([]);
      }
    } catch (err) {
      console.error('Search pipeline execution error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle refinement submission
  const handleApplyRefinement = async (suggestion: RecoverySuggestion, userResponseText: string) => {
    if (!currentClues) return;
    setIsLoading(true);
    setRecoveryStepCount(prev => prev + 1);

    logTelemetryEvent('SUGGESTION_CLICKED', { dimension: suggestion.dimension, response: userResponseText }, activeBenchmarkTask?.id, recoveryStepCount + 1);

    try {
      // 1. Process refinement via /api/recovery
      const processRes = await fetch('/api/recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'PROCESS_REFINEMENT',
          currentClues,
          selectedSuggestion: suggestion,
          userResponse: userResponseText,
        }),
      });
      const processData = await processRes.json();
      const updatedClues: StructuredClues = processData.clues || currentClues;
      setCurrentClues(updatedClues);

      // 2. Perform refined search pass
      const searchRes = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: activeQuery, clues: updatedClues }),
      });
      const sResult: SearchResult = await searchRes.json();
      setSearchResult(sResult);

      logTelemetryEvent('REFINED_SEARCH_SUBMIT', {
        candidate_count: sResult.candidates.length,
        is_weak: sResult.weak_result_eval.is_weak_result,
      }, activeBenchmarkTask?.id, recoveryStepCount + 1);

      // 3. Re-evaluate suggestions if still weak
      if (sResult.weak_result_eval.is_weak_result) {
        const suggRes = await fetch('/api/recovery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'GENERATE_SUGGESTIONS',
            currentClues: updatedClues,
            missingDimensions: ['time_frame', 'category', 'people', 'location'],
          }),
        });
        const suggData = await suggRes.json();
        setSuggestions(suggData.suggestions || []);
      } else {
        setSuggestions([]);
      }
    } catch (err) {
      console.error('Refinement pipeline error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmSuccess = (candidate: ScoredPhotoItem) => {
    setConfirmedCandidate(candidate);
    setSelectedCandidate(null);
    logTelemetryEvent('TASK_CONFIRMED_SUCCESS', {
      photo_id: candidate.photo.id,
      recovery_steps: recoveryStepCount,
      target_matched: activeBenchmarkTask ? candidate.photo.id === activeBenchmarkTask.target_photo_id : true,
    }, activeBenchmarkTask?.id, recoveryStepCount);
  };

  const handleRejectCandidate = (candidate: ScoredPhotoItem) => {
    setSelectedCandidate(null);
    logTelemetryEvent('PHOTO_SELECTED', { action: 'rejected', photo_id: candidate.photo.id }, activeBenchmarkTask?.id, recoveryStepCount);
  };

  const handleExportLogs = () => {
    const jsonStr = exportSessionEventsAsJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lumina_photos_session_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setActiveQuery('');
    setCurrentClues(null);
    setSearchResult(null);
    setSuggestions([]);
    setSelectedCandidate(null);
    setConfirmedCandidate(null);
    setRecoveryStepCount(0);
    setActiveBenchmarkTask(null);
    setActiveTab('photos');
  };

  // Convert raw photo items to scored structure for default photo grid display
  const defaultPhotosScored: ScoredPhotoItem[] = allPhotoItems
    .filter(p => selectedCategoryFilter ? p.category === selectedCategoryFilter : true)
    .map(p => ({
      photo: p,
      score: 0,
      score_breakdown: { category_score: 0, date_score: 0, people_score: 0, location_score: 0, activity_score: 0, tags_ocr_score: 0, total_score: 0 },
      matched_clues: [],
    }));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top App Header Bar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={handleReset}>
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-extrabold text-xl shadow-md">
                L
              </div>
              <div>
                <span className="font-extrabold text-slate-900 text-base block leading-none tracking-tight">
                  Lumina Photos
                </span>
                <span className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">
                  AI Retrieval Recovery MVP
                </span>
              </div>
            </div>
          </div>

          <div className="flex-1 max-w-2xl hidden md:block">
            <SearchHeader
              onSearch={(q) => handlePerformSearch(q)}
              onSelectPresetTask={(task) => handlePerformSearch(task.prompt, task)}
              presetTasks={presetTasks}
              isLoading={isLoading}
              activeQuery={activeQuery}
              onClearSearch={handleReset}
            />
          </div>

          <div className="flex items-center gap-2.5">
            <OfflineBadge isFallbackMode={isFallbackMode} />
            <button
              onClick={handleExportLogs}
              title="Export Anonymous Session JSON Logs"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden lg:inline">Export Session Logs</span>
            </button>
            <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 text-slate-600 flex items-center justify-center text-xs font-bold shadow-xs">
              <User className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Mobile Search Bar Row */}
        <div className="p-3 border-t border-slate-100 md:hidden bg-white">
          <SearchHeader
            onSearch={(q) => handlePerformSearch(q)}
            onSelectPresetTask={(task) => handlePerformSearch(task.prompt, task)}
            presetTasks={presetTasks}
            isLoading={isLoading}
            activeQuery={activeQuery}
            onClearSearch={handleReset}
          />
        </div>
      </header>

      {/* Main Layout Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        {/* Left Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            if (tab === 'photos') setActiveQuery('');
          }}
          selectedCategory={selectedCategoryFilter}
          onCategorySelect={(cat) => setSelectedCategoryFilter(cat)}
          className={`fixed md:sticky top-16 h-[calc(100vh-4rem)] z-20 transition-transform ${
            isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
          }`}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-8 space-y-8 min-w-0">
          {/* SUCCESS VIEW */}
          {confirmedCandidate ? (
            <SuccessView
              confirmedCandidate={confirmedCandidate}
              onResetTask={handleReset}
              recoveryStepCount={recoveryStepCount}
            />
          ) : (
            <>
              {/* STATE: What I Understood (Clue Chips & Conversational Memory) */}
              {currentClues && (
                <div className="max-w-4xl mx-auto">
                  <ClueChips clues={currentClues} recoveryStepCount={recoveryStepCount} />
                </div>
              )}

              {/* ACTIVE SEARCH RESULTS OR RECOVERY LOOP */}
              {searchResult ? (
                <div className="space-y-6 max-w-6xl mx-auto">
                  {/* Weak-Result Recovery Assistant */}
                  {searchResult.weak_result_eval.is_weak_result && (
                    <RecoveryAssistant
                      weakEval={searchResult.weak_result_eval}
                      suggestions={suggestions}
                      onApplyRefinement={handleApplyRefinement}
                      isLoading={isLoading}
                    />
                  )}

                  {/* Candidate Results Photo Grid */}
                  <PhotoGrid
                    candidates={searchResult.candidates}
                    onSelectCandidate={(cand) => setSelectedCandidate(cand)}
                    title={recoveryStepCount > 0 ? 'Refined candidates' : 'Possible matches'}
                  />
                </div>
              ) : (
                /* DEFAULT VIEW: Representative Photo Library Grid */
                <div className="space-y-6 max-w-6xl mx-auto">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                        <span>Your Photo Library</span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-200 text-slate-700">
                          {defaultPhotosScored.length} items
                        </span>
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {selectedCategoryFilter ? `Filtered by ${selectedCategoryFilter}` : 'Controlled representative photo dataset'}
                      </p>
                    </div>
                  </div>

                  <PhotoGrid
                    candidates={defaultPhotosScored}
                    onSelectCandidate={(cand) => setSelectedCandidate(cand)}
                    title="All Photos"
                  />
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Candidate Modal View */}
      <CandidateModal
        candidate={selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
        onConfirmSuccess={handleConfirmSuccess}
        onRejectCandidate={handleRejectCandidate}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500">
          Independent Google Photos-inspired AI retrieval recovery research prototype. Not connected to official Google services.
        </div>
      </footer>
    </div>
  );
}
