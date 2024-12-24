"use client";

import { useState, useEffect, useRef, MutableRefObject } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Crosshair } from 'lucide-react';
import { toast } from "@/hooks/use-toast";
import '@tomtom-international/web-sdk-maps/dist/maps.css';

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
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const handleMapClick = (e: { lngLat: { lng: number; lat: number } }) => {
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

      try {
        // Clean up existing map instance
        if (mapInstanceRef.current) {
          try {
            if (markerRef.current) {
              markerRef.current.remove();
              markerRef.current = null;
            }
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
          } catch (e) {
            console.error('Error cleaning up map:', e);
          }
        }

        const tt = await import('@tomtom-international/web-sdk-maps');
        
        const lat = initialLocation?.lat || selectedLocation.lat;
        const lon = initialLocation?.lon || selectedLocation.lon;

        const newMap = tt.map({
          key: process.env.NEXT_PUBLIC_TOMTOM_API_KEY || '',
          container: mapRef.current,
          center: [lon, lat],
          zoom: 13,
        });

        newMap.on('load', () => {
          const newMarker = new tt.Marker()
            .setLngLat([lon, lat])
            .addTo(newMap);
          
          markerRef.current = newMarker;
          reverseGeocode(lat, lon);
        });

        newMap.on('click', handleMapClick);
        mapInstanceRef.current = newMap;

      } catch (error) {
        console.error("Error initializing map:", error);
      }
    };

    if (isOpen) {
      timeoutId = setTimeout(initializeMap, 100);
    }

    return () => {
      clearTimeout(timeoutId);
      if (mapInstanceRef.current) {
        try {
          if (markerRef.current) {
            markerRef.current.remove();
            markerRef.current = null;
          }
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        } catch (e) {
          console.error('Error cleaning up map:', e);
        }
      }
    };
  }, [isOpen, initialLocation]);

  const updateMarker = (lat: number, lon: number) => {
    if (!mapInstanceRef.current) return;
    
    if (markerRef.current) {
      markerRef.current.setLngLat([lon, lat]);
    } else {
      const tt = require('@tomtom-international/web-sdk-maps');
      const newMarker = new tt.Marker()
        .setLngLat([lon, lat])
        .addTo(mapInstanceRef.current);
      markerRef.current = newMarker;
    }
    mapInstanceRef.current.setCenter([lon, lat]);
  };

  const handleSearch = async () => {
    try {
      const response = await fetch(
        `https://api.tomtom.com/search/2/search/${encodeURIComponent(searchQuery)}.json?key=${process.env.NEXT_PUBLIC_TOMTOM_API_KEY}&limit=5`
      );
      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (error) {
      console.error("Error searching for location:", error);
    }
  };

  const reverseGeocode = async (lat: number, lon: number) => {
    try {
      const response = await fetch(
        `https://api.tomtom.com/search/2/reverseGeocode/${lat},${lon}.json?key=${process.env.NEXT_PUBLIC_TOMTOM_API_KEY}`
      );
      const data = await response.json();
      if (data?.addresses?.[0]?.address?.freeformAddress) {
        setAddress(data.addresses[0].address.freeformAddress);
      }
    } catch (error) {
      console.error("Error reverse geocoding:", error);
    }
  };

  const handleSelectSearchResult = (result: any) => {
    const { lat, lon } = result.position;
    setSelectedLocation({ lat, lon });
    setAddress(result.address.freeformAddress);
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Location</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col space-y-4">
          <div className="flex space-x-2">
            <Input
              placeholder="Search for a location"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
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
                  <span className="text-sm">{result.address.freeformAddress}</span>
                </li>
              ))}
            </ul>
          )}
          <div
            ref={mapRef}
            className="h-[400px] w-full rounded-md"
          />
          <div className="flex justify-between">
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
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              onClick={() => {
                onSelectLocation({ ...selectedLocation, display_name: address });
                onClose();
              }}
            >
              Confirm
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MapDialog;