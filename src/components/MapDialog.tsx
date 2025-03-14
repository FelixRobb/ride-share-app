"use client";

import { SearchIcon, MapPin, Crosshair, Loader, Copy, ExternalLink } from 'lucide-react';
import maplibregl from 'maplibre-gl';
import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import 'maplibre-gl/dist/maplibre-gl.css';

interface SearchResult {
  id: string;
  place_name: string;
  center: [number, number];
}

interface MapDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (location: { lat: number; lon: number; display_name: string }) => void;
  initialLocation?: { lat: number; lon: number };
}

const MapDialog: React.FC<MapDialogProps> = ({ isOpen, onClose, onSelectLocation, initialLocation }) => {
  const [searchQuery, setSearchQuery] = useState('');
const [searchResults, setSearchResults] = useState < SearchResult[] > ([]);
const [selectedLocation, setSelectedLocation] = useState({ lat: 38.707490, lon: -9.136398 });
const [address, setAddress] = useState('');
const mapRef = useRef < HTMLDivElement | null > (null);
const mapInstanceRef = useRef < maplibregl.Map | null > (null);
const markerRef = useRef < maplibregl.Marker | null > (null);
const [isLoading, setIsLoading] = useState(false);

// Side sheet for desktop, bottom sheet for mobile
const sheetSide = typeof window !== 'undefined' && window.innerWidth > 768 ? 'right' : 'bottom';

const initialCoordinatesRef = useRef({
    lat: initialLocation?.lat || 38.707490,
    lon: initialLocation?.lon || -9.136398
});

  const handleMapClick = useCallback((e: maplibregl.MapMouseEvent) => {
    const { lng, lat } = e.lngLat;
    setSelectedLocation({ lat, lon: lng });
    if (markerRef.current) {
      markerRef.current.setLngLat([lng, lat]);
    }
    reverseGeocode(lat, lng);
  }, []);

  // Update initial coordinates when initialLocation prop changes
  useEffect(() => {
    if (initialLocation) {
      initialCoordinatesRef.current = initialLocation;
      setSelectedLocation(initialLocation);
    }
  }, [initialLocation]);

  // Map initialization effect now uses initialCoordinatesRef
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

        const { lat, lon } = initialCoordinatesRef.current;

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

      } catch {
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
  }, [isOpen, handleMapClick]); // Removed selectedLocation from dependencies

  const updateMarker = (lat: number, lon: number, shouldCenter: boolean = false) => {
    if (!mapInstanceRef.current) return;

    if (markerRef.current) {
      markerRef.current.setLngLat([lon, lat]);
    } else {
      const newMarker = new maplibregl.Marker()
        .setLngLat([lon, lat])
        .addTo(mapInstanceRef.current);
      markerRef.current = newMarker;
    }

    if (shouldCenter && mapInstanceRef.current) {
      mapInstanceRef.current.setCenter([lon, lat]);
    }
  };

  const handleSearch = useCallback(async () => {
    setSearchResults([]);
    if (!searchQuery.trim()) return;
    try {
      const response = await fetch(
        `https://api.maptiler.com/geocoding/${encodeURIComponent(searchQuery)}.json?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`
      );
      const data = await response.json();
      setSearchResults(data.features || []);
    } catch {
      toast.error("Error searching for location:");
    }
  }, [searchQuery]);

  const reverseGeocode = async (lat: number, lon: number) => {
    try {
      const response = await fetch(
        `https://api.maptiler.com/geocoding/${lon},${lat}.json?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`
      );
      const data = await response.json();
      if (data?.features?.[0]?.place_name) {
        setAddress(data.features[0].place_name);
      }
    } catch {
      toast.error("An error ocurred, please try again.");
    }
  };

  const handleSelectSearchResult = (result: SearchResult) => {
    const [lon, lat] = result.center;
    setSelectedLocation({ lat, lon });
    setAddress(result.place_name);
    setSearchResults([]);
    updateMarker(lat, lon, true);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const { latitude, longitude } = coords;
        setSelectedLocation({ lat: latitude, lon: longitude });
        updateMarker(latitude, longitude, true);
        reverseGeocode(latitude, longitude);
      },
      () => {
        toast.error("Error getting current location:");
      }
    );
  };

  const copyToClipboard = async (text: string) => {
    if (typeof window !== "undefined" && window.navigator?.clipboard) {
      try {
        await window.navigator.clipboard.writeText(text)
        toast.success("The address has been copied to your clipboard.")
      } catch {
        toast.error("Failed to copy the address to your clipboard.")
      }
    }
  }

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
  }, [handleSearch, searchQuery]);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side={sheetSide} className="w-full sm:max-w-full md:max-w-xl lg:max-w-2xl p-0 overflow-y-auto">
        <div className="flex flex-col h-full">
          <SheetHeader className="px-6 py-4 border-b sticky top-0 z-10 bg-background">
            <SheetTitle className="text-xl font-semibold">Select Location</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col md:flex-row gap-4">
            {/* Search Panel */}
            <div className="md:w-1/3 flex flex-col gap-4">
              <div className="relative">
                <Input
                  placeholder="Search for a location"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10"
                />
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

                {searchResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-10 bg-background shadow-md rounded-md border max-h-60 overflow-y-auto">
                    <ul>
                      {searchResults.map((result) => (
                        <li key={result.id} className="p-2 hover:bg-accent cursor-pointer transition-colors">
                          <button
                            onClick={() => handleSelectSearchResult(result)}
                            className="flex items-start gap-2 w-full text-left"
                          >
                            <MapPin className="w-4 h-4 mt-1 flex-shrink-0 text-primary" />
                            <span className="text-sm">{result.place_name}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSearch} className="flex-1">
                  <SearchIcon className="w-4 h-4 mr-2" />
                  Search
                </Button>
                <Button variant="outline" onClick={handleUseCurrentLocation} className="flex-1">
                  <Crosshair className="w-4 h-4 mr-2" />
                  Current
                </Button>
              </div>

              <Card className="mt-2">
                <CardHeader className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">Selected Location</CardTitle>
                    {address && (
                      <Badge variant="outline" className="font-normal">
                        {selectedLocation.lat.toFixed(5)}, {selectedLocation.lon.toFixed(5)}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="py-3 px-4">
                  {address ? (
                    <>
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
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Click on the map to select a location</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Map Panel */}
            <div className="relative md:w-2/3 min-h-[400px] md:min-h-0 mt-4 md:mt-0">
              <div className="h-[400px] md:h-[500px] w-full relative border rounded-lg bg-background overflow-hidden" ref={mapRef} style={{ width: '100%', height: '100%' }} />
              {isLoading && (
                <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10">
                  <div className="bg-background p-4 rounded-lg shadow-lg flex items-center gap-2">
                    <Loader className="w-5 h-5 animate-spin text-primary" />
                    <span className="text-sm font-medium">Loading map...</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <SheetFooter className="p-4 border-t mt-auto">
            <div className="flex gap-2 w-full justify-end">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button
                onClick={() => {
                  onSelectLocation({ ...selectedLocation, display_name: address });
                  onClose();
                }}
                disabled={!address}
              >
                Confirm Location
              </Button>
            </div>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
);
};

export default MapDialog;

