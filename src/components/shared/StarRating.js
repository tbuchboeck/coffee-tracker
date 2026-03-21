import React from 'react';
import { Star } from 'lucide-react';

const StarRating = ({ rating, onRatingChange, readOnly = false, size = 'normal', darkMode }) => {
  const sizeClass = size === 'small' ? 'w-4 h-4' : 'w-5 h-5';
  return (
    <div className="flex space-x-1 flex-nowrap">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClass} cursor-pointer transition-colors ${
            star <= rating
              ? 'text-yellow-400 fill-yellow-400'
              : darkMode ? 'text-gray-600 hover:text-yellow-300' : 'text-gray-300 hover:text-yellow-300'
          } ${readOnly ? 'cursor-default' : ''}`}
          onClick={() => !readOnly && onRatingChange && onRatingChange(star)}
        />
      ))}
    </div>
  );
};

export default StarRating;
