export const commonCountries = [
  'BR', 'CO', 'ET', 'GT', 'HN', 'JM', 'KE', 'PE', 'UG', 'VE', 'CR', 'EC', 'MX', 'NI', 'PA', 'RW', 'TZ', 'YE', 'ID', 'IN', 'VN', 'PG', 'HI'
];

export const countryFlags = {
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
  'SA': { flag: '🌎', name: 'South America' },
  'HN': { flag: '🇭🇳', name: 'Honduras' },
  'JM': { flag: '🇯🇲', name: 'Jamaica' },
  'KE': { flag: '🇰🇪', name: 'Kenya' },
  'PE': { flag: '🇵🇪', name: 'Peru' },
  'VE': { flag: '🇻🇪', name: 'Venezuela' },
  'MX': { flag: '🇲🇽', name: 'Mexico' },
  'PA': { flag: '🇵🇦', name: 'Panama' },
  'RW': { flag: '🇷🇼', name: 'Rwanda' },
  'TZ': { flag: '🇹🇿', name: 'Tanzania' },
  'YE': { flag: '🇾🇪', name: 'Yemen' },
  'VN': { flag: '🇻🇳', name: 'Vietnam' },
  'PG': { flag: '🇵🇬', name: 'Papua New Guinea' },
  'HI': { flag: '🌺', name: 'Hawaii' }
};

export const commonPreparationNotes = [
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

export const getRoastBadge = (level) => {
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
