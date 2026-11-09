/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export interface AppLogoProps {
  variant?: 'light' | 'dark' | 'original' | 'squircle';
  className?: string;
  size?: number | string;
  alt?: string;
  showText?: boolean;
  subtitle?: string;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  variant = 'dark',
  className = 'w-7 h-7',
  alt = 'Crowdsourced Accessibility Map Logo',
  showText = false,
  subtitle,
}) => {
  // If variant is squircle, wrap white logo in dark slate squircle
  if (variant === 'squircle') {
    return (
      <div className="flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-2xl bg-slate-950 text-white flex items-center justify-center p-2 shadow-sm border border-slate-800 shrink-0">
          <img
            src="/logo-white.png"
            alt={alt}
            className={`${className} object-contain`}
          />
        </div>
        {showText && (
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 truncate">
                AccessMap
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-100 text-sky-800">
                CDO
              </span>
            </div>
            {subtitle && (
              <p className="text-xs text-slate-500 truncate">{subtitle}</p>
            )}
          </div>
        )}
      </div>
    );
  }

  const logoSrc =
    variant === 'light'
      ? '/logo-white.png'
      : variant === 'original'
      ? '/logo.jpg'
      : '/logo-dark.png';

  const imgElement = (
    <img
      src={logoSrc}
      alt={alt}
      className={`${className} object-contain`}
      loading="eager"
    />
  );

  if (!showText) {
    return imgElement;
  }

  return (
    <div className="flex items-center gap-2.5 min-w-0">
      {imgElement}
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 truncate">
            AccessMap
          </span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-100 text-sky-800">
            CDO
          </span>
        </div>
        {subtitle && (
          <p className="text-xs text-slate-500 truncate">{subtitle}</p>
        )}
      </div>
    </div>
  );
};

