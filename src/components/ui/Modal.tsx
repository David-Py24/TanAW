/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  headerClassName?: string;
  maxWidthClassName?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  'aria-label'?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  headerClassName = 'bg-slate-50',
  maxWidthClassName = 'max-w-2xl',
  children,
  footer,
  'aria-label': ariaLabel,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel || title}
      className="fixed inset-0 z-[1100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
    >
      <div
        className={`bg-white rounded-[22px] shadow-[0_6px_0_#0F172A] border-[1.8px] border-[#0F172A] w-full ${maxWidthClassName} max-h-[92vh] flex flex-col overflow-hidden animate-scale-up font-space`}
      >
        {/* Header matching .pn-h */}
        <div
          className={`p-4 sm:p-5 border-b-[1.5px] border-[#0F172A] flex items-center justify-between gap-3 shrink-0 ${headerClassName}`}
        >
          <div className="flex items-center gap-3 min-w-0">
            {icon && <div className="shrink-0">{icon}</div>}
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-[#0F172A] tracking-tight truncate">
                {title}
              </h2>
              {subtitle && (
                <p className="text-xs font-medium text-[#475569] truncate">{subtitle}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-neo w-8 h-8 p-0"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4 text-[#0F172A]" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-white">
          {children}
        </div>

        {/* Optional Footer matching .pfoot */}
        {footer && (
          <div className="p-4 border-t-[1.5px] border-[#0F172A] bg-[#EAF3F7] flex items-center justify-end gap-3 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

