"use client"

import * as React from "react"
import { Camera, Pencil } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { TogglePill } from "@/components/ui/toggle-pill"

import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"

// TODO: Replace with actual data from database
const LOCATION_OPTIONS = ["North", "South", "East", "West", "Central"] as const
const SKILL_OPTIONS = ["Beginner", "Intermediate", "Advanced"] as const
const SPORTS_OPTIONS = ["Running", "Yoga", "Badminton", "Basketball", "Tennis", "Cycling", "Swimming", "Football"] as const
const TIMING_OPTIONS = ["Early Morning", "Morning", "Afternoon", "Evening", "Night"] as const

type EditProfileValues = {
    name: string
    locations: string[]
    skillLevel: string
    sportsPreferences: string[]
    preferredTimings: string[]
    image?: string | null
    imageFile?: File | null
}

type EditProfileDrawerProps = {
    defaultValues?: Partial<EditProfileValues>
    onDone?: (values: EditProfileValues) => void
}


export default function EditProfileDrawer({
    defaultValues,
    onDone,
}: EditProfileDrawerProps) {
    const [image, setImage] = React.useState<string | null>(defaultValues?.image ?? null)
    const [imageFile, setImageFile] = React.useState<File | null>(null)
    const [name, setName] = React.useState(defaultValues?.name ?? "Samuel Tan")
    const [locations, setLocations] = React.useState<string[]>(
        defaultValues?.locations ?? []
    )
    const [skillLevel, setSkillLevel] = React.useState<string>(
        defaultValues?.skillLevel ?? ""
    )
    const [sportsPreferences, setSportsPreferences] = React.useState<string[]>(
        defaultValues?.sportsPreferences ?? []
    )
    const [preferredTimings, setPreferredTimings] = React.useState<string[]>(
        defaultValues?.preferredTimings ?? []
    )

    const toggleMulti = (
        value: string,
        current: string[],
        setter: React.Dispatch<React.SetStateAction<string[]>>
    ) => {
        setter(current.includes(value) ? current.filter((v) => v !== value) : [...current, value])
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (!file.type.startsWith("image/")) return

        // TODO: Upload image file to database
        setImageFile(file)
        setImage(URL.createObjectURL(file))
    }

    return (
        <Drawer direction="bottom">
            <DrawerTrigger asChild>
                <Button aria-label="Edit profile" variant="outline" className="gap-2">
                    <Pencil className="h-4 w-4" />
                    Edit
                </Button>
            </DrawerTrigger>

            <DrawerContent className="h-[88vh]">
                <DrawerHeader className="border-b">
                    <DrawerTitle className="text-center">Edit profile</DrawerTitle>
                </DrawerHeader>

                <div className="flex-1 overflow-y-auto px-4 py-5">

                    {/* Edit Picture */}
                    <section className="space-y-3 flex flex-col items-center text-center mb-8">
                        <div className="relative w-fit">
                            <Avatar className="mt-2 h-28 w-28 rounded-full border-4 border-background object-cover shadow-md">
                                <AvatarImage src={image ?? undefined} alt={name || "Profile preview"} />
                                <AvatarFallback className="bg-primary text-2xl text-white">
                                    {(name?.trim()?.charAt(0) || "U").toUpperCase()}
                                </AvatarFallback>
                            </Avatar>

                            <input
                                id="profile-image-input"
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="hidden"
                            />

                            <label
                                htmlFor="profile-image-input"
                                className="absolute -bottom-2 right-0 inline-flex cursor-pointer items-center gap-2 rounded-full border bg-background px-3 py-2 text-sm font-semibold shadow-md hover:bg-muted"
                            >
                                <Camera className="h-4 w-4" />
                            </label>
                        </div>
                    </section>

                    {/* Edit Name */}
                    <section className="space-y-3">
                        <h3 className="text-2xl font-bold">My profile</h3>
                        <p className="text-sm text-muted-foreground">Other players can see your profile, make sure to fill in all the details to get the best matches!</p>
                        <div className="space-y-2">
                            <label htmlFor="profile-name" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Name
                            </label>
                            <Input
                                id="profile-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter your name"
                            />
                        </div>
                    </section>

                    {/* Edit Location Preferences*/}
                    <section className="mt-6 space-y-4 border-t pt-5">
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Location</h4>
                        <div className="grid grid-cols-2 gap-3">
                            {LOCATION_OPTIONS.map((option) => (
                                <label key={option} className="flex items-center gap-2 text-sm">
                                    <Checkbox
                                        checked={locations.includes(option)}
                                        onCheckedChange={() => toggleMulti(option, locations, setLocations)}
                                    />
                                    {option}
                                </label>
                            ))}
                        </div>
                    </section>

                    {/* Edit Skill Level */}
                    <section className="mt-6 space-y-4 border-t pt-5">
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Skill level</h4>
                        <div className="grid grid-cols-1 gap-3">
                            {SKILL_OPTIONS.map((option) => (
                                <label key={option} className="flex items-center gap-2 text-sm">
                                    <Checkbox
                                        checked={skillLevel === option}
                                        onCheckedChange={() => setSkillLevel(option)}
                                    />
                                    {option}
                                </label>
                            ))}
                        </div>
                    </section>

                    {/* Edit Sports Preferences*/}
                    <section className="mt-6 space-y-4 border-t pt-5">
                        <h4 className="text-2xl font-bold">Sports Preferences</h4>
                        <div className="flex flex-wrap gap-3">
                            {SPORTS_OPTIONS.map((option) => (
                                <TogglePill
                                    key={option}
                                    label={option}
                                    selected={sportsPreferences.includes(option)}
                                    onClick={() => toggleMulti(option, sportsPreferences, setSportsPreferences)}
                                />
                            ))}
                        </div>
                    </section>

                    {/* Edit Preferred Timings */}
                    <section className="mt-8 space-y-4">
                        <h4 className="text-2xl font-bold">Preferred Timings</h4>
                        <div className="flex flex-wrap gap-3">
                            {TIMING_OPTIONS.map((option) => (
                                <TogglePill
                                    key={option}
                                    label={option}
                                    selected={preferredTimings.includes(option)}
                                    onClick={() => toggleMulti(option, preferredTimings, setPreferredTimings)}
                                />
                            ))}
                        </div>
                    </section>
                </div>

                <DrawerFooter className="border-t">
                    <DrawerClose asChild>
                        <Button
                            className="w-full rounded-full"
                            onClick={() =>
                                onDone?.({
                                    name,
                                    locations,
                                    skillLevel,
                                    sportsPreferences,
                                    preferredTimings,
                                    image,
                                    imageFile,
                                })
                            }
                        >
                            Done
                        </Button>
                    </DrawerClose>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    )
}