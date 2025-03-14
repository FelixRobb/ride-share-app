"use client"

import { SearchIcon, MapPin, Crosshair, Loader, Copy, ExternalLink } from "lucide-react"
import maplibregl from "maplibre-gl"
import { useState, useEffect, useRef, useCallback } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent } from "@/components/ui/card"
import "maplibre-gl/dist/maplibre-gl.css"

interface SearchResult {
  id: string
  place_name: string
  center: [number, number]
}

interface MapLocationPickerProps {
  isOpen: boolean
  onClose: () => void
  onSelectLocation: (location: { lat: number; lon: number; display_name: string }) => void
  initialLocation?: { lat: number; lon: number }
}

export default function MapDialog({
  isOpen,
  onClose,
  onSelectLocation,
  initialLocation,
}: MapLocationPickerProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [selectedLocation, setSelectedLocation] = useState({ lat: 38.70749, lon: -9.136398 })
  const [address, setAddress] = useState("")
  const mapRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<maplibregl.Map | null>(null)
  const markerRef = useRef<maplibregl.Marker | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const mapContainerRef = useRef<HTMLDivElement | null>(null)

  const initialCoordinatesRef = useRef({
    lat: initialLocation?.lat || 38.70749,
    lon: initialLocation?.lon || -9.136398,
  })

  // Check if we're on mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkIsMobile()
    window.addEventListener("resize", checkIsMobile)

    return () => {
      window.removeEventListener("resize", checkIsMobile)
    }
  }, [])

  const handleMapClick = useCallback((e: maplibregl.MapMouseEvent) => {
    const { lng, lat } = e.lngLat
    setSelectedLocation({ lat, lon: lng })
    if (markerRef.current) {
      markerRef.current.setLngLat([lng, lat])
    }
    reverseGeocode(lat, lng)
  }, [])

  // Update initial coordinates when initialLocation prop changes
  useEffect(() => {
    if (initialLocation) {
      initialCoordinatesRef.current = initialLocation
      setSelectedLocation(initialLocation)
    }
  }, [initialLocation])

  // Map initialization effect
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

        // Fix for map dragging in drawer
        if (isMobile && mapContainerRef.current) {
          newMap.on("dragstart", () => {
            if (mapContainerRef.current) {
              mapContainerRef.current.style.touchAction = "none"
            }
          })

          newMap.on("dragend", () => {
            if (mapContainerRef.current) {
              mapContainerRef.current.style.touchAction = "auto"
            }
          })
        }

        newMap.on("load", () => {
          const newMarker = new maplibregl.Marker().setLngLat([lon, lat]).addTo(newMap)

          markerRef.current = newMarker
          reverseGeocode(lat, lon)
          setIsLoading(false)
        })

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
  }, [isOpen, handleMapClick, isMobile])

  const updateMarker = (lat: number, lon: number, shouldCenter = false) => {
    if (!mapInstanceRef.current) return

    if (markerRef.current) {
      markerRef.current.setLngLat([lon, lat])
    } else {
      const newMarker = new maplibregl.Marker().setLngLat([lon, lat]).addTo(mapInstanceRef.current)
      markerRef.current = newMarker
    }

    if (shouldCenter && mapInstanceRef.current) {
      mapInstanceRef.current.setCenter([lon, lat])
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
      toast.error("An error occurred, please try again.")
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
      toast.error("Geolocation is not supported by this browser.")
      return
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const { latitude, longitude } = coords
        setSelectedLocation({ lat: latitude, lon: longitude })
        updateMarker(latitude, longitude, true)
        reverseGeocode(latitude, longitude)
      },
      () => {
        toast.error("Error getting current location")
      },
    )
  }

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

  // Content to be shared between Dialog and Drawer
  const MapContent = (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 flex-1 min-h-0">
        {/* Search Panel - Takes 1/4 of space on desktop */}
        <div className="flex flex-col space-y-3 md:pr-2">
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
                <ul className="py-1">
                  {searchResults.map((result) => (
                    <li key={result.id} className="hover:bg-accent cursor-pointer transition-colors">
                      <button
                        onClick={() => handleSelectSearchResult(result)}
                        className="flex items-start gap-2 w-full text-left px-3 py-2"
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

          <div className="grid grid-cols-2 gap-2">
            <Button onClick={handleSearch} size="sm" className="flex items-center justify-center">
              <SearchIcon className="w-4 h-4 mr-2" />
              Search
            </Button>
            <Button variant="outline" onClick={handleUseCurrentLocation} size="sm" className="flex items-center justify-center">
              <Crosshair className="w-4 h-4 mr-2" />
              Current
            </Button>
          </div>

          <Card className="shadow-sm">
            <CardContent className="p-4">
              <h3 className="text-sm font-medium mb-2 flex items-center">
                <MapPin className="w-4 h-4 mr-1 text-primary" />
                Selected Location
              </h3>
              {address ? (
                <>
                  <p className="text-sm mb-3 break-words">{address}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button size="sm" variant="outline" className="w-full" onClick={() => copyToClipboard(address)}>
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => openInGoogleMaps(selectedLocation.lat, selectedLocation.lon)}
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Google Maps
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Select a location on the map.</p>
              )}
            </CardContent>
          </Card>

          <div className="hidden md:block text-xs text-muted-foreground mt-2">
            <p>Coordinates: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lon.toFixed(6)}</p>
          </div>
        </div>

        {/* Map Panel - Takes 3/4 of space on desktop */}
        <div
          ref={mapContainerRef}
          className="relative md:col-span-3 h-[300px] md:h-full min-h-[300px] rounded-lg overflow-hidden border shadow-sm"
        >
          <div ref={mapRef} className="h-full w-full" />
          {isLoading && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10">
              <div className="bg-background p-3 rounded-lg shadow-lg flex items-center gap-2">
                <Loader className="w-5 h-5 animate-spin text-primary" />
                <span className="text-sm font-medium">Loading map...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 p-4 border-t mt-auto">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={() => {
            onSelectLocation({ ...selectedLocation, display_name: address })
            onClose()
          }}
        >
          Confirm Location
        </Button>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className="h-[85vh]">
          <DrawerHeader className="border-b">
            <DrawerTitle>Select Location</DrawerTitle>
          </DrawerHeader>
          <ScrollArea className="flex-1 overflow-auto">{MapContent}</ScrollArea>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[90vw] md:max-w-[800px] lg:max-w-[1000px] h-[90vh] max-h-[80vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Select Location</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 overflow-auto">{MapContent}</ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

