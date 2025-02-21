"use client"

import type React from "react"

import { SearchIcon, MapPin, Crosshair, Loader, Copy, ExternalLink } from "lucide-react"
import maplibregl from "maplibre-gl"
import { useState, useEffect, useRef, useCallback } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Drawer, DrawerContent } from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useMediaQuery } from "@/hooks/use-media-query"
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

const MapDialogContent: React.FC<{
  onClose: () => void
  onSelectLocation: (location: { lat: number; lon: number; display_name: string }) => void
  initialLocation?: { lat: number; lon: number }
}> = ({ onClose, onSelectLocation, initialLocation }) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [selectedLocation, setSelectedLocation] = useState({ lat: 38.70749, lon: -9.136398 })
  const [address, setAddress] = useState("")
  const mapRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<maplibregl.Map | null>(null)
  const markerRef = useRef<maplibregl.Marker | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const initialCoordinatesRef = useRef({
    lat: initialLocation?.lat || 38.70749,
    lon: initialLocation?.lon || -9.136398,
  })

  const handleMapClick = useCallback((e: maplibregl.MapMouseEvent) => {
    const { lng, lat } = e.lngLat
    setSelectedLocation({ lat, lon: lng })
    if (markerRef.current) {
      markerRef.current.setLngLat([lng, lat])
    }
    reverseGeocode(lat, lng)
  }, [])

  useEffect(() => {
    if (initialLocation) {
      initialCoordinatesRef.current = initialLocation
      setSelectedLocation(initialLocation)
    }
  }, [initialLocation])

  useEffect(() => {
    const initializeMap = async () => {
      if (!mapRef.current) return
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

    const timeoutId = setTimeout(initializeMap, 100)

    return () => {
      clearTimeout(timeoutId)
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [handleMapClick])

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
      toast.error("Error searching for location:")
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
        toast.error("Error getting current location:")
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

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-2">Select Location</h2>
        <div className="space-y-4">
          <div className="relative">
            <Input
              placeholder="Search for a location"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-10 w-full"
            />
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        {searchResults.length > 0 && (
          <div className="mb-4 border rounded-md">
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

        <div className="space-y-4">
          <div className="relative aspect-video w-full border rounded-lg overflow-hidden">
            <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
            {isLoading && (
              <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center">
                <div className="bg-background p-4 rounded-lg shadow-lg flex items-center gap-2">
                  <Loader className="w-5 h-5 animate-spin text-primary" />
                  <span className="text-sm font-medium">Loading map...</span>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 rounded-lg border bg-card">
            <h3 className="text-sm font-medium mb-2">Selected Location</h3>
            {address ? (
              <>
                <p className="text-sm mb-3 break-words">{address}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => copyToClipboard(address)}>
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
              <p className="text-sm mb-3">Please choose an address.</p>
            )}
          </div>
        </div>
      </ScrollArea>

      <div className="border-t p-4 mt-auto">
        <div className="flex gap-2 justify-end">
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
    </div>
  )
}

const MapDialog: React.FC<MapDialogProps> = ({ isOpen, onClose, onSelectLocation, initialLocation }) => {
  const isMobile = useMediaQuery("(max-width: 640px)")

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className="h-[90svh]">
          <MapDialogContent onClose={onClose} onSelectLocation={onSelectLocation} initialLocation={initialLocation} />
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[90vw] md:max-w-[800px] lg:max-w-[1000px] h-[90vh] p-0">
        <MapDialogContent onClose={onClose} onSelectLocation={onSelectLocation} initialLocation={initialLocation} />
      </DialogContent>
    </Dialog>
  )
}

export default MapDialog

