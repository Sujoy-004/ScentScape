'use client';

import { useEffect } from 'react';

export default function StringTuneManager() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.StringTuneContext && typeof window.StringTuneContext.stop === 'function') {
      try {
        window.StringTuneContext.stop();
      } catch (err) {
        console.warn('[StringTune] Stop error:', err);
      }
    }

    document.body.classList.remove('is-scrolling');
  }, []);

  return null;
}
