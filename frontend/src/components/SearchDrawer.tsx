"use client"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { Input } from "@/components/ui/input"
import { SearchIcon } from "lucide-react"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/search-accordion"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { format } from "date-fns"
import { ChevronDownIcon } from "lucide-react"

type SearchDrawerProps = {
    activityInput: string
    onActivityInputChange: (value: string) => void

    selectedRegions: string[]
    onSelectedRegionsChange: (regions: string[]) => void

    date?: Date
    onDateChange: (date?: Date) => void

    onSearch?: () => void
    onCancel?: () => void
}

export default function SearchDrawer({ activityInput, onActivityInputChange, selectedRegions, onSelectedRegionsChange, date, onDateChange, onSearch, onCancel }: SearchDrawerProps) {
    return (
    <Drawer
        key="bottom"
        direction="bottom"
        // Remove input when drawer is closed
        onOpenChange={(open) => {
            if (!open) {
                onActivityInputChange("")
                onDateChange(undefined)
                onSelectedRegionsChange([])
            }
        }
        }
    >
        <DrawerTrigger asChild>
            <ButtonGroup className="w-full my-4">
                <Input placeholder="Start your search" />
                <Button variant="outline" aria-label="Search">
                    <SearchIcon />
                </Button>
            </ButtonGroup>
        </DrawerTrigger>
        <DrawerContent className="h-[80vh]">
            <DrawerHeader>
                <DrawerTitle>Search for Activities</DrawerTitle>
                <DrawerDescription>
                    Find a buddy for the activities you love.
                    <br></br>Play together, grow together!
                </DrawerDescription>
            </DrawerHeader>
            <div className="grid flex-1 auto-rows-min gap-6 px-4">
                <Accordion
                    type="single"
                    collapsible
                    defaultValue="search-bar"
                    className="w-full"
                >
                    <AccordionItem value="activity" className="border-t">
                        <AccordionTrigger value={activityInput || undefined}>
                            What do you wanna do?
                        </AccordionTrigger>
                        <AccordionContent>
                            <Input
                                id="activity-input"
                                placeholder="Search for activities"
                                value={activityInput}
                                onChange={(e) => onActivityInputChange(e.target.value)}
                            />
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="date">
                        <AccordionTrigger value={date ? format(date, "PPP") : undefined}>
                            When?
                        </AccordionTrigger>
                        <AccordionContent>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        data-empty={!date}
                                        value={date ? format(date, "PPP") : undefined}
                                        className="data-[empty=true]:text-muted-foreground justify-between text-left font-normal w-full"
                                    >
                                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                                        <ChevronDownIcon data-icon="inline-end" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar mode="single" selected={date} onSelect={onDateChange} />
                                </PopoverContent>
                            </Popover>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="location" className="last:border-b">
                        <AccordionTrigger value={selectedRegions.length ? selectedRegions.join(", ") : undefined}>
                            Where?
                        </AccordionTrigger>
                        <AccordionContent>
                            <FieldGroup className="gap-2">
                                {["North", "South", "East", "West", "Central"].map((region) => (
                                    <React.Fragment key={region}>
                                        <Field orientation="horizontal">
                                            <Checkbox
                                                id={region}
                                                name={region}
                                                checked={selectedRegions.includes(region)}
                                                value={selectedRegions.includes(region) ? region : undefined}
                                                onCheckedChange={(checked) => 
                                                    onSelectedRegionsChange(checked 
                                                        ? [...selectedRegions, region] 
                                                        : selectedRegions.filter(r => r !== region))}
                                            />
                                            <FieldLabel htmlFor={region}>{region}</FieldLabel>
                                        </Field>
                                    </React.Fragment>
                                ))}
                            </FieldGroup>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>
            <DrawerFooter>
                {/* TODO: Implement search functionality */}
                <Button>Search</Button>
                <DrawerClose asChild>
                    <Button variant="outline">Cancel</Button>
                </DrawerClose>
            </DrawerFooter>
        </DrawerContent>
    </Drawer >
    );
}