import React from 'react';

interface GroupyLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export const GroupyLogo: React.FC<GroupyLogoProps> = ({
  className = 'w-10 h-10',
  size = 40,
  showText = false,
}) => {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <img
        src="/favicon.png"
        alt="Groupy Logo"
        width={size}
        height={size}
        className="shrink-0 object-contain rounded-xl transition-transform hover:scale-105"
        style={{ width: `${size}px`, height: `${size}px` }}
      />

      {showText && (
        <div>
          <h1 className="font-extrabold text-lg text-slate-900 dark:text-white tracking-tight leading-none">
            Groupy
          </h1>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            Pitch Allocations
          </p>
        </div>
      )}
    </div>
  );
};
