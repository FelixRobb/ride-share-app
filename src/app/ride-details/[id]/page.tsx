import { RideDetailsPage } from "@/components/ride-details-page";

export default async function RideDetails(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  return <RideDetailsPage rideId={params.id} />;
}

