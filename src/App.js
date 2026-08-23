import React, { useState, useEffect, useRef } from 'react';
import { Plus, Coffee, Star, Search, Trash2, Edit3, Calendar, Percent, ExternalLink, BarChart3, Moon, Sun, Download, Upload, FileText, RefreshCw, RotateCcw, Copy, ChevronDown, ChevronUp, Check, Cloud, CloudOff, Database, Lock, MoreHorizontal, Home, Settings, Bell, BellOff } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import jsPDF from 'jspdf';
import { personalCoffees } from './personal_coffees';
import { coffeeService } from './services/coffeeService';
import { authService } from './services/authService';
import AuthScreen from './components/AuthScreen';
import { pushSupported, pushStatus, enablePush, disablePush, reportFailure } from './services/pushService';

// Extracted modules
import { brewingMethods } from './constants/brewingMethods';
// tasteAttributes used via TasteProfile component
import { commonCountries, countryFlags, commonPreparationNotes, getRoastBadge } from './constants/countries';
import useDarkMode from './hooks/useDarkMode';
import useEquipment from './hooks/useEquipment';
import GlassCard from './components/shared/GlassCard';
import Modal from './components/shared/Modal';
import StarRating from './components/shared/StarRating';
import ComboBox from './components/shared/ComboBox';
import TasteProfile from './components/shared/TasteProfile';
import { StatsSkeleton, CoffeeListSkeleton } from './components/shared/SkeletonLoader';
import EquipmentSelector from './components/equipment/EquipmentSelector';
import EquipmentManager from './components/equipment/EquipmentManager';

const defaultCoffees = personalCoffees;

