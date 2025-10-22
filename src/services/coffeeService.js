import { supabase, isSupabaseConfigured } from '../supabaseClient';

// Storage keys for localStorage fallback
const STORAGE_KEY = 'coffeeTrackerData';
const VERSION_KEY = 'coffeeTrackerVersion';
const LAST_SAVED_KEY = 'coffeeTrackerLastSaved';
const CURRENT_VERSION = 'v2.1';

// Table name in Supabase
const TABLE_NAME = 'coffees';

/**
 * Mapping of lowercase PostgreSQL column names to camelCase JavaScript property names
 */
const COLUMN_MAPPING = {
  'id': 'id',
  'cuppingtime': 'cuppingTime',
  'roaster': 'roaster',
  'description': 'description',
  'origin': 'origin',
  'url': 'url',
  'percentarabica': 'percentArabica',
  'percentrobusta': 'percentRobusta',
  'roastlevel': 'roastLevel',
  'brewingmethod': 'brewingMethod',
  'recommendedmethod': 'recommendedMethod',
  'grinded': 'grinded',
  'grindingtime': 'grindingTime',
  'grindingdegree': 'grindingDegree',
  'preparationnotes': 'preparationNotes',
  'coffeeamount': 'coffeeAmount',
  'servings': 'servings',
  'cremarating': 'cremaRating',
  'tasterating': 'tasteRating',
  'tastenotes': 'tasteNotes',
  'comment': 'comment',
  'favorite': 'favorite',
  'price': 'price',
  'packagesize': 'packageSize',
  'currency': 'currency',
  'coffeegroup': 'coffeeGroup',
  'created_at': 'created_at'
};

/**
 * Convert camelCase keys to lowercase for PostgreSQL
 */
const toLowerCaseKeys = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return obj;

  const newObj = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      newObj[key.toLowerCase()] = obj[key];
    }
  }
  return newObj;
};

/**
 * Convert lowercase PostgreSQL keys back to camelCase for JavaScript
 */
const toCamelCaseKeys = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return obj;

  const newObj = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const camelKey = COLUMN_MAPPING[key] || key;
      newObj[camelKey] = obj[key];
    }
  }
  return newObj;
};

/**
 * Coffee Database Service
 *
 * This service provides a unified interface for storing coffee data.
 * It automatically uses Supabase when configured, otherwise falls back to localStorage.
 */
class CoffeeService {
  constructor() {
    this.useCloud = isSupabaseConfigured();
  }

  /**
   * Check if cloud storage is enabled and working
   */
  isCloudEnabled() {
    return this.useCloud;
  }

  /**
   * Get all coffees from storage
   */
  async getAllCoffees() {
    if (this.useCloud) {
      try {
        const { data, error } = await supabase
          .from(TABLE_NAME)
          .select('*')
          .order('cuppingtime', { ascending: false }); // lowercase for PostgreSQL

        if (error) throw error;

        // Convert lowercase keys back to camelCase for JavaScript
        const coffeesWithCamelCase = (data || []).map(coffee => toCamelCaseKeys(coffee));
        return coffeesWithCamelCase;
      } catch (error) {
        console.error('Error fetching coffees from Supabase:', error);
        // Fallback to localStorage on error
        return this._getFromLocalStorage();
      }
    } else {
      return this._getFromLocalStorage();
    }
  }

  /**
   * Add a new coffee entry
   */
  async addCoffee(coffee) {
    if (this.useCloud) {
      try {
        // Convert camelCase to lowercase for PostgreSQL
        const coffeeForDb = toLowerCaseKeys(coffee);

        const { data, error } = await supabase
          .from(TABLE_NAME)
          .insert([coffeeForDb])
          .select()
          .single();

        if (error) throw error;
        return { success: true, data };
      } catch (error) {
        console.error('Error adding coffee to Supabase:', error);
        return { success: false, error };
      }
    } else {
      return this._addToLocalStorage(coffee);
    }
  }

