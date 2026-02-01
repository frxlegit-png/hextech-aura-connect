import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Circle, Popup, useMap } from "react-leaflet";
import { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

// Zimbabwe coverage areas (Harare-based for now)
const coverageAreas = [
  { 
    name: "Harare CBD", 
    center: [-17.8292, 31.0522] as LatLngExpression, 
    radius: 3000, 
    status: "active" as const 
  },
  { 
    name: "Borrowdale", 
    center: [-17.7575, 31.0989] as LatLngExpression, 
    radius: 2500, 
    status: "active" as const 
  },
  { 
    name: "Avondale", 
    center: [-17.7925, 31.0339] as LatLngExpression, 
    radius: 2000, 
    status: "active" as const 
  },
  { 
    name: "Mount Pleasant", 
    center: [-17.7679, 31.0485] as LatLngExpression, 
    radius: 2200, 
    status: "active" as const 
  },
  { 
    name: "Eastlea", 
    center: [-17.8194, 31.0783] as LatLngExpression, 
    radius: 1800, 
    status: "active" as const 
  },
  { 
    name: "Belvedere", 
    center: [-17.8372, 31.0247] as LatLngExpression, 
    radius: 1500, 
    status: "expanding" as const 
  },
  { 
    name: "Highlands", 
    center: [-17.7839, 31.0694] as LatLngExpression, 
    radius: 2000, 
    status: "active" as const 
  },
  { 
    name: "Chitungwiza", 
    center: [-18.0127, 31.0755] as LatLngExpression, 
    radius: 4000, 
    status: "expanding" as const 
  },
];

interface MapClickHandlerProps {
  onLocationSelect: (lat: number, lng: number, inCoverage: boolean) => void;
}

const MapClickHandler = ({ onLocationSelect }: MapClickHandlerProps) => {
  const map = useMap();
  
  useEffect(() => {
    const handleClick = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      
      // Check if clicked location is within any coverage area
      const inCoverage = coverageAreas.some(area => {
        const areaCenter = area.center as [number, number];
        const distance = map.distance([lat, lng], areaCenter);
        return distance <= area.radius && area.status === "active";
      });
      
      onLocationSelect(lat, lng, inCoverage);
    };
    
    map.on("click", handleClick);
    return () => {
      map.off("click", handleClick);
    };
  }, [map, onLocationSelect]);
  
  return null;
};

interface CoverageMapProps {
  onLocationSelect?: (lat: number, lng: number, inCoverage: boolean) => void;
}

const CoverageMap = ({ onLocationSelect }: CoverageMapProps) => {
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
    inCoverage: boolean;
  } | null>(null);

  const handleLocationSelect = (lat: number, lng: number, inCoverage: boolean) => {
    setSelectedLocation({ lat, lng, inCoverage });
    onLocationSelect?.(lat, lng, inCoverage);
  };

  // Harare center
  const center: LatLngExpression = [-17.8252, 31.0335];

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden">
      <MapContainer
        center={center}
        zoom={11}
        style={{ height: "100%", width: "100%" }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        {/* Coverage circles */}
        {coverageAreas.map((area, index) => (
          <Circle
            key={index}
            center={area.center}
            radius={area.radius}
            pathOptions={{
              color: area.status === "active" ? "hsl(185, 100%, 50%)" : "hsl(45, 100%, 50%)",
              fillColor: area.status === "active" ? "hsl(185, 100%, 50%)" : "hsl(45, 100%, 50%)",
              fillOpacity: 0.2,
              weight: 2,
            }}
          >
            <Popup>
              <div className="text-center">
                <p className="font-semibold text-foreground">{area.name}</p>
                <p className={`text-sm ${area.status === "active" ? "text-green-500" : "text-yellow-500"}`}>
                  {area.status === "active" ? "✓ Active Coverage" : "⏳ Coming Soon"}
                </p>
              </div>
            </Popup>
          </Circle>
        ))}
        
        {/* Selected location marker */}
        {selectedLocation && (
          <Circle
            center={[selectedLocation.lat, selectedLocation.lng]}
            radius={200}
            pathOptions={{
              color: selectedLocation.inCoverage ? "hsl(120, 100%, 50%)" : "hsl(0, 100%, 50%)",
              fillColor: selectedLocation.inCoverage ? "hsl(120, 100%, 50%)" : "hsl(0, 100%, 50%)",
              fillOpacity: 0.5,
              weight: 3,
            }}
          >
            <Popup>
              <div className="text-center">
                <p className="font-semibold">
                  {selectedLocation.inCoverage ? "✓ You're Covered!" : "✗ Not in Coverage Area"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedLocation.inCoverage 
                    ? "Great news! We can serve your location." 
                    : "Register your interest for future expansion."}
                </p>
              </div>
            </Popup>
          </Circle>
        )}
        
        <MapClickHandler onLocationSelect={handleLocationSelect} />
      </MapContainer>
      
      {/* Legend overlay */}
      <div className="absolute bottom-4 left-4 z-[1000] glass-card p-3 rounded-lg">
        <p className="text-xs font-semibold text-foreground mb-2">Click to check coverage</p>
        <div className="flex flex-col gap-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary/60" />
            <span className="text-muted-foreground">Active Coverage</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
            <span className="text-muted-foreground">Coming Soon</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoverageMap;
