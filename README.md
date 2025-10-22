# Coffee Tracker

A comprehensive React application for coffee enthusiasts to track, rate, and analyze their coffee collection with detailed tasting notes and visual analytics.

![Coffee Tracker](https://img.shields.io/badge/React-18.2-blue) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC) ![Recharts](https://img.shields.io/badge/Recharts-2.15-orange)

## Features

### 🏠 Core Functionality
- **Coffee Management**: Add, edit, delete, and copy coffee entries
- **Grouped Variations**: Track same coffee with different preparation methods
- **Cloud Database Support**: Optional Supabase integration for cloud storage and multi-device sync
- **Data Persistence**: Automatic saving to cloud database (if configured) or browser localStorage with versioning
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
- **Database**: Supabase (optional, PostgreSQL)
- **Styling**: Tailwind CSS (CDN)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Build Tool**: Create React App
- **Storage**: Cloud database (Supabase) or localStorage fallback

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

3. (Optional) Set up cloud database:
   - See [CLOUD_SETUP.md](CLOUD_SETUP.md) for detailed instructions
   - Create a free Supabase account and configure `.env` file
   - Without cloud setup, the app works with localStorage

4. Start the development server:
```bash
npm start
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

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

### Cloud Database (Recommended)
With Supabase configured, your data is stored in the cloud:
- ✅ **Sync across devices**: Access from any browser
- ✅ **Automatic backups**: Data safely stored in PostgreSQL
- ✅ **No size limits**: Much larger than localStorage (500MB free tier)
- ✅ **Always available**: Survives browser data clearing
- ✅ **Free**: No credit card required
- 🟢 **Status indicator**: Green cloud icon when active

See [CLOUD_SETUP.md](CLOUD_SETUP.md) for setup instructions.

### Local Storage (Fallback)
Without cloud setup, the app uses browser localStorage:
- Data persists between browser sessions
- Dark mode preference is also saved
- No server or account required
- Data is stored locally on your device
- Limited to 5-10MB depending on browser
- ⚪ **Status indicator**: Gray cloud icon when active

### Migration Tool
Built-in tool to move localStorage data to cloud:
1. Click the cloud icon in the header
2. Click "Migrate localStorage to Cloud"
3. Your existing data uploads to Supabase
4. Future changes sync automatically

### Export/Import
- **Export**: Click the download button (↓) in the header to save your collection as a JSON file
- **Import**: Click the upload button (↑) to load a previously exported collection
- Import options:
  - Replace: Completely replace current data with imported data
  - Merge: Add imported coffees to your existing collection
- Works with both cloud and localStorage

### Backup Recommendations
- Regularly export your data to create backups (even with cloud)
- Exported files include:
  - All coffee entries with complete data
  - Export version for compatibility
  - Export date for reference

## Limitations

### With Cloud Database (Supabase)
- **Authentication**: Current setup allows anyone with credentials to access data (can be improved with Supabase Auth)
- **No Sharing**: Cannot share collections with other users (yet)

### With localStorage Only
- **Browser-Specific**: Data tied to specific browser and device
- **Storage Limits**: 5-10MB limit depending on browser
- **No Sync**: Data doesn't sync across devices
- **Data Loss Risk**: Cleared if browser data is deleted

### General
- **No User Accounts**: Single-user application (can be added with Supabase Auth)
- **No Photos**: Cannot upload images of coffee bags (yet)

## Future Enhancements

Potential improvements for the application:
- ✅ ~~Add cloud storage/sync capabilities~~ (Completed - Supabase integration)
- Add user authentication (Supabase Auth)
- Implement CSV export format
- Add photo upload for coffee bags
- Create shareable coffee profiles
- Add multi-user support with privacy controls
- Implement coffee bean inventory management
- Add data visualization for export statistics
- Implement automatic backup reminders
- Add mobile app version (React Native)

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
- @supabase/supabase-js: ^2.x (cloud database)
- recharts: ^2.15.3 (data visualization)
- lucide-react: ^0.263.1 (icons)
- jspdf: ^2.5.1 (PDF export)
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