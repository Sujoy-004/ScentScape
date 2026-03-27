'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export default function StringTuneManager() {
  const pathname = usePathname();
  const initialized = useRef(false);

  useEffect(() => {
    let stopTimer: number | null = null;

    const markScrolling = () => {
      if (typeof document === 'undefined') return;
      document.body.classList.add('is-scrolling');

      if (stopTimer !== null) {
        window.clearTimeout(stopTimer);
      }

      stopTimer = window.setTimeout(() => {
        document.body.classList.remove('is-scrolling');
        stopTimer = null;
      }, 140);
    };

    window.addEventListener('scroll', markScrolling, { passive: true });
    window.addEventListener('wheel', markScrolling, { passive: true });

    return () => {
      window.removeEventListener('scroll', markScrolling);
      window.removeEventListener('wheel', markScrolling);
      if (stopTimer !== null) {
        window.clearTimeout(stopTimer);
      }
      document.body.classList.remove('is-scrolling');
    };
  }, []);

  useEffect(() => {
    const tryUsePlugin = (engine: any, plugin: any, name: string) => {
      if (!plugin) return;
      try {
        engine.use(plugin);
      } catch (err) {
        // Keep runtime resilient if any plugin export is incompatible.
        console.warn(`[StringTune] Plugin skipped: ${name}`, err);
      }
    };

    const init = async () => {
      if (typeof window === 'undefined') return;

      if (!window.StringTune) {
        try {
          const module = await import('@fiddle-digital/string-tune');
          const candidate = (module as any).default ?? module;
          if (candidate && candidate.StringTune) {
            window.StringTune = candidate;
          }
        } catch (err) {
          console.warn('[StringTune] Package load error:', err);
          return;
        }
      }

      if (!window.StringTune) return;

      if (!initialized.current) {
        try {
          const stringTune = window.StringTune.StringTune.getInstance();

          // Core plugins
          tryUsePlugin(stringTune, window.StringTune.StringSplit, 'StringSplit');
          tryUsePlugin(stringTune, window.StringTune.StringMagnetic, 'StringMagnetic');
          tryUsePlugin(stringTune, window.StringTune.StringSpotlight, 'StringSpotlight');
          tryUsePlugin(stringTune, window.StringTune.StringParallax, 'StringParallax');
          tryUsePlugin(stringTune, window.StringTune.StringImpulse, 'StringImpulse');
          tryUsePlugin(stringTune, window.StringTune.StringGlide, 'StringGlide');
          tryUsePlugin(stringTune, window.StringTune.StringProgress, 'StringProgress');
          tryUsePlugin(stringTune, window.StringTune.StringReveal, 'StringReveal');

          // Optional plugins
          tryUsePlugin(stringTune, window.StringTune.StringLazy, 'StringLazy');

          window.StringTuneContext = stringTune;
          initialized.current = true;
        } catch (err) {
          console.warn('[StringTune] Init error:', err);
        }
      }

      if (window.StringTuneContext) {
        // Defer one frame so React can paint before StringTune scans.
        requestAnimationFrame(() => {
          try {
            window.StringTuneContext.start(0);
          } catch (err) {
            console.warn('[StringTune] Start error:', err);
          }
        });
      }
    };

    if (document.readyState === 'complete') {
      void init();
    } else {
      const onLoad = () => {
        void init();
      };
      window.addEventListener('load', onLoad);
      return () => window.removeEventListener('load', onLoad);
    }
  }, [pathname]); // Re-scan DOM on every route change

  return null;
}