const CoffeeTracker = () => {
  const [coffees, setCoffees] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCoffee, setEditingCoffee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFavorites, setFilterFavorites] = useState(true);
  const [sortBy, setSortBy] = useState('value');
  const [darkMode, toggleDarkMode] = useDarkMode();
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
  const [pinVerified, setPinVerified] = useState(() => authService.isSessionValid());
  const fileInputRef = useRef(null);
  const formRef = useRef(null);

  // Equipment
  const { equipment, activeEquipment, addEquipment, updateEquipment, deleteEquipment, switchEquipment } = useEquipment();
  const [showEquipmentManager, setShowEquipmentManager] = useState(false);
  const [filterEquipmentId, setFilterEquipmentId] = useState(null);

  // Header overflow menu
  const [showOverflowMenu, setShowOverflowMenu] = useState(false);
  const overflowRef = useRef(null);

  // Nachschub-Alarm (Web Push)
  const [pushOn, setPushOn] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  // Der Schalter folgt der DB-ZEILE, nicht dem Browser-Abo: der Cron
  // verschickt nur an das, was in der Tabelle steht.
  const refreshPush = React.useCallback(async () => {
    if (!pushSupported()) return null;
    const st = await pushStatus();
    setPushOn(st.db);
    return st;
  }, []);
  useEffect(() => { refreshPush().catch(() => {}); }, [refreshPush]);
  const handleTogglePush = async () => {
    if (pushBusy) return;
    setPushBusy(true);
    try {
      if (pushOn) {
        await disablePush();
        alert('Nachschub-Alarm aus.');
      } else {
        await enablePush();
        alert('Nachschub-Alarm an. Die Meldung kommt, wenn der Vorrat zur Neige geht.');
      }
    } catch (e) {
      // Diagnose mitgeben: ohne sie sieht ein Fehlschlag genauso aus wie
      // "nichts passiert", und der Schalter erklaert sich nicht.
      let extra = '';
      try {
        const st = await pushStatus();
        extra = `\n\nStand: Berechtigung=${st.permission}, Browser-Abo=${st.browser ? 'ja' : 'nein'}, `
              + `Cloud-Zeile=${st.db ? 'ja' : 'nein'}${st.error ? `, Fehler=${st.error}` : ''}`;
      } catch (_) { /* Diagnose ist Beiwerk, nicht der Zweck */ }
      reportFailure(pushOn ? 'disable' : 'enable', e.message);
      alert(`Nachschub-Alarm fehlgeschlagen:\n${e.message}${extra}\n\n(Der Fehler wurde gemeldet.)`);
    } finally {
      await refreshPush().catch(() => {});
      setPushBusy(false);
    }
  };

  // Filter chips
  const [filterBrewingMethod, setFilterBrewingMethod] = useState(null);
  const [filterRoastLevel, setFilterRoastLevel] = useState(null);
  const [filterOrigin, setFilterOrigin] = useState(null);

  // Multi-step form
  const [formStep, setFormStep] = useState(0);
  const FORM_STEPS = ['Basics', 'Brewing', 'Tasting', 'Details'];

  // Mobile nav
  const [mobileView, setMobileView] = useState('home'); // home, search, add, analytics

  // Data version for migration management
  const DATA_VERSION = '2.1';

  // Close overflow menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (overflowRef.current && !overflowRef.current.contains(event.target)) {
        setShowOverflowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Check if PIN session is still valid on mount
  useEffect(() => {
    setPinVerified(authService.isSessionValid());
  }, []);

  // Load data from database on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const data = await coffeeService.getAllCoffees();
        const wasFallback = coffeeService.didFallBack();
        const fetchError = coffeeService.getLastFetchError();

        if (data.length === 0) {
          console.log('No data found, using default data');
          setCoffees(defaultCoffees);
        } else {
          const coffeesWithDates = data.map(coffee => ({
            ...coffee,
            cuppingTime: new Date(coffee.cuppingTime)
          }));
          setCoffees(coffeesWithDates);
        }

        setCloudStatus(prev => ({
          ...prev,
          enabled: coffeeService.isCloudEnabled(),
          error: wasFallback ? (fetchError || 'Supabase connection failed - showing local data') : null
        }));
      } catch (error) {
        console.error('Error loading data:', error);
        setCloudStatus(prev => ({ ...prev, error: 'Failed to load data' }));
        setCoffees(defaultCoffees);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [pinVerified]);

  // Save collapsed roasters state
  useEffect(() => {
    localStorage.setItem('collapsedRoasters', JSON.stringify(collapsedRoasters));
  }, [collapsedRoasters]);

  const toggleRoasterCollapse = (roasterName) => {
    setCollapsedRoasters(prev => ({ ...prev, [roasterName]: !prev[roasterName] }));
  };

  const expandAllRoasters = () => setCollapsedRoasters({});

  const collapseAllRoasters = () => {
    const roasterNames = [...new Set(filteredCoffees.map(coffee =>
      coffee.roaster.split(' - ')[0] || coffee.roaster
    ))];
    const allCollapsed = {};
    roasterNames.forEach(name => { allCollapsed[name] = true; });
    setCollapsedRoasters(allCollapsed);
  };

  const scrollToForm = () => {
    setTimeout(() => {
      if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Parse taste notes for radar chart
  const parseTasteProfile = (tasteNotes) => {
    const profile = { chocolate: 0, nutty: 0, fruity: 0, floral: 0, earthy: 0, spicy: 0, sweet: 0, acidic: 0 };
    if (!tasteNotes) return profile;
    const notes = tasteNotes.toLowerCase();

    if (notes.includes('chocolate') || notes.includes('cocoa') || notes.includes('cacao')) profile.chocolate = 4;
    if (notes.includes('dark chocolate')) profile.chocolate = 5;
    if (notes.includes('nutty') || notes.includes('nut')) profile.nutty = 3;
    if (notes.includes('almond') || notes.includes('hazelnut') || notes.includes('walnut') || notes.includes('pecan')) profile.nutty = Math.max(profile.nutty, 4);
    if (notes.includes('fruity') || notes.includes('fruit')) profile.fruity = 4;
    if (notes.includes('berry') || notes.includes('berries') || notes.includes('citrus')) profile.fruity = Math.max(profile.fruity, 4);
    if (notes.includes('lemon')) profile.fruity = Math.max(profile.fruity, 3);
    if (notes.includes('floral') || notes.includes('flower') || notes.includes('jasmine')) profile.floral = 4;
    if (notes.includes('earthy') || notes.includes('woody') || notes.includes('wood')) profile.earthy = 4;
    if (notes.includes('spicy') || notes.includes('spice')) profile.spicy = 4;
    if (notes.includes('cinnamon')) profile.spicy = Math.max(profile.spicy, 3);
    if (notes.includes('sweet')) profile.sweet = 3;
    if (notes.includes('caramel') || notes.includes('honey')) profile.sweet = Math.max(profile.sweet, 4);
    if (notes.includes('sugar')) profile.sweet = Math.max(profile.sweet, 3);
    if (notes.includes('acid') || notes.includes('bright') || notes.includes('lively')) profile.acidic = 4;
    if (notes.includes('low acidity') || notes.includes('no acidity')) profile.acidic = 1;

    return profile;
  };

  // Cost calculation
  const calculateCostPerCup = (coffee) => {
    if (!coffee.price || !coffee.packageSize) return null;
    const pricePerGram = parseFloat(coffee.price) / coffee.packageSize;
    let gramsPerCup;
    if (coffee.coffeeAmount && !isNaN(parseFloat(coffee.coffeeAmount))) {
      const totalCoffeeAmount = parseFloat(coffee.coffeeAmount);
      if (coffee.brewingMethod === 'coldbrew' && coffee.servings && !isNaN(parseFloat(coffee.servings))) {
        gramsPerCup = totalCoffeeAmount / parseFloat(coffee.servings);
      } else {
        gramsPerCup = totalCoffeeAmount;
      }
    } else {
      switch(coffee.brewingMethod) {
        case 'coldbrew': gramsPerCup = 30; break;
        case 'filter': case 'v60': case 'chemex': case 'dripper': gramsPerCup = 15; break;
        case 'frenchpress': gramsPerCup = 17; break;
        default: gramsPerCup = 18; break;
      }
    }
    const costPerCup = pricePerGram * gramsPerCup;
    return {
      costPerCup: costPerCup.toFixed(3),
      pricePerKg: (parseFloat(coffee.price) / coffee.packageSize * 1000).toFixed(2),
      currency: coffee.currency || 'EUR',
      gramsUsed: gramsPerCup.toFixed(1),
      batchInfo: coffee.brewingMethod === 'coldbrew' && coffee.servings ?
        `${coffee.coffeeAmount}g / ${coffee.servings} servings` : null
    };
  };

  const calculateValueScore = (coffee) => {
    const cost = calculateCostPerCup(coffee);
    if (!cost || coffee.tasteRating === 0) return null;
    return (coffee.tasteRating / parseFloat(cost.costPerCup)).toFixed(1);
  };

  const getEfficiencyColor = (score, darkMode) => {
    const val = parseFloat(score);
    if (val >= 8) return darkMode ? 'text-green-400' : 'text-green-600';
    if (val >= 5) return darkMode ? 'text-yellow-400' : 'text-yellow-600';
    return darkMode ? 'text-red-400' : 'text-red-600';
  };

  const getEfficiencyBgColor = (score, darkMode) => {
    const val = parseFloat(score);
    if (val >= 8) return darkMode ? 'bg-green-900/40 border-green-700' : 'bg-green-50 border-green-300';
    if (val >= 5) return darkMode ? 'bg-yellow-900/40 border-yellow-700' : 'bg-yellow-50 border-yellow-300';
    return darkMode ? 'bg-red-900/40 border-red-700' : 'bg-red-50 border-red-300';
  };

  const getEfficiencyLabel = (score) => {
    const val = parseFloat(score);
    if (val >= 8) return 'Top Deal';
    if (val >= 5) return 'Fair';
    return 'Overpriced';
  };

  // Analytics
  const getAnalyticsData = () => {
    const roasterCounts = coffees.reduce((acc, coffee) => {
      const roaster = coffee.roaster.split(' - ')[0].trim();
      acc[roaster] = (acc[roaster] || 0) + 1;
      return acc;
    }, {});
    const roasterData = Object.entries(roasterCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    const totalCoffees = coffees.length;
    const avgArabica = totalCoffees > 0 ? coffees.reduce((sum, c) => sum + c.percentArabica, 0) / totalCoffees : 50;
    const blendData = [
      { name: 'Arabica', value: Math.round(avgArabica), fill: '#8B4513' },
      { name: 'Robusta', value: Math.round(100 - avgArabica), fill: '#D2691E' }
    ];

    const ratingTrends = coffees
      .sort((a, b) => new Date(a.cuppingTime) - new Date(b.cuppingTime))
      .map((coffee, index) => ({
        date: new Date(coffee.cuppingTime).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        rating: coffee.tasteRating,
        crema: coffee.cremaRating,
        name: coffee.roaster.split(' - ')[0],
        index: index + 1
      }));

    const roastLevelCounts = coffees.reduce((acc, coffee) => {
      const level = coffee.roastLevel || 'unknown';
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {});
    const roastLevelData = Object.entries(roastLevelCounts)
      .map(([level, count]) => ({
        level: level.charAt(0).toUpperCase() + level.slice(1),
        count,
        fill: level === 'light' ? '#D2B48C' : level === 'medium' ? '#8B4513' : level === 'medium-dark' ? '#654321' : level === 'dark' ? '#3C1810' : '#A0A0A0'
      }));

    const originCounts = coffees.reduce((acc, coffee) => {
      if (coffee.origin) {
        coffee.origin.split(',').map(c => c.trim()).forEach(country => {
          if (countryFlags[country]) acc[country] = (acc[country] || 0) + 1;
        });
      }
      return acc;
    }, {});
    const originData = Object.entries(originCounts)
      .map(([code, count]) => ({ country: countryFlags[code]?.name || code, code, count, flag: countryFlags[code]?.flag || '🌍' }))
      .sort((a, b) => b.count - a.count).slice(0, 8);

    const grindByBrand = coffees
      .filter(c => c.grindingDegree && !isNaN(parseInt(c.grindingDegree)))
      .reduce((acc, coffee) => {
        const brand = coffee.roaster.split(' - ')[0].trim();
        const grind = parseInt(coffee.grindingDegree);
        if (!acc[brand]) acc[brand] = { total: 0, count: 0, grinds: [] };
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
    roaster: '', description: '', favorite: false, grinded: false,
    grindingTime: '', grindingDegree: '', coffeeAmount: '', servings: '',
    percentArabica: 100, percentRobusta: 0, cremaRating: 0, tasteRating: 0,
    tasteNotes: '', url: '', imageUrl: '', comment: '', origin: '', roastLevel: 'medium',
    brewingMethod: 'espresso', recommendedMethod: 'espresso',
    price: '', packageSize: 1000, currency: 'EUR', preparationNotes: '', coffeeGroup: ''
  });

  const resetForm = () => {
    setFormData({
      roaster: '', description: '', favorite: false, grinded: false,
      grindingTime: '', grindingDegree: '', coffeeAmount: '', servings: '',
      percentArabica: 100, percentRobusta: 0, cremaRating: 0, tasteRating: 0,
      tasteNotes: '', url: '', imageUrl: '', comment: '', origin: '', roastLevel: 'medium',
      brewingMethod: 'espresso', recommendedMethod: 'espresso',
      price: '', packageSize: 1000, currency: 'EUR', preparationNotes: '', coffeeGroup: ''
    });
    setFormStep(0);
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
        url: formData.url || '',
        imageUrl: formData.imageUrl || '',
        equipmentId: editingCoffee ? (editingCoffee.equipmentId || activeEquipment?.id || null) : (activeEquipment?.id || null)
      };

      if (editingCoffee) {
        const result = await coffeeService.updateCoffee(editingCoffee.id, newCoffee);
        if (result.success) {
          setCoffees(coffees.map(coffee => coffee.id === editingCoffee.id ? newCoffee : coffee));
        } else {
          alert('Failed to update coffee. Please try again.');
          return;
        }
        setEditingCoffee(null);
      } else {
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
      roaster: coffee.roaster, description: coffee.description,
      favorite: coffee.favorite, grinded: coffee.grinded,
      grindingTime: coffee.grindingTime || '', grindingDegree: coffee.grindingDegree || '',
      coffeeAmount: coffee.coffeeAmount || '', servings: coffee.servings || '',
      percentArabica: coffee.percentArabica, percentRobusta: coffee.percentRobusta,
      cremaRating: coffee.cremaRating, tasteRating: coffee.tasteRating,
      tasteNotes: coffee.tasteNotes || '', url: coffee.url || '',
      imageUrl: coffee.imageUrl || '',
      comment: coffee.comment || '', origin: coffee.origin || '',
      roastLevel: coffee.roastLevel || 'medium',
      brewingMethod: coffee.brewingMethod || 'espresso',
      recommendedMethod: coffee.recommendedMethod || 'espresso',
      price: coffee.price || '', packageSize: coffee.packageSize || 1000,
      currency: coffee.currency || 'EUR',
      preparationNotes: coffee.preparationNotes || '',
      coffeeGroup: coffee.coffeeGroup || ''
    });
    setEditingCoffee(coffee);
    setShowAddForm(true);
    setFormStep(0);
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

  const handleCopy = async (coffee) => {
    try {
      const newCoffee = {
        ...coffee,
        id: Date.now(),
        cuppingTime: new Date(),
        cremaRating: 0, tasteRating: 0,
        preparationNotes: '', comment: '',
        equipmentId: activeEquipment?.id || coffee.equipmentId || null,
        coffeeGroup: coffee.coffeeGroup || `${coffee.roaster}-${coffee.description}`.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()
      };

      const result = await coffeeService.addCoffee(newCoffee);
      if (!result.success) { alert('Failed to copy coffee.'); return; }

      if (!coffee.coffeeGroup) {
        const updatedOriginal = { ...coffee, coffeeGroup: newCoffee.coffeeGroup };
        await coffeeService.updateCoffee(coffee.id, updatedOriginal);
        setCoffees(coffees.map(c => c.id === coffee.id ? updatedOriginal : c).concat(newCoffee));
      } else {
        setCoffees([...coffees, newCoffee]);
      }

      setFormData({
        roaster: newCoffee.roaster, description: newCoffee.description,
        favorite: newCoffee.favorite, grinded: newCoffee.grinded,
        grindingTime: newCoffee.grindingTime || '', grindingDegree: newCoffee.grindingDegree || '',
        coffeeAmount: newCoffee.coffeeAmount || '', servings: newCoffee.servings || '',
        percentArabica: newCoffee.percentArabica, percentRobusta: newCoffee.percentRobusta,
        cremaRating: newCoffee.cremaRating, tasteRating: newCoffee.tasteRating,
        tasteNotes: newCoffee.tasteNotes || '', url: newCoffee.url || '',
        imageUrl: newCoffee.imageUrl || '',
        comment: newCoffee.comment || '', origin: newCoffee.origin || '',
        roastLevel: newCoffee.roastLevel || 'medium',
        brewingMethod: newCoffee.brewingMethod || 'espresso',
        recommendedMethod: newCoffee.recommendedMethod || 'espresso',
        price: newCoffee.price || '', packageSize: newCoffee.packageSize || 1000,
        currency: newCoffee.currency || 'EUR',
        preparationNotes: newCoffee.preparationNotes || '',
        coffeeGroup: newCoffee.coffeeGroup
      });
      setEditingCoffee(newCoffee);
      setShowAddForm(true);
      setFormStep(0);
      scrollToForm();
    } catch (error) {
      console.error('Error copying coffee:', error);
    }
  };

  const handleToggleFavorite = async (id) => {
    const coffee = coffees.find(c => c.id === id);
    if (!coffee) return;
    try {
      const updatedCoffee = { ...coffee, favorite: !coffee.favorite };
      const result = await coffeeService.updateCoffee(id, updatedCoffee);
      if (result.success) {
        setCoffees(coffees.map(c => c.id === id ? updatedCoffee : c));
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  // Export
  const handleExport = () => {
    const dataToExport = { version: '1.0', exportDate: new Date().toISOString(), coffees };
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

  // PDF Export
  const handlePDFExport = () => {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    let yPosition = 20;
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('Coffee Collection', 20, yPosition);
    yPosition += 15;
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(`Total Coffees: ${coffees.length}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Favorites: ${coffees.filter(c => c.favorite).length}`, 20, yPosition);
    yPosition += 8;
    const avgRating = coffees.length > 0 ? (coffees.reduce((sum, c) => sum + c.tasteRating, 0) / coffees.length).toFixed(1) : '0';
    doc.text(`Average Rating: ${avgRating}/5`, 20, yPosition);
    yPosition += 15;
    doc.setFont(undefined, 'bold');
    doc.text('Coffee Details:', 20, yPosition);
    yPosition += 10;
    doc.setFont(undefined, 'normal');
    const sortedCoffees = [...coffees].sort((a, b) => b.tasteRating - a.tasteRating);
    sortedCoffees.forEach((coffee, index) => {
      if (yPosition > pageHeight - 40) { doc.addPage(); yPosition = 20; }
      doc.setFont(undefined, 'bold');
      doc.setFontSize(12);
      doc.text(`${index + 1}. ${coffee.roaster}`, 20, yPosition);
      yPosition += 6;
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      doc.text(`Description: ${coffee.description}`, 25, yPosition); yPosition += 5;
      const stars = (rating) => String.fromCharCode(9733).repeat(rating) + String.fromCharCode(9734).repeat(5 - rating);
      doc.text(`Taste: ${stars(coffee.tasteRating)} (${coffee.tasteRating}/5)`, 25, yPosition); yPosition += 5;
      doc.text(`Crema: ${stars(coffee.cremaRating)} (${coffee.cremaRating}/5)`, 25, yPosition); yPosition += 5;
      doc.text(`Blend: ${coffee.percentArabica}% Arabica, ${coffee.percentRobusta}% Robusta`, 25, yPosition); yPosition += 5;
      if (coffee.roastLevel) { doc.text(`Roast: ${coffee.roastLevel.charAt(0).toUpperCase() + coffee.roastLevel.slice(1)}`, 25, yPosition); yPosition += 5; }
      if (coffee.brewingMethod) {
        const method = brewingMethods.find(m => m.id === coffee.brewingMethod);
        doc.text(`Your Method: ${method ? method.name : coffee.brewingMethod}`, 25, yPosition); yPosition += 5;
      }
      if (coffee.origin) {
        const origins = coffee.origin.split(',').map(code => { const c = countryFlags[code.trim()]; return c ? c.name : code.trim(); }).join(', ');
        doc.text(`Origin: ${origins}`, 25, yPosition); yPosition += 5;
      }
      if (coffee.tasteNotes) { const lines = doc.splitTextToSize(`Taste Notes: ${coffee.tasteNotes}`, 160); lines.forEach(line => { doc.text(line, 25, yPosition); yPosition += 5; }); }
      if (coffee.preparationNotes) { doc.text(`Preparation: ${coffee.preparationNotes}`, 25, yPosition); yPosition += 5; }
      if (coffee.comment) { const lines = doc.splitTextToSize(`Notes: ${coffee.comment}`, 160); lines.forEach(line => { doc.text(line, 25, yPosition); yPosition += 5; }); }
      doc.text(`Cupped: ${new Date(coffee.cuppingTime).toLocaleDateString()}`, 25, yPosition); yPosition += 5;
      if (coffee.price) {
        doc.text(`Price: ${coffee.price} ${coffee.currency || 'EUR'} / ${coffee.packageSize || 1000}g`, 25, yPosition); yPosition += 5;
        const cost = calculateCostPerCup(coffee);
        if (cost) { doc.text(`Cost per cup: ${cost.costPerCup} ${cost.currency}`, 25, yPosition); yPosition += 5; }
      }
      if (coffee.favorite) { doc.text('FAVORITE', 25, yPosition); yPosition += 5; }
      yPosition += 5;
    });
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Generated by Coffee Tracker - Page ${i} of ${totalPages}`, 20, pageHeight - 10);
      doc.text(new Date().toLocaleDateString(), doc.internal.pageSize.width - 50, pageHeight - 10);
    }
    doc.save(`coffee-collection-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleResetToDefaults = () => {
    const storageInfo = getStorageInfo();
    const confirmText = 'RESET ALL DATA';
    const userInput = prompt(
      `WARNING: This will PERMANENTLY DELETE all your coffee data!\n\nYou will lose:\n- ${coffees.length} coffee entries\n- All your personal ratings and comments\n- ${storageInfo ? storageInfo.sizeKB : '?'}KB of stored data\n\nThis CANNOT be undone!\n\nType exactly: ${confirmText}`
    );
    if (userInput === confirmText) {
      if (window.confirm('FINAL WARNING: Are you absolutely sure?')) {
        const resetData = async () => {
          setIsSaving(true);
          try {
            if (coffeeService.isCloudEnabled()) await coffeeService.clearCloudData();
            localStorage.removeItem('coffeeTrackerData');
            localStorage.removeItem('coffeeTrackerVersion');
            localStorage.removeItem('coffeeTrackerLastSaved');
            await coffeeService.saveAllCoffees(defaultCoffees);
            setCoffees(defaultCoffees);
            localStorage.setItem('coffeeTrackerVersion', DATA_VERSION);
            alert('Data reset to defaults.');
          } catch (error) {
            console.error('Error resetting data:', error);
            alert('Error resetting data.');
          } finally {
            setIsSaving(false);
          }
        };
        resetData();
      }
    } else if (userInput !== null) {
      alert('Reset cancelled. Text did not match.');
    }
  };

  const handleForceRefresh = async () => {
    if (window.confirm('Update your data with any missing fields from the latest version?')) {
      setIsSaving(true);
      try {
        const migratedData = coffees.map(coffee => ({
          ...coffee,
          brewingMethod: coffee.brewingMethod || 'espresso',
          recommendedMethod: coffee.recommendedMethod || 'espresso',
          price: coffee.price || '',
          packageSize: coffee.packageSize || 1000,
          currency: coffee.currency || 'EUR',
          preparationNotes: coffee.preparationNotes || (new Date(coffee.cuppingTime) < new Date('2024-12-01') ? 'Pure espresso' : ''),
          coffeeGroup: coffee.coffeeGroup || '',
          equipmentId: coffee.equipmentId || null
        }));
        await coffeeService.saveAllCoffees(migratedData);
        setCoffees(migratedData);
        localStorage.setItem('coffeeTrackerVersion', DATA_VERSION);
        alert('Data migrated to latest version!');
      } catch (error) {
        console.error('Error refreshing:', error);
        alert('Error refreshing data.');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleMigrateToCloud = async () => {
    if (!coffeeService.isCloudEnabled()) { alert('Cloud storage not configured.'); return; }
    setCloudStatus(prev => ({ ...prev, syncing: true, error: null }));
    try {
      const result = await coffeeService.migrateToCloud();
      if (result.success) { alert(result.message || 'Successfully migrated!'); setShowMigrationModal(false); }
      else { alert('Migration failed: ' + (result.error?.message || 'Unknown error')); }
    } catch (error) {
      console.error('Migration error:', error);
      alert('Error during migration: ' + error.message);
    } finally {
      setCloudStatus(prev => ({ ...prev, syncing: false }));
    }
  };

  const handleLock = () => { authService.clearSession(); setPinVerified(false); setCoffees([]); };

  const getStorageInfo = () => {
    try {
      const data = localStorage.getItem('coffeeTrackerData');
      const version = localStorage.getItem('coffeeTrackerVersion');
      const lastSaved = localStorage.getItem('coffeeTrackerLastSaved');
      const sizeKB = data ? (new Blob([data]).size / 1024).toFixed(2) : '0';
      return { version, lastSaved: lastSaved ? new Date(lastSaved).toLocaleString() : 'Never', sizeKB, coffeeCount: coffees.length };
    } catch (error) { return null; }
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        if (!importedData.coffees || !Array.isArray(importedData.coffees)) {
          alert('Invalid file format.'); return;
        }
        const importedCoffees = importedData.coffees.map(coffee => ({
          ...coffee,
          cuppingTime: new Date(coffee.cuppingTime),
          id: coffee.id || Date.now() + Math.random(),
          equipmentId: coffee.equipmentId || null
        }));
        const shouldReplace = window.confirm(
          `Import ${importedCoffees.length} coffees?\n\nOK = Replace all\nCancel = Merge`
        );
        setIsSaving(true);
        if (shouldReplace) {
          const result = await coffeeService.saveAllCoffees(importedCoffees);
          if (result.success) { setCoffees(importedCoffees); alert(`Imported ${importedCoffees.length} coffees!`); }
          else { alert('Failed to import.'); }
        } else {
          const maxId = Math.max(...coffees.map(c => c.id), 0);
          const coffeesToAdd = importedCoffees.map((coffee, index) => ({ ...coffee, id: maxId + index + 1 }));
          let successCount = 0;
          for (const coffee of coffeesToAdd) {
            const result = await coffeeService.addCoffee(coffee);
            if (result.success) successCount++;
          }
          if (successCount > 0) { setCoffees([...coffees, ...coffeesToAdd]); alert(`Merged ${successCount} coffees!`); }
          else { alert('Failed to merge.'); }
        }
        setIsSaving(false);
      } catch (error) {
        console.error('Import error:', error);
        alert('Error importing file.');
        setIsSaving(false);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // Enhanced filtering
  const filteredCoffees = coffees
    .filter(coffee => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm ||
        coffee.roaster.toLowerCase().includes(term) ||
        coffee.description.toLowerCase().includes(term) ||
        (coffee.tasteNotes && coffee.tasteNotes.toLowerCase().includes(term)) ||
        (coffee.preparationNotes && coffee.preparationNotes.toLowerCase().includes(term)) ||
        (coffee.comment && coffee.comment.toLowerCase().includes(term));
      const matchesFavorite = !filterFavorites || coffee.favorite;
      const matchesEquipment = !filterEquipmentId || coffee.equipmentId === filterEquipmentId;
      const matchesBrewing = !filterBrewingMethod || coffee.brewingMethod === filterBrewingMethod;
      const matchesRoast = !filterRoastLevel || coffee.roastLevel === filterRoastLevel;
      const matchesOrigin = !filterOrigin || (coffee.origin && coffee.origin.includes(filterOrigin));
      return matchesSearch && matchesFavorite && matchesEquipment && matchesBrewing && matchesRoast && matchesOrigin;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'rating': return b.tasteRating - a.tasteRating;
        case 'roaster': return a.roaster.localeCompare(b.roaster);
        case 'priceLowHigh': {
          const costA = calculateCostPerCup(a); const costB = calculateCostPerCup(b);
          if (!costA?.costPerCup) return 1; if (!costB?.costPerCup) return -1;
          return parseFloat(costA.costPerCup) - parseFloat(costB.costPerCup);
        }
        case 'priceHighLow': {
          const cA = calculateCostPerCup(a); const cB = calculateCostPerCup(b);
          if (!cA?.costPerCup) return 1; if (!cB?.costPerCup) return -1;
          return parseFloat(cB.costPerCup) - parseFloat(cA.costPerCup);
        }
        case 'value': {
          const vA = calculateValueScore(a); const vB = calculateValueScore(b);
          if (!vA || isNaN(vA)) return 1; if (!vB || isNaN(vB)) return -1;
          return parseFloat(vB) - parseFloat(vA);
        }
        case 'date': default: return new Date(b.cuppingTime) - new Date(a.cuppingTime);
      }
    });

  const activeFiltersCount = [filterFavorites, filterEquipmentId, filterBrewingMethod, filterRoastLevel, filterOrigin].filter(Boolean).length;

  const clearAllFilters = () => {
    setFilterFavorites(false);
    setFilterEquipmentId(null);
    setFilterBrewingMethod(null);
    setFilterRoastLevel(null);
    setFilterOrigin(null);
    setSearchTerm('');
  };

  // Radar data
  const getRadarData = (coffee) => {
    const profile = parseTasteProfile(coffee.tasteNotes);
    return Object.entries(profile).map(([taste, value]) => ({
      taste: taste.charAt(0).toUpperCase() + taste.slice(1), value
    }));
  };

  const analytics = getAnalyticsData();

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={`${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'} p-3 rounded-lg shadow-lg border`}>
          <p className={`${darkMode ? 'text-white' : 'text-gray-900'} font-medium`}>{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>{`${entry.dataKey}: ${entry.value}`}</p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Get equipment name for a coffee
  const getEquipmentName = (coffee) => {
    if (!coffee.equipmentId) return null;
    const eq = equipment.find(e => e.id === coffee.equipmentId);
    return eq ? eq.name : null;
  };

  // Get unique origins used in coffees
  const usedOrigins = [...new Set(coffees.flatMap(c => c.origin ? c.origin.split(',').map(o => o.trim()) : []))].filter(o => countryFlags[o]);

  // PIN check
  if (!pinVerified) {
    return <AuthScreen onUnlock={() => setPinVerified(true)} />;
  }

  const inputClass = `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors ${
    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
  }`;

  // ==================== RENDER ====================
  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-amber-50 to-orange-100'} pb-20 md:pb-4 transition-colors`}>
      <div className="max-w-6xl mx-auto p-4">

        {/* ===== HEADER ===== */}
        <GlassCard darkMode={darkMode} className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            {/* Left: Logo */}
            <div className="flex items-center space-x-3">
              <Coffee className="w-8 h-8 text-amber-600" />
              <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                Coffee Tracker
              </h1>
            </div>

            {/* Center: Equipment Selector */}
            <div className="hidden md:block">
              <EquipmentSelector
                equipment={equipment}
                activeEquipment={activeEquipment}
                onSwitch={switchEquipment}
                onManage={() => setShowEquipmentManager(true)}
                darkMode={darkMode}
              />
            </div>

            {/* Right: Primary actions + overflow */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setShowAnalytics(!showAnalytics); setMobileView('analytics'); }}
                className={`${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white px-4 py-2 rounded-xl flex items-center space-x-2 transition-colors hidden sm:flex`}
              >
                <BarChart3 className="w-5 h-5" />
                <span>Analytics</span>
              </button>
              <button
                onClick={() => { resetForm(); setEditingCoffee(null); setShowAddForm(true); setFormStep(0); scrollToForm(); }}
                className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl flex items-center space-x-2 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Add Coffee</span>
              </button>

              {/* Overflow menu */}
              <div className="relative" ref={overflowRef}>
                <button
                  onClick={() => setShowOverflowMenu(!showOverflowMenu)}
                  className={`p-2 rounded-xl transition-colors ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>
                {showOverflowMenu && (
                  <div className={`absolute right-0 mt-2 w-56 rounded-xl shadow-xl border overflow-hidden z-50 animate-dropdown ${
                    darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                  }`}>
                    {[
                      { icon: <Download className="w-4 h-4" />, label: 'Export JSON', action: handleExport },
                      { icon: <FileText className="w-4 h-4" />, label: 'Export PDF', action: handlePDFExport },
                      { icon: <Upload className="w-4 h-4" />, label: 'Import Data', action: () => fileInputRef.current?.click() },
                      { icon: <RefreshCw className="w-4 h-4" />, label: 'Migrate Data', action: handleForceRefresh },
                      { divider: true },
                      { icon: cloudStatus.enabled ? <Cloud className="w-4 h-4" /> : <CloudOff className="w-4 h-4" />, label: 'Cloud Setup', action: () => setShowMigrationModal(true) },
                      { icon: <Lock className="w-4 h-4" />, label: 'Lock App', action: handleLock },
                      { icon: darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />, label: darkMode ? 'Light Mode' : 'Dark Mode', action: toggleDarkMode },
                      { icon: <Settings className="w-4 h-4" />, label: 'Equipment', action: () => setShowEquipmentManager(true) },
                      ...(pushSupported() ? [{
                        icon: pushOn ? <Bell className="w-4 h-4 text-amber-600" /> : <BellOff className="w-4 h-4" />,
                        label: pushOn ? 'Nachschub-Alarm aus' : 'Nachschub-Alarm an',
                        action: handleTogglePush,
                      }] : []),
                      { divider: true },
                      { icon: <RotateCcw className="w-4 h-4 text-red-500" />, label: 'Reset All Data', action: handleResetToDefaults, danger: true },
                    ].map((item, i) =>
                      item.divider ? (
                        <div key={i} className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`} />
                      ) : (
                        <button
                          key={i}
                          onClick={() => { setShowOverflowMenu(false); item.action(); }}
                          className={`w-full px-4 py-2.5 text-left text-sm flex items-center space-x-3 transition-colors ${
                            item.danger
                              ? darkMode ? 'text-red-400 hover:bg-red-900/30' : 'text-red-600 hover:bg-red-50'
                              : darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {item.icon}
                          <span>{item.label}</span>
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
            </div>
          </div>

          {/* Mobile equipment selector */}
          <div className="md:hidden mb-4">
            <EquipmentSelector
              equipment={equipment}
              activeEquipment={activeEquipment}
              onSwitch={switchEquipment}
              onManage={() => setShowEquipmentManager(true)}
              darkMode={darkMode}
            />
          </div>

          {/* Cloud Fallback Warning */}
          {cloudStatus.enabled && cloudStatus.error && (
            <div className={`mb-4 p-3 rounded-xl flex items-center gap-3 ${darkMode ? 'bg-amber-900/50 text-amber-200 border border-amber-700' : 'bg-amber-50 text-amber-800 border border-amber-300'}`}>
              <CloudOff className="w-5 h-5 flex-shrink-0" />
              <div className="text-sm">
                <strong>Supabase nicht erreichbar:</strong> {cloudStatus.error}. Es werden lokale Daten angezeigt ({coffees.length} Einträge).
              </div>
            </div>
          )}

          {/* Stats */}
          {isLoading ? (
            <StatsSkeleton darkMode={darkMode} />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { value: coffees.length, label: 'Total Coffees', color: 'text-amber-600' },
                { value: coffees.filter(c => c.favorite).length, label: 'Favorites', color: 'text-amber-600' },
                { value: coffees.length > 0 ? (coffees.reduce((sum, c) => sum + c.tasteRating, 0) / coffees.length).toFixed(1) : '0', label: 'Avg Rating', color: 'text-amber-600' },
                { value: analytics.avgCostPerCup ? `${analytics.avgCostPerCup} €` : 'N/A', label: 'Avg Cost/Cup', color: 'text-green-600' },
              ].map((stat, i) => (
                <div key={i} className={`${darkMode ? 'bg-gray-700/50' : 'bg-amber-50/80'} p-4 rounded-xl transition-colors`}>
                  <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                  <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{stat.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Storage Info */}
          {(() => {
            const storageInfo = getStorageInfo();
            return storageInfo && (
              <div className={`${darkMode ? 'bg-gray-700/50' : 'bg-blue-50/80'} p-3 rounded-xl mt-4 border-l-4 border-blue-500`}>
                <div className="flex items-center justify-between flex-wrap gap-2 text-sm">
                  <div className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                    Data v<span className="font-mono">{storageInfo.version}</span> | <span className="font-mono">{storageInfo.sizeKB}KB</span> | Last: <span className="font-mono">{storageInfo.lastSaved}</span>
                  </div>
                  <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {storageInfo.coffeeCount} coffees
                  </div>
                </div>
              </div>
            );
          })()}
        </GlassCard>

        {/* ===== ANALYTICS ===== */}
        {showAnalytics && (
          <GlassCard darkMode={darkMode} className="mb-6">
            <h2 className="text-2xl font-bold mb-6">Coffee Analytics & Insights</h2>

            <div className={`${darkMode ? 'bg-gray-700/50' : 'bg-amber-50/80'} p-4 rounded-xl mb-6 border-l-4 border-amber-500`}>
              <h3 className="text-lg font-semibold mb-2 flex items-center">
                <span className="text-amber-600 mr-2">Efficiency Score Explained</span>
              </h3>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <strong>Efficiency = Taste Rating / Cost per Cup</strong> — How much flavor you get per euro. <span className="text-green-600 font-medium">≥8 = Top Deal</span>, <span className="text-yellow-600 font-medium">5–8 = Fair</span>, <span className="text-red-600 font-medium">&lt;5 = Overpriced</span>.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Roasters */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Top Roasters</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={analytics.roasterData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                    <XAxis dataKey="name" stroke={darkMode ? '#9ca3af' : '#6b7280'} angle={-45} textAnchor="end" height={80} interval={0} fontSize={12} />
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
                    <Pie data={analytics.blendData} cx="50%" cy="50%" labelLine={false} outerRadius={80} dataKey="value">
                      {analytics.blendData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.fill} />))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="bottom" height={36} formatter={(value, entry) => `${value}: ${entry.payload.value}%`} wrapperStyle={{ color: darkMode ? '#d1d5db' : '#374151' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Rating Trends */}
              <div className="lg:col-span-2">
                <h3 className="text-lg font-semibold mb-4">Rating Trends Over Time</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={analytics.ratingTrends} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                    <XAxis dataKey="date" stroke={darkMode ? '#9ca3af' : '#6b7280'} angle={-45} textAnchor="end" height={60} interval={Math.max(0, Math.floor(analytics.ratingTrends.length / 10))} fontSize={12} />
                    <YAxis domain={[0, 5]} stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="rating" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4, fill: '#f59e0b' }} name="Taste Rating" />
                    <Line type="monotone" dataKey="crema" stroke={darkMode ? '#d4a574' : '#8b4513'} strokeWidth={2} dot={{ r: 4, fill: darkMode ? '#d4a574' : '#8b4513' }} name="Crema Rating" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Origin Countries */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Coffee Origins</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={analytics.originData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                    <XAxis dataKey="code" stroke={darkMode ? '#9ca3af' : '#6b7280'} angle={-45} textAnchor="end" height={80} interval={0} fontSize={12} />
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
                    <Pie data={analytics.roastLevelData} cx="50%" cy="50%" labelLine={false} label={({ level, count, x, y }) => (<text x={x} y={y} fill={darkMode ? '#e5e7eb' : '#374151'} textAnchor="middle" dominantBaseline="central" fontSize={12}>{`${level}: ${count}`}</text>)} outerRadius={80} dataKey="count">
                      {analytics.roastLevelData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.fill} />))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Cost Analysis */}
              {analytics.priceAnalysis.length > 0 && (
                <div className="lg:col-span-2">
                  <h3 className="text-lg font-semibold mb-4">Cost Analysis</h3>
                  <p className={`text-sm mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Average cost per cup: <span className={`font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>{analytics.avgCostPerCup} EUR</span>
                  </p>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.priceAnalysis.slice(0, 10)} margin={{ top: 20, right: 30, left: 80, bottom: 80 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                      <XAxis dataKey="name" stroke={darkMode ? '#9ca3af' : '#6b7280'} angle={-45} textAnchor="end" height={80} interval={0} fontSize={12} />
                      <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} label={{ value: 'Cost per Cup (EUR)', angle: -90, position: 'insideLeft', offset: 10, fill: darkMode ? '#d1d5db' : '#374151' }} />
                      <Tooltip content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className={`${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'} p-3 rounded-lg shadow-lg border`}>
                              <p className={`${darkMode ? 'text-white' : 'text-gray-900'} font-medium`}>{label}</p>
                              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{data.coffee}</p>
                              <p style={{ color: payload[0].color }}>Cost: {data.costPerCup.toFixed(3)} EUR/cup</p>
                              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Taste: {data.tasteRating}/5 | Efficiency: {data.valueScore}</p>
                            </div>
                          );
                        }
                        return null;
                      }} />
                      <Bar dataKey="costPerCup" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Grind Settings */}
              <div className="lg:col-span-2">
                <h3 className="text-lg font-semibold mb-4">Grind Settings by Brand</h3>
                {analytics.grindByBrandData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.grindByBrandData} margin={{ top: 20, right: 30, left: 60, bottom: 80 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                      <XAxis dataKey="brand" stroke={darkMode ? '#9ca3af' : '#6b7280'} angle={-45} textAnchor="end" height={80} interval={0} fontSize={12} />
                      <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} label={{ value: 'Grind Level', angle: -90, position: 'insideLeft', fill: darkMode ? '#d1d5db' : '#374151' }} />
                      <Tooltip content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className={`${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'} p-3 rounded-lg shadow-lg border`}>
                              <p className={`${darkMode ? 'text-white' : 'text-gray-900'} font-medium`}>{label}</p>
                              <p style={{ color: payload[0].color }}>Average Grind: {payload[0].value}</p>
                              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{payload[0].payload.count} coffee{payload[0].payload.count !== 1 ? 's' : ''}</p>
                            </div>
                          );
                        }
                        return null;
                      }} />
                      <Bar dataKey="avgGrind" fill={darkMode ? '#d4a574' : '#8b4513'} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No grind data available</div>
                )}
              </div>
            </div>

            {/* Flavor Profile */}
            {selectedCoffeeForRadar && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">
                  Flavor Profile: {selectedCoffeeForRadar.roaster} - {selectedCoffeeForRadar.description}
                </h3>
                <ResponsiveContainer width="100%" height={600}>
                  <RadarChart data={getRadarData(selectedCoffeeForRadar)} margin={{ top: 50, right: 50, bottom: 50, left: 50 }}>
                    <PolarGrid stroke={darkMode ? '#374151' : '#e5e7eb'} />
                    <PolarAngleAxis dataKey="taste" stroke={darkMode ? '#9ca3af' : '#6b7280'} fontSize={18} tick={{ fill: darkMode ? '#e5e7eb' : '#374151' }} />
                    <PolarRadiusAxis domain={[0, 5]} stroke={darkMode ? '#9ca3af' : '#6b7280'} fontSize={16} tick={{ fill: darkMode ? '#9ca3af' : '#6b7280' }} />
                    <Radar name="Flavor Profile" dataKey="value" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} strokeWidth={3} />
                    <Tooltip content={<CustomTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
          </GlassCard>
        )}

        {/* ===== SEARCH & FILTERS ===== */}
        <GlassCard darkMode={darkMode} className="mb-6">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className={`w-5 h-5 absolute left-3 top-3 ${darkMode ? 'text-gray-300' : 'text-gray-400'}`} />
                <input
                  type="text"
                  placeholder="Search roaster, description, taste notes, comments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-xl ${darkMode ? 'bg-gray-700/50 border-gray-600 text-white' : 'border-gray-300'} focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors`}
                />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setFilterFavorites(!filterFavorites)}
                  className={`px-3 py-2 rounded-xl flex items-center space-x-2 transition-colors text-sm ${
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
                  className={`px-3 py-2 border rounded-xl text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} focus:ring-2 focus:ring-amber-500`}
                >
                  <option value="date">Sort by Date</option>
                  <option value="rating">Sort by Rating</option>
                  <option value="roaster">Sort by Roaster</option>
                  <option value="value">Sort by Efficiency</option>
                  <option value="priceLowHigh">Price (Low-High)</option>
                  <option value="priceHighLow">Price (High-Low)</option>
                </select>
              </div>
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Filters:</span>

              {/* Brewing method chip */}
              <select
                value={filterBrewingMethod || ''}
                onChange={(e) => setFilterBrewingMethod(e.target.value || null)}
                className={`text-xs px-2.5 py-1.5 rounded-full border transition-colors ${
                  filterBrewingMethod
                    ? 'bg-amber-600 text-white border-amber-600'
                    : darkMode ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-gray-100 border-gray-200 text-gray-600'
                }`}
              >
                <option value="">Brewing Method</option>
                {brewingMethods.map(m => (<option key={m.id} value={m.id}>{m.icon} {m.name}</option>))}
              </select>

              {/* Roast level chip */}
              <select
                value={filterRoastLevel || ''}
                onChange={(e) => setFilterRoastLevel(e.target.value || null)}
                className={`text-xs px-2.5 py-1.5 rounded-full border transition-colors ${
                  filterRoastLevel
                    ? 'bg-amber-600 text-white border-amber-600'
                    : darkMode ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-gray-100 border-gray-200 text-gray-600'
                }`}
              >
                <option value="">Roast Level</option>
                <option value="light">Light</option>
                <option value="medium">Medium</option>
                <option value="medium-dark">Medium-Dark</option>
                <option value="dark">Dark</option>
              </select>

              {/* Equipment chip */}
              {equipment.length > 0 && (
                <select
                  value={filterEquipmentId || ''}
                  onChange={(e) => setFilterEquipmentId(e.target.value ? parseInt(e.target.value) : null)}
                  className={`text-xs px-2.5 py-1.5 rounded-full border transition-colors ${
                    filterEquipmentId
                      ? 'bg-amber-600 text-white border-amber-600'
                      : darkMode ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-gray-100 border-gray-200 text-gray-600'
                  }`}
                >
                  <option value="">Equipment</option>
                  {equipment.map(e => (<option key={e.id} value={e.id}>{e.name}</option>))}
                </select>
              )}

              {/* Origin chip */}
              {usedOrigins.length > 0 && (
                <select
                  value={filterOrigin || ''}
                  onChange={(e) => setFilterOrigin(e.target.value || null)}
                  className={`text-xs px-2.5 py-1.5 rounded-full border transition-colors ${
                    filterOrigin
                      ? 'bg-amber-600 text-white border-amber-600'
                      : darkMode ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-gray-100 border-gray-200 text-gray-600'
                  }`}
                >
                  <option value="">Origin</option>
                  {usedOrigins.map(o => (<option key={o} value={o}>{countryFlags[o]?.flag} {countryFlags[o]?.name || o}</option>))}
                </select>
              )}

              {activeFiltersCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className={`text-xs px-2.5 py-1.5 rounded-full transition-colors ${
                    darkMode ? 'bg-red-900/30 text-red-300 hover:bg-red-900/50' : 'bg-red-50 text-red-600 hover:bg-red-100'
                  }`}
                >
                  Clear all ({activeFiltersCount})
                </button>
              )}
            </div>
          </div>
        </GlassCard>

        {/* ===== ADD/EDIT FORM (Multi-Step Wizard) ===== */}
        {showAddForm && (
          <GlassCard darkMode={darkMode} className="mb-6" ref={formRef}>
            <h2 className="text-2xl font-bold mb-2">
              {editingCoffee ? 'Edit Coffee' : 'Add New Coffee'}
            </h2>

            {/* Progress indicator */}
            <div className="flex items-center mb-6">
              {FORM_STEPS.map((step, i) => (
                <React.Fragment key={step}>
                  <button
                    onClick={() => setFormStep(i)}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      i === formStep
                        ? 'bg-amber-600 text-white'
                        : i < formStep
                        ? darkMode ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-700'
                        : darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs border border-current">
                      {i < formStep ? <Check className="w-3 h-3" /> : i + 1}
                    </span>
                    <span className="hidden sm:inline">{step}</span>
                  </button>
                  {i < FORM_STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 ${i < formStep ? 'bg-green-500' : darkMode ? 'bg-gray-600' : 'bg-gray-300'}`} />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Step 0: Basics */}
            {formStep === 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-left">
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Roaster *</label>
                  <input type="text" required value={formData.roaster} onChange={(e) => setFormData({...formData, roaster: e.target.value})} className={inputClass} />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Description *</label>
                  <input type="text" required value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className={inputClass} />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Origin Countries</label>
                  <ComboBox value={formData.origin} onChange={(value) => setFormData({...formData, origin: value})} options={commonCountries} placeholder="e.g. BR, CO, ET" type="country" darkMode={darkMode} />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Roast Level</label>
                  <select value={formData.roastLevel} onChange={(e) => setFormData({...formData, roastLevel: e.target.value})} className={inputClass}>
                    <option value="light">Light</option>
                    <option value="medium">Medium</option>
                    <option value="medium-dark">Medium-Dark</option>
                    <option value="dark">Dark</option>
                  </select>
                </div>
                <div className="flex items-center space-x-6">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" checked={formData.favorite} onChange={(e) => setFormData({...formData, favorite: e.target.checked})} className="rounded text-amber-600 focus:ring-amber-500" />
                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Favorite</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" checked={formData.grinded} onChange={(e) => setFormData({...formData, grinded: e.target.checked})} className="rounded text-amber-600 focus:ring-amber-500" />
                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Pre-grinded</span>
                  </label>
                </div>
              </div>
            )}

            {/* Step 1: Brewing */}
            {formStep === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-left">
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Your Brewing Method</label>
                  <select value={formData.brewingMethod} onChange={(e) => setFormData({...formData, brewingMethod: e.target.value})} className={inputClass}>
                    {brewingMethods.map(m => (<option key={m.id} value={m.id}>{m.icon} {m.name}</option>))}
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Roaster's Recommended</label>
                  <select value={formData.recommendedMethod} onChange={(e) => setFormData({...formData, recommendedMethod: e.target.value})} className={inputClass}>
                    {brewingMethods.map(m => (<option key={m.id} value={m.id}>{m.icon} {m.name}</option>))}
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Grinder Level</label>
                  <input type="text" placeholder="e.g. 12, 15, 40" value={formData.grindingDegree} onChange={(e) => setFormData({...formData, grindingDegree: e.target.value})} className={inputClass} />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Coffee Amount (g)</label>
                  <input type="number" placeholder={formData.brewingMethod === 'coldbrew' ? "90" : "18"} value={formData.coffeeAmount} onChange={(e) => setFormData({...formData, coffeeAmount: e.target.value})} className={inputClass} />
                </div>
                {formData.brewingMethod === 'coldbrew' && (
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Servings/Cups</label>
                    <input type="number" placeholder="10" value={formData.servings} onChange={(e) => setFormData({...formData, servings: e.target.value})} className={inputClass} />
                  </div>
                )}
                <div className="md:col-span-2">
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Preparation Notes</label>
                  <div className="space-y-2">
                    <select
                      value={formData.preparationNotes && commonPreparationNotes.includes(formData.preparationNotes) ? formData.preparationNotes : ''}
                      onChange={(e) => { if (e.target.value) setFormData({...formData, preparationNotes: e.target.value}); }}
                      disabled={formData.preparationNotes && !commonPreparationNotes.includes(formData.preparationNotes)}
                      className={`${inputClass} ${formData.preparationNotes && !commonPreparationNotes.includes(formData.preparationNotes) ? 'opacity-50' : ''}`}
                    >
                      <option value="">-- Select preparation --</option>
                      {commonPreparationNotes.map((note, i) => (<option key={i} value={note}>{note}</option>))}
                    </select>
                    <div className={`text-center text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>— OR —</div>
                    <input
                      type="text"
                      value={formData.preparationNotes && !commonPreparationNotes.includes(formData.preparationNotes) ? formData.preparationNotes : ''}
                      onChange={(e) => setFormData({...formData, preparationNotes: e.target.value})}
                      disabled={formData.preparationNotes && commonPreparationNotes.includes(formData.preparationNotes)}
                      placeholder="Custom preparation notes..."
                      className={`${inputClass} ${formData.preparationNotes && commonPreparationNotes.includes(formData.preparationNotes) ? 'opacity-50' : ''}`}
                    />
                    {formData.preparationNotes && (
                      <button type="button" onClick={() => setFormData({...formData, preparationNotes: ''})} className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} underline`}>Clear</button>
                    )}
                  </div>
                </div>

                {/* Equipment info (read-only) */}
                {activeEquipment && (
                  <div className={`md:col-span-2 p-3 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-amber-50/80'} border-l-4 border-amber-500`}>
                    <div className="flex items-center space-x-2 text-sm">
                      <Settings className="w-4 h-4 text-amber-600" />
                      <span className="font-medium">Equipment:</span>
                      <span>{activeEquipment.name}</span>
                      {activeEquipment.grinder && <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>| {activeEquipment.grinder}</span>}
                      {activeEquipment.machine && <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>| {activeEquipment.machine}</span>}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Tasting */}
            {formStep === 2 && (
              <div className="space-y-4 animate-slide-left">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Crema Rating</label>
                    <StarRating rating={formData.cremaRating} onRatingChange={(r) => setFormData({...formData, cremaRating: r})} darkMode={darkMode} />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Taste Rating</label>
                    <StarRating rating={formData.tasteRating} onRatingChange={(r) => setFormData({...formData, tasteRating: r})} darkMode={darkMode} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Arabica %</label>
                    <input type="number" min="0" max="100" value={formData.percentArabica}
                      onChange={(e) => { const v = parseInt(e.target.value) || 0; setFormData({...formData, percentArabica: v, percentRobusta: Math.max(0, 100 - v)}); }}
                      className={inputClass} />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Robusta %</label>
                    <input type="number" min="0" max="100" value={formData.percentRobusta}
                      onChange={(e) => { const v = parseInt(e.target.value) || 0; setFormData({...formData, percentRobusta: v, percentArabica: Math.max(0, 100 - v)}); }}
                      className={inputClass} />
                  </div>
                </div>
                <div>
                  <button type="button" onClick={() => setTasteProfileCollapsed(!tasteProfileCollapsed)}
                    className="flex items-center justify-between w-full text-left mb-2">
                    <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Taste Profile <span className={`text-xs ml-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Rate 0-5</span>
                    </label>
                    <ChevronDown className={`w-4 h-4 transition-transform ${tasteProfileCollapsed ? '' : 'rotate-180'} ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                  </button>
                  {!tasteProfileCollapsed && (
                    <div className="animate-collapse-expand">
                      <TasteProfile value={formData.tasteNotes} onChange={(value) => setFormData({...formData, tasteNotes: value})} darkMode={darkMode} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Details */}
            {formStep === 3 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-left">
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Product URL</label>
                  <input type="url" placeholder="https://..." value={formData.url} onChange={(e) => setFormData({...formData, url: e.target.value})} className={inputClass} />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Product Image URL</label>
                  <input type="url" placeholder="Product image URL" value={formData.imageUrl} onChange={(e) => setFormData({...formData, imageUrl: e.target.value})} className={inputClass} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Price</label>
                    <input type="number" step="0.01" placeholder="12.50" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className={inputClass} />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Size (g)</label>
                    <input type="number" placeholder="1000" value={formData.packageSize} onChange={(e) => setFormData({...formData, packageSize: parseInt(e.target.value) || 1000})} className={inputClass} />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Currency</label>
                    <select value={formData.currency} onChange={(e) => setFormData({...formData, currency: e.target.value})} className={inputClass}>
                      <option value="EUR">EUR</option>
                      <option value="USD">USD</option>
                      <option value="GBP">GBP</option>
                      <option value="CHF">CHF</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Coffee Group</label>
                  <input type="text" value={formData.coffeeGroup} onChange={(e) => setFormData({...formData, coffeeGroup: e.target.value})} placeholder="Leave empty for auto-grouping" className={inputClass} />
                </div>
                <div className="md:col-span-2">
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Comment</label>
                  <textarea value={formData.comment} onChange={(e) => setFormData({...formData, comment: e.target.value})} rows="3" placeholder="Additional notes..." className={inputClass} />
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex items-center justify-between mt-6">
              <div className="flex space-x-2">
                {formStep > 0 && (
                  <button onClick={() => setFormStep(formStep - 1)}
                    className={`px-4 py-2 rounded-xl transition-colors ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}>
                    Back
                  </button>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => { setShowAddForm(false); setEditingCoffee(null); resetForm(); }}
                  className={`px-4 py-2 rounded-xl transition-colors ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-300 hover:bg-gray-400 text-gray-700'}`}>
                  Cancel
                </button>
                {formStep < FORM_STEPS.length - 1 ? (
                  <button onClick={() => setFormStep(formStep + 1)}
                    className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl transition-colors">
                    Next
                  </button>
                ) : (
                  <button onClick={handleSubmit} disabled={isSaving}
                    className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white px-6 py-2 rounded-xl transition-colors">
                    {isSaving ? 'Saving...' : editingCoffee ? 'Update Coffee' : 'Add Coffee'}
                  </button>
                )}
              </div>
            </div>
          </GlassCard>
        )}

        {/* ===== COFFEE LIST ===== */}
        {/* Expand/Collapse Controls */}
        {filteredCoffees.length > 0 && (
          <GlassCard darkMode={darkMode} className="mb-6 !p-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center space-x-2">
                <Coffee className="w-5 h-5 text-amber-600" />
                <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  Coffee Collection ({filteredCoffees.length} of {coffees.length})
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button onClick={expandAllRoasters}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
                  <ChevronUp className="w-4 h-4" /><span>Expand</span>
                </button>
                <button onClick={collapseAllRoasters}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
                  <ChevronDown className="w-4 h-4" /><span>Collapse</span>
                </button>
              </div>
            </div>
          </GlassCard>
        )}

        {isLoading ? (
          <CoffeeListSkeleton darkMode={darkMode} />
        ) : (
          <div className="space-y-8">
            {(() => {
              // Flat list for price/value sorting
              if (['priceLowHigh', 'priceHighLow', 'value'].includes(sortBy)) {
                return filteredCoffees.map((coffee) => (
                  <CoffeeCardDisplay key={coffee.id} coffee={coffee} darkMode={darkMode}
                    onEdit={() => handleEdit(coffee)} onDelete={() => handleDelete(coffee.id)}
                    onToggleFavorite={() => handleToggleFavorite(coffee.id)} onDuplicate={() => handleCopy(coffee)}
                    onShowRadar={setSelectedCoffeeForRadar} brewingMethods={brewingMethods}
                    countryFlags={countryFlags} getRoastBadge={getRoastBadge}
                    calculateCostPerCup={calculateCostPerCup} calculateValueScore={calculateValueScore}
                    getEfficiencyColor={getEfficiencyColor} getEfficiencyBgColor={getEfficiencyBgColor} getEfficiencyLabel={getEfficiencyLabel}
                    equipmentName={getEquipmentName(coffee)} />
                ));
              }

              // Group by roaster
              const roasterGroups = filteredCoffees.reduce((roasters, coffee) => {
                const roaster = coffee.roaster.split(' - ')[0] || coffee.roaster;
                if (!roasters[roaster]) roasters[roaster] = [];
                roasters[roaster].push(coffee);
                return roasters;
              }, {});

              const sortedRoasters = Object.entries(roasterGroups).sort(([rA, cA], [rB, cB]) => {
                if (sortBy === 'roaster') return rA.localeCompare(rB);
                if (sortBy === 'rating') {
                  return (cB.reduce((s, c) => s + c.tasteRating, 0) / cB.length) - (cA.reduce((s, c) => s + c.tasteRating, 0) / cA.length);
                }
                const avgA = cA.reduce((s, c) => s + c.tasteRating, 0) / cA.length;
                const avgB = cB.reduce((s, c) => s + c.tasteRating, 0) / cB.length;
                const favA = cA.filter(c => c.favorite).length;
                const favB = cB.filter(c => c.favorite).length;
                if (favA !== favB) return favB - favA;
                if (Math.abs(avgA - avgB) > 0.1) return avgB - avgA;
                return rA.localeCompare(rB);
              });

              return sortedRoasters.map(([roasterName, roasterCoffees]) => {
                const avgRating = roasterCoffees.reduce((sum, c) => sum + c.tasteRating, 0) / roasterCoffees.length;
                const favoriteCount = roasterCoffees.filter(c => c.favorite).length;
                const isCollapsed = collapsedRoasters[roasterName];
                const coffeesWithPrice = roasterCoffees.filter(c => c.price && !isNaN(parseFloat(c.price)));
                const avgPricePerCup = coffeesWithPrice.length > 0
                  ? (coffeesWithPrice.reduce((sum, c) => sum + parseFloat(calculateCostPerCup(c).costPerCup), 0) / coffeesWithPrice.length).toFixed(3)
                  : null;

                return (
                  <div key={roasterName} className="space-y-4">
                    {/* Roaster Header */}
                    <div
                      className={`${darkMode ? 'bg-gray-700/70 hover:bg-gray-600/70' : 'bg-gradient-to-r from-amber-100/80 to-orange-100/80 hover:from-amber-200/80 hover:to-orange-200/80'} backdrop-blur-sm rounded-xl p-4 border-l-4 border-amber-500 cursor-pointer transition-all`}
                      onClick={() => toggleRoasterCollapse(roasterName)}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex items-center flex-wrap gap-2">
                          <div className="flex items-center space-x-2">
                            {isCollapsed ? <ChevronDown className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} /> : <ChevronUp className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />}
                            <h2 className={`text-lg sm:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{roasterName}</h2>
                          </div>
                          <span className={`text-sm px-3 py-1 rounded-full font-medium ${darkMode ? 'bg-gray-600 text-gray-200' : 'bg-white/80 text-gray-700'}`}>
                            {roasterCoffees.length} coffee{roasterCoffees.length !== 1 ? 's' : ''}
                          </span>
                          {favoriteCount > 0 && (
                            <span className={`text-sm px-3 py-1 rounded-full font-medium ${darkMode ? 'bg-yellow-900 text-yellow-100' : 'bg-yellow-100 text-yellow-800'}`}>
                              {favoriteCount} fav{favoriteCount !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <StarRating rating={Math.round(avgRating)} readOnly size="small" darkMode={darkMode} />
                            <span className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{avgRating.toFixed(1)}</span>
                          </div>
                          {avgPricePerCup && (
                            <span className={`text-sm font-semibold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>{avgPricePerCup} €/cup</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Coffees */}
                    {!isCollapsed && (
                      <div className="grid gap-4 ml-4 animate-collapse-expand">
                        {roasterCoffees.map(coffee => (
                          <CoffeeCardDisplay key={coffee.id} coffee={coffee} darkMode={darkMode}
                            onEdit={() => handleEdit(coffee)} onDelete={() => handleDelete(coffee.id)}
                            onToggleFavorite={() => handleToggleFavorite(coffee.id)} onDuplicate={() => handleCopy(coffee)}
                            onShowRadar={setSelectedCoffeeForRadar} brewingMethods={brewingMethods}
                            countryFlags={countryFlags} getRoastBadge={getRoastBadge}
                            calculateCostPerCup={calculateCostPerCup} calculateValueScore={calculateValueScore}
                            getEfficiencyColor={getEfficiencyColor} getEfficiencyBgColor={getEfficiencyBgColor} getEfficiencyLabel={getEfficiencyLabel}
                            equipmentName={getEquipmentName(coffee)} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        )}

        {!isLoading && filteredCoffees.length === 0 && (
          <GlassCard darkMode={darkMode} className="text-center !p-12">
            <Coffee className={`w-16 h-16 ${darkMode ? 'text-gray-600' : 'text-gray-300'} mx-auto mb-4`} />
            <h3 className={`text-xl font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>No coffees found</h3>
            <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
              {searchTerm || activeFiltersCount > 0 ? 'Try adjusting your search or filters' : 'Add your first coffee to get started!'}
            </p>
          </GlassCard>
        )}
      </div>

      {/* ===== SAVING OVERLAY ===== */}
      {isSaving && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <GlassCard darkMode={darkMode}>
            <div className="flex items-center space-x-3">
              <RefreshCw className="w-6 h-6 animate-spin text-amber-600" />
              <span className="text-lg">Saving...</span>
            </div>
          </GlassCard>
        </div>
      )}

      {/* ===== CLOUD MIGRATION MODAL ===== */}
      <Modal isOpen={showMigrationModal} onClose={() => setShowMigrationModal(false)}
        title="Cloud Database Setup" icon={<Database className="w-6 h-6 text-amber-600" />} darkMode={darkMode}>
        <div className="space-y-4">
          <div className={`p-4 rounded-xl ${cloudStatus.enabled ? (darkMode ? 'bg-green-900/30 text-green-100' : 'bg-green-50 text-green-900') : (darkMode ? 'bg-gray-700' : 'bg-gray-100')}`}>
            <div className="flex items-center space-x-2 mb-2">
              {cloudStatus.enabled ? <Cloud className="w-5 h-5" /> : <CloudOff className="w-5 h-5" />}
              <span className="font-semibold">{cloudStatus.enabled ? 'Cloud Storage Active' : 'Cloud Storage Not Configured'}</span>
            </div>
            <p className="text-sm">{cloudStatus.enabled ? 'Syncing to Supabase.' : 'Set up Supabase to sync across devices.'}</p>
            {cloudStatus.error && <p className="text-sm text-red-400 mt-2">Error: {cloudStatus.error}</p>}
          </div>

          {!cloudStatus.enabled && (
            <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <h3 className="font-semibold mb-2">Setup Instructions:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Create account at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline">supabase.com</a></li>
                <li>Create a project, go to Settings &rarr; API</li>
                <li>Add .env file with REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY</li>
                <li>Create the coffees table (see CLOUD_SETUP.md)</li>
                <li>Restart dev server and refresh</li>
              </ol>
            </div>
          )}

          {cloudStatus.enabled && (
            <button onClick={handleMigrateToCloud} disabled={cloudStatus.syncing}
              className={`w-full py-3 rounded-xl font-semibold transition-colors ${cloudStatus.syncing ? 'bg-gray-400 text-gray-200' : 'bg-amber-600 hover:bg-amber-700 text-white'}`}>
              {cloudStatus.syncing ? 'Migrating...' : 'Migrate localStorage to Cloud'}
            </button>
          )}

          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <strong>Note:</strong> Falls back to localStorage if cloud is not configured.
          </p>
        </div>
      </Modal>

      {/* ===== EQUIPMENT MANAGER MODAL ===== */}
      <EquipmentManager isOpen={showEquipmentManager} onClose={() => setShowEquipmentManager(false)}
        darkMode={darkMode} equipment={equipment}
        onAdd={addEquipment} onUpdate={updateEquipment} onDelete={deleteEquipment} onSwitch={switchEquipment} />

      {/* ===== MOBILE BOTTOM NAV ===== */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden z-40 bottom-nav">
        <div className={`${darkMode ? 'glass-card-dark border-t border-gray-700' : 'glass-card border-t border-gray-200'} px-4 py-2`}>
          <div className="flex items-center justify-around">
            {[
              { id: 'home', icon: <Home className="w-5 h-5" />, label: 'Home', action: () => { setShowAnalytics(false); setShowAddForm(false); } },
              { id: 'search', icon: <Search className="w-5 h-5" />, label: 'Search', action: () => { setShowAnalytics(false); setShowAddForm(false); document.querySelector('input[type="text"]')?.focus(); } },
              { id: 'add', icon: <Plus className="w-5 h-5" />, label: 'Add', action: () => { resetForm(); setEditingCoffee(null); setShowAddForm(true); setShowAnalytics(false); setFormStep(0); scrollToForm(); } },
              { id: 'analytics', icon: <BarChart3 className="w-5 h-5" />, label: 'Analytics', action: () => { setShowAnalytics(!showAnalytics); setShowAddForm(false); window.scrollTo({ top: 0, behavior: 'smooth' }); } },
            ].map(item => (
              <button key={item.id} onClick={() => { setMobileView(item.id); item.action(); }}
                className={`flex flex-col items-center py-1 px-3 rounded-lg transition-colors ${
                  mobileView === item.id
                    ? 'text-amber-600'
                    : darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                {item.icon}
                <span className="text-xs mt-0.5">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== COFFEE CARD COMPONENT ====================
const CoffeeCardDisplay = ({ coffee, darkMode, onEdit, onDelete, onToggleFavorite, onDuplicate, onShowRadar, brewingMethods, countryFlags, getRoastBadge, calculateCostPerCup, calculateValueScore, getEfficiencyColor, getEfficiencyBgColor, getEfficiencyLabel, equipmentName }) => {
  const [imgError, setImgError] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);
  const roastBadge = getRoastBadge(coffee.roastLevel);
  const cost = calculateCostPerCup(coffee);
  const valueScore = calculateValueScore(coffee);

  const handleCardClick = (e) => {
    // Don't toggle when clicking buttons, links, or interactive elements
    if (e.target.closest('button') || e.target.closest('a')) return;
    setExpanded(prev => !prev);
  };

  const roastStripeColor = {
    'light': 'from-yellow-300 to-yellow-400',
    'medium': 'from-amber-400 to-amber-500',
    'medium-dark': 'from-orange-500 to-orange-600',
    'dark': 'from-stone-600 to-stone-700',
  }[coffee.roastLevel] || 'from-gray-400 to-gray-500';

  const hasImage = coffee.imageUrl && !imgError;

  return (
    <div
      className={`${darkMode ? 'glass-card-dark text-white' : 'glass-card text-gray-900'} rounded-2xl shadow-xl card-hover transition-all cursor-pointer overflow-hidden`}
      onClick={handleCardClick}
    >
      {/* Image banner with name overlay */}
      {hasImage ? (
        <div className="relative">
          <img src={coffee.imageUrl} alt={coffee.description} className="w-full h-32 object-cover" loading="lazy" referrerPolicy="no-referrer" onError={() => setImgError(true)} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 px-4 py-2 md:px-6">
            <p className="text-white font-bold text-sm truncate">{coffee.roaster}</p>
            <p className="text-white/80 text-xs truncate">{coffee.description}</p>
          </div>
        </div>
      ) : (
        /* Roast level color stripe when no image */
        <div className={`h-1.5 bg-gradient-to-r ${roastStripeColor}`} />
      )}

      {/* === COMPACT VIEW (always visible) === */}
      <div className={`flex items-start justify-between px-4 md:px-6 pb-4 md:pb-6 ${hasImage ? 'pt-0' : 'pt-3'}`}>
        <div className="flex-1">
          {/* Roaster name + roast level badge */}
          <div className="flex items-center space-x-2 flex-wrap gap-y-1 mb-1">
            <h3 className="text-lg sm:text-xl font-bold break-words">{coffee.roaster}</h3>
            {coffee.roastLevel && (
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${roastBadge.bg} ${roastBadge.text}`}>{roastBadge.label}</span>
            )}
          </div>
          {/* Description - always visible */}
          <p className={`text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'} line-clamp-1`}>{coffee.description}</p>

          {/* Compact stats bar */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl flex-wrap text-xs ${darkMode ? 'bg-gray-800/60' : 'bg-gray-50'}`}>
            {cost && (
              <span className={`font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`} title={cost.batchInfo || `${cost.gramsUsed}g per cup`}>{cost.costPerCup} {cost.currency}</span>
            )}
            {cost && <span className={`${darkMode ? 'text-gray-600' : 'text-gray-300'}`}>|</span>}
            <span className={`font-bold ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>T{coffee.tasteRating} C{coffee.cremaRating}</span>
            {valueScore && <span className={`${darkMode ? 'text-gray-600' : 'text-gray-300'}`}>|</span>}
            {valueScore && (
              <>
                <span className={`font-bold ${getEfficiencyColor(valueScore, darkMode)}`}>{valueScore}</span>
                <span className={`px-1.5 py-0.5 rounded-full font-medium ${getEfficiencyBgColor(valueScore, darkMode)} ${getEfficiencyColor(valueScore, darkMode)}`}>{getEfficiencyLabel(valueScore)}</span>
              </>
            )}
          </div>
        </div>

        {/* Right side: favorite star + chevron toggle */}
        <div className="flex flex-col items-center space-y-1 ml-3">
          <button onClick={onToggleFavorite} className={`p-2 ${coffee.favorite ? 'text-yellow-400' : darkMode ? 'text-gray-400 hover:text-yellow-400' : 'text-gray-400 hover:text-yellow-500'} transition-colors`}>
            <Star className={`w-5 h-5 ${coffee.favorite ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(prev => !prev); }}
            className={`p-1 ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'} transition-colors`}
            title={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* === EXPANDED VIEW (toggle) === */}
      {expanded && (
        <div className="mx-4 md:mx-6 mb-4 md:mb-6 mt-3 border-t pt-3" style={{ borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
            {/* Arabica / Robusta percentage */}
            <div className="flex items-center space-x-2">
              <Percent className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <span className="text-sm">{coffee.percentArabica}% Arabica / {coffee.percentRobusta}% Robusta</span>
            </div>
            {/* Grinder setting + coffee amount badges */}
            {(coffee.grindingDegree || coffee.coffeeAmount) && (
              <div className="flex items-center space-x-2 flex-wrap">
                {coffee.grindingDegree && <span className={`text-xs px-2 py-1 rounded ${darkMode ? 'bg-orange-900/50 text-orange-200' : 'bg-orange-100 text-orange-800'}`}>Grinder: {coffee.grindingDegree}</span>}
                {coffee.coffeeAmount && <span className={`text-xs px-2 py-1 rounded ${darkMode ? 'bg-blue-900/50 text-blue-200' : 'bg-blue-100 text-blue-800'}`}>{coffee.coffeeAmount}g{coffee.servings && coffee.brewingMethod === 'coldbrew' ? ` (${coffee.servings} srv)` : ''}</span>}
              </div>
            )}
            {/* Date */}
            <div className="flex items-center space-x-2">
              <Calendar className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <span className="text-sm">{new Date(coffee.cuppingTime).toLocaleDateString()}</span>
            </div>
            {/* Price full detail */}
            {coffee.price && (
              <span className={`text-xs px-2 py-1 rounded inline-block ${darkMode ? 'bg-green-900/50 text-green-200' : 'bg-green-100 text-green-800'}`}>
                {coffee.price} {coffee.currency || 'EUR'} / {coffee.packageSize || 1000}g
              </span>
            )}
          </div>

          {/* Origin country flags */}
          {coffee.origin && (
            <div className="mb-3 flex flex-wrap items-center gap-1">
              {coffee.origin.split(',').map(code => {
                const tc = code.trim();
                const country = countryFlags[tc];
                const isRegion = ['AS', 'LA', 'SA'].includes(tc);
                return (
                  <span key={code} className="inline-flex items-center" title={country ? country.name : tc}>
                    {country && !isRegion ? (
                      <><span className="text-xl">{country.flag}</span><span className="text-xs ml-1">{tc}</span></>
                    ) : (
                      <span className={`text-xs px-2 py-1 rounded ${darkMode ? 'bg-green-900/50 text-green-200' : 'bg-green-100 text-green-800'}`}>{country ? country.name : tc}</span>
                    )}
                  </span>
                );
              })}
            </div>
          )}

          {/* Taste notes + radar chart button */}
          {coffee.tasteNotes && (
            <div className="mb-2">
              <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Taste: </span>
              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{coffee.tasteNotes}</span>
              <button onClick={() => onShowRadar(coffee)} className="ml-2 text-amber-600 hover:text-amber-700"><BarChart3 className="w-4 h-4 inline" /></button>
            </div>
          )}

          {/* Preparation notes */}
          {coffee.preparationNotes && (
            <div className="mb-2">
              <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Prep: </span>
              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} italic`}>{coffee.preparationNotes}</span>
            </div>
          )}

          {/* Brewing method + price badges */}
          <div className="flex items-center space-x-2 flex-wrap gap-y-1 mb-3">
            {coffee.brewingMethod && (
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${darkMode ? 'bg-blue-900/50 text-blue-200' : 'bg-blue-100 text-blue-800'}`}>
                {brewingMethods.find(m => m.id === coffee.brewingMethod)?.icon} {brewingMethods.find(m => m.id === coffee.brewingMethod)?.name || coffee.brewingMethod}
              </span>
            )}
            {coffee.price && (
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${darkMode ? 'bg-green-900/50 text-green-200' : 'bg-green-100 text-green-800'}`}>
                {coffee.price} {coffee.currency || 'EUR'}
              </span>
            )}
          </div>

          {/* Star ratings */}
          <div className="flex items-center space-x-4 sm:space-x-6 mb-3 flex-wrap">
            <div>
              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} block`}>Crema</span>
              <StarRating rating={coffee.cremaRating} readOnly darkMode={darkMode} />
            </div>
            <div>
              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} block`}>Taste</span>
              <StarRating rating={coffee.tasteRating} readOnly darkMode={darkMode} />
            </div>
          </div>

          {/* Product link + Comment */}
          {(coffee.comment || coffee.url) && (
            <div className="space-y-1 mb-3">
              {coffee.url && (
                <div className="flex items-center space-x-2">
                  <ExternalLink className={`w-4 h-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  <a href={coffee.url} target="_blank" rel="noopener noreferrer" className={`hover:underline text-sm ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>Product Link</a>
                </div>
              )}
              {coffee.comment && <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} italic`}>"{coffee.comment}"</p>}
            </div>
          )}

          {/* Equipment badge */}
          {equipmentName && (
            <div className="mb-3">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${darkMode ? 'bg-purple-900/50 text-purple-200' : 'bg-purple-100 text-purple-800'}`}>
                <Settings className="w-3 h-3 inline mr-1" />{equipmentName}
              </span>
            </div>
          )}

          {/* Action buttons: Edit, Copy, Delete */}
          <div className="flex items-center space-x-2 pt-2 border-t" style={{ borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
            <button onClick={onEdit} className={`p-2 ${darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'} rounded transition-colors`}>
              <Edit3 className="w-5 h-5" />
            </button>
            <button onClick={onDuplicate} className={`p-2 ${darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'} rounded transition-colors`}>
              <Copy className="w-5 h-5" />
            </button>
            <button onClick={onDelete} className={`p-2 ${darkMode ? 'text-gray-400 hover:text-red-400 hover:bg-gray-700' : 'text-gray-600 hover:text-red-600 hover:bg-red-50'} rounded transition-colors`}>
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoffeeTracker;
