import React, { useState, useRef, useEffect } from 'react';
import { Coffee, Lock, AlertCircle } from 'lucide-react';
import { pinService } from '../services/pinService';

const PIN_LENGTH = 4;

const PinScreen = ({ onUnlock }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (currentPin) => {
    const pinToCheck = currentPin || pin;
    if (pinToCheck.length < PIN_LENGTH) return;

    setError('');
    setLoading(true);

    try {
      const result = await pinService.verifyPin(pinToCheck);
      if (result.success) {
        onUnlock();
      } else {
        setError(result.error);
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setPin('');
        inputRef.current?.focus();
      }
    } catch {
      setError('Verbindungsfehler');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, PIN_LENGTH);
    setPin(value);
    setError('');

    // Auto-submit when full PIN entered
    if (value.length === PIN_LENGTH) {
      handleSubmit(value);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-amber-600 p-4 rounded-full">
              <Coffee className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Coffee Tracker</h1>
          <p className="text-gray-500 flex items-center justify-center gap-2">
            <Lock className="w-4 h-4" />
            PIN eingeben
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <AlertCircle className="w-4 h-4 text-red-500 mr-2 flex-shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* PIN Dots Display */}
        <div className={`flex justify-center gap-4 mb-6 ${shake ? 'animate-shake' : ''}`}>
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all duration-200 ${
                i < pin.length
                  ? 'bg-amber-600 scale-110'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Hidden Input */}
        <input
          ref={inputRef}
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          value={pin}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={loading}
          className="sr-only"
          autoComplete="off"
          aria-label="PIN eingeben"
        />

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del'].map((key, i) => {
            if (key === null) return <div key={i} />;

            if (key === 'del') {
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => { setPin(p => p.slice(0, -1)); setError(''); inputRef.current?.focus(); }}
                  disabled={loading || pin.length === 0}
                  className="h-14 rounded-xl text-gray-500 hover:bg-gray-100 active:bg-gray-200 transition-colors text-sm font-medium disabled:opacity-30"
                >
                  &larr;
                </button>
              );
            }

            return (
              <button
                key={i}
                type="button"
                onClick={() => {
                  if (pin.length < PIN_LENGTH) {
                    const newPin = pin + key;
                    setPin(newPin);
                    setError('');
                    if (newPin.length === PIN_LENGTH) {
                      handleSubmit(newPin);
                    }
                  }
                  inputRef.current?.focus();
                }}
                disabled={loading || pin.length >= PIN_LENGTH}
                className="h-14 rounded-xl bg-gray-50 hover:bg-gray-100 active:bg-gray-200 transition-colors text-xl font-semibold text-gray-800 disabled:opacity-30"
              >
                {key}
              </button>
            );
          })}
        </div>

        {/* Loading indicator */}
        {loading && (
          <div className="mt-4 text-center">
            <div className="inline-block w-5 h-5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Shake animation style */}
        <style>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20%, 60% { transform: translateX(-8px); }
            40%, 80% { transform: translateX(8px); }
          }
          .animate-shake {
            animation: shake 0.4s ease-in-out;
          }
        `}</style>
      </div>
    </div>
  );
};

export default PinScreen;
