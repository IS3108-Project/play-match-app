import { useState, useEffect } from "react"

let cachedKey: string | null = null
let fetchPromise: Promise<string | null> | null = null

function fetchKey(): Promise<string | null> {
    if (!fetchPromise) {
        fetchPromise = fetch("http://localhost:3000/api/config")
            .then((res) => res.json())
            .then((data) => {
                cachedKey = data.googleMapsApiKey || null
                return cachedKey
            })
            .catch(() => null)
    }
    return fetchPromise
}

// Pre-fetch on module load so the key is ready before any drawer opens
fetchKey()

export function useGoogleMapsKey() {
    const [apiKey, setApiKey] = useState<string | null>(cachedKey)

    useEffect(() => {
        if (cachedKey !== null) {
            setApiKey(cachedKey)
            return
        }
        fetchKey().then((key) => {
            if (key) setApiKey(key)
        })
    }, [])

    return apiKey
}
