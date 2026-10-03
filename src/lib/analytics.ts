import { TelemetryEvent, TelemetryEventType } from './types';

const STORAGE_KEY = 'gphotos_retrieval_events';

/**
 * Get session ID or create a new anonymous session ID.
 */
export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return 'server_session';
  let sid = localStorage.getItem('gphotos_session_id');
  if (!sid) {
    sid = `sess_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
    localStorage.setItem('gphotos_session_id', sid);
  }
  return sid;
}

/**
 * Log an anonymous telemetry event to local storage.
 */
export function logTelemetryEvent(
  eventType: TelemetryEventType,
  payload: Record<string, unknown> = {},
  taskId?: string | null,
  stepCount: number = 0
): TelemetryEvent {
  const event: TelemetryEvent = {
    event_id: `evt_${Math.random().toString(36).substring(2, 9)}`,
    session_id: getOrCreateSessionId(),
    task_id: taskId || null,
    event_type: eventType,
    timestamp: Date.now(),
    elapsed_seconds: 0,
    recovery_step_count: stepCount,
    payload,
  };

  if (typeof window !== 'undefined') {
    try {
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      existing.push(event);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    } catch (e) {
      console.warn('Failed to log telemetry event:', e);
    }
  }

  return event;
}

/**
 * Export all logged session events as a JSON string for user testing logs export.
 */
export function exportSessionEventsAsJson(): string {
  if (typeof window === 'undefined') return '[]';
  return localStorage.getItem(STORAGE_KEY) || '[]';
}
