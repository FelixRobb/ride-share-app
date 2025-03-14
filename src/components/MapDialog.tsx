"use client";

import { SearchIcon, MapPin, Crosshair, Loader, Copy, ExternalLink, ChevronRight, X } from 'lucide-react';
import maplibregl from 'maplibre-gl';
import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedLocation, setSelectedLocation] = useState({ lat: 38.707490, lon: -9.136398 });
  const [address, setAddress] = useState('');
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

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
          const newMarker = new maplibregl.Marker({
            color: '#4f46e5',
            draggable: true
          })
            .setLngLat([lon, lat])
            .addTo(newMap);
            
          newMarker.on('dragend', () => {
            const lngLat = newMarker.getLngLat();
            setSelectedLocation({ lat: lngLat.lat, lon: lngLat.lng });
            reverseGeocode(lngLat.lat, lngLat.lng);
          });

          markerRef.current = newMarker;
          reverseGeocode(lat, lon);
          setIsLoading(false);
        });

        // Add zoom controls
        newMap.addControl(new maplibregl.NavigationControl(), 'bottom-right');

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
  }, [isOpen, handleMapClick]);

  const updateMarker = (lat: number, lon: number, shouldCenter: boolean = false) => {
    if (!mapInstanceRef.current) return;

    if (markerRef.current) {
      markerRef.current.setLngLat([lon, lat]);
    } else {
      const newMarker = new maplibregl.Marker({
        color: '#4f46e5',
        draggable: true
      })
        .setLngLat([lon, lat])
        .addTo(mapInstanceRef.current);
        
      newMarker.on('dragend', () => {
        const lngLat = newMarker.getLngLat();
        setSelectedLocation({ lat: lngLat.lat, lon: lngLat.lng });
        reverseGeocode(lngLat.lat, lngLat.lng);
      });
      
      markerRef.current = newMarker;
    }

    if (shouldCenter && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo({
        center: [lon, lat],
        zoom: 14,
        duration: 800
      });
    }
  };

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchResults([]);
    
    try {
      const response = await fetch(
        `https://api.maptiler.com/geocoding/${encodeURIComponent(searchQuery)}.json?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`
      );
      const data = await response.json();
      setSearchResults(data.features || []);
    } catch {
      toast.error("Error searching for location");
    } finally {
      setIsSearching(false);
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
      toast.error("An error occurred while fetching the address");
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
      toast.error("Geolocation is not supported by this browser");
      return;
    }

    toast.loading("Getting your location...");
    
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const { latitude, longitude } = coords;
        setSelectedLocation({ lat: latitude, lon: longitude });
        updateMarker(latitude, longitude, true);
        reverseGeocode(latitude, longitude);
        toast.dismiss();
        toast.success("Location found");
      },
      () => {
        toast.dismiss();
        toast.error("Unable to access your location");
      }
    );
  };

  const copyToClipboard = async (text: string) => {
    if (typeof window !== "undefined" && window.navigator?.clipboard) {
      try {
        await window.navigator.clipboard.writeText(text);
        toast.success("Address copied to clipboard");
      } catch {
        toast.error("Failed to copy the address");
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
      <SheetContent side={sheetSide} className="w-full sm:max-w-full md:max-w-xl lg:max-w-2xl p-0 overflow-hidden">
        <div className="flex flex-col h-full">
          <SheetHeader className="px-6 py-4 border-b sticky top-0 z-10 bg-background/95 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-xl font-semibold flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Select Location
              </SheetTitle>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </SheetHeader>

          <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
            {/* Search Panel */}
            <div className={`md:border-r flex flex-col transition-all duration-300 ${isCollapsed ? 'md:w-0 md:opacity-0 md:invisible' : 'md:w-1/3 md:opacity-100 md:visible'}`}>
              <div className="p-4 flex-1 overflow-y-auto">
                <div className="sticky top-0 z-10 pb-3">
                  <div className="relative">
                    <Input
                      placeholder="Search for a location"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      className="pl-10 pr-10 py-6 text-base"
                    />
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    {searchQuery && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full"
                        onClick={() => setSearchQuery('')}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                    {isSearching && (
                      <Loader className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />
                    )}
                  </div>

                  <div className="flex gap-2 mt-3">
                    <Button onClick={handleSearch} className="flex-1 py-5" disabled={isSearching || !searchQuery.trim()}>
                      <SearchIcon className="w-4 h-4 mr-2" />
                      Search
                    </Button>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" onClick={handleUseCurrentLocation} className="flex-1 py-5">
                            <Crosshair className="w-4 h-4 mr-2" />
                            Current Location
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Use your current location</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>

                {searchResults.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Search Results</h3>
                    <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
                      {searchResults.map((result) => (
                        <div 
                          key={result.id} 
                          className="p-3 hover:bg-accent rounded-lg cursor-pointer transition-colors group"
                          onClick={() => handleSelectSearchResult(result)}
                        >
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 mt-1 flex-shrink-0 text-primary" />
                            <div className="flex-1">
                              <span className="text-sm font-medium group-hover:text-primary transition-colors">{result.place_name}</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Card className="mt-4 shadow-sm border-muted">
                  <CardHeader className="py-3 px-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">Selected Location</CardTitle>
                      {address && (
                        <Badge variant="secondary" className="font-normal">
                          {selectedLocation.lat.toFixed(5)}, {selectedLocation.lon.toFixed(5)}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="py-3 px-4">
                    {address ? (
                      <>
                        <p className="text-sm mb-4 break-words">{address}</p>
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
                            Open in Maps
                          </Button>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">Click on the map to select a location</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Map Panel */}
            <div className={`relative flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'md:w-full' : 'md:w-2/3'}`}>
              <div className="absolute top-4 left-4 z-10 md:hidden">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 px-2 bg-background/90 backdrop-blur-sm shadow-md"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                >
                  <SearchIcon className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </div>
              
              <div className="absolute top-4 left-4 z-10 hidden md:block">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8 rounded-full bg-background/90 backdrop-blur-sm shadow-md"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4 rotate-180" />
                  )}
                </Button>
              </div>

              <div className="flex-1 relative">
                <div className="absolute inset-0" ref={mapRef} />
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
                className="bg-primary hover:bg-primary/90"
              >
                <MapPin className="w-4 h-4 mr-2" />
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