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
      container: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-semibold',
      defaultIcon: <CheckCircle2 className="w-3 h-3 text-emerald-600" />,
    },
    'ai-suggested': {
      container: 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-semibold',
      defaultIcon: <Sparkles className="w-3 h-3 text-indigo-600" />,
    },
    barrier: {
      container: 'bg-rose-50 text-rose-700 border border-rose-200/80 font-semibold',
      defaultIcon: <AlertTriangle className="w-3 h-3 text-rose-600" />,
    },
    category: {
      container: 'bg-slate-100/80 text-slate-600 font-medium border border-slate-200/60',
    },
    neutral: {
      container: 'bg-slate-50 text-slate-600 font-medium border border-slate-200/80',
    },
    success: {
      container: 'bg-teal-50 text-teal-800 border border-teal-200/80 font-semibold',
      defaultIcon: <ShieldCheck className="w-3 h-3 text-teal-600" />,
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

