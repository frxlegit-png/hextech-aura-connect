import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Circle, Popup, useMap } from "react-leaflet";
import { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import { useCoverageAreas, CoverageArea } from "@/hooks/useCoverageAreas";

interface MapClickHandlerProps {
  onLocationSelect: (lat: number, lng: number, inCoverage: boolean) => void;
  coverageAreas: CoverageArea[];
}

const MapClickHandler = ({ onLocationSelect, coverageAreas }: MapClickHandlerProps) => {
  const map = useMap();
  
  useEffect(() => {
    const handleClick = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      
      // Check if clicked location is within any coverage area
      const inCoverage = coverageAreas.some(area => {
        const distance = map.distance([lat, lng], [area.latitude, area.longitude]);
        return distance <= area.radius && area.status === "active";
      });
      
      onLocationSelect(lat, lng, inCoverage);
    };
    
    map.on("click", handleClick);
    return () => {
      map.off("click", handleClick);
    };
  }, [map, onLocationSelect, coverageAreas]);
  
  return null;
};

interface CoverageMapProps {
  onLocationSelect?: (lat: number, lng: number, inCoverage: boolean) => void;
}

const CoverageMap = ({ onLocationSelect }: CoverageMapProps) => {
  const { areas: coverageAreas, isLoading } = useCoverageAreas();
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

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-secondary/30 rounded-2xl">
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    );
  }

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
        {coverageAreas.map((area) => (
          <Circle
            key={area.id}
            center={[area.latitude, area.longitude] as LatLngExpression}
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
        
        <MapClickHandler onLocationSelect={handleLocationSelect} coverageAreas={coverageAreas} />
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
