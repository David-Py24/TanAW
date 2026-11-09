/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CheckCircle2, Sparkles, AlertTriangle, ShieldCheck } from 'lucide-react';

export type BadgeVariant =
  | 'verified'
  | 'ai-suggested'
  | 'barrier'
  | 'category'
  | 'neutral'
  | 'success';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  icon?: React.ReactNode;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  children,
  icon,
  size = 'sm',
  className = '',
}) => {
  const sizeClasses = {
    xs: 'px-2 py-0.5 text-[10px]',
    sm: 'px-2.5 py-0.5 text-[11px]',
    md: 'px-3 py-1 text-xs',
  }[size];

  const variantStyles: Record<BadgeVariant, { container: string; defaultIcon?: React.ReactNode }> = {
    verified: {
      container: 'bg-[#bef264] text-slate-950 font-black tracking-wide uppercase shadow-2xs',
      defaultIcon: <CheckCircle2 className="w-3 h-3 text-slate-950" />,
    },
    'ai-suggested': {
      container: 'bg-purple-100 text-purple-900 border border-purple-200 font-bold uppercase',
      defaultIcon: <Sparkles className="w-3 h-3 text-purple-600" />,
    },
    barrier: {
      container: 'bg-rose-100 text-rose-800 border border-rose-200 font-bold uppercase',
      defaultIcon: <AlertTriangle className="w-3 h-3 text-rose-700" />,
    },
    category: {
      container: 'bg-slate-100 text-slate-600 font-bold tracking-wider uppercase',
    },
    neutral: {
      container: 'bg-slate-100 text-slate-700 font-medium border border-slate-200',
    },
    success: {
      container: 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold',
      defaultIcon: <ShieldCheck className="w-3 h-3 text-emerald-600" />,
    },
  };

  const currentVariant = variantStyles[variant];
  const renderedIcon = icon ?? currentVariant.defaultIcon;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full ${sizeClasses} ${currentVariant.container} ${className}`}
    >
      {renderedIcon}
      <span>{children}</span>
    </span>
  );
};

