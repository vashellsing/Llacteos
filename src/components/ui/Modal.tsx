import React, { useEffect } from 'react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  icon?: string;
  maxWidth?: 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
  headerActions?: React.ReactNode;
  tabs?: React.ReactNode;
  footer?: React.ReactNode;
  bodyClassName?: string;
  children: React.ReactNode;
}

const MAX_WIDTH_CLASSES = {
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  icon = 'assignment',
  maxWidth = '2xl',
  headerActions,
  tabs,
  footer,
  bodyClassName = 'p-5 sm:p-6',
  children,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div
        className={`w-full ${MAX_WIDTH_CLASSES[maxWidth]} max-h-[92vh] bg-[#fcfaf7] border border-[#e6decb] rounded-3xl shadow-2xl flex flex-col overflow-hidden`}
      >
        <header className="px-5 sm:px-6 py-4 bg-white border-b border-[#e6decb] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-[#004ac6]/10 border border-[#004ac6]/20 text-[#004ac6] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[24px]">
                {icon}
              </span>
            </div>
            <div className="min-w-0">
              {badge && <div className="mb-0.5">{badge}</div>}
              <h2 className="text-base sm:text-lg font-extrabold text-[#191c1e] tracking-tight truncate">
                {title}
              </h2>
              {subtitle && (
                <div className="text-xs text-[#5f6374] truncate mt-0.5">
                  {subtitle}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {headerActions}
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar ventana"
              className="w-9 h-9 rounded-xl bg-[#f4efe6] hover:bg-[#e6decb] text-[#434655] flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">
                close
              </span>
            </button>
          </div>
        </header>

        {tabs && (
          <div className="bg-white border-b border-[#e6decb] shrink-0">
            {tabs}
          </div>
        )}

        <div className={`${bodyClassName} overflow-y-auto flex-1`}>
          {children}
        </div>

        {footer && (
          <footer className="px-5 sm:px-6 py-3.5 bg-white border-t border-[#e6decb] flex flex-wrap items-center justify-end gap-2.5 shrink-0">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
};
