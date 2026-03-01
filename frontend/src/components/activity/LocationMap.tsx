"use client"

import * as React from "react"
import { APIProvider, Map, AdvancedMarker, useMapsLibrary } from "@vis.gl/react-google-maps"
import { useGoogleMapsKey } from "@/hooks/useGoogleMapsKey"

const DEFAULT_CENTER = { lat: 1.3521, lng: 103.8198 }

function GeocodedMap({ location }: { location: string }) {
    const geocoding = useMapsLibrary("geocoding")
    const [position, setPosition] = React.useState<{ lat: number; lng: number } | null>(null)

    React.useEffect(() => {
        if (!geocoding) return

        const geocoder = new geocoding.Geocoder()
        geocoder.geocode(
            { address: `${location}, Singapore` },
            (results, status) => {
                if (status === "OK" && results?.[0]) {
                    setPosition({
                        lat: results[0].geometry.location.lat(),
                        lng: results[0].geometry.location.lng(),
                    })
                }
            },
        )
    }, [geocoding, location])

    if (!position) return null

    return (
        <div className="rounded-lg overflow-hidden border h-48">
            <Map
                defaultCenter={position}
                center={position}
                defaultZoom={16}
                gestureHandling="cooperative"
                disableDefaultUI
                mapId="detail-location"
                style={{ width: "100%", height: "100%" }}
            >
                <AdvancedMarker position={position} />
            </Map>
        </div>
    )
}

export default function LocationMap({ location }: { location: string }) {
    const apiKey = useGoogleMapsKey()

    if (!apiKey) return null

    return (
        <APIProvider apiKey={apiKey} libraries={["geocoding"]}>
            <GeocodedMap location={location} />
        </APIProvider>
    )
}
