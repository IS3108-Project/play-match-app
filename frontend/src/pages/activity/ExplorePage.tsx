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



export default function ExplorePage() {
  const [date, setDate] = React.useState<Date>()
  const [checked, setChecked] = React.useState(false)
  const [activityInput, setActivityInput] = React.useState("")
  const [selectedRegions, setSelectedRegions] = React.useState<string[]>([])

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">Find Your Activity</h1>
        <p className="mt-2 text-muted-foreground">
          Join local activities organized by the community
        </p>
      </div>

      {/* Search Drawer */}
      <Drawer
        key="bottom"
        direction="bottom"
        // Remove input when drawer is closed
        onOpenChange={(open) => {
          if (!open) {
            setActivityInput("")
            setDate(undefined)
            setSelectedRegions([])
          }
        }}
      >
        <DrawerTrigger asChild>
          <ButtonGroup className="w-full my-4">
            <Input placeholder="Start your Search" />
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
                    onChange={(e) => setActivityInput(e.target.value)}
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
                        className="data-[empty=true]:text-muted-foreground w-[212px] justify-between text-left font-normal w-full"
                      >
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                        <ChevronDownIcon data-icon="inline-end" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={date} onSelect={setDate} />
                    </PopoverContent>
                  </Popover>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="location" className="last:border-b-1">
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
                            onCheckedChange={() => setSelectedRegions(prev =>
                              prev.includes(region)
                                ? prev.filter(r => r !== region) : [...prev, region])} />
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
      </Drawer>

      {/* Activities Grid Placeholder */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg border p-4">
            <span className="inline-block rounded bg-primary px-2 py-1 text-xs text-primary-foreground">
              RUNNING
            </span>
            <h3 className="mt-2 font-semibold">Morning Jog at MacRitchie!</h3>
            <p className="text-sm text-muted-foreground">MacRitchie Reservoir</p>
            <p className="text-sm text-muted-foreground">Saturday, Feb 8, 2026</p>
            <p className="mt-2 text-sm">
              12 / 20 joined · <span className="text-primary">8 spots left</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}