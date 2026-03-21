import { useState, useEffect, useCallback } from 'react';
import { equipmentService } from '../services/equipmentService';

const useEquipment = () => {
  const [equipment, setEquipment] = useState([]);
  const [activeEquipment, setActiveEquipment] = useState(null);

  const loadEquipment = useCallback(() => {
    const all = equipmentService.getAll();
    setEquipment(all);
    setActiveEquipment(all.find(e => e.isActive) || null);
  }, []);

  useEffect(() => {
    loadEquipment();
  }, [loadEquipment]);

  const addEquipment = useCallback((profile) => {
    const result = equipmentService.add(profile);
    if (result.success) {
      loadEquipment();
    }
    return result;
  }, [loadEquipment]);

  const updateEquipment = useCallback((id, updates) => {
    const result = equipmentService.update(id, updates);
    if (result.success) {
      loadEquipment();
    }
    return result;
  }, [loadEquipment]);

  const deleteEquipment = useCallback((id) => {
    const result = equipmentService.delete(id);
    if (result.success) {
      loadEquipment();
    }
    return result;
  }, [loadEquipment]);

  const switchEquipment = useCallback((id) => {
    const result = equipmentService.setActive(id);
    if (result.success) {
      loadEquipment();
    }
    return result;
  }, [loadEquipment]);

  return {
    equipment,
    activeEquipment,
    addEquipment,
    updateEquipment,
    deleteEquipment,
    switchEquipment,
    refreshEquipment: loadEquipment
  };
};

export default useEquipment;
