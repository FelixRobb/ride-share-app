"use client";

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchIcon, MapPin, Crosshair, Loader } from 'lucide-react';
import { toast } from "@/hooks/use-toast";
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface MapDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (location: { lat: number; lon: number; display_name: string }) => void;
  initialLocation?: { lat: number; lon: number };
}

const MapDialog: React.FC<MapDialogProps> = ({ isOpen, onClose, onSelectLocation, initialLocation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState({ lat: 38.7223, lon: -9.1393 });
  const [address, setAddress] = useState('');
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleMapClick = (e: maplibregl.MapMouseEvent) => {
    const { lng, lat } = e.lngLat;
    setSelectedLocation({ lat, lon: lng });
    updateMarker(lat, lng);
    reverseGeocode(lat, lng);
  };

  useEffect(() => {
    if (initialLocation) {
      setSelectedLocation(initialLocation);
    }
  }, [initialLocation]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const initializeMap = async () => {
      if (!isOpen || !mapRef.current) return;
      setIsLoading(true);

      try {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        const lat = initialLocation?.lat || selectedLocation.lat;
        const lon = initialLocation?.lon || selectedLocation.lon;

        const newMap = new maplibregl.Map({
          container: mapRef.current,
          style: `https://api.maptiler.com/maps/streets/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`,
          center: [lon, lat],
          zoom: 13,
        });

        newMap.on('load', () => {
          const newMarker = new maplibregl.Marker()
            .setLngLat([lon, lat])
            .addTo(newMap);

          markerRef.current = newMarker;
          reverseGeocode(lat, lon);
          setIsLoading(false);
        });

        newMap.on('click', handleMapClick);
        mapInstanceRef.current = newMap;

      } catch (error) {
        console.error("Error initializing map:", error);
        setIsLoading(false);
      }
    };

    if (isOpen) {
      timeoutId = setTimeout(initializeMap, 100);
    }

    return () => {
      clearTimeout(timeoutId);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, initialLocation]);

  const updateMarker = (lat: number, lon: number) => {
    if (!mapInstanceRef.current) return;

    if (markerRef.current) {
      markerRef.current.setLngLat([lon, lat]);
    } else {
      const newMarker = new maplibregl.Marker()
        .setLngLat([lon, lat])
        .addTo(mapInstanceRef.current);
      markerRef.current = newMarker;
    }
    mapInstanceRef.current.setCenter([lon, lat]);
  };

  const handleSearch = async () => {
    try {
      const response = await fetch(
        `https://api.maptiler.com/geocoding/${encodeURIComponent(searchQuery)}.json?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`
      );
      const data = await response.json();
      setSearchResults(data.features || []);
    } catch (error) {
      console.error("Error searching for location:", error);
    }
  };

  const reverseGeocode = async (lat: number, lon: number) => {
    try {
      const response = await fetch(
        `https://api.maptiler.com/geocoding/${lon},${lat}.json?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`
      );
      const data = await response.json();
      if (data?.features?.[0]?.place_name) {
        setAddress(data.features[0].place_name);
      }
    } catch (error) {
      console.error("Error reverse geocoding:", error);
    }
  };

  const handleSelectSearchResult = (result: any) => {
    const [lon, lat] = result.center;
    setSelectedLocation({ lat, lon });
    setAddress(result.place_name);
    setSearchResults([]);
    updateMarker(lat, lon);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      console.error("Geolocation is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const { latitude, longitude } = coords;
        setSelectedLocation({ lat: latitude, lon: longitude });
        updateMarker(latitude, longitude);
        reverseGeocode(latitude, longitude);
      },
      (error) => {
        console.error("Error getting current location:", error);
      }
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast({
          title: "Copied to clipboard",
          description: "The address has been copied to your clipboard.",
        });
      },
      (error) => {
        console.error("Could not copy text to clipboard:", error);
      }
    );
  };

  const openInGoogleMaps = (lat: number, lon: number) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lon}`, "_blank");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-0">
        <div className="p-4 border-b">
          <DialogTitle>Select Location</DialogTitle>
        </div>
        <div className="flex flex-col space-y-4 p-4">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <Input
              placeholder="Search for a location"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-grow"
            />
            <Button onClick={handleSearch}>Search</Button>
            <Button variant="outline" onClick={handleUseCurrentLocation}>
              <Crosshair className="w-4 h-4 mr-2" />
              Current
            </Button>
          </div>
          {searchResults.length > 0 && (
            <ul className="max-h-40 overflow-y-auto bg-secondary border rounded-md shadow-sm">
              {searchResults.map((result) => (
                <li
                  key={result.id}
                  className="cursor-pointer p-2 flex items-center hover:bg-accent"
                  onClick={() => handleSelectSearchResult(result)}
                >
                  <MapPin className="w-4 h-4 mr-2 text-primary" />
                  <span className="text-sm">{result.place_name}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="relative">
            <div
              ref={mapRef}
              className="h-[400px] w-full rounded-md"
              style={{ width: '100%', height: '400px' }}
            />
            {isLoading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                <Loader className="w-8 h-8 animate-spin text-white" />
              </div>
            )}
          </div>
          <div className="flex justify-between border-t pt-4">
            <p className="text-sm font-medium">Selected Location: {address}</p>
            <div className="space-x-2">
              <Button size="sm" variant="outline" onClick={() => copyToClipboard(address)}>
                Copy
              </Button>
              <Button size="sm" variant="outline" onClick={() => openInGoogleMaps(selectedLocation.lat, selectedLocation.lon)}>
                Google Maps
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              onClick={() => {
                onSelectLocation({ ...selectedLocation, display_name: address });
                onClose();
              }}
            >
              Confirm
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MapDialog;
