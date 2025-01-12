"use client";

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchIcon, MapPin, Crosshair, Loader, Copy, ExternalLink } from 'lucide-react';
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
  const [selectedLocation, setSelectedLocation] = useState({ lat: 38.707490, lon: -9.136398 });
  const [address, setAddress] = useState('');
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const searchResultsRef = useRef<HTMLDivElement | null>(null); // Added ref for search results
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
    setSearchResults([]); // Clear previous results
    if (!searchQuery.trim()) return; // Don't search if query is empty
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

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery) {
        handleSearch();
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[90vw] md:max-w-[800px] lg:max-w-[1000px] rounded-lg h-[90vh] max-h-[80vh] p-0 overflow-scroll bg-background text-foreground">
        <div className="flex flex-col h-full">
          <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
            <DialogTitle className="text-xl font-semibold">Select Location</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-3 flex-1 min-h-0">
            {/* Search Panel */}
            <div className="p-4 lg:border-r flex flex-col">
              <div className="relative flex-shrink-0 mb-4">
                <Input
                  placeholder="Search for a location"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10 bg-background text-foreground border-input"
                />
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

                {searchResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-10 bg-background shadow-md rounded-md border border-input max-h-60 overflow-y-auto">
                    <ul>
                      {searchResults.map((result) => (
                        <li
                          key={result.id}
                          onClick={() => handleSelectSearchResult(result)}
                          className="p-2 hover:bg-accent cursor-pointer transition-colors"
                        >
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 mt-1 flex-shrink-0 text-primary" />
                            <span className="text-sm">{result.place_name}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-4 flex-shrink-0">
                <Button onClick={handleSearch} className="flex-1">
                  <SearchIcon className="w-4 h-4 mr-2" />
                  Search
                </Button>
                <Button variant="outline" onClick={handleUseCurrentLocation} className="flex-1">
                  <Crosshair className="w-4 h-4 mr-2" />
                  Current
                </Button>
              </div>

              {address && (
                <div className="mt-4 p-4 rounded-lg border bg-card text-card-foreground"> {/* Updated selected location card */}
                  <h3 className="text-sm font-medium mb-2">Selected Location</h3>
                  <p className="text-sm mb-3 break-words">{address}</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => copyToClipboard(address)}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => openInGoogleMaps(selectedLocation.lat, selectedLocation.lon)}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Maps
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Map Panel */}
            <div className="relative p-4 lg:col-span-2 min-h-[400px] lg:min-h-0">
              <div className="h-[300px] w-full relative border rounded-lg bg-background" ref={mapRef} style={{ width: '100%', height: '300px' }} /> {/* Updated map container */}
              {isLoading && (
                <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10">
                  <div className="bg-background p-4 rounded-lg shadow-lg flex items-center gap-2">
                    <Loader className="w-5 h-5 animate-spin text-primary" />
                    <span className="text-sm font-medium text-foreground">Loading map...</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex gap-2 p-4 border-t mt-auto flex-shrink-0">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              onClick={() => {
                onSelectLocation({ ...selectedLocation, display_name: address });
                onClose();
              }}
            >
              Confirm Location
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MapDialog;

