import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Settings, Coffee } from 'lucide-react';

const EquipmentSelector = ({ equipment, activeEquipment, onSwitch, onManage, darkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (equipment.length === 0) {
    return (
      <button
        onClick={onManage}
        className={`flex items-center space-x-2 px-3 py-2 rounded-xl border-2 border-dashed transition-all ${
          darkMode
            ? 'border-gray-600 hover:border-amber-500 text-gray-400 hover:text-amber-400'
            : 'border-gray-300 hover:border-amber-500 text-gray-500 hover:text-amber-600'
        }`}
      >
        <Settings className="w-4 h-4" />
        <span className="text-sm font-medium">Setup Equipment</span>
      </button>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-3 py-2 rounded-xl transition-all ${
          darkMode
            ? 'bg-gray-700/80 hover:bg-gray-600 border border-gray-600'
            : 'bg-white/80 hover:bg-white border border-gray-200 shadow-sm'
        }`}
      >
        <Coffee className="w-4 h-4 text-amber-500" />
        <div className="text-left">
          <div className="text-sm font-semibold leading-tight">
            {activeEquipment?.name || 'No Profile'}
          </div>
          {activeEquipment && (
            <div className={`text-xs leading-tight ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {[activeEquipment.grinder, activeEquipment.machine].filter(Boolean).join(' + ') || 'No details'}
            </div>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''} ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
      </button>

      {isOpen && (
        <div className={`absolute top-full mt-1 left-0 right-0 min-w-[240px] z-50 rounded-xl shadow-xl border overflow-hidden animate-dropdown ${
          darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
        }`}>
          {equipment.map(profile => (
            <button
              key={profile.id}
              onClick={() => {
                onSwitch(profile.id);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-3 text-left transition-colors flex items-center justify-between ${
                profile.isActive
                  ? darkMode ? 'bg-amber-900/30 text-amber-300' : 'bg-amber-50 text-amber-700'
                  : darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <div>
                <div className="font-medium text-sm">{profile.name}</div>
                <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {[profile.grinder, profile.machine].filter(Boolean).join(' + ') || 'No details'}
                </div>
              </div>
              {profile.isActive && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500 text-white font-medium">Active</span>
              )}
            </button>
          ))}
          <div className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <button
              onClick={() => {
                setIsOpen(false);
                onManage();
              }}
              className={`w-full px-4 py-2.5 text-left text-sm font-medium flex items-center space-x-2 transition-colors ${
                darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-50 text-gray-500'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Manage Equipment</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquipmentSelector;
