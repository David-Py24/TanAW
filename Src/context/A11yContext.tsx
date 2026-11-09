/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState } from 'react';

export type TextSize = 'normal' | 'large' | 'extra-large';

interface A11yContextType {
  textSize: TextSize;
  setTextSize: (size: TextSize) => void;
  highContrast: boolean;
  setHighContrast: (enabled: boolean) => void;
  toggleHighContrast: () => void;
  announcement: string;
  announce: (message: string) => void;
}

const A11yContext = createContext<A11yContextType | undefined>(undefined);

export const A11yProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [textSize, setTextSizeState] = useState<TextSize>(() => {
    return (localStorage.getItem('accessmap_text_size') as TextSize) || 'normal';
  });

  const [highContrast, setHighContrastState] = useState<boolean>(() => {
    return localStorage.getItem('accessmap_high_contrast') === 'true';
  });

  const [announcement, setAnnouncement] = useState<string>('');

  const setTextSize = (size: TextSize) => {
    setTextSizeState(size);
    localStorage.setItem('accessmap_text_size', size);
  };

  const setHighContrast = (enabled: boolean) => {
    setHighContrastState(enabled);
    localStorage.setItem('accessmap_high_contrast', String(enabled));
  };

  const toggleHighContrast = () => {
    setHighContrast(!highContrast);
  };

  const announce = (message: string) => {
    setAnnouncement(message);
    // Clear after 4 seconds
    setTimeout(() => {
      setAnnouncement((curr) => (curr === message ? '' : curr));
    }, 4000);
  };

  useEffect(() => {
    // Apply high contrast class to body
    if (highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
  }, [highContrast]);

  useEffect(() => {
    // Apply font size scale to root document
    const root = document.documentElement;
    if (textSize === 'extra-large') {
      root.style.fontSize = '125%';
    } else if (textSize === 'large') {
      root.style.fontSize = '112.5%';
    } else {
      root.style.fontSize = '100%';
    }
  }, [textSize]);

  return (
    <A11yContext.Provider
      value={{
        textSize,
        setTextSize,
        highContrast,
        setHighContrast,
        toggleHighContrast,
        announcement,
        announce,
      }}
    >
      {children}
      {/* Accessible live region for screen readers */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>
    </A11yContext.Provider>
  );
};

export function useA11y(): A11yContextType {
  const ctx = useContext(A11yContext);
  if (!ctx) {
    throw new Error('useA11y must be used within an A11yProvider');
  }
  return ctx;
}