  /**
   * Update an existing coffee entry
   */
  async updateCoffee(id, updates) {
    if (this.useCloud) {
      try {
        // Convert camelCase to lowercase for PostgreSQL
        const updatesForDb = toLowerCaseKeys(updates);

        const { data, error } = await supabase
          .from(TABLE_NAME)
          .update(updatesForDb)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return { success: true, data };
      } catch (error) {
        console.error('Error updating coffee in Supabase:', error);
        return { success: false, error };
      }
    } else {
      return this._updateInLocalStorage(id, updates);
    }
  }

  /**
   * Delete a coffee entry
   */
  async deleteCoffee(id) {
    if (this.useCloud) {
      try {
        const { error } = await supabase
          .from(TABLE_NAME)
          .delete()
          .eq('id', id);

        if (error) throw error;
        return { success: true };
      } catch (error) {
        console.error('Error deleting coffee from Supabase:', error);
        return { success: false, error };
      }
    } else {
      return this._deleteFromLocalStorage(id);
    }
  }

  /**
   * Save all coffees (batch operation)
   */
  async saveAllCoffees(coffees) {
    if (this.useCloud) {
      try {
        // Delete all existing entries
        const { error: deleteError } = await supabase
          .from(TABLE_NAME)
          .delete()
          .neq('id', 0); // Delete all records

        if (deleteError) throw deleteError;

        // Insert all new entries
        if (coffees.length > 0) {
          // Convert camelCase to lowercase for PostgreSQL
          const coffeesForDb = coffees.map(coffee => toLowerCaseKeys(coffee));

          const { error: insertError } = await supabase
            .from(TABLE_NAME)
            .insert(coffeesForDb);

          if (insertError) throw insertError;
        }

        return { success: true };
      } catch (error) {
        console.error('Error saving all coffees to Supabase:', error);
        return { success: false, error };
      }
    } else {
      return this._saveToLocalStorage(coffees);
    }
  }

  /**
   * Migrate data from localStorage to Supabase
   */
  async migrateToCloud() {
    if (!this.useCloud) {
      return { success: false, error: 'Supabase is not configured' };
    }

    try {
      // Get data from localStorage
      const localData = this._getFromLocalStorage();

      if (localData.length === 0) {
        return { success: true, message: 'No data to migrate' };
      }

      // Convert camelCase to lowercase for PostgreSQL
      const dataForDb = localData.map(coffee => toLowerCaseKeys(coffee));

      // Use upsert to handle existing entries (insert or update)
      const { error } = await supabase
        .from(TABLE_NAME)
        .upsert(dataForDb, {
          onConflict: 'id',
          ignoreDuplicates: false
        });

      if (error) throw error;

      return {
        success: true,
        message: `Successfully migrated ${localData.length} coffee entries to cloud`
      };
    } catch (error) {
      console.error('Error migrating to cloud:', error);
      return { success: false, error };
    }
  }

  /**
   * Clear all data from cloud
   */
  async clearCloudData() {
    if (!this.useCloud) {
      return { success: false, error: 'Supabase is not configured' };
    }

    try {
      const { error } = await supabase
        .from(TABLE_NAME)
        .delete()
        .neq('id', 0); // Delete all records

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error clearing cloud data:', error);
      return { success: false, error };
    }
  }

  // ==================== LocalStorage Methods ====================

  _getFromLocalStorage() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];

      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return [];
    }
  }

  _saveToLocalStorage(coffees) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(coffees));
      localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
      localStorage.setItem(LAST_SAVED_KEY, new Date().toISOString());
      return { success: true };
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      return { success: false, error };
    }
  }

  _addToLocalStorage(coffee) {
    const coffees = this._getFromLocalStorage();
    coffees.push(coffee);
    return this._saveToLocalStorage(coffees);
  }

  _updateInLocalStorage(id, updates) {
    const coffees = this._getFromLocalStorage();
    const index = coffees.findIndex(c => c.id === id);

    if (index === -1) {
      return { success: false, error: 'Coffee not found' };
    }

    coffees[index] = { ...coffees[index], ...updates };
    return this._saveToLocalStorage(coffees);
  }

  _deleteFromLocalStorage(id) {
    const coffees = this._getFromLocalStorage();
    const filtered = coffees.filter(c => c.id !== id);
    return this._saveToLocalStorage(filtered);
  }
}

// Export a singleton instance
export const coffeeService = new CoffeeService();
