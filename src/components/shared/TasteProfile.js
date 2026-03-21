import React, { useState } from 'react';
import { tasteAttributes } from '../../constants/tasteAttributes';

const TasteProfile = ({ value, onChange, darkMode }) => {
  const parseExistingTastes = (tasteNotes) => {
    const profile = {};
    if (!tasteNotes) return profile;

    const matches = tasteNotes.match(/(\w+):\s*(\d+)/gi);
    if (matches) {
      matches.forEach(match => {
        const [, taste, rating] = match.match(/(\w+):\s*(\d+)/i);
        const normalizedTaste = taste.toLowerCase();
        const attribute = tasteAttributes.find(attr =>
          attr.id === normalizedTaste || attr.name.toLowerCase() === normalizedTaste
        );
        if (attribute) {
          profile[attribute.id] = parseInt(rating, 10);
        }
      });
    }
    return profile;
  };

  const [tasteProfile, setTasteProfile] = useState(() => parseExistingTastes(value));

  const profileToText = (profile) => {
    const entries = Object.entries(profile)
      .filter(([, rating]) => rating > 0)
      .map(([taste, rating]) => {
        const attribute = tasteAttributes.find(attr => attr.id === taste);
        return `${attribute?.name || taste}: ${rating}`;
      });
    return entries.join(', ');
  };

  const updateTasteRating = (tasteId, rating) => {
    const newProfile = { ...tasteProfile, [tasteId]: rating };
    setTasteProfile(newProfile);
    onChange(profileToText(newProfile));
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {tasteAttributes.map(attribute => (
          <div key={attribute.id} className={`p-3 rounded-lg border ${
            darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium flex items-center space-x-1">
                <span>{attribute.icon}</span>
                <span>{attribute.name}</span>
              </span>
              <span className={`text-xs px-2 py-1 rounded ${
                tasteProfile[attribute.id] > 0
                  ? darkMode ? 'bg-amber-900/50 text-amber-300' : 'bg-amber-100 text-amber-800'
                  : darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'
              }`}>
                {tasteProfile[attribute.id] || 0}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="5"
              value={tasteProfile[attribute.id] || 0}
              onChange={(e) => updateTasteRating(attribute.id, parseInt(e.target.value))}
              className={`w-full h-2 rounded-lg appearance-none cursor-pointer accent-amber-600 ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`}
            />
            <div className={`flex justify-between text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <span>0</span>
              <span>5</span>
            </div>
          </div>
        ))}
      </div>
      <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
        <label className={`block text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
          Generated Taste Notes:
        </label>
        <div className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
          {profileToText(tasteProfile) || 'Select taste attributes above'}
        </div>
      </div>
    </div>
  );
};

export default TasteProfile;
