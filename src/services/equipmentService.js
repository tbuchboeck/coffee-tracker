const STORAGE_KEY = 'coffeeTrackerEquipment';
const ACTIVE_KEY = 'coffeeTrackerActiveEquipment';

class EquipmentService {
  getAll() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Error reading equipment from localStorage:', error);
      return [];
    }
  }

  _saveAll(equipment) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(equipment));
      return { success: true };
    } catch (error) {
      console.error('Error saving equipment to localStorage:', error);
      return { success: false, error };
    }
  }

  add(profile) {
    const equipment = this.getAll();
    const newProfile = {
      ...profile,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      isActive: equipment.length === 0 // First profile is auto-active
    };
    // If this is the first and becomes active, no need to deactivate others
    if (newProfile.isActive) {
      equipment.forEach(e => { e.isActive = false; });
    }
    equipment.push(newProfile);
    this._saveAll(equipment);
    if (newProfile.isActive) {
      localStorage.setItem(ACTIVE_KEY, String(newProfile.id));
    }
    return { success: true, data: newProfile };
  }

  update(id, updates) {
    const equipment = this.getAll();
    const index = equipment.findIndex(e => e.id === id);
    if (index === -1) return { success: false, error: 'Equipment not found' };
    equipment[index] = { ...equipment[index], ...updates };
    this._saveAll(equipment);
    return { success: true, data: equipment[index] };
  }

  delete(id) {
    const equipment = this.getAll();
    const wasActive = equipment.find(e => e.id === id)?.isActive;
    const filtered = equipment.filter(e => e.id !== id);
    // If deleted profile was active, activate the first remaining one
    if (wasActive && filtered.length > 0) {
      filtered[0].isActive = true;
      localStorage.setItem(ACTIVE_KEY, String(filtered[0].id));
    } else if (filtered.length === 0) {
      localStorage.removeItem(ACTIVE_KEY);
    }
    this._saveAll(filtered);
    return { success: true };
  }

  setActive(id) {
    const equipment = this.getAll();
    equipment.forEach(e => { e.isActive = e.id === id; });
    this._saveAll(equipment);
    localStorage.setItem(ACTIVE_KEY, String(id));
    return { success: true };
  }

  getActive() {
    const equipment = this.getAll();
    return equipment.find(e => e.isActive) || null;
  }

  getActiveId() {
    const id = localStorage.getItem(ACTIVE_KEY);
    return id ? parseInt(id, 10) : null;
  }
}

export const equipmentService = new EquipmentService();
