import React from 'react';

declare module 'react' {
  interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    string?: string;
    'string-repeat'?: string;
    'string-split'?: string;
    'string-radius'?: string;
    'string-strength'?: string;
    'string-glide'?: string;
    'string-speed'?: string;
    'string-parallax-speed'?: string;
    'string-impulse'?: string;
  }
}



declare global {
  interface Window {
    StringTune: any;
    StringTuneContext: any;
  }
}
