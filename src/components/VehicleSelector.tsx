import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Truck, X, Plus, Check, ChevronRight, CarFront } from 'lucide-react';
import { Vehicle } from '../types';
import { cn } from '../lib/utils';

interface VehicleSelectorProps {
  vehicles: Vehicle[];
  selectedVehicleId?: string;
  onSelect: (vehicleId: string) => void;
  onAdd: (vehicle: Omit<Vehicle, 'id'>) => void;
  onClose: () => void;
}

export default function VehicleSelector({ vehicles, selectedVehicleId, onSelect, onAdd, onClose }: VehicleSelectorProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newVehicle, setNewVehicle] = useState<Omit<Vehicle, 'id'>>({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    fuelType: 'gasoline',
    engineSize: '',
    vin: '',
  });

  const handleAdd = () => {
    if (newVehicle.make && newVehicle.model) {
      onAdd(newVehicle);
      setIsAdding(false);
      setNewVehicle({
        make: '',
        model: '',
        year: new Date().getFullYear(),
        fuelType: 'gasoline',
        engineSize: '',
        vin: '',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="glass-card w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-white/10"
      >
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-car-accent/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-car-accent/20 text-car-accent">
              <CarFront size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Your Garage</h2>
              <p className="text-xs text-white/40">Select the vehicle you're diagnosing</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {!isAdding ? (
            <div className="space-y-3">
              {vehicles.map((v) => (
                <button
                  key={v.id}
                  onClick={() => onSelect(v.id)}
                  className={cn(
                    "w-full p-4 rounded-2xl flex items-center justify-between border transition-all duration-300 group",
                    selectedVehicleId === v.id 
                      ? "bg-car-accent/20 border-car-accent shadow-[0_0_20px_rgba(242,125,38,0.2)]" 
                      : "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "p-3 rounded-xl transition-colors",
                      selectedVehicleId === v.id ? "bg-car-accent/20 text-car-accent" : "bg-white/5 text-white/40 group-hover:text-white/60"
                    )}>
                      <Truck size={20} />
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-white leading-tight">{v.year} {v.make} {v.model}</h3>
                      <p className="text-[10px] uppercase tracking-widest text-white/40 mt-1">{v.engineSize || 'Standard Engine'} • {v.fuelType}</p>
                    </div>
                  </div>
                  {selectedVehicleId === v.id ? (
                    <div className="w-6 h-6 rounded-full bg-car-accent flex items-center justify-center text-white">
                      <Check size={14} />
                    </div>
                  ) : (
                    <ChevronRight size={18} className="text-white/20 group-hover:text-white/40 transition-colors" />
                  )}
                </button>
              ))}

              <button
                onClick={() => setIsAdding(true)}
                className="w-full p-4 rounded-2xl border-2 border-dashed border-white/10 hover:border-car-accent/40 hover:bg-car-accent/5 transition-all text-white/40 hover:text-car-accent flex items-center justify-center gap-2 group"
              >
                <Plus size={20} className="group-hover:scale-110 transition-transform" />
                <span className="font-bold text-sm uppercase tracking-widest">Add New Vehicle</span>
              </button>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-5"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1">Make</label>
                  <input
                    type="text"
                    value={newVehicle.make}
                    onChange={(e) => setNewVehicle({ ...newVehicle, make: e.target.value })}
                    placeholder="Toyota, Ford, etc."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-car-accent/50 transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1">Model</label>
                  <input
                    type="text"
                    value={newVehicle.model}
                    onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                    placeholder="Camry, F-150, etc."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-car-accent/50 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1">Year</label>
                  <input
                    type="number"
                    value={Number.isNaN(newVehicle.year) ? '' : newVehicle.year}
                    onChange={(e) => setNewVehicle({ ...newVehicle, year: e.target.value === '' ? ('' as any) : parseInt(e.target.value) })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-car-accent/50 transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1">Fuel Type</label>
                  <select
                    value={newVehicle.fuelType}
                    onChange={(e) => setNewVehicle({ ...newVehicle, fuelType: e.target.value as any })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-car-accent/50 transition-colors appearance-none"
                  >
                    <option value="gasoline">Gasoline</option>
                    <option value="diesel">Diesel</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="electric">Electric</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1">Engine Size (Optional)</label>
                <input
                  type="text"
                  value={newVehicle.engineSize}
                  onChange={(e) => setNewVehicle({ ...newVehicle, engineSize: e.target.value })}
                  placeholder="e.g. 2.0L Turbo, V8 5.0"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-car-accent/50 transition-colors"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setIsAdding(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-white font-bold text-xs uppercase tracking-widest hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdd}
                  disabled={!newVehicle.make || !newVehicle.model}
                  className="flex-[2] px-4 py-3 rounded-xl bg-car-accent text-white font-bold text-xs uppercase tracking-widest hover:bg-car-accent/80 transition-colors disabled:opacity-50"
                >
                  Add Vehicle
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
