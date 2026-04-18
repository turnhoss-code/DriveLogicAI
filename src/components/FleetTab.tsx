import React from 'react';
import { Truck, AlertTriangle, CheckCircle2, Navigation, Activity } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface FleetVehicle {
  id: string;
  name: string;
  status: 'active' | 'maintenance' | 'offline';
  damageScore: number;
  activeDtcs: string[];
  lastLocation: string;
}

const mockFleet: FleetVehicle[] = [
  {
    id: 'v1',
    name: 'Van 1 - Delivery',
    status: 'active',
    damageScore: 12,
    activeDtcs: [],
    lastLocation: 'Downtown Sector',
  },
  {
    id: 'v2',
    name: 'Truck 2 - Heavy',
    status: 'maintenance',
    damageScore: 85,
    activeDtcs: ['P0300', 'P0135'],
    lastLocation: 'Main Depot',
  },
  {
    id: 'v3',
    name: 'Manager Car',
    status: 'active',
    damageScore: 4,
    activeDtcs: [],
    lastLocation: 'North Branch',
  }
];

export default function FleetTab() {
  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-car-accent to-car-purple bg-clip-text text-transparent">
            Fleet Management
          </h2>
          <p className="text-xs text-white/60 mt-1">Monitor all vehicles in your organization</p>
        </div>
        <div className="px-3 py-1 bg-car-accent/20 text-car-accent rounded-full text-[10px] font-bold uppercase tracking-widest border border-car-accent/30">
          Pro Tier
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center">
          <Truck className="text-car-accent mb-2" size={24} />
          <div className="text-2xl font-bold">3</div>
          <div className="text-[10px] text-white/40 uppercase tracking-widest">Total Vehicles</div>
        </div>
        <div className="glass-card p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center">
          <AlertTriangle className="text-car-warning mb-2" size={24} />
          <div className="text-2xl font-bold">1</div>
          <div className="text-[10px] text-white/40 uppercase tracking-widest">Needs Attention</div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-widest text-white/60 pl-2">Active Vehicles</h3>
        {mockFleet.map((vehicle, idx) => (
          <motion.div
            key={vehicle.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="glass-card p-4 rounded-2xl border border-white/5 space-y-4"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-xl",
                  vehicle.status === 'active' ? "bg-car-success/20 text-car-success" :
                  vehicle.status === 'maintenance' ? "bg-car-warning/20 text-car-warning" :
                  "bg-white/10 text-white/40"
                )}>
                  <Truck size={20} />
                </div>
                <div>
                  <h4 className="font-bold">{vehicle.name}</h4>
                  <div className="flex items-center gap-1 text-[10px] text-white/40 mt-1">
                    <Navigation size={10} />
                    {vehicle.lastLocation}
                  </div>
                </div>
              </div>
              <div className={cn(
                "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest",
                vehicle.status === 'active' ? "bg-car-success/20 text-car-success" :
                vehicle.status === 'maintenance' ? "bg-car-warning/20 text-car-warning" :
                "bg-white/10 text-white/40"
              )}>
                {vehicle.status}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-white/40 uppercase tracking-widest">Damage Score</span>
                <div className="flex items-center gap-2">
                  <Activity size={14} className={vehicle.damageScore > 50 ? "text-car-danger" : "text-car-success"} />
                  <span className="font-mono text-sm">{vehicle.damageScore}</span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-white/40 uppercase tracking-widest">Active DTCs</span>
                <div className="flex items-center gap-2">
                  {vehicle.activeDtcs.length > 0 ? (
                    <span className="text-xs font-bold text-car-danger bg-car-danger/20 px-2 py-0.5 rounded">
                      {vehicle.activeDtcs.length} Codes
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-car-success flex items-center gap-1">
                      <CheckCircle2 size={14} /> Clean
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
