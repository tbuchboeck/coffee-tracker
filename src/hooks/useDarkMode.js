import { useState, useEffect } from 'react';

const useDarkMode = () => {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('coffeeTrackerDarkMode');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('coffeeTrackerDarkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  return [darkMode, toggleDarkMode, setDarkMode];
};

export default useDarkMode;
