import React, { useState, useEffect, useRef } from 'react';
import { Plus, Coffee, Star, Search, Trash2, Edit3, Calendar, Percent, ExternalLink, BarChart3, Moon, Sun, Download, Upload, FileText, RefreshCw, RotateCcw, Copy, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import jsPDF from 'jspdf';

// Default sample data
const defaultCoffees = [
  {
    "id": 17,
    "roaster": "DieRöster - Suchan Bologna",
    "description": "leichte Frucht, Schokolade, ausgeglichen, bittere Schokoladenoten",
    "favorite": true,
    "grinded": false,
    "grindingTime": "",
    "grindingDegree": "8",
    "percentArabica": 90,
    "percentRobusta": 10,
    "cuppingTime": new Date("2023-01-20 10:16:45"),
    "cremaRating": 3,
    "tasteRating": 3,
    "tasteNotes": "light fruity, chocolate, balanced, bitter chocolate notes",
    "url": "https://www.dieroester.at/roester/suchan/bologna",
    "comment": "90/10 Mischung aus Brasilien, Indien, Äthiopien, Nicaragua",
    "origin": "BR,IN,ET,NI",
    "roastLevel": "medium-dark",
    "brewingMethod": "espresso",
    "recommendedMethod": "espresso",
    "price": "43.20",
    "packageSize": 1000,
    "currency": "EUR",
    "preparationNotes": "Pure espresso"
  },
  {
    "id": 11,
    "roaster": "DieRöster - Suchan Palermo",
    "description": "schokoladig nussig holzig",
    "favorite": true,
    "grinded": false,
    "grindingTime": "",
    "grindingDegree": "15",
    "percentArabica": 100,
    "percentRobusta": 0,
    "cuppingTime": new Date("2023-03-15 21:48:47"),
    "cremaRating": 5,
    "tasteRating": 5,
    "tasteNotes": "nutty, woody, chocolate, very low acidity",
    "url": "https://www.dieroester.at/roester/suchan/palermo",
    "comment": "Parade-Espresso für Leute, die viel Aroma und wenig Säure möchten",
    "origin": "IT",
    "roastLevel": "dark",
    "brewingMethod": "espresso",
    "recommendedMethod": "espresso",
    "price": "45.60",
    "packageSize": 1000,
    "currency": "EUR",
    "preparationNotes": "Pure espresso"
  },
  {
    "id": 20,
    "roaster": "Lavazza",
    "description": "Barista intenso",
    "favorite": true,
    "grinded": false,
    "grindingTime": "",
    "grindingDegree": "10",
    "percentArabica": 50,
    "percentRobusta": 50,
    "cuppingTime": new Date("2024-01-10 19:03:35"),
    "cremaRating": 5,
    "tasteRating": 5,
    "tasteNotes": "cocoa, wood, hazelnut, full body, intense aftertaste",
    "url": "https://www.lavazza.com/en/coffee-beans/espresso-barista-intenso",
    "comment": "Intensity 9/10, perfect for espresso and moka",
    "origin": "BR,AS",
    "roastLevel": "dark",
    "brewingMethod": "espresso",
    "recommendedMethod": "espresso",
    "price": "19.99",
    "packageSize": 1000,
    "currency": "EUR",
    "preparationNotes": "Pure espresso"
  },
  {
    "id": 19,
    "roaster": "Lavazza",
    "description": "Espresso Italiano Cremoso",
    "favorite": true,
    "grinded": false,
    "grindingTime": "",
    "grindingDegree": "9",
    "percentArabica": 30,
    "percentRobusta": 70,
    "cuppingTime": new Date("2023-10-15 12:29:58"),
    "cremaRating": 5,
    "tasteRating": 5,
    "tasteNotes": "chocolate, spices, cocoa, long-lasting crema",
    "url": "https://www.lavazza.com/en/coffee/coffee-beans/espresso-cremoso-1-kg.html",
    "comment": "Röstgrad mittel, Intensity 8/10, from Latin America and Southeast Asia",
    "origin": "LA,AS",
    "roastLevel": "medium",
    "brewingMethod": "espresso",
    "recommendedMethod": "espresso",
    "price": "16.49",
    "packageSize": 1000,
    "currency": "EUR",
    "preparationNotes": "Pure espresso"
  },
  {
    "id": 21,
    "roaster": "Lavazza",
    "description": "Gran Cremoso",
    "favorite": true,
    "grinded": false,
    "grindingTime": "",
    "grindingDegree": "19",
    "percentArabica": 70,
    "percentRobusta": 30,
    "cuppingTime": new Date("2024-03-23 07:41:56"),
    "cremaRating": 4,
    "tasteRating": 4,
    "tasteNotes": "chocolate, dried fruits, balanced, well-rounded",
    "url": "https://www.lavazza.com",
    "comment": "South America and Southeast Asia blend",
    "origin": "SA,AS",
    "roastLevel": "medium",
    "brewingMethod": "espresso",
    "recommendedMethod": "espresso",
    "price": "26.99",
    "packageSize": 1000,
    "currency": "EUR",
    "preparationNotes": "Pure espresso"
  },
  {
    "id": 9,
    "roaster": "220 Grad",
    "description": "Guatemala La Labor",
    "favorite": false,
    "grinded": false,
    "grindingTime": "",
    "grindingDegree": "15",
    "percentArabica": 100,
    "percentRobusta": 0,
    "cuppingTime": new Date("2020-07-11 18:02:56"),
    "cremaRating": 4,
    "tasteRating": 4,
    "tasteNotes": "almonds, pecans, dried fruits, milk chocolate, lively acidity",
    "url": "https://www.220grad.com/produkt/guatemala-la-labor-espresso-roestung/",
    "comment": "Red Bourbon variety, Finca La Labor, 1520m altitude",
    "origin": "GT",
    "roastLevel": "medium",
    "brewingMethod": "espresso",
    "recommendedMethod": "v60",
    "price": "38.30",
    "packageSize": 1000,
    "currency": "EUR",
    "preparationNotes": "Pure espresso"
  },
  {
    "id": 7,
    "roaster": "220 Grad",
    "description": "Papua Neuguinea Wagi Valley",
    "favorite": false,
    "grinded": false,
    "grindingTime": "",
    "grindingDegree": "11",
    "percentArabica": 100,
    "percentRobusta": 0,
    "cuppingTime": new Date("2018-12-27 14:20:02"),
    "cremaRating": 4,
    "tasteRating": 4,
    "tasteNotes": "dark chocolate, nuts, creamy body, balanced acidity",
    "url": "https://www.220grad.com/produkt/papua-neuguinea-tairora-espresso-roestung/",
    "comment": "Typica variety, 1800m altitude, washed processing",
    "origin": "PG",
    "roastLevel": "medium",
    "brewingMethod": "espresso",
    "recommendedMethod": "espresso",
    "price": "41.50",
    "packageSize": 1000,
    "currency": "EUR",
    "preparationNotes": "Pure espresso"
  },
  {
    "id": 16,
    "roaster": "220 Grad",
    "description": "Mexiko Mischung",
    "favorite": false,
    "grinded": false,
    "grindingTime": "",
    "grindingDegree": "9",
    "percentArabica": 80,
    "percentRobusta": 20,
    "cuppingTime": new Date("2024-03-28 14:40:31"),
    "cremaRating": 4,
    "tasteRating": 4,
    "tasteNotes": "nutty, caramel, milk chocolate, medium body",
    "url": "https://www.220grad.com",
    "comment": "Mexiko blend with 20% robusta for extra crema",
    "origin": "MX",
    "roastLevel": "medium-dark",
    "brewingMethod": "espresso",
    "recommendedMethod": "espresso",
    "price": "35.90",
    "packageSize": 1000,
    "currency": "EUR",
    "preparationNotes": "Pure espresso"
  },
  {
    "id": 18,
    "roaster": "220 Grad",
    "description": "Honduras San Rafael",
    "favorite": false,
    "grinded": false,
    "grindingTime": "",
    "grindingDegree": "11",
    "percentArabica": 100,
    "percentRobusta": 0,
    "cuppingTime": new Date("2024-04-12 09:15:45"),
    "cremaRating": 4,
    "tasteRating": 5,
    "tasteNotes": "chocolate, brown sugar, peach, honey, clean finish",
    "url": "https://www.220grad.com/produkt/honduras-san-rafael/",
    "comment": "Catuai variety, 1500m altitude, honey processed",
    "origin": "HN",
    "roastLevel": "medium",
    "brewingMethod": "v60",
    "recommendedMethod": "v60",
    "price": "39.90",
    "packageSize": 1000,
    "currency": "EUR",
    "preparationNotes": "V60 pour over, 15g coffee to 250ml water"
  },
  {
    "id": 14,
    "roaster": "Rösterei Fuchs",
    "description": "Kenia AA Plus",
    "favorite": false,
    "grinded": false,
    "grindingTime": "",
    "grindingDegree": "13",
    "percentArabica": 100,
    "percentRobusta": 0,
    "cuppingTime": new Date("2024-02-14 16:22:11"),
    "cremaRating": 3,
    "tasteRating": 5,
    "tasteNotes": "blackcurrant, wine-like, bright acidity, complex",
    "url": "https://www.roesterei-fuchs.de/kenia-aa-plus",
    "comment": "SL28/SL34 varieties, 1700-1800m altitude, fully washed",
    "origin": "KE",
    "roastLevel": "light-medium",
    "brewingMethod": "v60",
    "recommendedMethod": "v60",
    "price": "48.50",
    "packageSize": 1000,
    "currency": "EUR",
    "preparationNotes": "V60 pour over, 16g coffee to 260ml water, 2:30 brew time"
  },
  {
    "id": 15,
    "roaster": "Rösterei Fuchs",
    "description": "Colombia Supremo",
    "favorite": false,
    "grinded": false,
    "grindingTime": "",
    "grindingDegree": "10",
    "percentArabica": 100,
    "percentRobusta": 0,
    "cuppingTime": new Date("2024-05-02 08:45:22"),
    "cremaRating": 4,
    "tasteRating": 4,
    "tasteNotes": "caramel, orange, milk chocolate, smooth",
    "url": "https://www.roesterei-fuchs.de/colombia-supremo",
    "comment": "Castillo variety, 1600m altitude, washed processing",
    "origin": "CO",
    "roastLevel": "medium",
    "brewingMethod": "espresso",
    "recommendedMethod": "espresso",
    "price": "36.90",
    "packageSize": 1000,
    "currency": "EUR",
    "preparationNotes": "18g dose, 27s extraction, 36g yield"
  },
  {
    "id": 6,
    "roaster": "Mövenpick",
    "description": "Der Kräftige",
    "favorite": false,
    "grinded": false,
    "grindingTime": "",
    "grindingDegree": "9",
    "percentArabica": 70,
    "percentRobusta": 30,
    "cuppingTime": new Date("2018-07-26 18:45:14"),
    "cremaRating": 4,
    "tasteRating": 3,
    "tasteNotes": "strong, robust, chocolate, earthy",
    "url": "https://www.moevenpick-cafe.com",
    "comment": "Strong blend, intensity 5/5",
    "origin": "SA,AS,AF",
    "roastLevel": "dark",
    "brewingMethod": "espresso",
    "recommendedMethod": "espresso",
    "price": "24.99",
    "packageSize": 1000,
    "currency": "EUR",
    "preparationNotes": "Pure espresso"
  },
  {
    "id": 12,
    "roaster": "Mövenpick",
    "description": "Espresso",
    "favorite": false,
    "grinded": false,
    "grindingTime": "",
    "grindingDegree": "8",
    "percentArabica": 100,
    "percentRobusta": 0,
    "cuppingTime": new Date("2024-01-28 11:30:45"),
    "cremaRating": 3,
    "tasteRating": 3,
    "tasteNotes": "balanced, mild chocolate, slight fruitiness",
    "url": "https://www.moevenpick-cafe.com/espresso",
    "comment": "100% Arabica espresso blend",
    "origin": "CA,SA",
    "roastLevel": "medium-dark",
    "brewingMethod": "espresso",
    "recommendedMethod": "espresso",
    "price": "27.99",
    "packageSize": 1000,
    "currency": "EUR",
    "preparationNotes": "Pure espresso"
  },
  {
    "id": 13,
    "roaster": "Tchibo",
    "description": "Barista Caffè Crema",
    "favorite": false,
    "grinded": false,
    "grindingTime": "",
    "grindingDegree": "12",
    "percentArabica": 100,
    "percentRobusta": 0,
    "cuppingTime": new Date("2024-04-22 09:15:30"),
    "cremaRating": 3,
    "tasteRating": 3,
    "tasteNotes": "mild, creamy, slight acidity, caramel notes",
    "url": "https://www.tchibo.de/barista-caffe-crema",
    "comment": "Light to medium roast, good for lungo",
    "origin": "BR,CO",
    "roastLevel": "light-medium",
    "brewingMethod": "espresso",
    "recommendedMethod": "espresso",
    "price": "21.99",
    "packageSize": 1000,
    "currency": "EUR",
    "preparationNotes": "Lungo extraction, 20g dose for 110ml"
  },
  {
    "id": 22,
    "roaster": "Tchibo",
    "description": "Barista Espresso",
    "favorite": false,
    "grinded": false,
    "grindingTime": "",
    "grindingDegree": "9",
    "percentArabica": 100,
    "percentRobusta": 0,
    "cuppingTime": new Date("2024-05-18 14:25:15"),
    "cremaRating": 3,
    "tasteRating": 3,
    "tasteNotes": "chocolate, nuts, low acidity, smooth",
    "url": "https://www.tchibo.de/products/280387747392/barista-espresso",
    "comment": "Sehr wenig Säure, 100% Fairtrade, drum roasted",
    "origin": "BR",
    "roastLevel": "medium",
    "brewingMethod": "espresso",
    "recommendedMethod": "espresso",
    "price": "19.99",
    "packageSize": 1000,
    "currency": "EUR",
    "preparationNotes": "Pure espresso"
  },
  {
    "id": 23,
    "roaster": "Tchibo",
    "description": "Barista Espresso Dark",
    "favorite": false,
    "grinded": false,
    "grindingTime": "",
    "grindingDegree": "10",
    "percentArabica": 70,
    "percentRobusta": 30,
    "cuppingTime": new Date("2024-06-22 11:33:01"),
    "cremaRating": 3,
    "tasteRating": 3,
    "tasteNotes": "roasted nuts, velvety dark crema, intense",
    "url": "https://www.tchibo.de",
    "comment": "India and Brazil blend, dark roast",
    "origin": "IN,BR",
    "roastLevel": "dark",
    "brewingMethod": "espresso",
    "recommendedMethod": "espresso",
    "price": "22.99",
    "packageSize": 1000,
    "currency": "EUR",
    "preparationNotes": "Pure espresso"
  },
  {
    "id": 24,
    "roaster": "Tchibo",
    "description": "Cafe Crema Barista",
    "favorite": false,
    "grinded": false,
    "grindingTime": "",
    "grindingDegree": "13",
    "percentArabica": 100,
    "percentRobusta": 0,
    "cuppingTime": new Date("2024-06-22 11:33:37"),
    "cremaRating": 3,
    "tasteRating": 3,
    "tasteNotes": "mild, balanced, fruity notes, light body",
    "url": "https://www.tchibo.de",
    "comment": "Perfect for cafe crema, light roast",
    "origin": "CO,BR",
    "roastLevel": "light",
    "brewingMethod": "espresso",
    "recommendedMethod": "espresso",
    "price": "20.99",
    "packageSize": 1000,
    "currency": "EUR",
    "preparationNotes": "Cafe crema, 8g dose for 120ml"
  }
];

const CoffeeTracker = () => {
  const [coffees, setCoffees] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCoffee, setEditingCoffee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [sortBy, setSortBy] = useState('date');
  const [darkMode, setDarkMode] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [selectedCoffeeForRadar, setSelectedCoffeeForRadar] = useState(null);
  const [collapsedRoasters, setCollapsedRoasters] = useState(() => {
    const saved = localStorage.getItem('collapsedRoasters');
    return saved ? JSON.parse(saved) : {};
  });
  const fileInputRef = useRef(null);
  const formRef = useRef(null);

  // Brewing methods
  const brewingMethods = [
    { id: 'espresso', name: 'Espresso/Portafilter (Siebträger)', icon: '☕' },
    { id: 'v60', name: 'V60 Pour Over', icon: '🔻' },
    { id: 'chemex', name: 'Chemex', icon: '⏳' },
    { id: 'frenchpress', name: 'French Press', icon: '🫖' },
    { id: 'aeropress', name: 'AeroPress', icon: '💉' },
    { id: 'moka', name: 'Moka Pot', icon: '🫗' },
    { id: 'dripper', name: 'Dripper', icon: '☕' },
    { id: 'filter', name: 'Filter Coffee', icon: '📄' }
  ];

  // Common options for dropdowns
  const commonCountries = [
    'BR', 'CO', 'ET', 'GT', 'HN', 'JM', 'KE', 'PE', 'UG', 'VE', 'CR', 'EC', 'MX', 'NI', 'PA', 'RW', 'TZ', 'YE', 'ID', 'IN', 'VN', 'PG', 'HI'
  ];


  const commonPreparationNotes = [
    'Pure espresso',
    '18g dose stretched to 30 seconds - Americano style',
    'Extra fine grind for stronger extraction',
    'Coarser grind for smoother taste', 
    'Used extra sieve (sieb) for more crema',
    'Double shot extraction',
    'Single shot, concentrated',
    'Medium grind, normal extraction',
    'Pre-infusion for 10 seconds',
    'Temperature adjusted to 90°C',
    'Temperature adjusted to 95°C'
  ];

  // Taste attributes for the new rating system
  const tasteAttributes = [
    { id: 'chocolate', name: 'Chocolate', icon: '🍫' },
    { id: 'nutty', name: 'Nutty', icon: '🥜' },
    { id: 'fruity', name: 'Fruity', icon: '🍓' },
    { id: 'floral', name: 'Floral', icon: '🌸' },
    { id: 'citrus', name: 'Citrus', icon: '🍋' },
    { id: 'caramel', name: 'Caramel', icon: '🍯' },
    { id: 'spicy', name: 'Spicy', icon: '🌶️' },
    { id: 'earthy', name: 'Earthy', icon: '🌱' },
    { id: 'roasted', name: 'Roasted', icon: '🔥' },
    { id: 'acidic', name: 'Acidic', icon: '⚡' },
    { id: 'bitter', name: 'Bitter', icon: '☕' },
    { id: 'sweet', name: 'Sweet', icon: '🍭' }
  ];


  // Data version for migration management
  const DATA_VERSION = '2.1';
  
  // Load data from localStorage on mount
  useEffect(() => {
    const loadedData = localStorage.getItem('coffeeTrackerData');
    const loadedVersion = localStorage.getItem('coffeeTrackerVersion');
    
    if (loadedData && loadedVersion === DATA_VERSION) {
      try {
        const parsedData = JSON.parse(loadedData);
        // Convert date strings back to Date objects
        const coffeesWithDates = parsedData.map(coffee => ({
          ...coffee,
          cuppingTime: new Date(coffee.cuppingTime)
        }));
        setCoffees(coffeesWithDates);
        console.log('✅ Loaded existing data from localStorage');
      } catch (error) {
        console.error('❌ Error loading data from localStorage:', error);
        // Fall back to default data if there's an error
        setCoffees(defaultCoffees);
        localStorage.setItem('coffeeTrackerVersion', DATA_VERSION);
      }
    } else {
      // No saved data or version mismatch - use updated default data
      console.log('🔄 Using fresh default data (version mismatch or first run)');
      setCoffees(defaultCoffees);
      localStorage.setItem('coffeeTrackerVersion', DATA_VERSION);
    }

    // Load dark mode preference
    const savedDarkMode = localStorage.getItem('coffeeTrackerDarkMode');
    if (savedDarkMode !== null) {
      setDarkMode(JSON.parse(savedDarkMode));
    }
  }, []);

  // Save data to localStorage whenever coffees change
  useEffect(() => {
    if (coffees.length > 0) {
      try {
        localStorage.setItem('coffeeTrackerData', JSON.stringify(coffees));
        localStorage.setItem('coffeeTrackerVersion', DATA_VERSION);
        localStorage.setItem('coffeeTrackerLastSaved', new Date().toISOString());
        console.log('💾 Data saved to localStorage');
      } catch (error) {
        console.error('❌ Error saving to localStorage:', error);
        if (error.name === 'QuotaExceededError') {
          alert('Storage quota exceeded! Consider exporting your data.');
        }
      }
    }
  }, [coffees]);

  // Save dark mode preference
  useEffect(() => {
    localStorage.setItem('coffeeTrackerDarkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Save collapsed roasters state
  useEffect(() => {
    localStorage.setItem('collapsedRoasters', JSON.stringify(collapsedRoasters));
  }, [collapsedRoasters]);

  // Toggle roaster collapse state
  const toggleRoasterCollapse = (roasterName) => {
    setCollapsedRoasters(prev => ({
      ...prev,
      [roasterName]: !prev[roasterName]
    }));
  };

  // Expand all roasters
  const expandAllRoasters = () => {
    setCollapsedRoasters({});
  };

  // Collapse all roasters
  const collapseAllRoasters = () => {
    const roasterNames = [...new Set(filteredCoffees.map(coffee => 
      coffee.roaster.split(' - ')[0] || coffee.roaster
    ))];
    const allCollapsed = {};
    roasterNames.forEach(name => {
      allCollapsed[name] = true;
    });
    setCollapsedRoasters(allCollapsed);
  };

  // Scroll to form when editing/copying
  const scrollToForm = () => {
    setTimeout(() => {
      if (formRef.current) {
        formRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        });
      }
    }, 100); // Small delay to ensure form is rendered
  };

  // Country codes mapping with names
  const countryFlags = {
    'BR': { flag: '🇧🇷', name: 'Brazil' },
    'IN': { flag: '🇮🇳', name: 'India' },
    'ET': { flag: '🇪🇹', name: 'Ethiopia' },
    'NI': { flag: '🇳🇮', name: 'Nicaragua' },
    'IT': { flag: '🇮🇹', name: 'Italy' },
    'GT': { flag: '🇬🇹', name: 'Guatemala' },
    'UG': { flag: '🇺🇬', name: 'Uganda' },
    'CR': { flag: '🇨🇷', name: 'Costa Rica' },
    'CO': { flag: '🇨🇴', name: 'Colombia' },
    'SV': { flag: '🇸🇻', name: 'El Salvador' },
    'EC': { flag: '🇪🇨', name: 'Ecuador' },
    'ID': { flag: '🇮🇩', name: 'Indonesia' },
    'AT': { flag: '🇦🇹', name: 'Austria' },
    'AS': { flag: '🌏', name: 'Asia' },
    'LA': { flag: '🌎', name: 'Latin America' },
    'SA': { flag: '🌎', name: 'South America' }
  };

  // Roast level badge colors and text
  const getRoastBadge = (level) => {
    switch(level) {
      case 'light':
        return { bg: 'bg-yellow-100 dark:bg-yellow-900', text: 'text-yellow-800 dark:text-yellow-100', label: 'Light Roast' };
      case 'medium':
        return { bg: 'bg-amber-100 dark:bg-amber-900', text: 'text-amber-800 dark:text-amber-100', label: 'Medium Roast' };
      case 'medium-dark':
        return { bg: 'bg-orange-100 dark:bg-orange-900', text: 'text-orange-800 dark:text-orange-100', label: 'Medium-Dark' };
      case 'dark':
        return { bg: 'bg-stone-200 dark:bg-stone-800', text: 'text-stone-800 dark:text-stone-100', label: 'Dark Roast' };
      default:
        return { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-800 dark:text-gray-100', label: 'Unknown' };
    }
  };

  // Parse taste notes for radar chart
  const parseTasteProfile = (tasteNotes) => {
    const profile = {
      chocolate: 0,
      nutty: 0,
      fruity: 0,
      floral: 0,
      earthy: 0,
      spicy: 0,
      sweet: 0,
      acidic: 0
    };

    if (!tasteNotes) return profile;

    const notes = tasteNotes.toLowerCase();
    
    // Score each attribute based on keywords - using incremental scoring
    if (notes.includes('chocolate') || notes.includes('cocoa') || notes.includes('cacao')) profile.chocolate = 4;
    if (notes.includes('dark chocolate')) profile.chocolate = 5;
    
    if (notes.includes('nutty') || notes.includes('nut')) profile.nutty = 3;
    if (notes.includes('almond')) profile.nutty = Math.max(profile.nutty, 4);
    if (notes.includes('hazelnut')) profile.nutty = Math.max(profile.nutty, 4);
    if (notes.includes('walnut')) profile.nutty = Math.max(profile.nutty, 4);
    if (notes.includes('pecan')) profile.nutty = Math.max(profile.nutty, 4);
    
    if (notes.includes('fruity') || notes.includes('fruit')) profile.fruity = 4;
    if (notes.includes('berry') || notes.includes('berries')) profile.fruity = Math.max(profile.fruity, 4);
    if (notes.includes('citrus')) profile.fruity = Math.max(profile.fruity, 4);
    if (notes.includes('lemon')) profile.fruity = Math.max(profile.fruity, 3);
    
    if (notes.includes('floral') || notes.includes('flower') || notes.includes('jasmine')) profile.floral = 4;
    
    if (notes.includes('earthy')) profile.earthy = 4;
    if (notes.includes('woody') || notes.includes('wood')) profile.earthy = Math.max(profile.earthy, 4);
    
    if (notes.includes('spicy') || notes.includes('spice')) profile.spicy = 4;
    if (notes.includes('cinnamon')) profile.spicy = Math.max(profile.spicy, 3);
    
    if (notes.includes('sweet')) profile.sweet = 3;
    if (notes.includes('caramel')) profile.sweet = Math.max(profile.sweet, 4);
    if (notes.includes('honey')) profile.sweet = Math.max(profile.sweet, 4);
    if (notes.includes('sugar')) profile.sweet = Math.max(profile.sweet, 3);
    
    if (notes.includes('acid') || notes.includes('bright') || notes.includes('lively')) profile.acidic = 4;
    if (notes.includes('low acidity') || notes.includes('no acidity')) profile.acidic = 1;

    return profile;
  };

  // Cost calculation functions
  const calculateCostPerCup = (coffee) => {
    if (!coffee.price || !coffee.packageSize) return null;
    
    const pricePerGram = parseFloat(coffee.price) / coffee.packageSize;
    // Typical espresso shot uses 18-20g, let's use 18g as default
    const gramsPerCup = coffee.brewingMethod === 'filter' ? 15 : 18;
    const costPerCup = pricePerGram * gramsPerCup;
    
    return {
      costPerCup: costPerCup.toFixed(3),
      pricePerKg: (parseFloat(coffee.price) / coffee.packageSize * 1000).toFixed(2),
      currency: coffee.currency || 'EUR'
    };
  };

  const calculateValueScore = (coffee) => {
    const cost = calculateCostPerCup(coffee);
    if (!cost || coffee.tasteRating === 0) return null;
    
    // Value score = taste rating / cost per cup (higher is better)
    const valueScore = coffee.tasteRating / parseFloat(cost.costPerCup);
    return valueScore.toFixed(1);
  };

  // Fixed Analytics calculations
  const getAnalyticsData = () => {
    // Favorite roasters - improved calculation
    const roasterCounts = coffees.reduce((acc, coffee) => {
      const roaster = coffee.roaster.split(' - ')[0].trim();
      acc[roaster] = (acc[roaster] || 0) + 1;
      return acc;
    }, {});

    const roasterData = Object.entries(roasterCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6); // Show top 6 roasters

    // Arabica/Robusta preference - improved calculation
    const totalCoffees = coffees.length;
    const avgArabica = totalCoffees > 0 ? coffees.reduce((sum, c) => sum + c.percentArabica, 0) / totalCoffees : 50;
    const avgRobusta = 100 - avgArabica;
    
    const blendData = [
      { name: 'Arabica', value: Math.round(avgArabica), fill: '#8B4513' },
      { name: 'Robusta', value: Math.round(avgRobusta), fill: '#D2691E' }
    ];

    // Rating trends over time - improved calculation with proper sorting
    const ratingTrends = coffees
      .sort((a, b) => new Date(a.cuppingTime) - new Date(b.cuppingTime))
      .map((coffee, index) => ({
        date: new Date(coffee.cuppingTime).toLocaleDateString('en-US', { 
          month: 'short', 
          year: '2-digit' 
        }),
        rating: coffee.tasteRating,
        crema: coffee.cremaRating,
        name: coffee.roaster.split(' - ')[0],
        index: index + 1
      }));

    // Roast level distribution
    const roastLevelCounts = coffees.reduce((acc, coffee) => {
      const level = coffee.roastLevel || 'unknown';
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {});

    const roastLevelData = Object.entries(roastLevelCounts)
      .map(([level, count]) => ({ 
        level: level.charAt(0).toUpperCase() + level.slice(1), 
        count,
        fill: level === 'light' ? '#D2B48C' : 
              level === 'medium' ? '#8B4513' : 
              level === 'medium-dark' ? '#654321' : 
              level === 'dark' ? '#3C1810' : '#A0A0A0'
      }));

    // Origin country analysis
    const originCounts = coffees.reduce((acc, coffee) => {
      if (coffee.origin) {
        const countries = coffee.origin.split(',').map(c => c.trim());
        countries.forEach(country => {
          if (countryFlags[country]) {
            acc[country] = (acc[country] || 0) + 1;
          }
        });
      }
      return acc;
    }, {});

    const originData = Object.entries(originCounts)
      .map(([code, count]) => ({ 
        country: countryFlags[code]?.name || code,
        code,
        count,
        flag: countryFlags[code]?.flag || '🌍'
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Grind settings by brand - NEW CALCULATION
    const grindByBrand = coffees
      .filter(c => c.grindingDegree && !isNaN(parseInt(c.grindingDegree)))
      .reduce((acc, coffee) => {
        const brand = coffee.roaster.split(' - ')[0].trim();
        const grind = parseInt(coffee.grindingDegree);
        
        if (!acc[brand]) {
          acc[brand] = { total: 0, count: 0, grinds: [] };
        }
        acc[brand].total += grind;
        acc[brand].count += 1;
        acc[brand].grinds.push(grind);
        return acc;
      }, {});

    const grindByBrandData = Object.entries(grindByBrand)
      .map(([brand, data]) => ({
        brand,
        avgGrind: Math.round(data.total / data.count * 10) / 10,
        count: data.count,
        minGrind: Math.min(...data.grinds),
        maxGrind: Math.max(...data.grinds)
      }))
      .sort((a, b) => a.avgGrind - b.avgGrind);

    // Price analysis
    const coffeesWithPrice = coffees.filter(c => c.price && !isNaN(parseFloat(c.price)));
    const priceAnalysis = coffeesWithPrice.map(coffee => {
      const cost = calculateCostPerCup(coffee);
      return {
        name: coffee.roaster.split(' - ')[0],
        coffee: coffee.description,
        costPerCup: parseFloat(cost.costPerCup),
        pricePerKg: parseFloat(cost.pricePerKg),
        tasteRating: coffee.tasteRating,
        valueScore: parseFloat(calculateValueScore(coffee)) || 0
      };
    }).sort((a, b) => a.costPerCup - b.costPerCup);

    const avgCostPerCup = priceAnalysis.length > 0 
      ? (priceAnalysis.reduce((sum, c) => sum + c.costPerCup, 0) / priceAnalysis.length).toFixed(3)
      : null;

    return { roasterData, blendData, ratingTrends, roastLevelData, originData, grindByBrandData, priceAnalysis, avgCostPerCup };
  };

  const [formData, setFormData] = useState({
    roaster: '',
    description: '',
    favorite: false,
    grinded: false,
    grindingTime: '',
    grindingDegree: '',
    percentArabica: 100,
    percentRobusta: 0,
    cremaRating: 0,
    tasteRating: 0,
    tasteNotes: '',
    url: '',
    comment: '',
    origin: '',
    roastLevel: 'medium',
    brewingMethod: 'espresso',
    recommendedMethod: 'espresso',
    price: '',
    packageSize: 1000,
    currency: 'EUR',
    preparationNotes: '',
    coffeeGroup: ''
  });

  const resetForm = () => {
    setFormData({
      roaster: '',
      description: '',
      favorite: false,
      grinded: false,
      grindingTime: '',
      grindingDegree: '',
      percentArabica: 100,
      percentRobusta: 0,
      cremaRating: 0,
      tasteRating: 0,
      tasteNotes: '',
      url: '',
      comment: '',
      origin: '',
      roastLevel: 'medium',
      brewingMethod: 'espresso',
      recommendedMethod: 'espresso',
      price: '',
      packageSize: 1000,
      currency: 'EUR',
      preparationNotes: '',
      coffeeGroup: ''
    });
  };

  const handleSubmit = () => {
    const newCoffee = {
      ...formData,
      id: editingCoffee ? editingCoffee.id : Date.now(),
      cuppingTime: editingCoffee ? editingCoffee.cuppingTime : new Date(),
      percentArabica: parseInt(formData.percentArabica),
      percentRobusta: parseInt(formData.percentRobusta),
      grindingTime: formData.grindingTime || '',
      grindingDegree: formData.grindingDegree || '',
      cremaRating: parseInt(formData.cremaRating),
      tasteRating: parseInt(formData.tasteRating),
      tasteNotes: formData.tasteNotes || '',
      url: formData.url || ''
    };

    if (editingCoffee) {
      setCoffees(coffees.map(coffee => 
        coffee.id === editingCoffee.id ? newCoffee : coffee
      ));
      setEditingCoffee(null);
    } else {
      setCoffees([...coffees, newCoffee]);
    }

    resetForm();
    setShowAddForm(false);
  };

  const handleEdit = (coffee) => {
    setFormData({
      roaster: coffee.roaster,
      description: coffee.description,
      favorite: coffee.favorite,
      grinded: coffee.grinded,
      grindingTime: coffee.grindingTime || '',
      grindingDegree: coffee.grindingDegree || '',
      percentArabica: coffee.percentArabica,
      percentRobusta: coffee.percentRobusta,
      cremaRating: coffee.cremaRating,
      tasteRating: coffee.tasteRating,
      tasteNotes: coffee.tasteNotes || '',
      url: coffee.url || '',
      comment: coffee.comment || '',
      origin: coffee.origin || '',
      roastLevel: coffee.roastLevel || 'medium',
      brewingMethod: coffee.brewingMethod || 'espresso',
      recommendedMethod: coffee.recommendedMethod || 'espresso',
      price: coffee.price || '',
      packageSize: coffee.packageSize || 1000,
      currency: coffee.currency || 'EUR',
      preparationNotes: coffee.preparationNotes || '',
      coffeeGroup: coffee.coffeeGroup || ''
    });
    setEditingCoffee(coffee);
    setShowAddForm(true);
    scrollToForm();
  };

  const handleDelete = (id) => {
    setCoffees(coffees.filter(coffee => coffee.id !== id));
  };

  // Copy coffee for different preparation methods
  const handleCopy = (coffee) => {
    const newCoffee = {
      ...coffee,
      id: Date.now(),
      cuppingTime: new Date(),
      cremaRating: 0,
      tasteRating: 0,
      preparationNotes: '',
      comment: '',
      // Create or maintain group ID for related coffees
      coffeeGroup: coffee.coffeeGroup || `${coffee.roaster}-${coffee.description}`.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()
    };
    
    // Also update the original coffee with group ID if it doesn't have one
    if (!coffee.coffeeGroup) {
      const updatedCoffees = coffees.map(c => 
        c.id === coffee.id 
          ? { ...c, coffeeGroup: newCoffee.coffeeGroup }
          : c
      );
      setCoffees([...updatedCoffees, newCoffee]);
    } else {
      setCoffees([...coffees, newCoffee]);
    }
    
    // Pre-fill form with the new coffee for editing
    setFormData({
      roaster: newCoffee.roaster,
      description: newCoffee.description,
      favorite: newCoffee.favorite,
      grinded: newCoffee.grinded,
      grindingTime: newCoffee.grindingTime || '',
      grindingDegree: newCoffee.grindingDegree || '',
      percentArabica: newCoffee.percentArabica,
      percentRobusta: newCoffee.percentRobusta,
      cremaRating: newCoffee.cremaRating,
      tasteRating: newCoffee.tasteRating,
      tasteNotes: newCoffee.tasteNotes || '',
      url: newCoffee.url || '',
      comment: newCoffee.comment || '',
      origin: newCoffee.origin || '',
      roastLevel: newCoffee.roastLevel || 'medium',
      brewingMethod: newCoffee.brewingMethod || 'espresso',
      recommendedMethod: newCoffee.recommendedMethod || 'espresso',
      price: newCoffee.price || '',
      packageSize: newCoffee.packageSize || 1000,
      currency: newCoffee.currency || 'EUR',
      preparationNotes: newCoffee.preparationNotes || '',
      coffeeGroup: newCoffee.coffeeGroup
    });
    setEditingCoffee(newCoffee);
    setShowAddForm(true);
    scrollToForm();
  };

  // Export data to JSON file
  const handleExport = () => {
    const dataToExport = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      coffees: coffees
    };
    
    const jsonString = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `coffee-tracker-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export data to PDF
  const handlePDFExport = () => {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    let yPosition = 20;
    
    // Title
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('Coffee Collection', 20, yPosition);
    yPosition += 15;
    
    // Summary stats
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(`Total Coffees: ${coffees.length}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Favorites: ${coffees.filter(c => c.favorite).length}`, 20, yPosition);
    yPosition += 8;
    const avgRating = coffees.length > 0 ? (coffees.reduce((sum, c) => sum + c.tasteRating, 0) / coffees.length).toFixed(1) : '0';
    doc.text(`Average Rating: ${avgRating}/5`, 20, yPosition);
    yPosition += 15;
    
    // Coffee list
    doc.setFont(undefined, 'bold');
    doc.text('Coffee Details:', 20, yPosition);
    yPosition += 10;
    doc.setFont(undefined, 'normal');
    
    const sortedCoffees = [...coffees].sort((a, b) => b.tasteRating - a.tasteRating);
    
    sortedCoffees.forEach((coffee, index) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = 20;
      }
      
      // Coffee header
      doc.setFont(undefined, 'bold');
      doc.setFontSize(12);
      doc.text(`${index + 1}. ${coffee.roaster}`, 20, yPosition);
      yPosition += 6;
      
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      
      // Description
      doc.text(`Description: ${coffee.description}`, 25, yPosition);
      yPosition += 5;
      
      // Ratings with stars
      const stars = (rating) => '★'.repeat(rating) + '☆'.repeat(5 - rating);
      doc.text(`Taste: ${stars(coffee.tasteRating)} (${coffee.tasteRating}/5)`, 25, yPosition);
      yPosition += 5;
      doc.text(`Crema: ${stars(coffee.cremaRating)} (${coffee.cremaRating}/5)`, 25, yPosition);
      yPosition += 5;
      
      // Blend
      doc.text(`Blend: ${coffee.percentArabica}% Arabica, ${coffee.percentRobusta}% Robusta`, 25, yPosition);
      yPosition += 5;
      
      // Roast level
      if (coffee.roastLevel) {
        doc.text(`Roast: ${coffee.roastLevel.charAt(0).toUpperCase() + coffee.roastLevel.slice(1)}`, 25, yPosition);
        yPosition += 5;
      }
      
      // Brewing methods
      if (coffee.brewingMethod) {
        const method = brewingMethods.find(m => m.id === coffee.brewingMethod);
        doc.text(`Your Method: ${method ? method.name : coffee.brewingMethod}`, 25, yPosition);
        yPosition += 5;
      }
      if (coffee.recommendedMethod && coffee.recommendedMethod !== coffee.brewingMethod) {
        const recMethod = brewingMethods.find(m => m.id === coffee.recommendedMethod);
        doc.text(`Recommended: ${recMethod ? recMethod.name : coffee.recommendedMethod}`, 25, yPosition);
        yPosition += 5;
      }
      
      // Grind settings
      if (coffee.grindingDegree) {
        doc.text(`Grind Level: ${coffee.grindingDegree}`, 25, yPosition);
        yPosition += 5;
      }
      
      // Origin
      if (coffee.origin) {
        const origins = coffee.origin.split(',').map(code => {
          const country = countryFlags[code.trim()];
          return country ? country.name : code.trim();
        }).join(', ');
        doc.text(`Origin: ${origins}`, 25, yPosition);
        yPosition += 5;
      }
      
      // Taste notes
      if (coffee.tasteNotes) {
        const maxWidth = 160;
        const lines = doc.splitTextToSize(`Taste Notes: ${coffee.tasteNotes}`, maxWidth);
        lines.forEach(line => {
          doc.text(line, 25, yPosition);
          yPosition += 5;
        });
      }
      
      // Preparation notes
      if (coffee.preparationNotes) {
        doc.text(`Preparation: ${coffee.preparationNotes}`, 25, yPosition);
        yPosition += 5;
      }
      
      // Comment
      if (coffee.comment) {
        const maxWidth = 160;
        const lines = doc.splitTextToSize(`Notes: ${coffee.comment}`, maxWidth);
        lines.forEach(line => {
          doc.text(line, 25, yPosition);
          yPosition += 5;
        });
      }
      
      // Date
      doc.text(`Cupped: ${new Date(coffee.cuppingTime).toLocaleDateString()}`, 25, yPosition);
      yPosition += 5;
      
      // Price information
      if (coffee.price) {
        doc.text(`Price: ${coffee.price} ${coffee.currency || 'EUR'} / ${coffee.packageSize || 1000}g`, 25, yPosition);
        yPosition += 5;
        
        const cost = calculateCostPerCup(coffee);
        if (cost) {
          doc.text(`Cost per cup: ${cost.costPerCup} ${cost.currency}`, 25, yPosition);
          yPosition += 5;
          
          const valueScore = calculateValueScore(coffee);
          if (valueScore) {
            doc.text(`Value score: ${valueScore} (taste/cost ratio)`, 25, yPosition);
            yPosition += 5;
          }
        }
      }
      
      // Favorite indicator
      if (coffee.favorite) {
        doc.text('★ FAVORITE', 25, yPosition);
        yPosition += 5;
      }
      
      yPosition += 5; // Space between coffees
    });
    
    // Footer
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Generated by Coffee Tracker - Page ${i} of ${totalPages}`, 20, pageHeight - 10);
      doc.text(new Date().toLocaleDateString(), doc.internal.pageSize.width - 50, pageHeight - 10);
    }
    
    // Save the PDF
    doc.save(`coffee-collection-${new Date().toISOString().split('T')[0]}.pdf`);
  };
  
  // Clear localStorage and reset to default data (DANGEROUS)
  const handleResetToDefaults = () => {
    const storageInfo = getStorageInfo();
    const confirmText = 'RESET ALL DATA';
    
    const userInput = prompt(
      `⚠️ DANGER: This will PERMANENTLY DELETE all your coffee data!

` +
      `You will lose:
` +
      `• ${coffees.length} coffee entries
` +
      `• All your personal ratings and comments
` +
      `• All cupping dates and custom data
` +
      `• ${storageInfo ? storageInfo.sizeKB : '?'}KB of stored data

` +
      `This CANNOT be undone!

` +
      `If you really want to continue, type exactly: ${confirmText}`
    );
    
    if (userInput === confirmText) {
      // Double confirmation
      if (window.confirm('⚠️ FINAL WARNING: Are you absolutely sure? This will delete everything!')) {
        localStorage.removeItem('coffeeTrackerData');
        localStorage.removeItem('coffeeTrackerVersion');
        localStorage.removeItem('coffeeTrackerLastSaved');
        setCoffees(defaultCoffees);
        localStorage.setItem('coffeeTrackerVersion', DATA_VERSION);
        alert('✅ Data reset to defaults. All previous data has been deleted.');
      }
    } else if (userInput !== null) {
      alert('❌ Reset cancelled. Text did not match exactly.');
    }
  };

  // Force refresh data (bypass version check)
  const handleForceRefresh = () => {
    if (window.confirm('This will update your data with any missing fields from the latest version. Existing data will be preserved. Continue?')) {
      const migratedData = coffees.map(coffee => ({
        ...coffee,
        // Ensure all new fields exist
        brewingMethod: coffee.brewingMethod || 'espresso',
        recommendedMethod: coffee.recommendedMethod || 'espresso',
        price: coffee.price || '',
        packageSize: coffee.packageSize || 1000,
        currency: coffee.currency || 'EUR',
        preparationNotes: coffee.preparationNotes || (new Date(coffee.cuppingTime) < new Date('2024-12-01') ? 'Pure espresso' : ''),
        coffeeGroup: coffee.coffeeGroup || ''
      }));
      setCoffees(migratedData);
      localStorage.setItem('coffeeTrackerVersion', DATA_VERSION);
      alert('✅ Data migrated to latest version!');
    }
  };

  // Check localStorage usage
  const getStorageInfo = () => {
    try {
      const data = localStorage.getItem('coffeeTrackerData');
      const version = localStorage.getItem('coffeeTrackerVersion');
      const lastSaved = localStorage.getItem('coffeeTrackerLastSaved');
      const sizeKB = data ? (new Blob([data]).size / 1024).toFixed(2) : '0';
      
      return {
        version,
        lastSaved: lastSaved ? new Date(lastSaved).toLocaleString() : 'Never',
        sizeKB,
        coffeeCount: coffees.length
      };
    } catch (error) {
      return null;
    }
  };

  // Import data from JSON file
  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        
        // Validate the imported data
        if (!importedData.coffees || !Array.isArray(importedData.coffees)) {
          alert('Invalid file format. Please select a valid Coffee Tracker export file.');
          return;
        }

        // Convert date strings back to Date objects
        const importedCoffees = importedData.coffees.map(coffee => ({
          ...coffee,
          cuppingTime: new Date(coffee.cuppingTime),
          // Ensure each coffee has a unique ID
          id: coffee.id || Date.now() + Math.random()
        }));

        // Ask user if they want to replace or merge
        const shouldReplace = window.confirm(
          `Import ${importedCoffees.length} coffees?\n\n` +
          'OK = Replace all current data\n' +
          'Cancel = Merge with existing data'
        );

        if (shouldReplace) {
          setCoffees(importedCoffees);
        } else {
          // Merge: add imported coffees with new IDs to avoid conflicts
          const maxId = Math.max(...coffees.map(c => c.id), 0);
          const mergedCoffees = [
            ...coffees,
            ...importedCoffees.map((coffee, index) => ({
              ...coffee,
              id: maxId + index + 1
            }))
          ];
          setCoffees(mergedCoffees);
        }

        alert(`Successfully imported ${importedCoffees.length} coffees!`);
      } catch (error) {
        console.error('Import error:', error);
        alert('Error importing file. Please make sure it\'s a valid Coffee Tracker export.');
      }
    };
    
    reader.readAsText(file);
    // Reset file input
    event.target.value = '';
  };

  const filteredCoffees = coffees
    .filter(coffee => {
      const matchesSearch = coffee.roaster.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           coffee.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFavorite = !filterFavorites || coffee.favorite;
      return matchesSearch && matchesFavorite;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.tasteRating - a.tasteRating;
        case 'roaster':
          return a.roaster.localeCompare(b.roaster);
        case 'priceLowHigh':
          const costA = calculateCostPerCup(a);
          const costB = calculateCostPerCup(b);
          if (!costA) return 1;
          if (!costB) return -1;
          return parseFloat(costA.costPerCup) - parseFloat(costB.costPerCup);
        case 'priceHighLow':
          const costA2 = calculateCostPerCup(a);
          const costB2 = calculateCostPerCup(b);
          if (!costA2) return 1;
          if (!costB2) return -1;
          return parseFloat(costB2.costPerCup) - parseFloat(costA2.costPerCup);
        case 'value':
          const valueA = calculateValueScore(a);
          const valueB = calculateValueScore(b);
          if (!valueA) return 1;
          if (!valueB) return -1;
          return parseFloat(valueB) - parseFloat(valueA);
        case 'date':
        default:
          return new Date(b.cuppingTime) - new Date(a.cuppingTime);
      }
    });

  const StarRating = ({ rating, onRatingChange, readOnly = false, size = 'normal' }) => {
    const sizeClass = size === 'small' ? 'w-4 h-4' : 'w-5 h-5';
    return (
      <div className="flex space-x-1">
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

  // ComboBox component for dropdowns with custom input
  const ComboBox = ({ value, onChange, options, placeholder, type = 'text' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState(value || '');
    const dropdownRef = useRef(null);

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
      setIsOpen(true);
    };

    const handleOptionSelect = (option) => {
      setInputValue(option);
      onChange(option);
      setIsOpen(false);
    };

    const filteredOptions = options.filter(option =>
      option.toLowerCase().includes(inputValue.toLowerCase())
    );

    // Format display for countries
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
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
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
          } border rounded-lg shadow-lg max-h-48 overflow-y-auto`}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleOptionSelect(option)}
                  className={`w-full px-4 py-2 text-left hover:${
                    darkMode ? 'bg-gray-600' : 'bg-gray-100'
                  } flex items-center justify-between transition-colors`}
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

  // Enhanced ComboBox that allows both selection and custom input
  const EnhancedComboBox = ({ value, onChange, options, placeholder, type }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState(value || '');
    const dropdownRef = useRef(null);

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
      // Only open dropdown if user is typing and there are matches
      if (newValue.length > 0) {
        const hasMatches = options.some(option =>
          option.toLowerCase().includes(newValue.toLowerCase())
        );
        setIsOpen(hasMatches);
      } else {
        setIsOpen(false);
      }
    };

    const handleOptionSelect = (option) => {
      // Simply set the selected option, then user can edit it freely
      setInputValue(option);
      onChange(option);
      setIsOpen(false);
    };

    const filteredOptions = options.filter(option =>
      option.toLowerCase().includes(inputValue.toLowerCase())
    );

    return (
      <div className="relative" ref={dropdownRef}>
        <div className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
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
          } border rounded-lg shadow-lg max-h-48 overflow-y-auto`}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleOptionSelect(option)}
                  className={`w-full px-4 py-2 text-left hover:${
                    darkMode ? 'bg-gray-600' : 'bg-gray-100'
                  } transition-colors`}
                >
                  <span className="truncate">{option}</span>
                </button>
              ))
            ) : (
              <div className={`px-4 py-2 text-sm ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Type to add custom entry
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // TasteProfile component for visual taste rating
  const TasteProfile = ({ value, onChange }) => {
    // Parse existing taste notes to extract ratings
    const parseExistingTastes = (tasteNotes) => {
      const profile = {};
      if (!tasteNotes) return profile;
      
      // Try to parse format like "Chocolate: 3, Nutty: 4, Fruity: 2"
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

    // Convert taste profile back to text format
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
                    ? 'bg-amber-100 text-amber-800' 
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
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
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

  // Prepare radar data for selected coffee
  const getRadarData = (coffee) => {
    const profile = parseTasteProfile(coffee.tasteNotes);
    return Object.entries(profile).map(([taste, value]) => ({
      taste: taste.charAt(0).toUpperCase() + taste.slice(1),
      value
    }));
  };

  const analytics = getAnalyticsData();

  // Custom tooltip component for better formatting
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={`${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'} p-3 rounded-lg shadow-lg border`}>
          <p className={`${darkMode ? 'text-white' : 'text-gray-900'} font-medium`}>{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.dataKey}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-amber-50 to-orange-100'} p-4 transition-colors`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} rounded-2xl shadow-xl p-6 mb-6 transition-colors`}>
          <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
            <div className="flex items-center space-x-3">
              <Coffee className="w-8 h-8 text-amber-600" />
              <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Coffee Tracker</h1>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-200 text-gray-700'} transition-colors`}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                onClick={handleExport}
                className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} transition-colors`}
                title="Export JSON data"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={handlePDFExport}
                className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700 text-red-300 hover:bg-gray-600' : 'bg-gray-200 text-red-700 hover:bg-gray-300'} transition-colors`}
                title="Export PDF catalog"
              >
                <FileText className="w-5 h-5" />
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} transition-colors`}
                title="Import data"
              >
                <Upload className="w-5 h-5" />
              </button>
              <button
                onClick={handleForceRefresh}
                className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700 text-blue-300 hover:bg-gray-600' : 'bg-gray-200 text-blue-700 hover:bg-gray-300'} transition-colors`}
                title="Update to latest version (safe)"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              {/* Dangerous reset button - separated and clearly marked */}
              <div className="border-l border-gray-400 ml-2 pl-2">
                <button
                  onClick={handleResetToDefaults}
                  className={`p-2 rounded-lg ${darkMode ? 'bg-red-900 text-red-300 hover:bg-red-800' : 'bg-red-100 text-red-700 hover:bg-red-200'} transition-colors border ${darkMode ? 'border-red-700' : 'border-red-300'}`}
                  title="⚠️ DANGER: Reset ALL data to defaults (EXPORT FIRST!)"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
              <button
                onClick={() => setShowAnalytics(!showAnalytics)}
                className={`${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors`}
              >
                <BarChart3 className="w-5 h-5" />
                <span className="hidden sm:inline">Analytics</span>
              </button>
              <button
                onClick={() => {
                  resetForm();
                  setEditingCoffee(null);
                  setShowAddForm(true);
                  scrollToForm();
                }}
                className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Add Coffee</span>
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className={`${darkMode ? 'bg-gray-700' : 'bg-amber-50'} p-4 rounded-lg transition-colors`}>
              <div className="text-2xl font-bold text-amber-600">{coffees.length}</div>
              <div className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Total Coffees</div>
            </div>
            <div className={`${darkMode ? 'bg-gray-700' : 'bg-amber-50'} p-4 rounded-lg transition-colors`}>
              <div className="text-2xl font-bold text-amber-600">
                {coffees.filter(c => c.favorite).length}
              </div>
              <div className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Favorites</div>
            </div>
            <div className={`${darkMode ? 'bg-gray-700' : 'bg-amber-50'} p-4 rounded-lg transition-colors`}>
              <div className="text-2xl font-bold text-amber-600">
                {coffees.length > 0 ? (coffees.reduce((sum, c) => sum + c.tasteRating, 0) / coffees.length).toFixed(1) : '0'}
              </div>
              <div className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Avg Rating</div>
            </div>
            <div className={`${darkMode ? 'bg-gray-700' : 'bg-amber-50'} p-4 rounded-lg transition-colors`}>
              <div className="text-2xl font-bold text-green-600">
                {analytics.avgCostPerCup ? `${analytics.avgCostPerCup} €` : 'N/A'}
              </div>
              <div className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Avg Cost/Cup</div>
            </div>
          </div>
          
          {/* Storage Info */}
          {(() => {
            const storageInfo = getStorageInfo();
            return storageInfo && (
              <div className={`${darkMode ? 'bg-gray-700' : 'bg-blue-50'} p-3 rounded-lg mt-4 border-l-4 border-blue-500`}>
                <div className="flex items-center justify-between flex-wrap gap-2 text-sm">
                  <div className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                    💾 Data Version: <span className="font-mono">{storageInfo.version}</span> | 
                    Size: <span className="font-mono">{storageInfo.sizeKB}KB</span> | 
                    Last Saved: <span className="font-mono">{storageInfo.lastSaved}</span>
                  </div>
                  <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {storageInfo.coffeeCount} coffees in storage
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Analytics Dashboard */}
        {showAnalytics && (
          <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} rounded-2xl shadow-xl p-6 mb-6 transition-colors`}>
            <h2 className="text-2xl font-bold mb-6">Coffee Analytics & Insights</h2>
            
            {/* Value Score Explanation */}
            <div className={`${darkMode ? 'bg-gray-700' : 'bg-amber-50'} p-4 rounded-lg mb-6 border-l-4 border-amber-500`}>
              <h3 className="text-lg font-semibold mb-2 flex items-center">
                <span className="text-amber-600 mr-2">💡</span>
                Value Score Explained
              </h3>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                <strong>Value Score = Taste Rating ÷ Cost per Cup</strong>
              </p>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Higher scores mean better value for money. A 5-star coffee at €0.50/cup (Value: 10.0) offers better value than a 5-star coffee at €1.00/cup (Value: 5.0). 
                Scores above 5 are generally good value.
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Roasters */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Top Roasters</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={analytics.roasterData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                    <XAxis 
                      dataKey="name" 
                      stroke={darkMode ? '#9ca3af' : '#6b7280'}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      interval={0}
                      fontSize={12}
                    />
                    <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Blend Preference */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Average Blend Preference</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <Pie
                      data={analytics.blendData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {analytics.blendData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      formatter={(value, entry) => `${value}: ${entry.payload.value}%`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Rating Trends */}
              <div className="lg:col-span-2">
                <h3 className="text-lg font-semibold mb-4">Rating Trends Over Time</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={analytics.ratingTrends} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                    <XAxis 
                      dataKey="date" 
                      stroke={darkMode ? '#9ca3af' : '#6b7280'}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      interval={Math.max(0, Math.floor(analytics.ratingTrends.length / 10))}
                      fontSize={12}
                    />
                    <YAxis domain={[0, 5]} stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="rating" 
                      stroke="#f59e0b" 
                      strokeWidth={2} 
                      dot={{ r: 4, fill: '#f59e0b' }}
                      name="Taste Rating"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="crema" 
                      stroke="#8b4513" 
                      strokeWidth={2} 
                      dot={{ r: 4, fill: '#8b4513' }}
                      name="Crema Rating"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Origin Countries */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Coffee Origins</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={analytics.originData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                    <XAxis 
                      dataKey="code" 
                      stroke={darkMode ? '#9ca3af' : '#6b7280'}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      interval={0}
                      fontSize={12}
                    />
                    <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Roast Levels */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Roast Level Distribution</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={analytics.roastLevelData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ level, count }) => `${level}: ${count}`}
                      outerRadius={80}
                      dataKey="count"
                    >
                      {analytics.roastLevelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Cost Analysis */}
              {analytics.priceAnalysis && analytics.priceAnalysis.length > 0 && (
                <div className="lg:col-span-2">
                  <h3 className="text-lg font-semibold mb-4">Cost Analysis</h3>
                  <div className="mb-4">
                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Average cost per cup: <span className="font-bold text-green-600">{analytics.avgCostPerCup} EUR</span>
                    </p>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.priceAnalysis.slice(0, 10)} margin={{ top: 20, right: 30, left: 60, bottom: 80 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                      <XAxis 
                        dataKey="name" 
                        stroke={darkMode ? '#9ca3af' : '#6b7280'} 
                        angle={-45} 
                        textAnchor="end" 
                        height={80}
                        interval={0}
                        fontSize={12}
                      />
                      <YAxis 
                        stroke={darkMode ? '#9ca3af' : '#6b7280'} 
                        label={{ value: 'Cost per Cup (EUR)', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className={`${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'} p-3 rounded-lg shadow-lg border`}>
                                <p className={`${darkMode ? 'text-white' : 'text-gray-900'} font-medium`}>{label}</p>
                                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{data.coffee}</p>
                                <p style={{ color: payload[0].color }}>
                                  Cost: {data.costPerCup.toFixed(3)} EUR/cup
                                </p>
                                <p className="text-sm text-gray-500">
                                  Taste: {data.tasteRating}/5 | Value: {data.valueScore}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="costPerCup" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Grind Settings by Brand - FIXED */}
              <div className="lg:col-span-2">
                <h3 className="text-lg font-semibold mb-4">Grind Settings by Brand</h3>
                {analytics.grindByBrandData && analytics.grindByBrandData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.grindByBrandData} margin={{ top: 20, right: 30, left: 60, bottom: 80 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                      <XAxis 
                        dataKey="brand" 
                        stroke={darkMode ? '#9ca3af' : '#6b7280'} 
                        angle={-45} 
                        textAnchor="end" 
                        height={80}
                        interval={0}
                        fontSize={12}
                      />
                      <YAxis 
                        stroke={darkMode ? '#9ca3af' : '#6b7280'} 
                        label={{ value: 'Grind Level', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className={`${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'} p-3 rounded-lg shadow-lg border`}>
                                <p className={`${darkMode ? 'text-white' : 'text-gray-900'} font-medium`}>{label}</p>
                                <p style={{ color: payload[0].color }}>
                                  Average Grind: {payload[0].value}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {payload[0].payload.count} coffee{payload[0].payload.count !== 1 ? 's' : ''}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="avgGrind" fill="#8b4513" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No grind data available
                  </div>
                )}
              </div>
            </div>

            {/* Flavor Profile Comparison */}
            {selectedCoffeeForRadar && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">
                  Flavor Profile: {selectedCoffeeForRadar.roaster} - {selectedCoffeeForRadar.description}
                </h3>
                <ResponsiveContainer width="100%" height={600}>
                  <RadarChart data={getRadarData(selectedCoffeeForRadar)} margin={{ top: 50, right: 50, bottom: 50, left: 50 }}>
                    <PolarGrid stroke={darkMode ? '#374151' : '#e5e7eb'} />
                    <PolarAngleAxis 
                      dataKey="taste" 
                      stroke={darkMode ? '#9ca3af' : '#6b7280'} 
                      fontSize={18}
                      tick={{ fill: darkMode ? '#e5e7eb' : '#374151' }}
                      className="font-medium"
                    />
                    <PolarRadiusAxis 
                      domain={[0, 5]} 
                      stroke={darkMode ? '#9ca3af' : '#6b7280'} 
                      fontSize={16}
                      tick={{ fill: darkMode ? '#9ca3af' : '#6b7280' }}
                    />
                    <Radar name="Flavor Profile" dataKey="value" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} strokeWidth={3} />
                    <Tooltip content={<CustomTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* Search and Filter */}
        <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} rounded-2xl shadow-xl p-6 mb-6 transition-colors`}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search by roaster or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors`}
              />
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setFilterFavorites(!filterFavorites)}
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                  filterFavorites 
                    ? 'bg-amber-600 text-white' 
                    : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <Star className="w-4 h-4" />
                <span>Favorites</span>
              </button>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={`px-4 py-2 border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors`}
              >
                <option value="date">Sort by Date</option>
                <option value="rating">Sort by Rating</option>
                <option value="roaster">Sort by Roaster</option>
                <option value="value">Sort by Value (Best First)</option>
                <option value="priceLowHigh">Sort by Price (Low to High)</option>
                <option value="priceHighLow">Sort by Price (High to Low)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div ref={formRef} className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} rounded-2xl shadow-xl p-6 mb-6 transition-colors`}>
            <h2 className="text-2xl font-bold mb-6">
              {editingCoffee ? 'Edit Coffee' : 'Add New Coffee'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Roaster</label>
                <input
                  type="text"
                  required
                  value={formData.roaster}
                  onChange={(e) => setFormData({...formData, roaster: e.target.value})}
                  className={`w-full px-3 py-2 border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Description</label>
                <input
                  type="text"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className={`w-full px-3 py-2 border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors`}
                />
              </div>

              <div className="flex items-center space-x-6">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.favorite}
                    onChange={(e) => setFormData({...formData, favorite: e.target.checked})}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Favorite</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.grinded}
                    onChange={(e) => setFormData({...formData, grinded: e.target.checked})}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Pre-grinded</span>
                </label>
              </div>

              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Roast Level</label>
                <select
                  value={formData.roastLevel}
                  onChange={(e) => setFormData({...formData, roastLevel: e.target.value})}
                  className={`w-full px-3 py-2 border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors`}
                >
                  <option value="light">Light</option>
                  <option value="medium">Medium</option>
                  <option value="medium-dark">Medium-Dark</option>
                  <option value="dark">Dark</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Your Brewing Method</label>
                <select
                  value={formData.brewingMethod}
                  onChange={(e) => setFormData({...formData, brewingMethod: e.target.value})}
                  className={`w-full px-3 py-2 border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors`}
                >
                  {brewingMethods.map(method => (
                    <option key={method.id} value={method.id}>
                      {method.icon} {method.name}
                    </option>
                  ))}
                </select>
                <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Your preferred brewing method
                </p>
              </div>

              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Roaster's Recommended Method</label>
                <select
                  value={formData.recommendedMethod}
                  onChange={(e) => setFormData({...formData, recommendedMethod: e.target.value})}
                  className={`w-full px-3 py-2 border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors`}
                >
                  {brewingMethods.map(method => (
                    <option key={method.id} value={method.id}>
                      {method.icon} {method.name}
                    </option>
                  ))}
                </select>
                <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  What the roaster suggests (check packaging/website)
                </p>
              </div>

              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Origin Countries</label>
                <ComboBox
                  value={formData.origin}
                  onChange={(value) => setFormData({...formData, origin: value})}
                  options={commonCountries}
                  placeholder="e.g. BR, CO, ET (Brazil, Colombia, Ethiopia)"
                  type="country"
                />
                <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Common codes: BR (Brazil), CO (Colombia), ET (Ethiopia), GT (Guatemala), CR (Costa Rica)
                </p>
              </div>

              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Grinder Level</label>
                <input
                  type="text"
                  placeholder="e.g. 12, 15, 10"
                  value={formData.grindingDegree}
                  onChange={(e) => setFormData({...formData, grindingDegree: e.target.value})}
                  className={`w-full px-3 py-2 border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Arabica %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.percentArabica}
                    onChange={(e) => {
                      const arabica = parseInt(e.target.value) || 0;
                      setFormData({
                        ...formData, 
                        percentArabica: arabica,
                        percentRobusta: Math.max(0, 100 - arabica)
                      });
                    }}
                    className={`w-full px-3 py-2 border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Robusta %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.percentRobusta}
                    onChange={(e) => {
                      const robusta = parseInt(e.target.value) || 0;
                      setFormData({
                        ...formData, 
                        percentRobusta: robusta,
                        percentArabica: Math.max(0, 100 - robusta)
                      });
                    }}
                    className={`w-full px-3 py-2 border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Crema Rating</label>
                <StarRating 
                  rating={formData.cremaRating} 
                  onRatingChange={(rating) => setFormData({...formData, cremaRating: rating})}
                />
              </div>

              <div className="md:col-span-2">
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Taste Profile
                  <span className={`text-xs ml-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Rate each taste from 0-5
                  </span>
                </label>
                <TasteProfile
                  value={formData.tasteNotes}
                  onChange={(value) => setFormData({...formData, tasteNotes: value})}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Product URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formData.url}
                  onChange={(e) => setFormData({...formData, url: e.target.value})}
                  className={`w-full px-3 py-2 border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Taste Rating</label>
                <StarRating 
                  rating={formData.tasteRating} 
                  onRatingChange={(rating) => setFormData({...formData, tasteRating: rating})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Price</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 12.50"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className={`w-full px-3 py-2 border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Package Size (g)</label>
                  <input
                    type="number"
                    placeholder="1000"
                    value={formData.packageSize}
                    onChange={(e) => setFormData({...formData, packageSize: parseInt(e.target.value) || 1000})}
                    className={`w-full px-3 py-2 border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({...formData, currency: e.target.value})}
                    className={`w-full px-3 py-2 border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors`}
                  >
                    <option value="EUR">EUR €</option>
                    <option value="USD">USD $</option>
                    <option value="GBP">GBP £</option>
                    <option value="CHF">CHF ₣</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Preparation Notes</label>
                <EnhancedComboBox
                  value={formData.preparationNotes}
                  onChange={(value) => setFormData({...formData, preparationNotes: value})}
                  options={commonPreparationNotes}
                  placeholder="e.g. Pure espresso, Americano style, Extra sieve"
                  type="preparation"
                />
                <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  How you prepared this coffee when rating it
                </p>
              </div>
              
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Coffee Group (Optional)</label>
                <input
                  type="text"
                  value={formData.coffeeGroup}
                  onChange={(e) => setFormData({...formData, coffeeGroup: e.target.value})}
                  placeholder="Leave empty for auto-grouping"
                  className={`w-full px-3 py-2 border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors`}
                />
                <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Groups related coffees together (auto-generated when copying)
                </p>
              </div>

              <div className="md:col-span-2">
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Comment</label>
                <textarea
                  value={formData.comment}
                  onChange={(e) => setFormData({...formData, comment: e.target.value})}
                  rows="3"
                  placeholder="Additional notes, brewing tips, personal thoughts..."
                  className={`w-full px-3 py-2 border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors`}
                />
              </div>

              <div className="md:col-span-2 flex space-x-4">
                <button
                  onClick={handleSubmit}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  {editingCoffee ? 'Update Coffee' : 'Add Coffee'}
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingCoffee(null);
                    resetForm();
                  }}
                  className={`${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-300 hover:bg-gray-400 text-gray-700'} px-6 py-2 rounded-lg transition-colors`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Expand/Collapse All Controls */}
        {filteredCoffees.length > 0 && (
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-xl p-4 mb-6`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Coffee className="w-5 h-5 text-amber-600" />
                <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  Coffee Collection ({filteredCoffees.length} coffees)
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={expandAllRoasters}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    darkMode 
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                  title="Expand all roaster sections"
                >
                  <ChevronUp className="w-4 h-4" />
                  <span>Expand All</span>
                </button>
                <button
                  onClick={collapseAllRoasters}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    darkMode 
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                  title="Collapse all roaster sections"
                >
                  <ChevronDown className="w-4 h-4" />
                  <span>Collapse All</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Coffee List */}
        <div className="space-y-8">
          {(() => {
            // First group by roaster, then by coffeeGroup for variations
            const roasterGroups = filteredCoffees.reduce((roasters, coffee) => {
              const roaster = coffee.roaster.split(' - ')[0] || coffee.roaster; // Get main roaster name
              if (!roasters[roaster]) roasters[roaster] = [];
              roasters[roaster].push(coffee);
              return roasters;
            }, {});
            
            // Sort roasters: favorites first, then alphabetically
            const sortedRoasters = Object.entries(roasterGroups).sort(([roasterA, coffeesA], [roasterB, coffeesB]) => {
              const avgRatingA = coffeesA.reduce((sum, c) => sum + c.tasteRating, 0) / coffeesA.length;
              const avgRatingB = coffeesB.reduce((sum, c) => sum + c.tasteRating, 0) / coffeesB.length;
              const favCountA = coffeesA.filter(c => c.favorite).length;
              const favCountB = coffeesB.filter(c => c.favorite).length;
              
              // Sort by: 1) favorites count, 2) average rating, 3) alphabetically
              if (favCountA !== favCountB) return favCountB - favCountA;
              if (Math.abs(avgRatingA - avgRatingB) > 0.1) return avgRatingB - avgRatingA;
              return roasterA.localeCompare(roasterB);
            });
            
            return sortedRoasters.map(([roasterName, roasterCoffees]) => {
              // Group coffees within this roaster by coffeeGroup for variations
              const groupedCoffees = roasterCoffees.reduce((groups, coffee) => {
                const group = coffee.coffeeGroup || `individual-${coffee.id}`;
                if (!groups[group]) groups[group] = [];
                groups[group].push(coffee);
                return groups;
              }, {});
              
              const avgRating = roasterCoffees.reduce((sum, c) => sum + c.tasteRating, 0) / roasterCoffees.length;
              const favoriteCount = roasterCoffees.filter(c => c.favorite).length;
              const isCollapsed = collapsedRoasters[roasterName];
              
              return (
                <div key={roasterName} className="space-y-4">
                  {/* Roaster Header */}
                  <div 
                    className={`${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gradient-to-r from-amber-100 to-orange-100 hover:from-amber-200 hover:to-orange-200'} rounded-xl p-4 border-l-4 border-amber-500 cursor-pointer transition-colors`}
                    onClick={() => toggleRoasterCollapse(roasterName)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          {isCollapsed ? (
                            <ChevronDown className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                          ) : (
                            <ChevronUp className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                          )}
                          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                            ☕ {roasterName}
                          </h2>
                        </div>
                        <span className={`text-sm px-3 py-1 rounded-full font-medium ${darkMode ? 'bg-gray-600 text-gray-200' : 'bg-white text-gray-700'}`}>
                          {roasterCoffees.length} coffee{roasterCoffees.length !== 1 ? 's' : ''}
                        </span>
                        {favoriteCount > 0 && (
                          <span className={`text-sm px-3 py-1 rounded-full font-medium ${darkMode ? 'bg-yellow-900 text-yellow-100' : 'bg-yellow-100 text-yellow-800'}`}>
                            ⭐ {favoriteCount} favorite{favoriteCount !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          Avg Rating:
                        </span>
                        <div className="flex items-center">
                          <StarRating rating={Math.round(avgRating)} readOnly size="small" />
                          <span className={`ml-1 text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                            {avgRating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Coffees within this roaster - conditionally rendered */}
                  {!isCollapsed && (
                    <div className="grid gap-6 ml-4">
                      {Object.entries(groupedCoffees).map(([groupId, coffees]) => {
              const isGrouped = coffees.length > 1 && !groupId.startsWith('individual-');
              const mainCoffee = coffees[0]; // Use first coffee for shared information
              
              if (isGrouped) {
                // Grouped coffee display: main card + variation sub-cards
                return (
                  <div key={groupId} className="space-y-4">
                    {/* Main coffee card with shared information */}
                    <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} rounded-2xl shadow-xl p-6 border-l-4 border-blue-500`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <h3 className="text-xl font-bold">{mainCoffee.roaster}</h3>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${darkMode ? 'bg-blue-900 text-blue-100' : 'bg-blue-100 text-blue-800'}`}>
                              📊 {coffees.length} preparations
                            </span>
                            {mainCoffee.roastLevel && (
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${getRoastBadge(mainCoffee.roastLevel).bg} ${getRoastBadge(mainCoffee.roastLevel).text}`}>
                                {getRoastBadge(mainCoffee.roastLevel).label}
                              </span>
                            )}
                          </div>
                          
                          <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>{mainCoffee.description}</p>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                            <div className="flex items-center space-x-2">
                              <Percent className="w-4 h-4 text-gray-500" />
                              <span className="text-sm">
                                {mainCoffee.percentArabica}% Arabica / {mainCoffee.percentRobusta}% Robusta
                              </span>
                            </div>
                            
                            {mainCoffee.grindingDegree && (
                              <div className="flex items-center space-x-2">
                                <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                                  Grinder Level: {mainCoffee.grindingDegree}
                                </span>
                              </div>
                            )}
                            
                            {mainCoffee.price && (
                              <div className="flex items-center space-x-2">
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                  {mainCoffee.price} {mainCoffee.currency || 'EUR'} / {mainCoffee.packageSize || 1000}g
                                </span>
                              </div>
                            )}
                          </div>

                          {mainCoffee.origin && (
                            <div className="mb-4">
                              <div className="flex flex-wrap items-center gap-1">
                                {mainCoffee.origin.split(',').map(code => {
                                  const trimmedCode = code.trim();
                                  const country = countryFlags[trimmedCode];
                                  const isRegion = ['AS', 'LA', 'SA'].includes(trimmedCode);
                                  
                                  return (
                                    <span 
                                      key={code} 
                                      className="inline-flex items-center"
                                      title={country ? country.name : trimmedCode}
                                    >
                                      {country && !isRegion ? (
                                        <>
                                          <span className="text-xl">{country.flag}</span>
                                          <span className="text-xs ml-1">{trimmedCode}</span>
                                        </>
                                      ) : (
                                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                          {country ? country.name : trimmedCode}
                                        </span>
                                      )}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          
                          {mainCoffee.price && (
                            <div className="mb-4">
                              {(() => {
                                const cost = calculateCostPerCup(mainCoffee);
                                return cost && (
                                  <div className="flex items-center space-x-4">
                                    <div className="text-sm">
                                      <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Cost per cup: </span>
                                      <span className="font-bold text-green-600">
                                        {cost.costPerCup} {cost.currency}
                                      </span>
                                    </div>
                                    <div className="text-sm">
                                      <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Price per kg: </span>
                                      <span className="font-bold">
                                        {cost.pricePerKg} {cost.currency}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                          
                          {(mainCoffee.comment || mainCoffee.url) && (
                            <div className="space-y-2">
                              {mainCoffee.url && (
                                <div className="flex items-center space-x-2">
                                  <ExternalLink className="w-4 h-4 text-blue-600" />
                                  <a 
                                    href={mainCoffee.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                                  >
                                    View Product Online
                                  </a>
                                </div>
                              )}
                              {mainCoffee.comment && (
                                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} italic`}>{mainCoffee.comment}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Variation sub-cards */}
                    <div className="grid md:grid-cols-2 gap-4 ml-6">
                      {coffees.map((coffee) => (
                        <div key={coffee.id} className={`${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50'} rounded-xl shadow-md p-4 border-l-4 ${coffee.preparationNotes?.includes('Pure espresso') ? 'border-amber-500' : 'border-green-500'}`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-3">
                                <h4 className="text-lg font-semibold">Preparation #{coffees.indexOf(coffee) + 1}</h4>
                                {coffee.favorite && <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />}
                              </div>
                              
                              {coffee.preparationNotes && (
                                <div className="mb-3">
                                  <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Method: </span>
                                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} italic`}>{coffee.preparationNotes}</span>
                                </div>
                              )}
                              
                              <div className="grid grid-cols-2 gap-4 mb-3">
                                <div>
                                  <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} block mb-1`}>Crema</span>
                                  <StarRating rating={coffee.cremaRating} readOnly />
                                </div>
                                <div>
                                  <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} block mb-1`}>Taste</span>
                                  <StarRating rating={coffee.tasteRating} readOnly />
                                </div>
                              </div>
                              
                              {(() => {
                                const valueScore = calculateValueScore(coffee);
                                return valueScore && (
                                  <div className="mb-3">
                                    <span className={`text-xs px-2 py-1 rounded ${darkMode ? 'bg-amber-900 text-amber-100' : 'bg-amber-100 text-amber-800'}`} title="Value Score: Taste Rating ÷ Cost per Cup. Higher = Better Value!">
                                      Value: {valueScore}
                                    </span>
                                  </div>
                                );
                              })()}
                              
                              <div className="text-xs text-gray-500">
                                Tasted: {new Date(coffee.cuppingTime).toLocaleDateString()}
                              </div>
                            </div>
                            
                            <div className="flex flex-col space-y-1 ml-2">
                              <button
                                onClick={() => handleEdit(coffee)}
                                className={`p-1.5 ${darkMode ? 'text-gray-400 hover:text-amber-400 hover:bg-gray-600' : 'text-gray-600 hover:text-amber-600 hover:bg-amber-50'} rounded transition-colors`}
                                title="Edit preparation"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleCopy(coffee)}
                                className={`p-1.5 ${darkMode ? 'text-gray-400 hover:text-blue-400 hover:bg-gray-600' : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'} rounded transition-colors`}
                                title="Copy for new preparation"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDelete(coffee.id)}
                                className={`p-1.5 ${darkMode ? 'text-gray-400 hover:text-red-400 hover:bg-gray-600' : 'text-gray-600 hover:text-red-600 hover:bg-red-50'} rounded transition-colors`}
                                title="Delete preparation"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              } else {
                // Individual coffee display (unchanged)
                const coffee = mainCoffee;
                return (
            <div key={coffee.id} className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h3 className="text-xl font-bold">{coffee.roaster}</h3>
                    {coffee.favorite && (
                      <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    )}
                    {coffee.roastLevel && (
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getRoastBadge(coffee.roastLevel).bg} ${getRoastBadge(coffee.roastLevel).text}`}>
                        {getRoastBadge(coffee.roastLevel).label}
                      </span>
                    )}
                    {coffee.brewingMethod && (
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${darkMode ? 'bg-blue-900 text-blue-100' : 'bg-blue-100 text-blue-800'}`} title="Your preferred method">
                        👤 {brewingMethods.find(m => m.id === coffee.brewingMethod)?.icon} {brewingMethods.find(m => m.id === coffee.brewingMethod)?.name || coffee.brewingMethod}
                      </span>
                    )}
                    {coffee.recommendedMethod && coffee.recommendedMethod !== coffee.brewingMethod && (
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${darkMode ? 'bg-green-900 text-green-100' : 'bg-green-100 text-green-800'}`} title="Roaster's recommendation">
                        🏪 {brewingMethods.find(m => m.id === coffee.recommendedMethod)?.icon} {brewingMethods.find(m => m.id === coffee.recommendedMethod)?.name || coffee.recommendedMethod}
                      </span>
                    )}
                  </div>
                  
                  <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>{coffee.description}</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <Percent className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">
                        {coffee.percentArabica}% Arabica / {coffee.percentRobusta}% Robusta
                      </span>
                    </div>
                    
                    {coffee.grindingDegree && (
                      <div className="flex items-center space-x-2">
                        <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                          Grinder Level: {coffee.grindingDegree}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">
                        {new Date(coffee.cuppingTime).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {coffee.price && (
                      <div className="flex items-center space-x-2">
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          {coffee.price} {coffee.currency || 'EUR'} / {coffee.packageSize || 1000}g
                        </span>
                      </div>
                    )}
                  </div>

                  {coffee.origin && (
                    <div className="mb-4">
                      <div className="flex flex-wrap items-center gap-1">
                        {coffee.origin.split(',').map(code => {
                          const trimmedCode = code.trim();
                          const country = countryFlags[trimmedCode];
                          const isRegion = ['AS', 'LA', 'SA'].includes(trimmedCode);
                          
                          return (
                            <span 
                              key={code} 
                              className="inline-flex items-center"
                              title={country ? country.name : trimmedCode}
                            >
                              {country && !isRegion ? (
                                <>
                                  <span className="text-xl">{country.flag}</span>
                                  <span className="text-xs ml-1">{trimmedCode}</span>
                                </>
                              ) : (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                  {country ? country.name : trimmedCode}
                                </span>
                              )}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {coffee.tasteNotes && (
                    <div className="mb-3">
                      <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Taste: </span>
                      <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{coffee.tasteNotes}</span>
                      <button
                        onClick={() => setSelectedCoffeeForRadar(coffee)}
                        className="ml-2 text-amber-600 hover:text-amber-700 text-sm"
                        title="Show flavor profile"
                      >
                        <BarChart3 className="w-4 h-4 inline" />
                      </button>
                    </div>
                  )}
                  
                  {coffee.preparationNotes && (
                    <div className="mb-3">
                      <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Preparation: </span>
                      <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} italic`}>{coffee.preparationNotes}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-6 mb-4">
                    <div>
                      <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} block`}>Crema</span>
                      <StarRating rating={coffee.cremaRating} readOnly />
                    </div>
                    <div>
                      <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} block`}>Taste</span>
                      <StarRating rating={coffee.tasteRating} readOnly />
                    </div>
                    {(() => {
                      const cost = calculateCostPerCup(coffee);
                      const valueScore = calculateValueScore(coffee);
                      return cost && (
                        <div>
                          <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} block`}>Cost/Cup</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-lg font-bold text-green-600">
                              {cost.costPerCup} {cost.currency}
                            </span>
                            {valueScore && (
                              <span className={`text-xs px-2 py-1 rounded ${darkMode ? 'bg-amber-900 text-amber-100' : 'bg-amber-100 text-amber-800'}`} title="Value Score: Taste Rating ÷ Cost per Cup. Higher = Better Value!">
                                Value: {valueScore}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                  
                  {(coffee.comment || coffee.url) && (
                    <div className="space-y-2">
                      {coffee.url && (
                        <div className="flex items-center space-x-2">
                          <ExternalLink className="w-4 h-4 text-blue-600" />
                          <a 
                            href={coffee.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800 underline"
                          >
                            View Product Online
                          </a>
                        </div>
                      )}
                      {coffee.comment && (
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} italic`}>{coffee.comment}</p>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col space-y-2 ml-4">
                  <button
                    onClick={() => handleEdit(coffee)}
                    className={`p-2 ${darkMode ? 'text-gray-400 hover:text-amber-400 hover:bg-gray-700' : 'text-gray-600 hover:text-amber-600 hover:bg-amber-50'} rounded-lg transition-colors`}
                    title="Edit coffee"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleCopy(coffee)}
                    className={`p-2 ${darkMode ? 'text-gray-400 hover:text-blue-400 hover:bg-gray-700' : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'} rounded-lg transition-colors`}
                    title="Copy for different preparation"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(coffee.id)}
                    className={`p-2 ${darkMode ? 'text-gray-400 hover:text-red-400 hover:bg-gray-700' : 'text-gray-600 hover:text-red-600 hover:bg-red-50'} rounded-lg transition-colors`}
                    title="Delete coffee"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
                );
              }
                      })}
                    </div>
                  )}
                </div>
              );
            });
          })()}
        </div>

        {filteredCoffees.length === 0 && (
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-xl p-12 text-center`}>
            <Coffee className={`w-16 h-16 ${darkMode ? 'text-gray-600' : 'text-gray-300'} mx-auto mb-4`} />
            <h3 className={`text-xl font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>No coffees found</h3>
            <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
              {searchTerm || filterFavorites ? 'Try adjusting your search or filters' : 'Add your first coffee to get started!'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoffeeTracker;