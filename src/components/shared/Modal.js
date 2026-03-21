import React, { useEffect } from 'react';

const Modal = ({ isOpen, onClose, title, icon, children, darkMode, maxWidth = 'max-w-2xl' }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} rounded-2xl shadow-2xl ${maxWidth} w-full max-h-[90vh] overflow-y-auto animate-slide-up`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              {icon}
              <h2 className="text-2xl font-bold">{title}</h2>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
            >
              <span className="text-2xl leading-none">&times;</span>
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
