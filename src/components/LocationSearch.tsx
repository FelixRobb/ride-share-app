import { MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Location {
  lat: number;
  lon: number;
  display_name: string;
}

interface LocationSearchProps {
  selectedLocation: Location | null;
  label: string;
  onOpenMap: () => void;
}

export default function LocationSearch({
  selectedLocation,
  label,
  onOpenMap,
}: LocationSearchProps) {
  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <Button type="button" onClick={onOpenMap} variant="outline" className="w-full">
          <MapPin className="mr-2 h-4 w-4" />
          {selectedLocation ? "Change Location" : `Select ${label}`}
        </Button>
      </div>
      {selectedLocation && (
        <Card className="bg-primary/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{label}</p>
                <p className="text-sm text-muted-foreground">{selectedLocation.display_name}</p>
              </div>
              <MapPin className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
