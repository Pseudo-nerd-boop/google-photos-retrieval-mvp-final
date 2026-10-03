'use client';

import React, { useState } from 'react';
import benchmarkTasksData from '../../../data/benchmark_tasks.json';
import { BenchmarkTask } from '../../lib/types';
import { exportSessionEventsAsJson } from '../../lib/analytics';
import { Play, Download, CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function TestTasksPage() {
  const tasks = benchmarkTasksData as BenchmarkTask[];
  const [copied, setCopied] = useState(false);

  const handleExportLogs = () => {
    const jsonStr = exportSessionEventsAsJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gphotos_retrieval_session_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Benchmark Usability Tasks (/test-tasks)
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Select a research scenario to run an end-to-end usability test task.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportLogs}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Session Logs (JSON)</span>
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-800 transition-colors"
            >
              <span>Back to Main Search</span>
            </Link>
          </div>
        </div>

        {/* Benchmark Scenario Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800">
                    {task.id}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">Target: {task.target_photo_id}</span>
                </div>

                <h3 className="font-bold text-base text-slate-900">{task.title}</h3>
                
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 italic text-xs text-slate-700">
                  "{task.prompt}"
                </div>

                <div className="space-y-1 text-xs text-slate-500 pt-1">
                  <div><strong className="text-slate-700">Near-miss Candidates:</strong> {task.known_near_miss_ids.length} photos</div>
                  <div><strong className="text-slate-700">Expected Recovery Dimensions:</strong> {task.expected_recovery_dimensions.join(', ')}</div>
                </div>
              </div>

              <Link
                href={{
                  pathname: '/',
                  query: { task: task.id, prompt: task.prompt }
                }}
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-colors mt-2"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Run Scenario</span>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
