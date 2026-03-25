import React, { useState, useCallback } from 'react';
import { Activity, History, AlertTriangle, ChevronRight, Clock, MapPin, ChevronDown, Download, Key } from 'lucide-react';
import { DamagePoint, Trip, SensorPoint } from '../types';
import { LineChart, Line, ResponsiveContainer, YAxis, XAxis, Tooltip, AreaChart, Area } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { GoogleMap, useJsApiLoader, Polyline, Marker, InfoWindow } from '@react-google-maps/api';

interface DamageLogTabProps {
  score: number;
  history: DamagePoint[];
  sensorHistory: SensorPoint[];
  trips: Trip[];
  isRecording: boolean;
  mapsApiKey: string;
  onUpdateTrip: (trip: Trip) => void;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '0.75rem'
};

const darkMapStyles = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9a76" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f3948" }] },
  { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
  { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] },
];

const libraries: ("places")[] = ["places"];

export default function DamageLogTab({ score, history, sensorHistory, trips, isRecording, mapsApiKey, onUpdateTrip }: DamageLogTabProps) {
  const [expandedTripId, setExpandedTripId] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<{ type: string, timestamp: number, lat: number, lng: number } | null>(null);
  const [newMarkerPos, setNewMarkerPos] = useState<{ lat: number, lng: number } | null>(null);
  const [markerNote, setMarkerNote] = useState('');

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: mapsApiKey,
    libraries
  });

  React.useEffect(() => {
    setSelectedEvent(null);
    setNewMarkerPos(null);
    setMarkerNote('');
  }, [expandedTripId]);

  const handleAddMarker = (trip: Trip) => {
    if (!newMarkerPos || !markerNote.trim()) return;

    const updatedTrip: Trip = {
      ...trip,
      customMarkers: [
        ...(trip.customMarkers || []),
        { ...newMarkerPos, note: markerNote, timestamp: Date.now() }
      ]
    };

    onUpdateTrip(updatedTrip);
    setNewMarkerPos(null);
    setMarkerNote('');
  };

  const handleDeleteMarker = (trip: Trip, timestamp: number) => {
    const updatedTrip: Trip = {
      ...trip,
      customMarkers: (trip.customMarkers || []).filter(m => m.timestamp !== timestamp)
    };
    onUpdateTrip(updatedTrip);
  };

  const exportTripData = (trip: Trip, e: React.MouseEvent) => {
    e.stopPropagation();
    const dataStr = JSON.stringify(trip, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `trip_${trip.id}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const exportAllTrips = () => {
    const dataStr = JSON.stringify(trips, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `all_trips.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const exportFullReport = () => {
    const data = {
      timestamp: Date.now(),
      currentScore: score,
      liveHistory: history,
      liveSensorHistory: sensorHistory,
      trips: trips
    };
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ztcd_full_report_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getScoreColor = (s: number) => {
    if (s < 20) return 'text-car-success';
    if (s < 50) return 'text-car-warning';
    return 'text-car-danger';
  };

  const renderRoute = (trip: Trip) => {
    const { waypoints, events } = trip;
    if (waypoints.length < 2) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-white/20">
          <MapPin size={24} />
          <span className="text-[8px] uppercase mt-1">No route data</span>
        </div>
      );
    }

    if (!isLoaded || !mapsApiKey) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-white/20">
          <Key size={24} />
          <span className="text-[8px] uppercase mt-1">Maps API Key Required</span>
        </div>
      );
    }

    const path = waypoints.map(w => ({ lat: w.lat, lng: w.lng }));
    const startPoint = path[0];
    const endPoint = path[path.length - 1];

    const onLoadMap = (map: google.maps.Map) => {
      const bounds = new google.maps.LatLngBounds();
      path.forEach(p => bounds.extend(p));
      map.fitBounds(bounds, { top: 20, right: 20, bottom: 20, left: 20 });
    };

    return (
      <div className="relative w-full h-full rounded-xl overflow-hidden">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          options={{
            styles: darkMapStyles,
            disableDefaultUI: true,
            gestureHandling: 'cooperative',
          }}
          onLoad={onLoadMap}
          onClick={(e) => {
            if (e.latLng) {
              setNewMarkerPos({ lat: e.latLng.lat(), lng: e.latLng.lng() });
            }
          }}
        >
          <Polyline
            path={path}
            options={{
              strokeColor: "#3b82f6",
              strokeOpacity: 0.8,
              strokeWeight: 4,
            }}
          />
          <Marker
            position={startPoint}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 6,
              fillColor: "#10b981",
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: "#FFFFFF",
            }}
          />
          <Marker
            position={endPoint}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 6,
              fillColor: "#ef4444",
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: "#FFFFFF",
            }}
          />
          {events.map((event, idx) => {
            if (!event.location) return null;
            return (
              <Marker
                key={idx}
                position={{ lat: event.location.lat, lng: event.location.lng }}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 8,
                  fillColor: event.type === 'harsh_braking' ? '#ef4444' : '#f59e0b',
                  fillOpacity: 0.9,
                  strokeWeight: 2,
                  strokeColor: "#FFFFFF",
                }}
                onClick={() => {
                  setSelectedEvent({
                    type: event.type,
                    timestamp: event.timestamp,
                    lat: event.location!.lat,
                    lng: event.location!.lng
                  });
                }}
              />
            );
          })}

          {/* Custom Markers */}
          {trip.customMarkers?.map((marker, idx) => (
            <Marker
              key={`custom-${idx}`}
              position={{ lat: marker.lat, lng: marker.lng }}
              icon={{
                path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                scale: 5,
                fillColor: "#8b5cf6",
                fillOpacity: 1,
                strokeWeight: 2,
                strokeColor: "#FFFFFF",
              }}
              onClick={() => {
                setSelectedEvent({
                  type: `Note: ${marker.note}`,
                  timestamp: marker.timestamp,
                  lat: marker.lat,
                  lng: marker.lng
                });
              }}
            />
          ))}

          {/* New Marker Placement */}
          {newMarkerPos && (
            <InfoWindow
              position={newMarkerPos}
              onCloseClick={() => setNewMarkerPos(null)}
            >
              <div className="p-2 min-w-[150px]">
                <p className="text-[10px] font-bold uppercase text-gray-500 mb-2">Add Note to Route</p>
                <textarea
                  autoFocus
                  value={markerNote}
                  onChange={(e) => setMarkerNote(e.target.value)}
                  placeholder="Enter note..."
                  className="w-full text-xs p-2 border rounded mb-2 text-black"
                  rows={2}
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setNewMarkerPos(null)}
                    className="text-[10px] uppercase font-bold text-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleAddMarker(trip)}
                    className="text-[10px] uppercase font-bold text-car-accent"
                  >
                    Save
                  </button>
                </div>
              </div>
            </InfoWindow>
          )}

          {selectedEvent && (
            <InfoWindow
              position={{ lat: selectedEvent.lat, lng: selectedEvent.lng }}
              onCloseClick={() => setSelectedEvent(null)}
              options={{
                pixelOffset: new google.maps.Size(0, -10),
              }}
            >
              <div className="p-1 text-black max-w-[200px]">
                <p className="text-xs font-bold uppercase tracking-tighter mb-1">
                  {selectedEvent.type.startsWith('Note:') ? 'Custom Note' : selectedEvent.type.replace('_', ' ')}
                </p>
                <p className="text-[10px] leading-tight mb-2">
                  {selectedEvent.type.startsWith('Note:') ? selectedEvent.type.substring(6) : ''}
                </p>
                <div className="flex justify-between items-center">
                  <p className="text-[8px] font-mono text-gray-400">
                    {new Date(selectedEvent.timestamp).toLocaleTimeString()}
                  </p>
                  {selectedEvent.type.startsWith('Note:') && (
                    <button
                      onClick={() => {
                        handleDeleteMarker(trip, selectedEvent.timestamp);
                        setSelectedEvent(null);
                      }}
                      className="text-[8px] text-red-500 font-bold uppercase"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Activity className="text-car-accent" size={24} />
          Damage Analysis
        </h2>
        <button
          onClick={exportFullReport}
          className="flex items-center gap-2 px-3 py-1.5 bg-car-accent/10 hover:bg-car-accent/20 text-car-accent rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border border-car-accent/20"
        >
          <Download size={14} />
          Export Data
        </button>
      </div>

      {/* Live Damage Score */}
      <div className="glass-card p-6 rounded-3xl flex flex-col items-center gap-4 text-center">
        <div className="relative">
          <svg className="w-32 h-32 transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="58"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-white/5"
            />
            <circle
              cx="64"
              cy="64"
              r="58"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={364}
              strokeDashoffset={364 - (364 * score) / 100}
              className={cn("transition-all duration-500", getScoreColor(score))}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold font-mono">{Math.round(score)}</span>
            <span className="text-[8px] uppercase tracking-widest text-white/40">Damage Score</span>
          </div>
        </div>
        
        <div className="w-full space-y-4 mt-2">
          {/* Accelerometer Chart */}
          <div className="space-y-1">
            <div className="flex justify-between items-center px-1">
              <span className="text-[8px] uppercase tracking-widest text-car-cyan font-mono">Accelerometer (G)</span>
              <span className="text-[10px] font-mono text-white/40">
                {sensorHistory.length > 0 ? sensorHistory[sensorHistory.length - 1].accel.toFixed(2) : '0.00'} G
              </span>
            </div>
            <div className="h-20 w-full bg-black/20 rounded-xl p-1 border border-white/5">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sensorHistory}>
                  <defs>
                    <linearGradient id="colorAccel" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area 
                    type="monotone" 
                    dataKey="accel" 
                    stroke="#06b6d4" 
                    fillOpacity={1}
                    fill="url(#colorAccel)"
                    strokeWidth={2} 
                    isAnimationActive={false}
                  />
                  <YAxis hide domain={['auto', 'auto']} />
                  <XAxis hide />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f1012', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }}
                    itemStyle={{ padding: '0' }}
                    labelStyle={{ display: 'none' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gyroscope Chart */}
          <div className="space-y-1">
            <div className="flex justify-between items-center px-1">
              <span className="text-[8px] uppercase tracking-widest text-car-purple font-mono">Gyroscope (°/s)</span>
              <span className="text-[10px] font-mono text-white/40">
                {sensorHistory.length > 0 ? sensorHistory[sensorHistory.length - 1].gyro.toFixed(0) : '0'} °/s
              </span>
            </div>
            <div className="h-20 w-full bg-black/20 rounded-xl p-1 border border-white/5">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sensorHistory}>
                  <defs>
                    <linearGradient id="colorGyro" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area 
                    type="monotone" 
                    dataKey="gyro" 
                    stroke="#8b5cf6" 
                    fillOpacity={1}
                    fill="url(#colorGyro)"
                    strokeWidth={2} 
                    isAnimationActive={false}
                  />
                  <YAxis hide domain={['auto', 'auto']} />
                  <XAxis hide />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f1012', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }}
                    itemStyle={{ padding: '0' }}
                    labelStyle={{ display: 'none' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Trip History */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="font-bold flex items-center gap-2">
            <History size={18} className="text-car-accent" />
            Trip History
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-white/40 font-mono uppercase">{trips.length} Recorded</span>
            {trips.length > 0 && (
              <button
                onClick={exportAllTrips}
                className="flex items-center gap-1 px-2 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] uppercase tracking-wider text-white/60 transition-colors"
                title="Export all trips as JSON"
              >
                <Download size={12} />
                Export All
              </button>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {trips.length === 0 ? (
            <div className="glass-card p-8 rounded-2xl text-center">
              <p className="text-xs text-white/40 italic">No trips recorded yet. Start a trip to begin logging data.</p>
            </div>
          ) : (
            trips.map((trip) => (
              <motion.div
                key={trip.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => setExpandedTripId(expandedTripId === trip.id ? null : trip.id)}
                className={cn(
                  "glass-card p-4 rounded-2xl flex flex-col group cursor-pointer hover:bg-white/5 transition-all duration-300",
                  expandedTripId === trip.id && "bg-white/5 border-car-accent/30"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      trip.averageDamageScore < 30 ? "bg-car-success/10 text-car-success" : "bg-car-danger/10 text-car-danger"
                    )}>
                      <Activity size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">
                          {new Date(trip.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                        <span className="text-[10px] text-white/40 font-mono">
                          {new Date(trip.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1 text-[10px] text-white/60">
                          <Clock size={10} />
                          {Math.round((trip.endTime! - trip.startTime) / 60000)} min
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-white/60">
                          <AlertTriangle size={10} className={trip.events.length > 0 ? "text-car-warning" : "text-white/20"} />
                          {trip.events.length} events
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => exportTripData(trip, e)}
                      className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-colors mr-2"
                      title="Export trip data"
                    >
                      <Download size={14} />
                    </button>
                    <div className="text-right">
                      <div className="text-xs font-bold font-mono">{Math.round(trip.averageDamageScore)}</div>
                      <div className="text-[8px] text-white/40 uppercase tracking-tighter">Avg Score</div>
                    </div>
                    {expandedTripId === trip.id ? (
                      <ChevronDown size={16} className="text-car-accent" />
                    ) : (
                      <ChevronRight size={16} className="text-white/20 group-hover:text-car-accent transition-colors" />
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {expandedTripId === trip.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 pt-4 border-t border-white/5 space-y-4">
                        {/* Trip Damage Chart */}
                        <div>
                          <p className="text-[8px] uppercase tracking-widest text-white/40 mb-2">Damage Timeline</p>
                          <div className="h-24 w-full bg-black/20 rounded-xl p-2">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={trip.damageHistory}>
                                <defs>
                                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <Area 
                                  type="monotone" 
                                  dataKey="score" 
                                  stroke="#3b82f6" 
                                  fillOpacity={1} 
                                  fill="url(#colorScore)" 
                                  strokeWidth={2}
                                />
                                <YAxis hide domain={[0, 100]} />
                                <XAxis hide />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Trip Route Visualization */}
                        <div>
                          <p className="text-[8px] uppercase tracking-widest text-white/40 mb-2">Route Map</p>
                          <div className="h-40 w-full bg-black/40 rounded-xl relative overflow-hidden border border-white/5">
                            <div className="absolute inset-0 opacity-10" style={{ 
                              backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', 
                              backgroundSize: '15px 15px' 
                            }} />
                            <div className="relative z-10 w-full h-full p-4">
                              {renderRoute(trip)}
                            </div>
                            <div className="absolute bottom-2 left-2 flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-car-success" />
                                <span className="text-[6px] text-white/40 uppercase">Start</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-car-danger" />
                                <span className="text-[6px] text-white/40 uppercase">End</span>
                              </div>
                            </div>
                            <div className="absolute top-2 right-2">
                              <span className="text-[8px] font-mono text-white/40">{trip.distance.toFixed(2)} mi</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
