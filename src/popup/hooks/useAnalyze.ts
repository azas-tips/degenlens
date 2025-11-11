// useAnalyze Hook
// Manages Port communication with Background Worker for analysis

import { useCallback, useRef } from 'react';
import { useAppStore } from '../stores/app.store';
import type { AnalyzeReq, AnalyzeProgress, AnalyzeResult } from '@/shared/schema';

/**
 * Hook for managing analysis requests via Port communication
 * Uses correlation IDs to track request/response pairs
 */
export function useAnalyze() {
  const { chain, model, maxPairs, setAnalyzing, setProgress, setResults, setError } = useAppStore();

  // Store port reference for cancellation
  const portRef = useRef<chrome.runtime.Port | null>(null);

  /**
   * Start analysis
   * Opens a Port connection and sends analyze request
   */
  const analyze = useCallback(async () => {
    // Validate inputs
    if (!chain || !model) {
      setError('Please select a chain and model');
      return;
    }

    // Generate correlation ID
    const requestId = crypto.randomUUID();

    // Set analyzing state
    setAnalyzing(true);
    setProgress({ step: '', progress: 0 });
    setError('');

    try {
      // Open Port connection
      const port = chrome.runtime.connect({ name: 'analyze' });
      portRef.current = port;

      // Message listener
      port.onMessage.addListener((message: unknown) => {
        // Validate message has correlation ID
        const msg = message as { id?: string; type?: string };
        if (msg.id !== requestId) {
          console.warn('[useAnalyze] Received message with mismatched ID:', msg);
          return;
        }

        // Handle progress updates
        if (msg.type === 'progress') {
          const progressMsg = msg as AnalyzeProgress;
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
            setError(
              resultMsg.error,
              resultMsg.code,
              resultMsg.suggestions || [],
              resultMsg.retryAfterMs || 0
            );
          }
          // Success
          else if (resultMsg.data) {
            setResults(resultMsg.data as any);
          }

          // Disconnect port
          port.disconnect();
          portRef.current = null;
        }
      });

      // Disconnect listener (cleanup)
      port.onDisconnect.addListener(() => {
        console.log('[useAnalyze] Port disconnected');
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
      };

      console.log('[useAnalyze] Sending analyze request:', request);
      port.postMessage(request);
    } catch (err) {
      console.error('[useAnalyze] Failed to start analysis:', err);
      setError('Failed to start analysis. Please try again.');
      setAnalyzing(false);
    }
  }, [chain, model, maxPairs, setAnalyzing, setProgress, setResults, setError]);

  /**
   * Cancel ongoing analysis
   * Disconnects the Port and resets state
   */
  const cancel = useCallback(() => {
    if (portRef.current) {
      console.log('[useAnalyze] Cancelling analysis');
      portRef.current.disconnect();
      portRef.current = null;
      setAnalyzing(false);
      setError('Analysis cancelled by user', 'E_USER_CANCELLED');
    }
  }, [setAnalyzing, setError]);

  return { analyze, cancel };
}
