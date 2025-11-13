// useAnalyze Hook
// Manages Port communication with Background Worker for analysis

import { useCallback, useRef } from 'react';
import { useAppStore } from '@/stores/app.store';
import type { AnalysisResult } from '@/types/analysis';
import type { AnalyzeReq, AnalyzeProgress, AnalyzeResult } from '@/shared/schema';
import { saveToHistory } from '@/utils/history';

/**
 * Hook for managing analysis requests via Port communication
 * Uses correlation IDs to track request/response pairs
 */
export function useAnalyze() {
  // Use individual selectors for state values only
  const chain = useAppStore(state => state.chain);
  const model = useAppStore(state => state.model);
  const maxPairs = useAppStore(state => state.maxPairs);
  const timeframe = useAppStore(state => state.timeframe);

  // Store port reference for cancellation
  const portRef = useRef<chrome.runtime.Port | null>(null);

  /**
   * Start analysis
   * Opens a Port connection and sends analyze request
   */
  const analyze = useCallback(async () => {
    // Get actions directly from store to avoid dependency issues
    const { setAnalyzing, setProgress, setError } = useAppStore.getState();

    console.log('[useAnalyze] analyze() called - chain:', chain, 'model:', model);

    // Close any existing port first
    if (portRef.current) {
      console.log('[useAnalyze] Closing existing port before starting new analysis');
      portRef.current.disconnect();
      portRef.current = null;
    }

    // Validate inputs
    if (!chain || !model) {
      console.log('[useAnalyze] Validation failed - missing chain or model');
      setError('Please select a chain and model');
      return;
    }

    // Generate correlation ID
    const requestId = crypto.randomUUID();
    console.log('[useAnalyze] Generated request ID:', requestId);

    // Set analyzing state
    console.log('[useAnalyze] Setting analyzing = true');
    setAnalyzing(true);
    setProgress({ step: '', progress: 0 });
    setError('');

    try {
      // Open Port connection
      const port = chrome.runtime.connect({ name: 'analyze' });
      portRef.current = port;

      // Message listener
      port.onMessage.addListener((message: unknown) => {
        // Get actions from store
        const { setProgress, setError, setResults } = useAppStore.getState();

        // Validate message has correlation ID
        const msg = message as { id?: string; type?: string };
        console.log('[useAnalyze] Received message:', msg.type, msg);

        if (msg.id !== requestId) {
          console.warn('[useAnalyze] Received message with mismatched ID:', msg);
          return;
        }

        // Handle progress updates
        if (msg.type === 'progress') {
          const progressMsg = msg as AnalyzeProgress;
          console.log('[useAnalyze] Progress update:', progressMsg.step, progressMsg.progress);
          setProgress({
            step: progressMsg.step,
            progress: progressMsg.progress,
          });
        }

        // Handle result
        else if (msg.type === 'result') {
          const resultMsg = msg as AnalyzeResult;

          // Check for error
          if (resultMsg.error) {
            console.log('[useAnalyze] Error result:', resultMsg.error);
            setError(
              resultMsg.error,
              resultMsg.code,
              resultMsg.suggestions || [],
              resultMsg.retryAfterMs || 0
            );
          }
          // Success
          else if (resultMsg.data) {
            console.log('[useAnalyze] Success result, calling setResults');
            const result = resultMsg.data as AnalysisResult;
            setResults(result);

            // Save to history
            saveToHistory(result, chain, model, timeframe, maxPairs).catch(error => {
              console.error('[useAnalyze] Failed to save to history:', error);
            });
          }

          // Disconnect port
          console.log('[useAnalyze] Disconnecting port');
          port.disconnect();
          portRef.current = null;
        }
      });

      // Disconnect listener (cleanup)
      port.onDisconnect.addListener(() => {
        console.log('[useAnalyze] Port disconnected');
        const { setAnalyzing } = useAppStore.getState();
        setAnalyzing(false);
        portRef.current = null;
      });

      // Send analyze request
      const request: AnalyzeReq = {
        type: 'analyze',
        id: requestId,
        chain,
        model,
        maxPairs,
        timeframe,
      };

      console.log('[useAnalyze] Sending analyze request:', request);
      port.postMessage(request);
    } catch (err) {
      console.error('[useAnalyze] Failed to start analysis:', err);
      const { setError, setAnalyzing } = useAppStore.getState();
      setError('Failed to start analysis. Please try again.');
      setAnalyzing(false);
    }
  }, [chain, model, maxPairs, timeframe]);

  /**
   * Cancel ongoing analysis
   * Disconnects the Port and resets state
   */
  const cancel = useCallback(() => {
    if (portRef.current) {
      console.log('[useAnalyze] Cancelling analysis');
      portRef.current.disconnect();
      portRef.current = null;
      const { setAnalyzing, setError } = useAppStore.getState();
      setAnalyzing(false);
      setError('Analysis cancelled by user', 'E_USER_CANCELLED');
    }
  }, []);

  return { analyze, cancel };
}
