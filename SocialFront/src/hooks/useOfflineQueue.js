import { useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import db from '../db/indexedDB';

// Stores a failed API mutation in IndexedDB for later replay
export async function queueOfflineMutation(payload) {
  await db.offlineMutations.add({ ...payload, synced: false, timestamp: Date.now() });
}

// Replays all pending offline mutations against the live API
async function flushQueue() {
  const pending = await db.offlineMutations.where('synced').equals(0).toArray();
  if (!pending.length) return;

  let replayed = 0;
  for (const mutation of pending) {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json', ...mutation.headers };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(mutation.url, {
        method: mutation.method,
        headers,
        body: mutation.body || undefined,
      });

      if (res.ok) {
        await db.offlineMutations.update(mutation.id, { synced: true });
        replayed++;
      }
    } catch {
      // Still offline — leave in queue
    }
  }

  if (replayed > 0) {
    toast.success(`${replayed} offline action${replayed > 1 ? 's' : ''} synced`);
    // Clean up synced entries older than 1 hour
    const cutoff = Date.now() - 60 * 60 * 1000;
    await db.offlineMutations.where('synced').equals(1).and(m => m.timestamp < cutoff).delete();
  }
}

export default function useOfflineQueue() {
  // Listen for SW messages
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleMessage = async (event) => {
      if (event.data?.type === 'OFFLINE_QUEUED') {
        await queueOfflineMutation(event.data.payload);
        toast('Request saved — will sync when online', { icon: '📶' });
      }
      if (event.data?.type === 'FLUSH_OFFLINE_QUEUE') {
        await flushQueue();
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
  }, []);

  // Flush when the browser comes back online
  useEffect(() => {
    const handleOnline = () => {
      flushQueue();
      // Tell the SW to trigger background sync
      navigator.serviceWorker?.controller?.postMessage({ type: 'REGISTER_SYNC' });
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  // Flush any leftover mutations on mount (e.g. after a page reload)
  useEffect(() => {
    if (navigator.onLine) flushQueue();
  }, []);

  return { flushQueue };
}
