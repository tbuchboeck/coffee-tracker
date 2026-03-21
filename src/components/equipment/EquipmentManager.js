import React, { useState } from 'react';
import { Settings, Plus, Trash2, Edit3, Check, X } from 'lucide-react';
import Modal from '../shared/Modal';

const EquipmentManager = ({ isOpen, onClose, darkMode, equipment, onAdd, onUpdate, onDelete, onSwitch }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    grinder: '',
    grinderModel: '',
    machine: '',
    machineModel: ''
  });

  const resetForm = () => {
    setFormData({ name: '', grinder: '', grinderModel: '', machine: '', machineModel: '' });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSave = () => {
    if (!formData.name.trim()) return;

    if (editingId) {
      onUpdate(editingId, formData);
    } else {
      onAdd(formData);
    }
    resetForm();
  };

  const handleEdit = (profile) => {
    setFormData({
      name: profile.name,
      grinder: profile.grinder || '',
      grinderModel: profile.grinderModel || '',
      machine: profile.machine || '',
      machineModel: profile.machineModel || ''
    });
    setEditingId(profile.id);
    setIsAdding(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this equipment profile?')) {
      onDelete(id);
    }
  };

  const inputClass = `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors ${
    darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300 placeholder-gray-500'
  }`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Equipment Profiles"
      icon={<Settings className="w-6 h-6 text-amber-600" />}
      darkMode={darkMode}
    >
      <div className="space-y-4">
        {/* Existing profiles */}
        {equipment.map(profile => (
          <div
            key={profile.id}
            className={`p-4 rounded-xl border-2 transition-all ${
              profile.isActive
                ? darkMode ? 'border-amber-500 bg-amber-900/20' : 'border-amber-500 bg-amber-50'
                : darkMode ? 'border-gray-600 bg-gray-700/50' : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="font-bold text-lg">{profile.name}</h3>
                  {profile.isActive && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500 text-white font-medium">Active</span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  {profile.grinder && (
                    <div className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                      <span className="font-medium">Grinder:</span> {profile.grinder}
                      {profile.grinderModel && <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}> ({profile.grinderModel})</span>}
                    </div>
                  )}
                  {profile.machine && (
                    <div className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                      <span className="font-medium">Machine:</span> {profile.machine}
                      {profile.machineModel && <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}> ({profile.machineModel})</span>}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-1 ml-2">
                {!profile.isActive && (
                  <button
                    onClick={() => onSwitch(profile.id)}
                    className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                      darkMode ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-amber-500 hover:bg-amber-600 text-white'
                    }`}
                    title="Set as active"
                  >
                    Activate
                  </button>
                )}
                <button
                  onClick={() => handleEdit(profile)}
                  className={`p-1.5 rounded ${darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'} transition-colors`}
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(profile.id)}
                  className={`p-1.5 rounded ${darkMode ? 'text-gray-400 hover:text-red-400 hover:bg-gray-600' : 'text-gray-500 hover:text-red-600 hover:bg-red-50'} transition-colors`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {equipment.length === 0 && !isAdding && (
          <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <Settings className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-lg font-medium mb-1">No equipment profiles yet</p>
            <p className="text-sm">Add your grinder and coffee machine to track which equipment you use.</p>
          </div>
        )}

        {/* Add/Edit form */}
        {isAdding ? (
          <div className={`p-4 rounded-xl border-2 border-dashed ${darkMode ? 'border-gray-500 bg-gray-700/30' : 'border-gray-300 bg-gray-50'}`}>
            <h3 className="font-bold mb-3">{editingId ? 'Edit Profile' : 'New Equipment Profile'}</h3>
            <div className="space-y-3">
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Profile Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Home Setup, Office, Travel Kit"
                  className={inputClass}
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Grinder</label>
                  <input
                    type="text"
                    value={formData.grinder}
                    onChange={(e) => setFormData({ ...formData, grinder: e.target.value })}
                    placeholder="e.g. Eureka Mignon"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Grinder Model</label>
                  <input
                    type="text"
                    value={formData.grinderModel}
                    onChange={(e) => setFormData({ ...formData, grinderModel: e.target.value })}
                    placeholder="e.g. Specialita"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Coffee Machine</label>
                  <input
                    type="text"
                    value={formData.machine}
                    onChange={(e) => setFormData({ ...formData, machine: e.target.value })}
                    placeholder="e.g. Rancilio Silvia"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Machine Model</label>
                  <input
                    type="text"
                    value={formData.machineModel}
                    onChange={(e) => setFormData({ ...formData, machineModel: e.target.value })}
                    placeholder="e.g. Pro X"
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="flex space-x-2 pt-2">
                <button
                  onClick={handleSave}
                  disabled={!formData.name.trim()}
                  className="flex items-center space-x-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingId ? 'Update' : 'Save'}</span>
                </button>
                <button
                  onClick={resetForm}
                  className={`flex items-center space-x-1 px-4 py-2 rounded-lg transition-colors ${
                    darkMode ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className={`w-full p-3 rounded-xl border-2 border-dashed transition-colors flex items-center justify-center space-x-2 ${
              darkMode
                ? 'border-gray-600 hover:border-amber-500 text-gray-400 hover:text-amber-400'
                : 'border-gray-300 hover:border-amber-500 text-gray-500 hover:text-amber-600'
            }`}
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Add Equipment Profile</span>
          </button>
        )}
      </div>
    </Modal>
  );
};

export default EquipmentManager;
