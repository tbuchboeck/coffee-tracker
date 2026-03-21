import React from 'react';

const SkeletonPulse = ({ className = '', darkMode }) => (
  <div className={`animate-pulse rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} ${className}`} />
);

export const StatsSkeleton = ({ darkMode }) => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    {[1, 2, 3, 4].map(i => (
      <div key={i} className={`${darkMode ? 'bg-gray-700/50' : 'bg-amber-50'} p-4 rounded-lg`}>
        <SkeletonPulse darkMode={darkMode} className="h-8 w-16 mb-2" />
        <SkeletonPulse darkMode={darkMode} className="h-4 w-24" />
      </div>
    ))}
  </div>
);

export const CoffeeCardSkeleton = ({ darkMode }) => (
  <div className={`${darkMode ? 'glass-card-dark' : 'glass-card'} rounded-2xl shadow-xl p-4 md:p-6`}>
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center space-x-3 mb-3">
          <SkeletonPulse darkMode={darkMode} className="h-6 w-48" />
          <SkeletonPulse darkMode={darkMode} className="h-5 w-20 rounded-full" />
        </div>
        <SkeletonPulse darkMode={darkMode} className="h-4 w-64 mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <SkeletonPulse darkMode={darkMode} className="h-4 w-40" />
          <SkeletonPulse darkMode={darkMode} className="h-4 w-32" />
          <SkeletonPulse darkMode={darkMode} className="h-4 w-28" />
        </div>
        <div className="flex items-center space-x-6 mb-4">
          <div>
            <SkeletonPulse darkMode={darkMode} className="h-3 w-12 mb-1" />
            <SkeletonPulse darkMode={darkMode} className="h-5 w-24" />
          </div>
          <div>
            <SkeletonPulse darkMode={darkMode} className="h-3 w-12 mb-1" />
            <SkeletonPulse darkMode={darkMode} className="h-5 w-24" />
          </div>
        </div>
      </div>
      <div className="flex flex-col space-y-2 ml-4">
        <SkeletonPulse darkMode={darkMode} className="h-8 w-8 rounded" />
        <SkeletonPulse darkMode={darkMode} className="h-8 w-8 rounded" />
        <SkeletonPulse darkMode={darkMode} className="h-8 w-8 rounded" />
      </div>
    </div>
  </div>
);

export const CoffeeListSkeleton = ({ darkMode, count = 3 }) => (
  <div className="space-y-8">
    {/* Roaster group skeleton */}
    <div className="space-y-4">
      <div className={`${darkMode ? 'bg-gray-700/50' : 'bg-gradient-to-r from-amber-100/50 to-orange-100/50'} rounded-xl p-4 border-l-4 border-amber-500/30`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <SkeletonPulse darkMode={darkMode} className="h-7 w-48" />
            <SkeletonPulse darkMode={darkMode} className="h-5 w-20 rounded-full" />
          </div>
          <SkeletonPulse darkMode={darkMode} className="h-5 w-32" />
        </div>
      </div>
      <div className="grid gap-6 ml-4">
        {Array.from({ length: count }).map((_, i) => (
          <CoffeeCardSkeleton key={i} darkMode={darkMode} />
        ))}
      </div>
    </div>
  </div>
);

export default SkeletonPulse;
