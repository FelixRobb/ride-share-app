"use client"

import type React from "react"

import { SearchIcon, MapPin, Crosshair, Loader, Copy, ExternalLink, X } from "lucide-react"
import maplibregl from "maplibre-gl"
import { useState, useEffect, useRef, useCallback } from "react"
import { toast } from "sonner"
import { useMediaQuery } from "@/hooks/use-media-query"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetClose } from "@/components/ui/sheet"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  const isDesktop = useMediaQuery("(min-width: 768px)")

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

  // Update initial coordinates when initialLocation prop changes
  useEffect(() => {
    if (initialLocation) {
      initialCoordinatesRef.current = initialLocation
      setSelectedLocation(initialLocation)
    }
  }, [initialLocation])

  // Map initialization effect now uses initialCoordinatesRef
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
  }, [isOpen, handleMapClick])

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

  const handleConfirmLocation = () => {
    onSelectLocation({ ...selectedLocation, display_name: address })
    onClose()
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side={isDesktop ? "right" : "bottom"}
        className={`rounded-md p-0 ${isDesktop ? " w-11/12 max-w-xl" : "w-full h-[85vh]"}`}
      >
        <div className="flex flex-col h-full">
          <SheetHeader className="px-6 py-4 border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-xl font-semibold">Select Location</SheetTitle>
              <SheetClose asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <X className="h-4 w-4" />
                </Button>
              </SheetClose>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-auto">
            <div className={`flex flex-col ${isDesktop ? "h-full" : ""}`}>
              {/* Search Section */}
              <div className="p-4 border-b">
                <div className="relative mb-4">
                  <Input
                    placeholder="Search for a location"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-10 bg-background text-foreground border-input"
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
                    Current Location
                  </Button>
                </div>

                {searchResults.length > 0 && (
                  <Card className="mt-4 max-h-48 overflow-y-auto">
                    <CardHeader className="py-2 px-3">
                      <CardTitle className="text-sm">Search Results</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <ul className="divide-y">
                        {searchResults.map((result) => (
                          <li key={result.id} className="hover:bg-accent transition-colors">
                            <button
                              onClick={() => handleSelectSearchResult(result)}
                              className="flex items-start gap-2 w-full text-left p-3"
                            >
                              <MapPin className="w-4 h-4 mt-1 flex-shrink-0 text-primary" />
                              <span className="text-sm">{result.place_name}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Map Section */}
              <div className="relative flex-1 min-h-[300px]">
                <div ref={mapRef} className="h-full w-full border-b" />
                {isLoading && (
                  <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10">
                    <div className="bg-background p-4 rounded-lg shadow-lg flex items-center gap-2">
                      <Loader className="w-5 h-5 animate-spin text-primary" />
                      <span className="text-sm font-medium text-foreground">Loading map...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Selected Location Section */}
              {address && (
                <div className="p-4">
                  <Card className="bg-card text-card-foreground">
                    <CardHeader className="py-3 px-4">
                      <CardTitle className="text-sm font-medium">Selected Location</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 pt-0">
                      <p className="text-sm mb-3 break-words">{address}</p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => copyToClipboard(address)}>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Address
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
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>

          <SheetFooter className="p-4 border-t mt-auto">
            <div className="flex w-full gap-2 justify-end">
              <SheetClose asChild>
                <Button variant="outline">Cancel</Button>
              </SheetClose>
              <Button onClick={handleConfirmLocation}>Confirm Location</Button>
            </div>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default MapDialog

