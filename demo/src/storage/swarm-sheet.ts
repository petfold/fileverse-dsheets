import { useCallback, useEffect, useRef, useState } from 'react';
import { SwarmDocumentStorage } from '../../../src/swarm/swarm-document-storage';

/**
 * Sheet persistence over a `SwarmDocumentStorage`: restore-with-retry on
 * open, debounced save on change.
 *
 * The saved payload is the editor's base64-encoded Y.Doc state — the same
 * string `onChange` hands the host — so restoring is a CRDT merge
 * (`editorStateRef.mergeContent`), never an overwrite: whatever IndexedDB
 * already has locally and whatever Swarm has converge to the same sheet.
 *
 * Saves are held, not failed, while Swarm cannot be written (node down,
 * no postage, offline): the newest snapshot waits in `pendingRef` and goes
 * out on the next change of write capability. Local persistence continues
 * regardless, so nothing is lost meanwhile.
 */

// A node that has just started answers requests before it can serve
// anything — and a Swarm-aware browser typically opens the page in exactly
// that window. Field-measured (Freedom, 2026-08-18): its embedded ant node
// refused a SOC lookup ~10s after start and served the same chunk fine
// once warm — the warm-up is tens of seconds, so the budget must span
// minutes, not seconds.
export const MAX_RESTORE_ATTEMPTS = 8;
const restoreRetryDelayMs = (attempt: number) =>
  [2_000, 4_000, 8_000, 12_000, 16_000, 24_000, 30_000][attempt - 1] ??
  30_000;
const SAVE_DEBOUNCE_MS = 2_000;

export type SwarmRestoreState =
  | { phase: 'idle' }
  | { phase: 'loading'; attempt: number }
  | { phase: 'done'; snapshot: string | null }
  | { phase: 'failed'; error: string };

export type SwarmSaveState = 'idle' | 'saving' | 'saved' | 'held' | 'error';

const READ_ONLY_MARKER = 'belongs to another identity';

export const useSwarmSheet = ({
  documentId,
  docStorage,
  canWrite,
  expectContent = false,
  onReadOnlySave,
}: {
  documentId: string;
  docStorage: SwarmDocumentStorage | null;
  canWrite: boolean;
  /**
   * True for a sheet that arrived by link: it exists on Swarm by
   * definition, so a "feed not found" is a retrieval failure to retry and
   * explain — NOT an empty new sheet. Rendering a blank grid for it reads
   * as data loss (Freedom field test, 2026-08-18: a cold ultra-light node
   * answered not-found for chunks the network provably held).
   */
  expectContent?: boolean;
  /** A save was refused because another identity owns the feed. */
  onReadOnlySave: () => void;
}) => {
  const [restore, setRestore] = useState<SwarmRestoreState>({ phase: 'idle' });
  const [saveState, setSaveState] = useState<SwarmSaveState>('idle');
  const [lastError, setLastError] = useState<string | null>(null);
  // Retry/skip controls bump this to re-run the restore effect.
  const [restoreRun, setRestoreRun] = useState(0);
  const skippedRef = useRef(false);

  const retryRestore = useCallback(() => {
    skippedRef.current = false;
    setRestoreRun((n) => n + 1);
  }, []);
  const skipRestore = useCallback(() => {
    skippedRef.current = true;
    setRestore({ phase: 'done', snapshot: null });
  }, []);

  useEffect(() => {
    if (!docStorage || skippedRef.current) return;
    let cancelled = false;
    (async () => {
      for (let attempt = 1; attempt <= MAX_RESTORE_ATTEMPTS; attempt++) {
        if (cancelled) return;
        setRestore({ phase: 'loading', attempt });
        try {
          console.warn(
            `[swarm] restore attempt ${attempt}/${MAX_RESTORE_ATTEMPTS}`,
            { documentId, expectContent, transport: docStorage.transport.kind },
          );
          const snapshot = await docStorage.loadDocument(documentId);
          if (cancelled) return;
          console.warn('[swarm] restore result', {
            found: Boolean(snapshot),
            feedIndex: snapshot?.feedIndex,
            bytes: snapshot?.bytes.length,
          });
          if (!snapshot && expectContent) {
            throw new Error(
              'This sheet exists on Swarm (its keys came with the link), ' +
                'but its feed could not be found from here yet. A node ' +
                'that has just started may need a minute to reach the ' +
                'chunks — retrying usually fixes it.',
            );
          }
          setRestore({ phase: 'done', snapshot: snapshot?.text ?? null });
          setLastError(null);
          return;
        } catch (error) {
          if (cancelled) return;
          const message = (error as Error).message;
          if (attempt === MAX_RESTORE_ATTEMPTS) {
            setRestore({ phase: 'failed', error: message });
            setLastError(message);
            return;
          }
          await new Promise((r) => setTimeout(r, restoreRetryDelayMs(attempt)));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [docStorage, documentId, restoreRun]);

  // Latest unsent snapshot; survives debounce, node downtime and re-renders.
  const pendingRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingRef = useRef(false);

  const flush = useCallback(async () => {
    if (!docStorage || !canWrite || savingRef.current) return;
    const snapshot = pendingRef.current;
    if (snapshot === null) return;
    pendingRef.current = null;
    savingRef.current = true;
    setSaveState('saving');
    try {
      await docStorage.saveDocument(documentId, snapshot);
      setSaveState('saved');
      setLastError(null);
    } catch (error) {
      const message = (error as Error).message;
      // Keep the newest snapshot: an edit made during the failed save wins.
      pendingRef.current ??= snapshot;
      if (message.includes(READ_ONLY_MARKER)) {
        onReadOnlySave();
        setSaveState('held');
      } else {
        setLastError(message);
        setSaveState('error');
      }
    } finally {
      savingRef.current = false;
      // A change that arrived while the request was in flight goes next.
      if (pendingRef.current !== null && canWrite) {
        timerRef.current = setTimeout(flush, SAVE_DEBOUNCE_MS);
      }
    }
  }, [docStorage, documentId, canWrite, onReadOnlySave]);

  const queueSave = useCallback(
    (encodedState: string) => {
      pendingRef.current = encodedState;
      if (!docStorage) return;
      if (!canWrite) {
        setSaveState('held');
        return;
      }
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(flush, SAVE_DEBOUNCE_MS);
    },
    [docStorage, canWrite, flush],
  );

  // Held edits go out as soon as writing becomes possible again.
  useEffect(() => {
    if (canWrite && pendingRef.current !== null) flush();
  }, [canWrite, flush]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  return { restore, retryRestore, skipRestore, queueSave, saveState, lastError };
};
