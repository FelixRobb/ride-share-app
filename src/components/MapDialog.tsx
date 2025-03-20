"use client"

import type React from "react"

import { SearchIcon, MapPin, Crosshair, Loader, Copy, ExternalLink, X } from "lucide-react"
import maplibregl from "maplibre-gl"
import { useState, useEffect, useRef, useCallback } from "react"
import { toast } from "sonner"
import { Drawer } from "vaul"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import "maplibre-gl/dist/maplibre-gl.css"
import { useMediaQuery } from "@/hooks/use-media-query"

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
  const isMobile = useMediaQuery("(max-width: 768px)")
  const prevIsMobileRef = useRef(isMobile)

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

      // If map is already initialized, update its center and marker
      if (mapInstanceRef.current && markerRef.current) {
        mapInstanceRef.current.setCenter([initialLocation.lon, initialLocation.lat])
        markerRef.current.setLngLat([initialLocation.lon, initialLocation.lat])
        reverseGeocode(initialLocation.lat, initialLocation.lon)
      }
    }
  }, [initialLocation])

  useEffect(() => {
    if (!mapInstanceRef.current || !isOpen) return

    const handleResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.resize()

        // For mobile, do an additional delayed resize to ensure proper rendering
        if (isMobile) {
          setTimeout(() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.resize()
            }
          }, 200)
        }
      }
    }

    // Use ResizeObserver if available for better performance
    if (typeof ResizeObserver !== "undefined" && mapRef.current) {
      const resizeObserver = new ResizeObserver(() => {
        handleResize()
      })

      const currentMapRef = mapRef.current
      resizeObserver.observe(currentMapRef)

      return () => {
        resizeObserver.unobserve(currentMapRef)
        resizeObserver.disconnect()
      }
    } else {
      window.addEventListener("resize", handleResize)
      return () => {
        window.removeEventListener("resize", handleResize)
      }
    }
  }, [isOpen, isMobile])

  useEffect(() => {
    // Only run if the component is open and the mobile state has changed
    if (isOpen && prevIsMobileRef.current !== isMobile) {
      // Force map reinitialization with a slight delay to allow DOM updates
      setTimeout(() => {
        if (mapInstanceRef.current) {
          const currentCenter = mapInstanceRef.current.getCenter()
          const currentZoom = mapInstanceRef.current.getZoom()

          // Save current state
          const tempLat = currentCenter.lat
          const tempLon = currentCenter.lng

          // Clean up existing map
          mapInstanceRef.current.remove()
          mapInstanceRef.current = null

          // Skip a frame to ensure DOM is updated
          requestAnimationFrame(() => {
            if (!mapRef.current) return

            // Reinitialize map with previous position
            const newMap = new maplibregl.Map({
              container: mapRef.current,
              style: `https://api.maptiler.com/maps/streets/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`,
              center: [tempLon, tempLat],
              zoom: currentZoom,
            })

            newMap.once("load", () => {
              newMap.resize()
              const newMarker = new maplibregl.Marker({ color: "#0ea5e9" }).setLngLat([tempLon, tempLat]).addTo(newMap)
              markerRef.current = newMarker
            })

            newMap.on("click", handleMapClick)
            mapInstanceRef.current = newMap
          })
        }
      }, 300)
    }

    // Update reference for next comparison
    prevIsMobileRef.current = isMobile
  }, [isMobile, isOpen, handleMapClick])

  // Map initialization effect
  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const initializeMap = async () => {
      if (!isOpen || !mapRef.current) return
      setIsLoading(true)

      // Get current location if available
      if (navigator.geolocation && !initialLocation) {
        navigator.geolocation.getCurrentPosition(
          ({ coords }) => {
            const { latitude, longitude } = coords
            initialCoordinatesRef.current = { lat: latitude, lon: longitude }
            setSelectedLocation({ lat: latitude, lon: longitude })

            // Initialize map with current location
            createMap(latitude, longitude)
            reverseGeocode(latitude, longitude)
          },
          () => {
            // Fallback to initial coordinates if geolocation fails
            const { lat, lon } = initialCoordinatesRef.current
            createMap(lat, lon)
            reverseGeocode(lat, lon)
          }
        )
      } else {
        // Use initial location from props or default
        const { lat, lon } = initialCoordinatesRef.current
        createMap(lat, lon)
        reverseGeocode(lat, lon)
      }
    }

    // Helper function to create the map with given coordinates
    const createMap = (lat: number, lon: number) => {
      try {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove()
          mapInstanceRef.current = null
        }

        // Allow DOM to fully render before initializing map
        setTimeout(() => {
          if (!mapRef.current) return

          const newMap = new maplibregl.Map({
            container: mapRef.current,
            style: `https://api.maptiler.com/maps/streets/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`,
            center: [lon, lat],
            zoom: 13,
          })

          // Important: Resize the map after initialization to fix rendering issues
          newMap.once("load", () => {
            // More aggressive resize handling for mobile
            if (isMobile) {
              setTimeout(() => {
                newMap.resize()
              }, 300)
            }
            newMap.resize()
            const newMarker = new maplibregl.Marker({ color: "#0ea5e9" }).setLngLat([lon, lat]).addTo(newMap)
            markerRef.current = newMarker
            setIsLoading(false)
          })

          newMap.on("click", handleMapClick)
          mapInstanceRef.current = newMap
        }, 100)
      } catch {
        setIsLoading(false)
      }
    }

    if (isOpen) {
      timeoutId = setTimeout(initializeMap, 300) // Longer timeout for better mobile loading
    }

    return () => {
      clearTimeout(timeoutId)
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [isOpen, handleMapClick, isMobile, initialLocation])

  const updateMarker = (lat: number, lon: number, shouldCenter = false) => {
    if (!mapInstanceRef.current) return

    if (markerRef.current) {
      markerRef.current.setLngLat([lon, lat])
    } else {
      const newMarker = new maplibregl.Marker({ color: "#0ea5e9" }).setLngLat([lon, lat]).addTo(mapInstanceRef.current)
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

  const renderContent = () => (
    <div className="flex flex-col h-full">
      {isMobile ? (
        <>
          <Drawer.Handle className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" />
          <div className="grid gap-1.5 p-4 text-center sm:text-left">
            <Drawer.Title className="text-lg font-semibold leading-none tracking-tight">Select Location</Drawer.Title>
          </div>
        </>
      ) : (
        <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
          <DialogTitle className="text-xl font-semibold flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-primary" />
            Select Location
          </DialogTitle>
        </DialogHeader>
      )}
      {isMobile ? (
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col h-full p-4">

            {/* Search with properly positioned results */}
            <div className="relative mb-3">
              <Input
                placeholder="Search for a location"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10 pr-10 bg-background border-input rounded-full"
              />
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("")
                    setSearchResults([])
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground hover:text-foreground rounded-full flex items-center justify-center"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Popup results list positioned directly under input */}
              {searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-background shadow-lg rounded-lg border border-input max-h-48 overflow-y-auto z-20">
                  <ul className="py-1">
                    {searchResults.map((result) => (
                      <li key={result.id} className="hover:bg-accent cursor-pointer transition-colors">
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
                  {/* Clear results button */}
                  <div className="p-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-sm"
                      onClick={() => {
                        setSearchQuery("")
                        setSearchResults([])
                      }}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Clear results
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 mb-4">
              <Button onClick={handleSearch} className="flex-1">
                <SearchIcon className="w-4 h-4 mr-2" />
                Search
              </Button>
              <Button variant="outline" onClick={handleUseCurrentLocation} className="flex-1">
                <Crosshair className="w-4 h-4 mr-2" />
                Current
              </Button>
            </div>

            {/* Selected location info */}
            <div className="mb-4 p-3 rounded-lg border bg-muted/30">
              <h3 className="text-sm font-medium mb-2 flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-primary" />
                Selected Location
              </h3>
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
                <p className="text-sm mb-3 text-muted-foreground">Tap on the map to select a location</p>
              )}
            </div>

            {/* Map section with improved styling */}
            <div className="p-3 flex-1 min-h-0 flex flex-col">
              <div className="relative rounded-md overflow-hidden border shadow-sm flex-1 min-h-0" >
                <div
                  ref={mapRef}
                  className="absolute inset-0 w-full h-full"
                />
                {isLoading && (
                  <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center z-10">
                    <div className="bg-background p-4 rounded-lg shadow-lg flex items-center gap-2">
                      <Loader className="w-5 h-5 animate-spin text-primary" />
                      <span className="text-sm font-medium">Loading map...</span>
                    </div>
                  </div>
                )}
                <div className="absolute top-2 right-2 z-10">
                  <div className="bg-background/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium shadow-sm border border-muted">
                    Tap to select location
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Desktop layout remains unchanged
        <div className="grid grid-cols-1 md:grid-cols-3 h-full overflow-hidden">
          {/* Desktop layout with dialog - Left panel */}
          <div className="p-4 md:border-r h-full overflow-hidden flex flex-col bg-background">
            <div className="flex flex-col h-full">
              {/* Search input with clear button */}
              <div className="relative flex-shrink-0 mb-4 p-1 mx-auto px-2 w-full">
                <div className="relative">
                  <Input
                    placeholder="Search for a location"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-10 pr-10 bg-background border-input rounded-full"
                  />
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery("")
                        setSearchResults([])
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground hover:text-foreground rounded-full flex items-center justify-center"
                      aria-label="Clear search"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Search results dropdown */}
                {searchResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-10 bg-background shadow-lg rounded-lg border border-input max-h-60 overflow-y-auto">
                    <ul className="py-1">
                      {searchResults.map((result) => (
                        <li key={result.id} className="hover:bg-accent cursor-pointer transition-colors">
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
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 mb-4">
                <Button onClick={handleSearch} className="flex-1">
                  <SearchIcon className="w-4 h-4 mr-2" />
                  Search
                </Button>
                <Button variant="outline" onClick={handleUseCurrentLocation} className="flex-1">
                  <Crosshair className="w-4 h-4 mr-2" />
                  Current
                </Button>
              </div>

              {/* Search results area (takes up middle space) */}
              <div className="flex-1"></div>

              {/* Selected location info - moved to bottom */}
              <div className="mt-auto p-4 rounded-lg border bg-muted shadow-sm">
                <h3 className="text-sm font-medium mb-2 flex items-center">
                  <MapPin className="w-4 h-4 mr-2 text-primary" />
                  Selected Location
                </h3>
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
                  <p className="text-sm mb-3 text-muted-foreground">Click on the map to select a location</p>
                )}
              </div>
            </div>
          </div>

          <div className="relative md:col-span-2 h-full flex flex-col">
            <div className="rounded-none md:rounded-lg overflow-hidden flex-1 bg-background p-3 min-h-[300px] w-full mx-auto">
              <div
                className="border"
                ref={mapRef}
                style={{
                  height: "100%",
                  borderRadius: "0.5rem",
                }}
              />
            </div>
            {isLoading && (
              <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10">
                <div className="bg-background/90 p-4 rounded-lg shadow-lg flex items-center gap-2">
                  <Loader className="w-5 h-5 animate-spin text-primary" />
                  <span className="text-sm font-medium">Loading map...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )
      }

      {
        isMobile ? (
          <div className="flex gap-2 p-4 border-t mt-auto sticky bottom-0 bg-background shadow-lg">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={() => {
                onSelectLocation({ ...selectedLocation, display_name: address })
                onClose()
              }}
              className="flex-1"
              disabled={!address}
            >
              Confirm
            </Button>
          </div>
        ) : (
          <DialogFooter className="flex gap-2 p-4 border-t mt-auto bg-background">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                onSelectLocation({ ...selectedLocation, display_name: address })
                onClose()
              }}
              disabled={!address}
            >
              <MapPin className="w-4 h-4 mr-2" />
              Confirm Location
            </Button>
          </DialogFooter>
        )
      }
    </div >
  )

  // Render different components based on screen size
  return isMobile ? (
    <Drawer.Root open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }} handleOnly>
      <Drawer.Portal>
        <Drawer.Overlay
          className="fixed inset-0 bg-black/40 z-40"
          onClick={() => onClose()} // Add click handler to the overlay
        />
        <Drawer.Content
          className="bg-background flex flex-col rounded-t-[16px] fixed bottom-0 left-0 right-0 z-50 border-t border-border shadow-xl"
          style={{
            height: "85svh",
            maxHeight: "85svh",
          }}
          onInteractOutside={(e) => {
            e.preventDefault();
            onClose(); // Close when clicking outside
          }}
        >
          {renderContent()}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  ) : (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[90vw] md:max-w-[800px] lg:max-w-[1000px] h-[80vh] p-0 rounded-lg bg-background text-foreground flex flex-col overflow-hidden shadow-xl">
        {renderContent()}
      </DialogContent>
    </Dialog>
  )
}

export default MapDialog

