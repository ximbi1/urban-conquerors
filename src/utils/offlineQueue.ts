import { Coordinate } from '@/types/territory';

const STORAGE_KEY = 'offline-run-queue';
const QUEUE_EVENT = 'offline-run-queue-changed';

export type OfflineRunSource = 'live' | 'manual' | 'import';

export interface OfflineRunPayload {
  path: Coordinate[];
  duration: number;
  source: OfflineRunSource;
  userId: string;
}

export interface OfflineRunMetadata {
  createdAt: string;
  distance: number;
  area: number;
  avgPace: number;
}

export interface OfflineRunEntry {
  id: string;
  payload: OfflineRunPayload;
  metadata: OfflineRunMetadata;
}

const safeParse = (): OfflineRunEntry[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed as OfflineRunEntry[];
    }
    return [];
  } catch (error) {
    console.error('Error reading offline run queue', error);
    return [];
  }
};

const persist = (queue: OfflineRunEntry[]) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  window.dispatchEvent(new CustomEvent(QUEUE_EVENT));
};

export const getOfflineRuns = (): OfflineRunEntry[] => safeParse();

export const enqueueOfflineRun = (
  payload: OfflineRunPayload,
  metadata: OfflineRunMetadata
): OfflineRunEntry => {
  const queue = safeParse();
  const entry: OfflineRunEntry = {
    id: `offline-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    payload,
    metadata,
  };
  queue.push(entry);
  persist(queue);
  return entry;
};

export const removeOfflineRun = (id: string) => {
  const queue = safeParse().filter((entry) => entry.id !== id);
  persist(queue);
};

export const clearOfflineRuns = () => {
  persist([]);
};

export const subscribeOfflineQueue = (handler: () => void) => {
  if (typeof window === 'undefined') return () => {};
  const listener = () => handler();
  window.addEventListener(QUEUE_EVENT, listener);
  return () => window.removeEventListener(QUEUE_EVENT, listener);
};
