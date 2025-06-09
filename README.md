# Coffee Tracker

A comprehensive React application for coffee enthusiasts to track, rate, and analyze their coffee collection with detailed tasting notes and visual analytics.

![Coffee Tracker](https://img.shields.io/badge/React-18.2-blue) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC) ![Recharts](https://img.shields.io/badge/Recharts-2.15-orange)

## Features

### 🏠 Core Functionality
- **Coffee Management**: Add, edit, delete, and copy coffee entries
- **Grouped Variations**: Track same coffee with different preparation methods
- **Data Persistence**: Automatic saving to browser localStorage with versioning
- **Export/Import**: Download and upload JSON backups, PDF export for collection
- **Rich Data Tracking**: 
  - Roaster and coffee name
  - Origin countries with flag display and smart dropdown
  - Roast levels (light, medium, medium-dark, dark)
  - Arabica/Robusta blend ratios
  - Grinder settings and preparation notes
  - Taste notes with pre-filled options and flavor profiles
  - Product URLs, comments, and brewing methods
  - Price tracking and cost-per-cup calculations
- **Rating System**: 5-star ratings for crema quality and taste
- **Favorites**: Mark coffees as favorites for quick filtering
- **Smart Organization**: Roaster-based grouping with collapsible sections

### 📊 Analytics Dashboard
- **Top Roasters**: Bar chart showing most frequent coffee brands
- **Blend Preferences**: Pie chart of average Arabica/Robusta ratios
- **Rating Trends**: Line chart tracking taste and crema ratings over time
- **Origin Analysis**: Bar chart of coffee origins by country
- **Roast Distribution**: Pie chart showing roast level preferences
- **Grind Settings**: Average grinder settings by brand

### 🎨 User Interface
- **Dark/Light Mode**: Toggle between themes
- **Responsive Design**: Mobile and desktop optimized
- **Search & Filter**: 
  - Search by roaster or description
  - Filter by favorites
  - Sort by date, rating, or roaster name
- **Flavor Profiles**: Interactive radar charts for taste analysis

## Tech Stack

- **Frontend Framework**: React 18.2
- **Styling**: Tailwind CSS (CDN)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Build Tool**: Create React App

## Project Structure

```
coffee-tracker/
├── public/
│   ├── index.html          # Main HTML file with Tailwind CDN
│   └── manifest.json       # PWA manifest
├── src/
│   ├── App.js             # Main application component
│   ├── index.js           # React entry point
│   └── index.css          # Tailwind imports and base styles
├── package.json           # Dependencies and scripts
└── README.md             # This file
```

## Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd coffee-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Adding a Coffee
1. Click the "Add Coffee" button in the header
2. Fill in the required fields:
   - Roaster name
   - Coffee description
   - Roast level
   - Blend percentages
3. Add optional details:
   - Origin countries (use country codes like BR, CO, ET)
   - Grinder settings
   - Taste notes
   - Ratings for crema and taste
   - Product URL and personal comments
4. Click "Add Coffee" to save

### Viewing Analytics
1. Click the "Analytics" button in the header
2. Explore various charts and insights about your coffee collection
3. Click on any coffee's chart icon to see its flavor profile radar chart

### Search and Filter
- Use the search bar to find coffees by roaster or description
- Toggle the "Favorites" filter to show only starred coffees
- Use the sort dropdown to organize by date, rating, or roaster

## Data Model

Each coffee entry contains:
```javascript
{
  id: number,
  roaster: string,
  description: string,
  favorite: boolean,
  grinded: boolean,
  grindingTime: string,
  grindingDegree: string,
  percentArabica: number,
  percentRobusta: number,
  cuppingTime: Date,
  cremaRating: number (0-5),
  tasteRating: number (0-5),
  tasteNotes: string,
  url: string,
  comment: string,
  origin: string (comma-separated country codes),
  roastLevel: string ('light'|'medium'|'medium-dark'|'dark')
}
```

## Flavor Profile Analysis

The app automatically analyzes taste notes to generate flavor profiles with 8 dimensions:
- Chocolate
- Nutty
- Fruity
- Floral
- Earthy
- Spicy
- Sweet
- Acidic

## Sample Data

The application comes pre-loaded with 25 coffee samples from various roasters including:
- DieRöster
- Lavazza
- 220 Grad
- Bohnendealer
- Dallmayr
- And more...

## Data Persistence

### Local Storage
The application automatically saves all your coffee data to browser localStorage:
- Data persists between browser sessions
- Dark mode preference is also saved
- No server or account required
- Data is stored locally on your device

### Export/Import
- **Export**: Click the download button (↓) in the header to save your collection as a JSON file
- **Import**: Click the upload button (↑) to load a previously exported collection
- Import options:
  - Replace: Completely replace current data with imported data
  - Merge: Add imported coffees to your existing collection

### Backup Recommendations
- Regularly export your data to create backups
- Exported files include:
  - All coffee entries with complete data
  - Export version for compatibility
  - Export date for reference

## Limitations

- **Browser-Specific Storage**: localStorage data is tied to the specific browser and device
- **Storage Limits**: Most browsers limit localStorage to 5-10MB
- **No Cloud Sync**: Data doesn't sync across devices
- **No User Accounts**: Single-user application
- **No Sharing**: Cannot share collections or individual coffees directly

## Future Enhancements

Potential improvements for the application:
- Add cloud storage/sync capabilities
- Implement CSV export format
- Add photo upload for coffee bags
- Create brewing method tracking
- Add cupping session notes
- Implement coffee bean inventory management
- Add price tracking and cost analytics
- Create shareable coffee profiles
- Add data visualization for export statistics
- Implement automatic backup reminders

## Development

### Available Scripts

- `npm start` - Run development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App

### Dependencies

Main dependencies:
- react: ^18.2.0
- react-dom: ^18.2.0
- recharts: ^2.15.3
- lucide-react: ^0.263.1
- react-scripts: 5.0.1

## Browser Support

The application supports all modern browsers:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This project is private as specified in package.json.

## Contributing

As this is a private project, contribution guidelines should be established by the project owner.

---

Built with ☕ and React