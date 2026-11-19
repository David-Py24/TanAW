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
      container: 'bg-[#E7F2F0] text-[#21524B] border-[1.5px] border-[#21524B] font-bold tracking-wider uppercase shadow-[0_1px_0_#21524B]',
      defaultIcon: <CheckCircle2 className="w-3 h-3 text-[#21524B]" />,
    },
    'ai-suggested': {
      container: 'bg-[#F3E8FF] text-[#581C87] border-[1.5px] border-[#581C87] font-bold tracking-wider uppercase shadow-[0_1px_0_#581C87]',
      defaultIcon: <Sparkles className="w-3 h-3 text-[#581C87]" />,
    },
    barrier: {
      container: 'bg-[#FEE2E2] text-[#991B1B] border-[1.5px] border-[#991B1B] font-bold tracking-wider uppercase shadow-[0_1px_0_#991B1B]',
      defaultIcon: <AlertTriangle className="w-3 h-3 text-[#991B1B]" />,
    },
    category: {
      container: 'bg-[#EAF3F7] text-[#0F172A] border-[1.5px] border-[#0F172A] font-bold tracking-wider uppercase',
    },
    neutral: {
      container: 'bg-white text-[#0F172A] border-[1.5px] border-[#0F172A] font-bold shadow-[0_1px_0_#0F172A]',
    },
    success: {
      container: 'bg-[#E7F2F0] text-[#21524B] border-[1.5px] border-[#21524B] font-bold shadow-[0_1px_0_#21524B]',
      defaultIcon: <ShieldCheck className="w-3 h-3 text-[#21524B]" />,
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

