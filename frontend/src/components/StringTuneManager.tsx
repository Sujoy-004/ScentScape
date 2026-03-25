'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export default function StringTuneManager() {
  const pathname = usePathname();
  const initialized = useRef(false);

  useEffect(() => {
    const init = () => {
      if (typeof window !== 'undefined' && window.StringTune && !initialized.current) {
        const stringTune = window.StringTune.StringTune.getInstance();
        stringTune.use(window.StringTune.StringSplit);
        stringTune.use(window.StringTune.StringMagnetic);
        stringTune.use(window.StringTune.StringSpotlight);
        stringTune.use(window.StringTune.StringParallax);
        stringTune.use(window.StringTune.StringImpulse);
        stringTune.use(window.StringTune.StringGlide);
        stringTune.use(window.StringTune.StringProgress);
        
        window.StringTuneContext = stringTune;
        initialized.current = true;
      }
      
      if (window.StringTuneContext) {
        // Delay to allow React to flush DOM updates
        setTimeout(() => {
          window.StringTuneContext.start(0);
        }, 100);
      }
    };

    if (document.readyState === 'complete') {
      init();
    } else {
      window.addEventListener('load', init);
      return () => window.removeEventListener('load', init);
    }
  }, [pathname]); // Re-run on route change

  return null;
}


