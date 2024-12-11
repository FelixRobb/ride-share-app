import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Clock } from 'lucide-react';

export function RideCard({ ride, type }: { ride: any; type: "available" | "my-ride" | "offered" }) {
  return (
    <Link href={`/ride-details/${ride.id}`}>
      <Card className="mb-4 overflow-hidden cursor-pointer hover:bg-secondary transition-colors">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">
            {ride.from_location} to {ride.to_location}
          </CardTitle>
          <CardDescription>
            {type === "available"
              ? `Requested by: ${ride.rider_name}`
              : type === "my-ride"
              ? `Status: ${ride.status.charAt(0).toUpperCase() + ride.status.slice(1)}`
              : `Offered to: ${ride.rider_name}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{new Date(ride.time).toLocaleString()}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

