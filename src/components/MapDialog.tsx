"use client"

import type React from "react"

import { SearchIcon, MapPin, Crosshair, Loader, Copy, ExternalLink, X, Check } from "lucide-react"
import maplibregl from "maplibre-gl"
import { useState, useEffect, useRef, useCallback } from "react"
import { toast } from "sonner"
import { useMediaQuery } from "@/hooks/use-media-query"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import "maplibre-gl/dist/maplibre-gl.css"

interface SearchResult {
  id: string
  place_name: string
  center: [number, number]
}

interface MapDialogProps {
  isOpen: boolean
  onClose: () => void
  onSelectLocation: (location: { lat: number; lon: number; display_name: string }) => void
  initialLocation?: { lat: number; lon: number }
}

const MapDialog: React.FC<MapDialogProps> = ({ isOpen, onClose, onSelectLocation, initialLocation }) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [selectedLocation, setSelectedLocation] = useState({ lat: 38.70749, lon: -9.136398 })
  const [address, setAddress] = useState("")
  const mapRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<maplibregl.Map | null>(null)
  const markerRef = useRef<maplibregl.Marker | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isMapInteracting, setIsMapInteracting] = useState(false)
  const isDesktop = useMediaQuery("(min-width: 768px)")

  const initialCoordinatesRef = useRef({
    lat: initialLocation?.lat || 38.70749,
    lon: initialLocation?.lon || -9.136398,
  })

  useEffect(() => {
    if (initialLocation) {
      initialCoordinatesRef.current = initialLocation
      setSelectedLocation(initialLocation)
    }
  }, [initialLocation])

  const handleMapClick = useCallback((e: maplibregl.MapMouseEvent) => {
    const { lng, lat } = e.lngLat
    setSelectedLocation({ lat, lon: lng })
    if (markerRef.current) {
      markerRef.current.setLngLat([lng, lat])
    }
    reverseGeocode(lat, lng)
  }, [])

  // Map initialization effect with touch event handling
  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const initializeMap = async () => {
      if (!isOpen || !mapRef.current) return
      setIsLoading(true)

      try {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove()
          mapInstanceRef.current = null
        }

        const { lat, lon } = initialCoordinatesRef.current

        const newMap = new maplibregl.Map({
          container: mapRef.current,
          style: `https://api.maptiler.com/maps/streets/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`,
          center: [lon, lat],
          zoom: 13,
        })

        newMap.on("load", () => {
          const newMarker = new maplibregl.Marker({
            color: "#0ea5e9", // Match primary color
          })
            .setLngLat([lon, lat])
            .addTo(newMap)

          markerRef.current = newMarker
          reverseGeocode(lat, lon)
          setIsLoading(false)
        })

        // Add map interaction handling to prevent drawer swipe interference
        newMap.on("mousedown", () => setIsMapInteracting(true))
        newMap.on("touchstart", () => setIsMapInteracting(true))

        newMap.on("mouseup", () => setIsMapInteracting(false))
        newMap.on("touchend", () => setIsMapInteracting(false))

        newMap.on("click", handleMapClick)
        mapInstanceRef.current = newMap
      } catch {
        setIsLoading(false)
      }
    }

    if (isOpen) {
      timeoutId = setTimeout(initializeMap, 100)
    }

    return () => {
      clearTimeout(timeoutId)
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [isOpen, handleMapClick])

  const updateMarker = (lat: number, lon: number, shouldCenter = false) => {
    if (!mapInstanceRef.current) return

    if (markerRef.current) {
      markerRef.current.setLngLat([lon, lat])
    } else {
      const newMarker = new maplibregl.Marker({
        color: "#0ea5e9", // Match primary color
      })
        .setLngLat([lon, lat])
        .addTo(mapInstanceRef.current)
      markerRef.current = newMarker
    }

    if (shouldCenter && mapInstanceRef.current) {
      mapInstanceRef.current.setCenter([lon, lat])
      mapInstanceRef.current.zoomTo(14)
    }
  }

  const handleSearch = useCallback(async () => {
    setSearchResults([])
    if (!searchQuery.trim()) return
    try {
      const response = await fetch(
        `https://api.maptiler.com/geocoding/${encodeURIComponent(searchQuery)}.json?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`,
      )
      const data = await response.json()
      setSearchResults(data.features || [])
    } catch {
      toast.error("Error searching for location")
    }
  }, [searchQuery])

  const reverseGeocode = async (lat: number, lon: number) => {
    try {
      const response = await fetch(
        `https://api.maptiler.com/geocoding/${lon},${lat}.json?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`,
      )
      const data = await response.json()
      if (data?.features?.[0]?.place_name) {
        setAddress(data.features[0].place_name)
      }
    } catch {
      toast.error("An error occurred, please try again")
    }
  }

  const handleSelectSearchResult = (result: SearchResult) => {
    const [lon, lat] = result.center
    setSelectedLocation({ lat, lon })
    setAddress(result.place_name)
    setSearchResults([])
    updateMarker(lat, lon, true)
  }

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by this browser")
      return
    }

    toast.loading("Getting your location...")

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        toast.dismiss()
        const { latitude, longitude } = coords
        setSelectedLocation({ lat: latitude, lon: longitude })
        updateMarker(latitude, longitude, true)
        reverseGeocode(latitude, longitude)
        toast.success("Location found")
      },
      () => {
        toast.dismiss()
        toast.error("Error getting current location")
      },
    )
  }

  const copyToClipboard = async (text: string) => {
    if (typeof window !== "undefined" && window.navigator?.clipboard) {
      try {
        await window.navigator.clipboard.writeText(text)
        toast.success("Address copied to clipboard")
      } catch {
        toast.error("Failed to copy address")
      }
    }
  }

  const openInGoogleMaps = (lat: number, lon: number) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lon}`, "_blank")
  }

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery) {
        handleSearch()
      }
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [handleSearch, searchQuery])

  // Shared content for both Dialog and Drawer
  const renderContent = () => (
    <div className="flex flex-col h-full">
      {/* Desktop layout */}
      {isDesktop ? (
        <div className="grid grid-cols-3 gap-6 p-6 flex-1 min-h-0">
          {/* Left sidebar */}
          <div className="flex flex-col space-y-5">
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">SEARCH</h3>
              <div className="relative">
                <Input
                  placeholder="Search for a location"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10"
                />
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground hover:text-foreground"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSearch} variant="secondary" className="flex-1">
                  <SearchIcon className="w-4 h-4 mr-2" />
                  Search
                </Button>
                <Button onClick={handleUseCurrentLocation} variant="outline" className="flex-1">
                  <Crosshair className="w-4 h-4 mr-2" />
                  Current
                </Button>
              </div>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-muted-foreground">RESULTS</h3>
                  <Badge variant="outline" className="text-xs font-normal">
                    {searchResults.length} found
                  </Badge>
                </div>
                <ScrollArea className="h-[180px] rounded-md border">
                  <div className="p-1">
                    {searchResults.map((result) => (
                      <button
                        key={result.id}
                        onClick={() => handleSelectSearchResult(result)}
                        className="flex items-start gap-2 w-full text-left p-2 hover:bg-accent rounded-sm transition-colors"
                      >
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
                        <span className="text-sm">{result.place_name}</span>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">SELECTED LOCATION</h3>
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  {address ? (
                    <div>
                      <div className="p-4 bg-muted/40">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 mt-1 text-primary flex-shrink-0" />
                          <p className="text-sm break-words">{address}</p>
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          {selectedLocation.lat.toFixed(6)}, {selectedLocation.lon.toFixed(6)}
                        </div>
                      </div>
                      <Separator />
                      <div className="grid grid-cols-2 p-3 gap-3">
                        <Button size="sm" variant="outline" onClick={() => copyToClipboard(address)} className="h-8">
                          <Copy className="w-3.5 h-3.5 mr-1.5" />
                          Copy
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openInGoogleMaps(selectedLocation.lat, selectedLocation.lon)}
                          className="h-8"
                        >
                          <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                          Maps
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 text-center">
                      <p className="text-sm text-muted-foreground">Select a location on the map</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Map (spans 2 columns) */}
          <div className="col-span-2 relative rounded-lg overflow-hidden border shadow-sm">
            <div
              ref={mapRef}
              className="h-full w-full"
              style={{
                touchAction: isMapInteracting ? "none" : "auto",
              }}
            />
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
      ) : (
        /* Mobile layout */
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {/* Map container */}
            <div className="relative h-[250px] rounded-lg overflow-hidden border shadow-sm">
              <div
                ref={mapRef}
                className="h-full w-full"
                style={{
                  touchAction: isMapInteracting ? "none" : "auto",
                }}
              />
              {isLoading && (
                <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10">
                  <div className="bg-background p-4 rounded-lg shadow-lg flex items-center gap-2">
                    <Loader className="w-5 h-5 animate-spin text-primary" />
                    <span className="text-sm font-medium">Loading map...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Search section */}
            <div className="space-y-3">
              <div className="relative">
                <Input
                  placeholder="Search for a location"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10"
                />
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground hover:text-foreground"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSearch} variant="secondary" className="flex-1">
                  <SearchIcon className="w-4 h-4 mr-2" />
                  Search
                </Button>
                <Button onClick={handleUseCurrentLocation} variant="outline" className="flex-1">
                  <Crosshair className="w-4 h-4 mr-2" />
                  Current
                </Button>
              </div>
            </div>

            {/* Search results */}
            {searchResults.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-muted-foreground">RESULTS</h3>
                  <Badge variant="outline" className="text-xs font-normal">
                    {searchResults.length} found
                  </Badge>
                </div>
                <Card>
                  <CardContent className="p-2">
                    {searchResults.map((result) => (
                      <button
                        key={result.id}
                        onClick={() => handleSelectSearchResult(result)}
                        className="flex items-start gap-2 w-full text-left p-2 hover:bg-accent rounded-sm transition-colors"
                      >
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
                        <span className="text-sm">{result.place_name}</span>
                      </button>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Selected location */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">SELECTED LOCATION</h3>
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  {address ? (
                    <div>
                      <div className="p-4 bg-muted/40">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 mt-1 text-primary flex-shrink-0" />
                          <p className="text-sm break-words">{address}</p>
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          {selectedLocation.lat.toFixed(6)}, {selectedLocation.lon.toFixed(6)}
                        </div>
                      </div>
                      <Separator />
                      <div className="grid grid-cols-2 p-3 gap-3">
                        <Button size="sm" variant="outline" onClick={() => copyToClipboard(address)} className="h-8">
                          <Copy className="w-3.5 h-3.5 mr-1.5" />
                          Copy
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openInGoogleMaps(selectedLocation.lat, selectedLocation.lon)}
                          className="h-8"
                        >
                          <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                          Maps
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 text-center">
                      <p className="text-sm text-muted-foreground">Select a location on the map</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </ScrollArea>
      )}

      {/* Footer with action buttons */}
      <div className="flex justify-end items-center gap-2 p-4 border-t bg-muted/30">
        <Button variant="outline" onClick={onClose} className="h-9">
          Cancel
        </Button>
        <Button
          onClick={() => {
            onSelectLocation({ ...selectedLocation, display_name: address })
            onClose()
          }}
          disabled={!address}
          className="h-9"
        >
          <Check className="w-4 h-4 mr-2" />
          Confirm Location
        </Button>
      </div>
    </div>
  )

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[90vw] md:max-w-[800px] lg:max-w-[1000px] xl:max-w-[1200px] h-[90vh] max-h-[80vh] p-0 overflow-hidden">
          <DialogHeader className="px-6 py-3 border-b bg-muted/30">
            <DialogTitle className="flex items-center text-lg">
              <MapPin className="w-5 h-5 mr-2 text-primary" />
              Select Location
            </DialogTitle>
          </DialogHeader>
          {renderContent()}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer
      open={isOpen}
      onOpenChange={(open) => {
        if (!isMapInteracting || !open) {
          onClose()
        }
      }}
      shouldScaleBackground={true}
      handleOnly={true} // Use the handleOnly prop to prevent drawer from closing when interacting with map
    >
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="border-b bg-muted/30 px-4 py-3">
          <DrawerTitle className="flex items-center justify-center text-base">
            <MapPin className="w-4 h-4 mr-2 text-primary" />
            Select Location
          </DrawerTitle>
        </DrawerHeader>
        <div className="h-[calc(85vh-56px)] overflow-hidden">{renderContent()}</div>
      </DrawerContent>
    </Drawer>
  )
}

export default MapDialog

