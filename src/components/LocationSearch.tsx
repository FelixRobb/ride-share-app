import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Check, MapPin, Search } from 'lucide-react'

interface Location {
  lat: number;
  lon: number;
  display_name: string;
}

interface LocationSearchProps {
  onLocationSelect: (location: Location | null) => void;
  label: string;
  onOpenMap: () => void;
}

export default function LocationSearch({ onLocationSelect, label, onOpenMap }: LocationSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  const searchLocation = async () => {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
    const data = await response.json();
    const parsedData: Location[] = data.map((item: any) => ({
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      display_name: item.display_name
    }));
    setResults(parsedData);
  };

  const handleSelect = (location: Location) => {
    setSelectedLocation(location);
    onLocationSelect(location);
    setResults([]);
  };

  const handleClear = () => {
    setSelectedLocation(null);
    onLocationSelect(null);
    setQuery('');
  };

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <div className="relative flex-grow">
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Enter ${label}`}
            className="pr-10"
          />
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
        <Button onClick={searchLocation}>Search</Button>
        <Button onClick={onOpenMap} variant="outline">Map</Button>
      </div>
      {results.length > 0 && (
        <Card>
          <CardContent className="p-2">
            <ul className="space-y-2">
              {results.map((result, index) => (
                <li key={index}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-left"
                    onClick={() => handleSelect(result)}
                  >
                    <MapPin className="mr-2 h-4 w-4 text-primary" />
                    <span className="text-sm">{result.display_name}</span>
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
      {selectedLocation && (
        <Card className="bg-primary/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{label}</p>
                <p className="text-sm text-muted-foreground">{selectedLocation.display_name}</p>
              </div>
              <Check className="h-5 w-5 text-primary" />
            </div>
            <Button variant="outline" className="mt-2 w-full" onClick={handleClear}>
              Clear Selection
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

