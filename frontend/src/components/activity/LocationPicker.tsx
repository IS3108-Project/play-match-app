"use client"

import * as React from "react"
import { APIProvider, Map, AdvancedMarker, useMapsLibrary } from "@vis.gl/react-google-maps"
import { Input } from "@/components/ui/input"
import { useGoogleMapsKey } from "@/hooks/useGoogleMapsKey"

type LocationPickerProps = {
    value: string
    onChange: (value: string) => void
}

// Default center: Singapore
const DEFAULT_CENTER = { lat: 1.3521, lng: 103.8198 }

function AutocompleteInput({ value, onChange }: LocationPickerProps) {
    const inputRef = React.useRef<HTMLInputElement>(null)
    const places = useMapsLibrary("places")
    const [position, setPosition] = React.useState(DEFAULT_CENTER)
    const [hasSelection, setHasSelection] = React.useState(false)

    React.useEffect(() => {
        if (!places || !inputRef.current) return

        const autocomplete = new places.Autocomplete(inputRef.current, {
            componentRestrictions: { country: "sg" },
            fields: ["formatted_address", "geometry", "name"],
        })

        autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace()
            const name = place.name || place.formatted_address || ""
            onChange(name)
            if (place.geometry?.location) {
                setPosition({
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng(),
                })
                setHasSelection(true)
            }
        })
    }, [places, onChange])

    return (
        <div className="space-y-2">
            <Input
                ref={inputRef}
                defaultValue={value}
                onChange={(e) => {
                    onChange(e.target.value)
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
                value={props.value}
                onChange={(e) => props.onChange(e.target.value)}
                placeholder="e.g. Bedok Sports Hall"
            />
        )
    }

    return (
        <APIProvider apiKey={apiKey} libraries={["places"]}>
            <AutocompleteInput {...props} />
        </APIProvider>
    )
}
