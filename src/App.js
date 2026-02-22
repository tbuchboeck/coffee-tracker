import React, { useState, useEffect, useRef } from 'react';
import { Plus, Coffee, Star, Search, Trash2, Edit3, Calendar, Percent, ExternalLink, BarChart3, Moon, Sun, Download, Upload, FileText, RefreshCw, RotateCcw, Copy, ChevronDown, ChevronUp, Check, Cloud, CloudOff, Database } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import jsPDF from 'jspdf';
import { personalCoffees } from './personal_coffees';
import { coffeeService } from './services/coffeeService';
// Auth disabled: import { authService } from './services/authService';
// Auth disabled: import Login from './components/Login';

// Personal coffee collection - your complete 30 coffee database
const defaultCoffees = personalCoffees;

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
  const [tasteProfileCollapsed, setTasteProfileCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [cloudStatus, setCloudStatus] = useState({
    enabled: coffeeService.isCloudEnabled(),
    syncing: false,
    error: null
  });
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [user, setUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(false); // Disabled auth check
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
    { id: 'filter', name: 'Filter Coffee', icon: '📄' },
    { id: 'coldbrew', name: 'Cold Brew', icon: '🧊' }
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
    'Temperature adjusted to 95°C',
    'Cold brew - 12 hours steep time, coarse grind',
    'Cold brew - 18 hours steep time, medium-coarse grind',
    'Cold brew - 24 hours steep time, very coarse grind',
    'Cold brew concentrate - diluted 1:1 with water',
    'Cold brew concentrate - diluted 1:2 with milk'
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

  // Authentication disabled - using localStorage mode only
  // Check authentication status on mount
  useEffect(() => {
    // Skip auth check - always use localStorage mode
    setAuthChecking(false);
    setUser(null);

    // No auth state change listener needed
    return () => {};
  }, []);

  // Load data from database on mount
  useEffect(() => {
    const loadData = async () => {
      // Skip cloud/auth checks - always use localStorage
      // (Auth is disabled)

      setIsLoading(true);
      try {
        const data = await coffeeService.getAllCoffees();
        const wasFallback = coffeeService.didFallBack();
        const fetchError = coffeeService.getLastFetchError();

        if (data.length === 0) {
          // No data from any source - use defaults
          console.log('🔄 No data found, using default data');
          setCoffees(defaultCoffees);
          if (wasFallback) {
            console.warn('⚠️ Supabase failed, localStorage empty → using default coffees');
          }
        } else {
          // Convert date strings back to Date objects
          const coffeesWithDates = data.map(coffee => ({
            ...coffee,
            cuppingTime: new Date(coffee.cuppingTime)
          }));
          setCoffees(coffeesWithDates);
          if (wasFallback) {
            console.warn(`⚠️ Supabase not reachable, showing ${data.length} coffees from local fallback`);
          } else {
            console.log(`✅ Loaded ${data.length} coffee entries from database`);
          }
        }

        // Update cloud status - show error if fallback was used
        setCloudStatus(prev => ({
          ...prev,
          enabled: coffeeService.isCloudEnabled(),
          error: wasFallback ? (fetchError || 'Supabase connection failed - showing local data') : null
        }));
      } catch (error) {
        console.error('❌ Error loading data:', error);
        setCloudStatus(prev => ({
          ...prev,
          error: 'Failed to load data'
        }));
        // Last resort: use default coffees instead of empty list
        setCoffees(defaultCoffees);
      } finally {
        setIsLoading(false);
      }
    };

    // Load dark mode preference
    const savedDarkMode = localStorage.getItem('coffeeTrackerDarkMode');
    if (savedDarkMode !== null) {
      setDarkMode(JSON.parse(savedDarkMode));
    }

    loadData();
  }, [user, authChecking]); // Reload when user changes

  // Note: Data is now saved immediately on each operation via coffeeService
  // No need for auto-save useEffect anymore

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
    
    // Use actual coffee amount if specified, otherwise use method defaults
    let gramsPerCup;
    if (coffee.coffeeAmount && !isNaN(parseFloat(coffee.coffeeAmount))) {
      const totalCoffeeAmount = parseFloat(coffee.coffeeAmount);
      
      // For cold brew, if servings specified, calculate per serving
      if (coffee.brewingMethod === 'coldbrew' && coffee.servings && !isNaN(parseFloat(coffee.servings))) {
        gramsPerCup = totalCoffeeAmount / parseFloat(coffee.servings);
      } else {
        gramsPerCup = totalCoffeeAmount;
      }
    } else {
      // Different brewing methods use different amounts of coffee (defaults)
      switch(coffee.brewingMethod) {
        case 'coldbrew':
          gramsPerCup = 30; // Cold brew typically uses more coffee
          break;
        case 'filter':
        case 'v60':
        case 'chemex':
        case 'dripper':
          gramsPerCup = 15; // Pour over methods
          break;
        case 'frenchpress':
          gramsPerCup = 17; // French press
          break;
        case 'espresso':
        case 'moka':
        default:
          gramsPerCup = 18; // Espresso-based methods
          break;
      }
    }
    
    const costPerCup = pricePerGram * gramsPerCup;
    
    return {
      costPerCup: costPerCup.toFixed(3),
      pricePerKg: (parseFloat(coffee.price) / coffee.packageSize * 1000).toFixed(2),
      currency: coffee.currency || 'EUR',
      gramsUsed: gramsPerCup.toFixed(1),
      batchInfo: coffee.brewingMethod === 'coldbrew' && coffee.servings ? 
        `${coffee.coffeeAmount}g ÷ ${coffee.servings} servings` : null
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
        name: `${coffee.roaster} - ${coffee.description}`,
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
    coffeeAmount: '', // Amount of coffee used in grams
    servings: '', // Number of servings/cups this preparation yields
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
      coffeeAmount: '',
      servings: '',
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

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      const newCoffee = {
        ...formData,
        id: editingCoffee ? editingCoffee.id : Date.now(),
        cuppingTime: editingCoffee ? editingCoffee.cuppingTime : new Date(),
        percentArabica: parseInt(formData.percentArabica),
        percentRobusta: parseInt(formData.percentRobusta),
        grindingTime: formData.grindingTime || '',
        grindingDegree: formData.grindingDegree || '',
        coffeeAmount: formData.coffeeAmount || '',
        servings: formData.servings || '',
        cremaRating: parseInt(formData.cremaRating),
        tasteRating: parseInt(formData.tasteRating),
        tasteNotes: formData.tasteNotes || '',
        url: formData.url || ''
      };

      if (editingCoffee) {
        // Update existing coffee
        const result = await coffeeService.updateCoffee(editingCoffee.id, newCoffee);
        if (result.success) {
          setCoffees(coffees.map(coffee =>
            coffee.id === editingCoffee.id ? newCoffee : coffee
          ));
        } else {
          alert('Failed to update coffee. Please try again.');
          return;
        }
        setEditingCoffee(null);
      } else {
        // Add new coffee
        const result = await coffeeService.addCoffee(newCoffee);
        if (result.success) {
          setCoffees([...coffees, newCoffee]);
        } else {
          alert('Failed to add coffee. Please try again.');
          return;
        }
      }

      resetForm();
      setShowAddForm(false);
    } catch (error) {
      console.error('Error saving coffee:', error);
      alert('An error occurred while saving. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (coffee) => {
    setFormData({
      roaster: coffee.roaster,
      description: coffee.description,
      favorite: coffee.favorite,
      grinded: coffee.grinded,
      grindingTime: coffee.grindingTime || '',
      grindingDegree: coffee.grindingDegree || '',
      coffeeAmount: coffee.coffeeAmount || '',
      servings: coffee.servings || '',
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

  const handleDelete = async (id) => {
    try {
      const result = await coffeeService.deleteCoffee(id);
      if (result.success) {
        setCoffees(coffees.filter(coffee => coffee.id !== id));
      } else {
        alert('Failed to delete coffee. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting coffee:', error);
      alert('An error occurred while deleting. Please try again.');
    }
  };

  // Copy coffee for different preparation methods
  const handleCopy = async (coffee) => {
    try {
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

      // Add the new coffee to the database
      const result = await coffeeService.addCoffee(newCoffee);
      if (!result.success) {
        alert('Failed to copy coffee. Please try again.');
        return;
      }

      // Also update the original coffee with group ID if it doesn't have one
      if (!coffee.coffeeGroup) {
        const updatedOriginal = { ...coffee, coffeeGroup: newCoffee.coffeeGroup };
        await coffeeService.updateCoffee(coffee.id, updatedOriginal);
        const updatedCoffees = coffees.map(c =>
          c.id === coffee.id ? updatedOriginal : c
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
    } catch (error) {
      console.error('Error copying coffee:', error);
      alert('An error occurred while copying. Please try again.');
    }
  };

  const handleToggleFavorite = async (id) => {
    const coffee = coffees.find(c => c.id === id);
    if (!coffee) return;

    try {
      const updatedCoffee = { ...coffee, favorite: !coffee.favorite };
      const result = await coffeeService.updateCoffee(id, updatedCoffee);
      if (result.success) {
        setCoffees(coffees.map(c =>
          c.id === id ? updatedCoffee : c
        ));
      } else {
        alert('Failed to update favorite status. Please try again.');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      alert('An error occurred. Please try again.');
    }
  };

  const handleDuplicate = (coffee) => {
    handleCopy(coffee);
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
        const resetData = async () => {
          setIsSaving(true);
          try {
            // Clear cloud data if enabled
            if (coffeeService.isCloudEnabled()) {
              await coffeeService.clearCloudData();
            }

            // Clear localStorage
            localStorage.removeItem('coffeeTrackerData');
            localStorage.removeItem('coffeeTrackerVersion');
            localStorage.removeItem('coffeeTrackerLastSaved');

            // Save defaults to database
            await coffeeService.saveAllCoffees(defaultCoffees);
            setCoffees(defaultCoffees);
            localStorage.setItem('coffeeTrackerVersion', DATA_VERSION);

            alert('✅ Data reset to defaults. All previous data has been deleted.');
          } catch (error) {
            console.error('Error resetting data:', error);
            alert('Error resetting data. Please try again.');
          } finally {
            setIsSaving(false);
          }
        };
        resetData();
      }
    } else if (userInput !== null) {
      alert('❌ Reset cancelled. Text did not match exactly.');
    }
  };

  // Force refresh data (bypass version check)
  const handleForceRefresh = async () => {
    if (window.confirm('This will update your data with any missing fields from the latest version. Existing data will be preserved. Continue?')) {
      setIsSaving(true);
      try {
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

        // Save to database
        await coffeeService.saveAllCoffees(migratedData);
        setCoffees(migratedData);
        localStorage.setItem('coffeeTrackerVersion', DATA_VERSION);
        alert('✅ Data migrated to latest version!');
      } catch (error) {
        console.error('Error refreshing data:', error);
        alert('Error refreshing data. Please try again.');
      } finally {
        setIsSaving(false);
      }
    }
  };

  // Migrate localStorage data to cloud
  const handleMigrateToCloud = async () => {
    if (!coffeeService.isCloudEnabled()) {
      alert('Cloud storage is not configured. Please set up Supabase first.');
      return;
    }

    setCloudStatus(prev => ({ ...prev, syncing: true, error: null }));
    try {
      const result = await coffeeService.migrateToCloud();
      if (result.success) {
        alert(result.message || 'Successfully migrated data to cloud!');
        setShowMigrationModal(false);
      } else {
        alert('Migration failed: ' + (result.error?.message || 'Unknown error'));
        setCloudStatus(prev => ({ ...prev, error: 'Migration failed' }));
      }
    } catch (error) {
      console.error('Migration error:', error);
      alert('Error during migration: ' + error.message);
      setCloudStatus(prev => ({ ...prev, error: 'Migration failed' }));
    } finally {
      setCloudStatus(prev => ({ ...prev, syncing: false }));
    }
  };

  // Auth disabled - handleSignOut removed
  // const handleSignOut = async () => {
  //   if (window.confirm('Are you sure you want to sign out?')) {
  //     const result = await authService.signOut();
  //     if (result.success) {
  //       setUser(null);
  //       setCoffees([]);
  //     } else {
  //       alert('Failed to sign out: ' + result.error);
  //     }
  //   }
  // };

  // Auth disabled - handleLogin removed
  // const handleLogin = (loggedInUser) => {
  //   setUser(loggedInUser);
  // };

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
    reader.onload = async (e) => {
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

        setIsSaving(true);

        if (shouldReplace) {
          // Replace all data
          const result = await coffeeService.saveAllCoffees(importedCoffees);
          if (result.success) {
            setCoffees(importedCoffees);
            alert(`Successfully imported ${importedCoffees.length} coffees!`);
          } else {
            alert('Failed to import data. Please try again.');
          }
        } else {
          // Merge: add imported coffees with new IDs to avoid conflicts
          const maxId = Math.max(...coffees.map(c => c.id), 0);
          const coffeesToAdd = importedCoffees.map((coffee, index) => ({
            ...coffee,
            id: maxId + index + 1
          }));

          // Add each coffee individually
          let successCount = 0;
          for (const coffee of coffeesToAdd) {
            const result = await coffeeService.addCoffee(coffee);
            if (result.success) successCount++;
          }

          if (successCount > 0) {
            const mergedCoffees = [...coffees, ...coffeesToAdd];
            setCoffees(mergedCoffees);
            alert(`Successfully merged ${successCount} coffees!`);
          } else {
            alert('Failed to merge data. Please try again.');
          }
        }

        setIsSaving(false);
      } catch (error) {
        console.error('Import error:', error);
        alert('Error importing file. Please make sure it\'s a valid Coffee Tracker export.');
        setIsSaving(false);
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
          if (!costA || !costA.costPerCup) return 1;
          if (!costB || !costB.costPerCup) return -1;
          return parseFloat(costA.costPerCup) - parseFloat(costB.costPerCup);
        case 'priceHighLow':
          const costA2 = calculateCostPerCup(a);
          const costB2 = calculateCostPerCup(b);
          if (!costA2 || !costA2.costPerCup) return 1;
          if (!costB2 || !costB2.costPerCup) return -1;
          return parseFloat(costB2.costPerCup) - parseFloat(costA2.costPerCup);
        case 'value':
          const valueA = calculateValueScore(a);
          const valueB = calculateValueScore(b);
          if (!valueA || isNaN(valueA)) return 1;
          if (!valueB || isNaN(valueB)) return -1;
          return parseFloat(valueB) - parseFloat(valueA);
        case 'date':
        default:
          return new Date(b.cuppingTime) - new Date(a.cuppingTime);
      }
    });

  const StarRating = ({ rating, onRatingChange, readOnly = false, size = 'normal' }) => {
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

  // ComboBox component for dropdowns with custom input
  const ComboBox = ({ value, onChange, options, placeholder, type = 'text' }) => {
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
      // Don't auto-open dropdown when editing - only manual via arrow click
    };

    const handleOptionSelect = (option) => {
      setInputValue(option);
      onChange(option);
      setIsOpen(false);
      // Keep focus on the input so user can continue typing
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          // Move cursor to end of text
          inputRef.current.setSelectionRange(inputValue.length, inputValue.length);
        }
      }, 0);
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
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => {
              // Don't auto-open dropdown - user can click arrow if they want options
            }}
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

  // Removed unused EnhancedComboBox component

  // CoffeeCard component for individual coffee display
  const CoffeeCard = ({ coffee, onEdit, onDelete, onToggleFavorite, onDuplicate, darkMode, onShowRadar }) => {
    return (
      <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} rounded-2xl shadow-xl p-4 md:p-6 hover:shadow-2xl transition-all`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-3">
              <h3 className="text-lg sm:text-xl font-bold break-words">{coffee.roaster}</h3>
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
              
              {(coffee.grindingDegree || coffee.coffeeAmount) && (
                <div className="flex items-center space-x-2 flex-wrap">
                  {coffee.grindingDegree && (
                    <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                      Grinder Level: {coffee.grindingDegree}
                    </span>
                  )}
                  {coffee.coffeeAmount && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {coffee.coffeeAmount}g coffee{coffee.servings && coffee.brewingMethod === 'coldbrew' ? ` (${coffee.servings} servings)` : ''}
                    </span>
                  )}
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
                  onClick={() => onShowRadar(coffee)}
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
            
            <div className="flex items-center space-x-4 sm:space-x-6 mb-4 flex-wrap">
              <div className="min-w-0">
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} block`}>Crema</span>
                <div className="overflow-hidden">
                  <StarRating rating={coffee.cremaRating} readOnly />
                </div>
              </div>
              <div className="min-w-0">
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} block`}>Taste</span>
                <div className="overflow-hidden">
                  <StarRating rating={coffee.tasteRating} readOnly />
                </div>
              </div>
              {(() => {
                const cost = calculateCostPerCup(coffee);
                const valueScore = calculateValueScore(coffee);
                return cost && (
                  <div>
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} block`}>Cost/Cup</span>
                    <span className="font-bold text-green-600" title={cost.batchInfo || `Based on ${cost.gramsUsed}g coffee`}>
                      {cost.costPerCup} EUR
                    </span>
                    {valueScore && (
                      <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} block`}>
                        Value: {valueScore}
                      </span>
                    )}
                  </div>
                );
              })()}
            </div>
            
            {coffee.price && (
              <div className="mb-4">
                {(() => {
                  const cost = calculateCostPerCup(coffee);
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
            
            {(coffee.comment || coffee.url) && (
              <div className="space-y-2">
                {coffee.url && (
                  <div className="flex items-center space-x-2">
                    <ExternalLink className="w-4 h-4 text-blue-600" />
                    <a 
                      href={coffee.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Product Link
                    </a>
                  </div>
                )}
                {coffee.comment && (
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} italic`}>
                    "{coffee.comment}"
                  </p>
                )}
              </div>
            )}
          </div>
          
          <div className="flex flex-col space-y-1 ml-4">
            <button
              onClick={onToggleFavorite}
              className={`p-2 ${coffee.favorite ? 'text-yellow-400' : darkMode ? 'text-gray-400 hover:text-yellow-400' : 'text-gray-400 hover:text-yellow-500'} transition-colors`}
              title={coffee.favorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Star className={`w-5 h-5 ${coffee.favorite ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={onEdit}
              className={`p-2 ${darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'} rounded transition-colors`}
              title="Edit coffee"
            >
              <Edit3 className="w-5 h-5" />
            </button>
            <button
              onClick={onDuplicate}
              className={`p-2 ${darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'} rounded transition-colors`}
              title="Duplicate coffee"
            >
              <Copy className="w-5 h-5" />
            </button>
            <button
              onClick={onDelete}
              className={`p-2 ${darkMode ? 'text-gray-400 hover:text-red-400 hover:bg-gray-700' : 'text-gray-600 hover:text-red-600 hover:bg-red-50'} rounded transition-colors`}
              title="Delete coffee"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
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

  // Show loading while checking authentication
  if (authChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <Coffee className="w-16 h-16 text-amber-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // Login disabled - always use localStorage mode
  // (Authentication is completely disabled)

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-amber-50 to-orange-100'} p-4 transition-colors`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} rounded-2xl shadow-xl p-4 sm:p-6 mb-6 transition-colors`}>
          <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
            <div className="flex items-center space-x-3">
              <Coffee className="w-8 h-8 text-amber-600" />
              <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Coffee Tracker</h1>
            </div>
            <div className="flex items-center flex-wrap gap-2">
              {/* Cloud Status Indicator */}
              {cloudStatus.enabled && cloudStatus.error ? (
                <button
                  onClick={() => setShowMigrationModal(true)}
                  className={`p-2 rounded-lg ${darkMode ? 'bg-amber-900 text-amber-300 hover:bg-amber-800' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'} transition-colors`}
                  title={`Cloud-Verbindung fehlgeschlagen: ${cloudStatus.error} - Lokale Daten werden angezeigt`}
                >
                  <CloudOff className="w-5 h-5" />
                </button>
              ) : cloudStatus.enabled ? (
                <button
                  onClick={() => setShowMigrationModal(true)}
                  className={`p-2 rounded-lg ${darkMode ? 'bg-green-900 text-green-300 hover:bg-green-800' : 'bg-green-100 text-green-700 hover:bg-green-200'} transition-colors`}
                  title="Cloud storage enabled - Click to manage"
                >
                  <Cloud className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={() => setShowMigrationModal(true)}
                  className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700 text-gray-400 hover:bg-gray-600' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'} transition-colors`}
                  title="Cloud storage not configured - Click to learn more"
                >
                  <CloudOff className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-200 text-gray-700'} transition-colors`}
                title="Toggle dark mode"
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              {/* Auth disabled - Sign Out Button removed */}
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
                className="bg-amber-600 hover:bg-amber-700 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Plus className="w-4 sm:w-5 h-4 sm:h-5" />
                <span className="hidden sm:inline">Add Coffee</span>
              </button>
            </div>
          </div>

          {/* Cloud Fallback Warning Banner */}
          {cloudStatus.enabled && cloudStatus.error && (
            <div className={`mb-4 p-3 rounded-lg flex items-center gap-3 ${darkMode ? 'bg-amber-900/50 text-amber-200 border border-amber-700' : 'bg-amber-50 text-amber-800 border border-amber-300'}`}>
              <CloudOff className="w-5 h-5 flex-shrink-0" />
              <div className="text-sm">
                <strong>Supabase nicht erreichbar:</strong> {cloudStatus.error}.
                {' '}Es werden lokale Daten angezeigt ({coffees.length} Einträge).
              </div>
            </div>
          )}

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
          <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} rounded-2xl shadow-xl p-4 sm:p-6 mb-6 transition-colors`}>
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
                    <BarChart data={analytics.priceAnalysis.slice(0, 10)} margin={{ top: 20, right: 30, left: 80, bottom: 80 }}>
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
                        label={{ value: 'Cost per Cup (EUR)', angle: -90, position: 'insideLeft', offset: 10 }}
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
        <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} rounded-2xl shadow-xl p-4 sm:p-6 mb-6 transition-colors`}>
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
                className={`px-3 sm:px-4 py-2 border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors w-full sm:w-auto`}
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
          <div ref={formRef} className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} rounded-2xl shadow-xl p-4 sm:p-6 mb-6 transition-colors`}>
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

              <div className={`grid ${formData.brewingMethod === 'coldbrew' ? 'grid-cols-3' : 'grid-cols-2'} gap-4`}>
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Grinder Level</label>
                  <input
                    type="text"
                    placeholder="e.g. 12, 15, 40"
                    value={formData.grindingDegree}
                    onChange={(e) => setFormData({...formData, grindingDegree: e.target.value})}
                    className={`w-full px-3 py-2 border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Coffee Amount (g)</label>
                  <input
                    type="number"
                    placeholder={formData.brewingMethod === 'coldbrew' ? "90" : "18"}
                    value={formData.coffeeAmount}
                    onChange={(e) => setFormData({...formData, coffeeAmount: e.target.value})}
                    className={`w-full px-3 py-2 border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors`}
                  />
                </div>
                {formData.brewingMethod === 'coldbrew' && (
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Servings/Cups</label>
                    <input
                      type="number"
                      placeholder="10"
                      value={formData.servings}
                      onChange={(e) => setFormData({...formData, servings: e.target.value})}
                      className={`w-full px-3 py-2 border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors`}
                    />
                    <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      How many cups from this batch?
                    </p>
                  </div>
                )}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Crema Rating</label>
                  <StarRating 
                    rating={formData.cremaRating} 
                    onRatingChange={(rating) => setFormData({...formData, cremaRating: rating})}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Taste Rating</label>
                  <StarRating 
                    rating={formData.tasteRating} 
                    onRatingChange={(rating) => setFormData({...formData, tasteRating: rating})}
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <button
                  type="button"
                  onClick={() => setTasteProfileCollapsed(!tasteProfileCollapsed)}
                  className={`flex items-center justify-between w-full text-left mb-2`}
                >
                  <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Taste Profile
                    <span className={`text-xs ml-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Rate each taste from 0-5
                    </span>
                  </label>
                  <ChevronDown className={`w-4 h-4 transition-transform ${tasteProfileCollapsed ? '' : 'rotate-180'} ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                </button>
                {!tasteProfileCollapsed && (
                  <TasteProfile
                    value={formData.tasteNotes}
                    onChange={(value) => setFormData({...formData, tasteNotes: value})}
                  />
                )}
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
                <div className="space-y-2">
                  <div>
                    <label className={`block text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Select from common preparations:</label>
                    <select
                      value={formData.preparationNotes && commonPreparationNotes.includes(formData.preparationNotes) ? formData.preparationNotes : ''}
                      onChange={(e) => {
                        if (e.target.value) {
                          setFormData({...formData, preparationNotes: e.target.value});
                        }
                      }}
                      disabled={formData.preparationNotes && !commonPreparationNotes.includes(formData.preparationNotes)}
                      className={`w-full px-3 py-2 border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors ${
                        formData.preparationNotes && !commonPreparationNotes.includes(formData.preparationNotes) ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <option value="">-- Select a preparation method --</option>
                      {commonPreparationNotes.map((note, index) => (
                        <option key={index} value={note}>{note}</option>
                      ))}
                    </select>
                  </div>
                  <div className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
                    — OR —
                  </div>
                  <div>
                    <label className={`block text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Enter custom preparation notes:</label>
                    <input
                      type="text"
                      value={formData.preparationNotes && !commonPreparationNotes.includes(formData.preparationNotes) ? formData.preparationNotes : ''}
                      onChange={(e) => setFormData({...formData, preparationNotes: e.target.value})}
                      disabled={formData.preparationNotes && commonPreparationNotes.includes(formData.preparationNotes)}
                      placeholder="e.g. V60 with 15g/250ml, 2:30 brew time"
                      className={`w-full px-3 py-2 border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors ${
                        formData.preparationNotes && commonPreparationNotes.includes(formData.preparationNotes) ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    />
                  </div>
                  {formData.preparationNotes && (
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, preparationNotes: ''})}
                      className={`text-xs ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-700'} underline`}
                    >
                      Clear selection
                    </button>
                  )}
                </div>
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
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-xl p-3 sm:p-4 mb-6`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center space-x-2">
                <Coffee className="w-4 sm:w-5 h-4 sm:h-5 text-amber-600" />
                <span className={`text-sm sm:text-base font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  Coffee Collection ({filteredCoffees.length} of {coffees.length} coffees)
                </span>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0">
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
            // For price and value sorting, show a flat list
            if (sortBy === 'priceLowHigh' || sortBy === 'priceHighLow' || sortBy === 'value') {
              return filteredCoffees.map((coffee) => (
                <CoffeeCard 
                  key={coffee.id} 
                  coffee={coffee} 
                  onEdit={() => handleEdit(coffee)}
                  onDelete={() => handleDelete(coffee.id)}
                  onToggleFavorite={() => handleToggleFavorite(coffee.id)}
                  onDuplicate={() => handleDuplicate(coffee)}
                  darkMode={darkMode}
                  onShowRadar={setSelectedCoffeeForRadar}
                />
              ));
            }
            
            // For other sorting, group by roaster
            const roasterGroups = filteredCoffees.reduce((roasters, coffee) => {
              const roaster = coffee.roaster.split(' - ')[0] || coffee.roaster; // Get main roaster name
              if (!roasters[roaster]) roasters[roaster] = [];
              roasters[roaster].push(coffee);
              return roasters;
            }, {});
            
            // Sort roasters based on the selected sort option
            const sortedRoasters = Object.entries(roasterGroups).sort(([roasterA, coffeesA], [roasterB, coffeesB]) => {
              if (sortBy === 'roaster') {
                return roasterA.localeCompare(roasterB);
              } else if (sortBy === 'rating') {
                const avgRatingA = coffeesA.reduce((sum, c) => sum + c.tasteRating, 0) / coffeesA.length;
                const avgRatingB = coffeesB.reduce((sum, c) => sum + c.tasteRating, 0) / coffeesB.length;
                return avgRatingB - avgRatingA;
              } else {
                // Default: sort by favorites and rating
                const avgRatingA = coffeesA.reduce((sum, c) => sum + c.tasteRating, 0) / coffeesA.length;
                const avgRatingB = coffeesB.reduce((sum, c) => sum + c.tasteRating, 0) / coffeesB.length;
                const favCountA = coffeesA.filter(c => c.favorite).length;
                const favCountB = coffeesB.filter(c => c.favorite).length;
                
                if (favCountA !== favCountB) return favCountB - favCountA;
                if (Math.abs(avgRatingA - avgRatingB) > 0.1) return avgRatingB - avgRatingA;
                return roasterA.localeCompare(roasterB);
              }
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
              
              // Calculate average price per cup for this roaster
              const coffeesWithPrice = roasterCoffees.filter(c => c.price && !isNaN(parseFloat(c.price)));
              const avgPricePerCup = coffeesWithPrice.length > 0 
                ? (coffeesWithPrice.reduce((sum, c) => sum + parseFloat(calculateCostPerCup(c).costPerCup), 0) / coffeesWithPrice.length).toFixed(3)
                : null;
              
              return (
                <div key={roasterName} className="space-y-4">
                  {/* Roaster Header */}
                  <div 
                    className={`${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gradient-to-r from-amber-100 to-orange-100 hover:from-amber-200 hover:to-orange-200'} rounded-xl p-4 border-l-4 border-amber-500 cursor-pointer transition-colors`}
                    onClick={() => toggleRoasterCollapse(roasterName)}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex items-center flex-wrap gap-2">
                        <div className="flex items-center space-x-2">
                          {isCollapsed ? (
                            <ChevronDown className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                          ) : (
                            <ChevronUp className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                          )}
                          <h2 className={`text-lg sm:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'} break-words`}>
                            ☕ {roasterName}
                          </h2>
                        </div>
                        <span className={`text-sm px-2 sm:px-3 py-1 rounded-full font-medium ${darkMode ? 'bg-gray-600 text-gray-200' : 'bg-white text-gray-700'}`}>
                          {roasterCoffees.length} coffee{roasterCoffees.length !== 1 ? 's' : ''}
                        </span>
                        {favoriteCount > 0 && (
                          <span className={`text-sm px-2 sm:px-3 py-1 rounded-full font-medium ${darkMode ? 'bg-yellow-900 text-yellow-100' : 'bg-yellow-100 text-yellow-800'}`}>
                            ⭐ {favoriteCount} favorite{favoriteCount !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} hidden sm:inline`}>
                            Avg:
                          </span>
                          <div className="flex items-center flex-nowrap min-w-0">
                            <div className="flex-shrink-0 overflow-hidden">
                              <StarRating rating={Math.round(avgRating)} readOnly size="small" />
                            </div>
                            <span className={`ml-1 text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'} whitespace-nowrap flex-shrink-0`}>
                              {avgRating.toFixed(1)}
                            </span>
                          </div>
                        </div>
                        {avgPricePerCup && (
                          <div className="flex items-center space-x-1">
                            <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              €/cup:
                            </span>
                            <span className={`text-sm font-semibold ${darkMode ? 'text-green-400' : 'text-green-600'} whitespace-nowrap`}>
                              {avgPricePerCup}
                            </span>
                          </div>
                        )}
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
                    <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} rounded-2xl shadow-xl p-4 md:p-6 border-l-4 border-blue-500`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <h3 className="text-lg sm:text-xl font-bold break-words">{mainCoffee.roaster}</h3>
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
                            
                            {(mainCoffee.grindingDegree || mainCoffee.coffeeAmount) && (
                              <div className="flex items-center space-x-2 flex-wrap">
                                {mainCoffee.grindingDegree && (
                                  <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                                    Grinder Level: {mainCoffee.grindingDegree}
                                  </span>
                                )}
                                {mainCoffee.coffeeAmount && (
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                    {mainCoffee.coffeeAmount}g coffee{mainCoffee.servings && mainCoffee.brewingMethod === 'coldbrew' ? ` (${mainCoffee.servings} servings)` : ''}
                                  </span>
                                )}
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
                                {coffee.brewingMethod && (
                                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${darkMode ? 'bg-blue-900 text-blue-100' : 'bg-blue-100 text-blue-800'}`} title="Brewing method">
                                    {brewingMethods.find(m => m.id === coffee.brewingMethod)?.icon} {brewingMethods.find(m => m.id === coffee.brewingMethod)?.name || coffee.brewingMethod}
                                  </span>
                                )}
                                {coffee.favorite && <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />}
                              </div>
                              
                              {coffee.preparationNotes && (
                                <div className="mb-3">
                                  <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Method: </span>
                                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} italic`}>{coffee.preparationNotes}</span>
                                </div>
                              )}
                              
                              <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-3">
                                <div className="min-w-0">
                                  <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} block mb-1`}>Crema</span>
                                  <div className="overflow-hidden">
                                    <StarRating rating={coffee.cremaRating} readOnly />
                                  </div>
                                </div>
                                <div className="min-w-0">
                                  <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} block mb-1`}>Taste</span>
                                  <div className="overflow-hidden">
                                    <StarRating rating={coffee.tasteRating} readOnly />
                                  </div>
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
            <div key={coffee.id} className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} rounded-2xl shadow-xl p-4 md:p-6 hover:shadow-2xl transition-all`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h3 className="text-lg sm:text-xl font-bold break-words">{coffee.roaster}</h3>
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
                    
                    {(coffee.grindingDegree || coffee.coffeeAmount) && (
                      <div className="flex items-center space-x-2 flex-wrap">
                        {coffee.grindingDegree && (
                          <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                            Grinder Level: {coffee.grindingDegree}
                          </span>
                        )}
                        {coffee.coffeeAmount && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {coffee.coffeeAmount}g coffee{coffee.servings && coffee.brewingMethod === 'coldbrew' ? ` (${coffee.servings} servings)` : ''}
                          </span>
                        )}
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
                  
                  <div className="flex items-center space-x-4 sm:space-x-6 mb-4 flex-wrap">
                    <div className="min-w-0">
                      <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} block`}>Crema</span>
                      <div className="overflow-hidden">
                        <StarRating rating={coffee.cremaRating} readOnly />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} block`}>Taste</span>
                      <div className="overflow-hidden">
                        <StarRating rating={coffee.tasteRating} readOnly />
                      </div>
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
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-xl p-8 sm:p-12 text-center`}>
            <Coffee className={`w-12 sm:w-16 h-12 sm:h-16 ${darkMode ? 'text-gray-600' : 'text-gray-300'} mx-auto mb-4`} />
            <h3 className={`text-xl font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>No coffees found</h3>
            <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
              {searchTerm || filterFavorites ? 'Try adjusting your search or filters' : 'Add your first coffee to get started!'}
            </p>
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {(isLoading || isSaving) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} rounded-lg p-6 shadow-xl`}>
            <div className="flex items-center space-x-3">
              <RefreshCw className="w-6 h-6 animate-spin text-amber-600" />
              <span className="text-lg">{isLoading ? 'Loading...' : 'Saving...'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Cloud Migration Modal */}
      {showMigrationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Database className="w-6 h-6 text-amber-600" />
                  <h2 className="text-2xl font-bold">Cloud Database Setup</h2>
                </div>
                <button
                  onClick={() => setShowMigrationModal(false)}
                  className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>

              <div className="space-y-4">
                {/* Status */}
                <div className={`p-4 rounded-lg ${cloudStatus.enabled ? (darkMode ? 'bg-green-900 text-green-100' : 'bg-green-50 text-green-900') : (darkMode ? 'bg-gray-700' : 'bg-gray-100')}`}>
                  <div className="flex items-center space-x-2 mb-2">
                    {cloudStatus.enabled ? <Cloud className="w-5 h-5" /> : <CloudOff className="w-5 h-5" />}
                    <span className="font-semibold">
                      {cloudStatus.enabled ? 'Cloud Storage Active' : 'Cloud Storage Not Configured'}
                    </span>
                  </div>
                  <p className="text-sm">
                    {cloudStatus.enabled
                      ? 'Your coffee data is being synced to Supabase cloud database.'
                      : 'Set up Supabase to sync your coffee data across devices.'}
                  </p>
                  {cloudStatus.error && (
                    <p className="text-sm text-red-400 mt-2">Error: {cloudStatus.error}</p>
                  )}
                </div>

                {/* Setup Instructions */}
                {!cloudStatus.enabled && (
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <h3 className="font-semibold mb-2">Setup Instructions:</h3>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li>Create a free account at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline">supabase.com</a></li>
                      <li>Create a new project</li>
                      <li>Go to Settings → API</li>
                      <li>Copy your project URL and anon/public key</li>
                      <li>Create a <code className={`px-1 py-0.5 rounded ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>.env</code> file in your project root:</li>
                    </ol>
                    <pre className={`mt-3 p-3 rounded text-xs overflow-x-auto ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
{`REACT_APP_SUPABASE_URL=your-project-url
REACT_APP_SUPABASE_ANON_KEY=your-anon-key`}
                    </pre>
                    <ol start="6" className="list-decimal list-inside space-y-2 text-sm mt-3">
                      <li>In Supabase SQL Editor, create the coffees table:</li>
                    </ol>
                    <pre className={`mt-2 p-3 rounded text-xs overflow-x-auto ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
{`CREATE TABLE coffees (
  id BIGINT PRIMARY KEY,
  cuppingTime TIMESTAMP,
  roaster TEXT,
  description TEXT,
  origin TEXT,
  url TEXT,
  percentArabica INTEGER,
  percentRobusta INTEGER,
  roastLevel TEXT,
  brewingMethod TEXT,
  recommendedMethod TEXT,
  grinded BOOLEAN,
  grindingTime TEXT,
  grindingDegree TEXT,
  preparationNotes TEXT,
  coffeeAmount TEXT,
  servings TEXT,
  cremaRating INTEGER,
  tasteRating INTEGER,
  tasteNotes TEXT,
  comment TEXT,
  favorite BOOLEAN,
  price TEXT,
  packageSize INTEGER,
  currency TEXT,
  coffeeGroup TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);`}
                    </pre>
                    <ol start="7" className="list-decimal list-inside space-y-2 text-sm mt-3">
                      <li>Restart your development server</li>
                      <li>Refresh this page - the cloud icon should turn green</li>
                    </ol>
                  </div>
                )}

                {/* Migration Button */}
                {cloudStatus.enabled && (
                  <div className="flex space-x-3">
                    <button
                      onClick={handleMigrateToCloud}
                      disabled={cloudStatus.syncing}
                      className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                        cloudStatus.syncing
                          ? (darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-400')
                          : (darkMode ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-amber-500 hover:bg-amber-600 text-white')
                      }`}
                    >
                      {cloudStatus.syncing ? 'Migrating...' : 'Migrate localStorage to Cloud'}
                    </button>
                  </div>
                )}

                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <p><strong>Note:</strong> This app automatically falls back to localStorage if cloud is not configured. Your data is always safe locally.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoffeeTracker;