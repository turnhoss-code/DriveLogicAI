import React, { useState, useEffect } from 'react';
import { Navigation, X, Key } from 'lucide-react';
import { NavigationState } from '../types';
import { GoogleMap, Marker, DirectionsRenderer, TrafficLayer } from '@react-google-maps/api';

interface FloatingMapProps {
  navigation: NavigationState;
  setNavigation: (nav: NavigationState) => void;
  mapsApiKey: string;
  isMapsLoaded: boolean;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const darkMapStyles = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#263c3f" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b9a76" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#38414e" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#212a37" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca5b3" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#746855" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1f2835" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#f3d19c" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#2f3948" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#17263c" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#515c6d" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#17263c" }],
  },
];

const libraries: ("places" | "routes" | "geocoding" | "core")[] = ["places", "routes", "geocoding", "core"];

export default function FloatingMap({ navigation, setNavigation, mapsApiKey, isMapsLoaded }: FloatingMapProps) {
  const [fromInput, setFromInput] = useState(navigation.from);
  const [toInput, setToInput] = useState(navigation.to);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [eta, setEta] = useState<string | null>(null);
  const [distance, setDistance] = useState<string | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.error("Geolocation failed:", err)
      );
    }
  }, []);

  useEffect(() => {
    if (!isMapsLoaded || !navigation.from || !navigation.to) return;

    const fetchDirections = () => {
      const directionsService = new google.maps.DirectionsService();
      
      // Handle "Current Location" by using the actual location state if available
      let origin: string | google.maps.LatLngLiteral = navigation.from;
      if (navigation.from.toLowerCase() === 'current location' && location) {
        origin = location;
      } else if (navigation.from.toLowerCase() === 'current location' && !location) {
        // If location is not yet available, we can't route from current location
        return;
      }

      directionsService.route(
        {
          origin: origin,
          destination: navigation.to,
          waypoints: navigation.waypoints?.map(wp => ({
            location: new google.maps.LatLng(wp.lat, wp.lng),
            stopover: true
          })),
          travelMode: google.maps.TravelMode.DRIVING,
          drivingOptions: {
            departureTime: new Date(), // Required to get traffic information
            trafficModel: google.maps.TrafficModel.BEST_GUESS
          }
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            setDirections(result);
            const route = result.routes[0].legs[0];
            // Use duration_in_traffic if available, otherwise fallback to standard duration
            setEta(route.duration_in_traffic?.text || route.duration?.text || null);
            setDistance(route.distance?.text || null);
          } else {
            console.error(`Error fetching directions: ${status}`, result);
            // Clear directions if there's an error so we don't show stale data
            setDirections(null);
            setEta(null);
            setDistance(null);
          }
        }
      );
    };

    // Initial fetch
    fetchDirections();

    // Re-fetch every 2 minutes (120000 ms) to get updated traffic and ETAs
    const intervalId = setInterval(fetchDirections, 120000);

    return () => clearInterval(intervalId);
  }, [isMapsLoaded, navigation.from, navigation.to, navigation.waypoints, location]);

  if (!navigation.isActive) return null;

  return (
    <div className="flex flex-col h-full relative bg-[#151619]">
      {/* Header */}
      <div className="p-2 bg-car-accent/10 flex items-center justify-between border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2 overflow-hidden">
          <Navigation size={14} className="text-car-accent shrink-0" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/80 truncate">Live Navigation</span>
        </div>
        <button onClick={() => setNavigation({ ...navigation, isActive: false })} className="p-1 hover:bg-white/10 rounded-lg text-white/40">
          <X size={12} />
        </button>
      </div>

      {/* Map View */}
      <div className="flex-1 relative overflow-hidden">
        {isMapsLoaded && mapsApiKey ? (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={location || { lat: 37.7749, lng: -122.4194 }}
            zoom={15}
            options={{
              styles: darkMapStyles,
              disableDefaultUI: true,
            }}
            onClick={(e) => {
              if (e.latLng) {
                const lat = e.latLng.lat();
                const lng = e.latLng.lng();
                const geocoder = new google.maps.Geocoder();
                geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                  let destination = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                  if (status === 'OK' && results && results[0]) {
                    destination = results[0].formatted_address;
                  }
                  
                  if (!navigation.to) {
                    setToInput(destination);
                    setNavigation({ ...navigation, to: destination, waypoints: [] });
                  } else {
                    const currentWaypoints = navigation.waypoints || [];
                    setNavigation({ 
                      ...navigation, 
                      waypoints: [...currentWaypoints, { lat, lng }]
                    });
                  }
                });
              }
            }}
          >
            <TrafficLayer />
            {location && <Marker position={location} />}
            {directions && <DirectionsRenderer directions={directions} options={{ suppressMarkers: false }} />}
          </GoogleMap>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
            {!mapsApiKey ? (
              <Key className="text-car-warning" size={16} />
            ) : (
              <Navigation className="text-car-accent animate-pulse" size={16} />
            )}
          </div>
        )}

        {(eta || distance) && (
          <div className="absolute bottom-3 left-3 right-3 p-2 glass-card rounded-xl border border-white/5 flex items-center justify-between">
            <div>
              <p className="text-[7px] uppercase tracking-widest text-white/40">ETA</p>
              <p className="text-[10px] font-bold text-white">{eta || '--'}</p>
            </div>
            <div className="text-right">
              <p className="text-[7px] uppercase tracking-widest text-white/40">Dist</p>
              <p className="text-[10px] font-bold text-car-accent">{distance || '--'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
