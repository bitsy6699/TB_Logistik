import { useEffect } from 'react';

export default function Modal({ isOpen, onClose, title, description, children }) {
  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-[32px] border border-slate-100 bg-white p-6 shadow-2xl transition-all duration-300 scale-100 md:p-8">
        
        {/* Header */}
        <div className="mb-6 pr-8">
          {title && (
            <h3 className="text-xl font-bold text-slate-900 leading-none">
              {title}
            </h3>
          )}
          {description && (
            <p className="mt-2 text-sm text-slate-500">
              {description}
            </p>
          )}
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-6 top-6 flex h-8 w-8 items-center justify-center rounded-full border border-slate-100 bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
          aria-label="Tutup"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Content */}
        <div className="max-h-[70vh] overflow-y-auto pr-1 -mr-1">
          {children}
        </div>
      </div>
    </div>
  );
}
