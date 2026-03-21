import React from 'react';

const GlassCard = React.forwardRef(({ children, className = '', darkMode, hover = false, onClick }, ref) => {
  const baseClasses = darkMode
    ? 'glass-card-dark text-white'
    : 'glass-card';

  const hoverClasses = hover
    ? 'hover:scale-[1.01] hover:shadow-2xl cursor-pointer'
    : '';

  return (
    <div
      ref={ref}
      className={`rounded-2xl shadow-xl p-4 sm:p-6 transition-all duration-300 ${baseClasses} ${hoverClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
});

GlassCard.displayName = 'GlassCard';

export default GlassCard;
