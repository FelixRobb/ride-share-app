import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import { Icon } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Search, MapPin, Crosshair } from 'lucide-react'

interface MapDialogProps {
  isOpen: boolean
  onClose: () => void
  onSelectLocation: (location: { lat: number; lon: number; display_name: string }) => void
  initialLocation?: { lat: number; lon: number }
}

const MapDialog: React.FC<MapDialogProps> = ({ isOpen, onClose, onSelectLocation, initialLocation }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedLocation, setSelectedLocation] = useState(initialLocation || { lat: 0, lon: 0 })
  const [address, setAddress] = useState('')
  const mapRef = useRef<L.Map | null>(null)

  const customIcon = new Icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
  })

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
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords
        setSelectedLocation({ lat: latitude, lon: longitude })
        reverseGeocode(latitude, longitude)
        if (mapRef.current) {
          mapRef.current.setView([latitude, longitude], 13)
        }
      }, (error) => {
        console.error('Error getting current location:', error)
      })
    } else {
      console.error('Geolocation is not supported by this browser.')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Select Location</DialogTitle>
        </DialogHeader>
        <div className="flex space-x-2 mb-4">
          <div className="relative flex-grow">
            <Input
              placeholder="Search for a location"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
          <ul className="mb-4 max-h-40 overflow-y-auto bg-white border rounded-md shadow-sm">
            {searchResults.map((result) => (
              <li
                key={result.place_id}
                className="cursor-pointer hover:bg-gray-100 p-2 flex items-center"
                onClick={() => handleSelectSearchResult(result)}
              >
                <MapPin className="w-4 h-4 mr-2 text-primary" />
                <span className="text-sm">{result.display_name}</span>
              </li>
            ))}
          </ul>
        )}
        <MapContainer
          center={[selectedLocation.lat || 0, selectedLocation.lon || 0]}
          zoom={13}
          style={{ height: '400px', width: '100%' }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker
            position={[selectedLocation.lat, selectedLocation.lon]}
            icon={customIcon}
          />
          <MapEvents />
        </MapContainer>
        <div className="mt-4">
          <p className="text-sm font-medium">Selected Location:</p>
          <p className="text-sm text-gray-500">{address}</p>
        </div>
        <div className="mt-4 flex justify-end space-x-2">
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
      </DialogContent>
    </Dialog>
  )
}

export default MapDialog

