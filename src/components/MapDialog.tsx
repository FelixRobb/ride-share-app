import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import { Icon } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Search, MapPin, Crosshair } from 'lucide-react'
import { toast } from "@/hooks/use-toast"

interface MapDialogProps {
  isOpen: boolean
  onClose: () => void
  onSelectLocation: (location: { lat: number; lon: number; display_name: string }) => void
  initialLocation?: { lat: number; lon: number }
}

const MapDialog: React.FC<MapDialogProps> = ({ isOpen, onClose, onSelectLocation, initialLocation }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedLocation, setSelectedLocation] = useState(initialLocation || { lat: 38.707624, lon: -9.136645 })
  const [address, setAddress] = useState('')
  const mapRef = useRef<L.Map | null>(null)

  const customIcon = new Icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
  })

  const isClient = typeof window !== 'undefined';

  useEffect(() => {
    if (initialLocation) {
      setSelectedLocation(initialLocation)
      reverseGeocode(initialLocation.lat, initialLocation.lon)
    }
  }, [initialLocation])

  const handleSearch = async () => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()
      setSearchResults(data)
    } catch (error) {
      console.error('Error searching for location:', error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSelectSearchResult = (result: any) => {
    setSelectedLocation({ lat: parseFloat(result.lat), lon: parseFloat(result.lon) })
    setAddress(result.display_name)
    setSearchResults([])
    if (mapRef.current) {
      mapRef.current.setView([parseFloat(result.lat), parseFloat(result.lon)], 13)
    }
  }

  const reverseGeocode = async (lat: number, lon: number) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
      const data = await response.json()
      setAddress(data.display_name)
    } catch (error) {
      console.error('Error reverse geocoding:', error)
    }
  }

  const MapEvents = () => {
    const map = useMap()
    useEffect(() => {
      if (map) {
        mapRef.current = map
      }
    }, [map])

    useMapEvents({
      click(e) {
        setSelectedLocation({ lat: e.latlng.lat, lon: e.latlng.lng })
        reverseGeocode(e.latlng.lat, e.latlng.lng)
      },
    })

    return null
  }

  const handleUseCurrentLocation = () => {
    if (!isClient || !('geolocation' in navigator)) {
      console.error('Geolocation is not supported by this browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setSelectedLocation({ lat: latitude, lon: longitude });
        reverseGeocode(latitude, longitude);
        if (mapRef.current) {
          mapRef.current.setView([latitude, longitude], 13);
        }
      },
      (error) => {
        console.error('Error getting current location:', error);
      }
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied to clipboard",
        description: "The address has been copied to your clipboard.",
      });
    }, (err) => {
      console.error('Could not copy text: ', err);
    });
  };

  const openInGoogleMaps = (lat: number, lon: number) => {
    if (isClient) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lon}`, '_blank');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Location</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col space-y-4">
          <div className="flex space-x-2 mb-4">
            <div className="relative flex-grow">
              <Input
                placeholder="Search for a location"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pr-10"
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            <Button onClick={handleSearch}>Search</Button>
            <Button onClick={handleUseCurrentLocation} variant="outline">
              <Crosshair className="w-4 h-4 mr-2" />
              Current
            </Button>
          </div>
          {searchResults.length > 0 && (
            <ul className="mb-4 max-h-40 overflow-y-auto bg-secondary border rounded-md shadow-sm">
              {searchResults.map((result) => (
                <li
                  key={result.place_id}
                  className="cursor-pointer p-2 flex items-center"
                  onClick={() => handleSelectSearchResult(result)}
                >
                  <MapPin className="w-4 h-4 mr-2 text-primary" />
                  <span className="text-sm text-white hover:text-primary">{result.display_name}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="h-[400px] w-full">
            <MapContainer
              center={[selectedLocation.lat || 0, selectedLocation.lon || 0]}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker
                position={[selectedLocation.lat, selectedLocation.lon]}
                icon={customIcon}
              />
              <MapEvents />
            </MapContainer>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Selected Location:</p>
              <p className="text-sm text-gray-500">{address}</p>
            </div>
            <div className="flex space-x-2 flex-col items-center gap-1">
              <Button size="sm" variant="outline" onClick={() => copyToClipboard(address)}>
                Copy
              </Button>
              <Button size="sm" variant="outline" onClick={() => openInGoogleMaps(selectedLocation.lat, selectedLocation.lon)}>
                Google Maps
              </Button>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button onClick={onClose} variant="outline">
              Cancel
            </Button>
            <Button
              onClick={() => {
                onSelectLocation({
                  ...selectedLocation,
                  display_name: address
                })
                onClose()
              }}
            >
              Confirm Location
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default MapDialog

