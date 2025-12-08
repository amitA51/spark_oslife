import { useEffect } from 'react';
import type { Screen } from '../../types';

/**
 * useUrlActions Hook
 *
 * Handles URL parameter processing for:
 * - Share targets (Web Share API)
 * - Deep links (add_task, add_spark, go_today, go_feed, import)
 *
 * Automatically cleans up URL after processing to prevent re-triggering on reload
 */
export function useUrlActions(setActiveScreen: (screen: Screen) => void) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');

    if (action) {
      if (action === 'share') {
        const url = params.get('url');
        const text = params.get('text');
        const title = params.get('title');
        sessionStorage.setItem('sharedData', JSON.stringify({ url, text, title }));
        setActiveScreen('add');
      } else if (action === 'add_task') {
        sessionStorage.setItem('preselect_add', 'task');
        setActiveScreen('add');
      } else if (action === 'add_spark') {
        sessionStorage.setItem('preselect_add', 'spark');
        setActiveScreen('add');
      } else if (action === 'go_today') {
        setActiveScreen('today');
      } else if (action === 'go_feed') {
        setActiveScreen('feed');
      } else if (action === 'import') {
        setActiveScreen('settings');
      }

      // Clean up URL to prevent re-triggering on reload
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [setActiveScreen]);
}
