import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { countryFlags } from '../../constants/countries';

const ComboBox = ({ value, onChange, options, placeholder, type = 'text', darkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || '');
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
  };

  const handleOptionSelect = (option) => {
    setInputValue(option);
    onChange(option);
    setIsOpen(false);
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(option.length, option.length);
      }
    }, 0);
  };

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(inputValue.toLowerCase())
  );

  const formatCountryDisplay = (countryCode) => {
    if (type === 'country') {
      const country = countryFlags[countryCode];
      return country ? `${country.flag} ${countryCode} - ${country.name}` : countryCode;
    }
    return countryCode;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={`w-full px-4 py-2 border rounded-lg pr-10 ${
            darkMode
              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
          } focus:ring-2 focus:ring-amber-500 focus:border-transparent`}
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`absolute right-2 top-1/2 transform -translate-y-1/2 ${
            darkMode ? 'text-gray-400' : 'text-gray-500'
          }`}
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isOpen && (
        <div className={`absolute z-10 w-full mt-1 ${
          darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
        } border rounded-lg shadow-lg max-h-48 overflow-y-auto animate-dropdown`}>
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleOptionSelect(option)}
                className={`w-full px-4 py-2 text-left flex items-center justify-between transition-colors ${
                  darkMode ? 'text-white hover:bg-gray-600' : 'text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span className="truncate">
                  {type === 'country' ? formatCountryDisplay(option) : option}
                </span>
                {inputValue === option && (
                  <Check className="w-4 h-4 text-amber-500 flex-shrink-0 ml-2" />
                )}
              </button>
            ))
          ) : (
            <div className={`px-4 py-2 text-sm ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              No matches found. Type to add custom entry.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ComboBox;
