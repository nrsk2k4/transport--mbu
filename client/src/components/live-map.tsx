import { useEffect, useRef } from "react";
import { MapPin, Navigation } from "lucide-react";

export default function LiveMap() {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // In a real implementation, this would initialize Leaflet map
    // For now, we'll create a visual placeholder
    if (mapRef.current) {
      // Simulate map initialization
      console.log("Map initialized");
    }
  }, []);

  return (
    <div
      ref={mapRef}
      className="w-full h-full bg-gradient-to-br from-blue-100 to-green-100 rounded-lg relative overflow-hidden"
      data-testid="live-map"
    >
      {/* Map overlay for demo */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <Navigation className="h-8 w-8 text-primary mb-2 mx-auto" />
          <p className="text-sm text-muted-foreground font-medium">Live Map View</p>
          <div className="flex justify-center space-x-2 mt-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
          </div>
        </div>
      </div>
      
      {/* Simulated location markers */}
      <div className="absolute top-4 left-4">
        <div className="flex items-center space-x-2 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 text-xs">
          <MapPin className="h-3 w-3 text-green-500" />
          <span>MBU Main Gate</span>
        </div>
      </div>
      
      <div className="absolute bottom-4 right-4">
        <div className="flex items-center space-x-2 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 text-xs">
          <MapPin className="h-3 w-3 text-red-500" />
          <span>City Center</span>
        </div>
      </div>
      
      {/* Simulated route line */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <path
          d="M 50 50 Q 150 100 250 150"
          stroke="#3b82f6"
          strokeWidth="3"
          fill="none"
          strokeDasharray="5,5"
          className="animate-pulse"
        />
      </svg>
    </div>
  );
}
