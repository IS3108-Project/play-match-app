"use client"

import * as React from "react"
import { APIProvider, Map, AdvancedMarker, useMapsLibrary } from "@vis.gl/react-google-maps"
import { Input } from "@/components/ui/input"
import { useGoogleMapsKey } from "@/hooks/useGoogleMapsKey"

export type LocationValue = {
    location: string
    latitude: number | null
    longitude: number | null
}

type LocationPickerProps = {
    value: LocationValue
    onChange: (value: LocationValue) => void
}

// Default center: Singapore
const DEFAULT_CENTER = { lat: 1.3521, lng: 103.8198 }

function AutocompleteInput({ value, onChange }: LocationPickerProps) {
    const inputRef = React.useRef<HTMLInputElement>(null)
    const places = useMapsLibrary("places")
    const geocoding = useMapsLibrary("geocoding")
    const [position, setPosition] = React.useState(
        value.latitude && value.longitude
            ? { lat: value.latitude, lng: value.longitude }
            : DEFAULT_CENTER
    )
    const [hasSelection, setHasSelection] = React.useState(
        value.latitude !== null && value.longitude !== null
    )
    const hasAttemptedGeocode = React.useRef(false)

    // Auto-geocode legacy locations that have a name but no coordinates
    React.useEffect(() => {
        if (!geocoding || hasAttemptedGeocode.current) return
        if (!value.location || value.latitude || value.longitude) return
        
        hasAttemptedGeocode.current = true
        
        const geocoder = new geocoding.Geocoder()
        geocoder.geocode(
            { address: value.location, region: "sg" },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (results: any[] | null, status: string) => {
                if (status === "OK" && results?.[0]?.geometry?.location) {
                    const loc = results[0].geometry.location
                    const lat = loc.lat()
                    const lng = loc.lng()
                    setPosition({ lat, lng })
                    setHasSelection(true)
                    onChange({
                        location: value.location,
                        latitude: lat,
                        longitude: lng,
                    })
                }
            }
        )
    }, [geocoding, value.location, value.latitude, value.longitude, onChange])

    // Prevent clicks on pac-container from closing the drawer
    React.useEffect(() => {
        const handlePacClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement
            if (target.closest(".pac-container")) {
                e.stopPropagation()
            }
        }
        
        document.addEventListener("mousedown", handlePacClick, true)
        document.addEventListener("touchstart", handlePacClick as any, true)
        
        return () => {
            document.removeEventListener("mousedown", handlePacClick, true)
            document.removeEventListener("touchstart", handlePacClick as any, true)
        }
    }, [])

    React.useEffect(() => {
        if (!places || !inputRef.current) return

        const autocomplete = new places.Autocomplete(inputRef.current, {
            componentRestrictions: { country: "sg" },
            fields: ["formatted_address", "geometry", "name"],
        })

        autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace()
            const name = place.name || place.formatted_address || ""
            
            if (place.geometry?.location) {
                const lat = place.geometry.location.lat()
                const lng = place.geometry.location.lng()
                setPosition({ lat, lng })
                setHasSelection(true)
                onChange({
                    location: name,
                    latitude: lat,
                    longitude: lng,
                })
            } else {
                // No geometry means user didn't select from dropdown
                onChange({
                    location: name,
                    latitude: null,
                    longitude: null,
                })
                setHasSelection(false)
            }
        })
    }, [places, onChange])

    return (
        <div className="space-y-2">
            <Input
                ref={inputRef}
                defaultValue={value.location}
                onChange={(e) => {
                    // When typing manually, clear lat/lng
                    onChange({
                        location: e.target.value,
                        latitude: null,
                        longitude: null,
                    })
                    setHasSelection(false)
                }}
                placeholder="Search for a location..."
            />
            {hasSelection && (
                <div className="rounded-lg overflow-hidden border h-40">
                    <Map
                        defaultCenter={position}
                        center={position}
                        defaultZoom={16}
                        gestureHandling="none"
                        disableDefaultUI
                        mapId="location-picker"
                    >
                        <AdvancedMarker position={position} />
                    </Map>
                </div>
            )}
        </div>
    )
}

export default function LocationPicker(props: LocationPickerProps) {
    const apiKey = useGoogleMapsKey()

    if (!apiKey) {
        return (
            <Input
                value={props.value.location}
                onChange={(e) => props.onChange({
                    location: e.target.value,
                    latitude: null,
                    longitude: null,
                })}
                placeholder="e.g. Bedok Sports Hall"
            />
        )
    }

    return (
        <APIProvider apiKey={apiKey} libraries={["places", "geocoding"]}>
            <AutocompleteInput {...props} />
        </APIProvider>
    )
}
