"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { format, isValid, parseISO } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// TODO: Replace with actual activity types from the database
const DEFAULT_ACTIVITY_TYPE_OPTIONS = [
  "Running",
  "Yoga",
  "Badminton",
  "Basketball",
  "Tennis",
  "Cycling",
  "Swimming",
  "Football",
] as const;

export type EditActivityValues = {
  activityTitle: string;
  activityType: string;
  date: string;
  time: string;
  location: string;
  maxParticipants: number;
  description: string;
};

type Props = {
  defaultValues?: Partial<EditActivityValues>;
  activityTypes?: string[];
  onSubmit?: (values: EditActivityValues) => Promise<void> | void;
  onCancel?: () => void;
};

const toOptionalDate = (value: string | undefined) => {
  if (!value) return undefined;
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : undefined;
};

export default function EditActivityForm({
  defaultValues,
  activityTypes = [...DEFAULT_ACTIVITY_TYPE_OPTIONS],
  onSubmit,
  onCancel,
}: Props) {
  const [form, setForm] = React.useState<EditActivityValues>({
    activityTitle: defaultValues?.activityTitle ?? "",
    activityType: defaultValues?.activityType ?? "",
    date: defaultValues?.date ?? "",
    time: defaultValues?.time ?? "",
    location: defaultValues?.location ?? "",
    maxParticipants: defaultValues?.maxParticipants ?? 2,
    description: defaultValues?.description ?? "",
  });

  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(() =>
    toOptionalDate(defaultValues?.date),
  );
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    setForm({
      activityTitle: defaultValues?.activityTitle ?? "",
      activityType: defaultValues?.activityType ?? "",
      date: defaultValues?.date ?? "",
      time: defaultValues?.time ?? "",
      location: defaultValues?.location ?? "",
      maxParticipants: defaultValues?.maxParticipants ?? 2,
      description: defaultValues?.description ?? "",
    });
    setSelectedDate(toOptionalDate(defaultValues?.date));
  }, [defaultValues]);

  const handleChange = <K extends keyof EditActivityValues>(
    key: K,
    value: EditActivityValues[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit(form);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 400));
        console.log("Edit activity payload:", form);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <h3 className="text-2xl font-bold">Edit activity</h3>
        <p className="text-sm text-muted-foreground">
          Update your activity details below.
        </p>
      </div>

      <div className="space-y-3">
        <Label htmlFor="edit-activity-title">Activity Name</Label>
        <Input
          id="edit-activity-title"
          value={form.activityTitle}
          onChange={(e) => handleChange("activityTitle", e.target.value)}
          placeholder="Enter activity name"
          required
        />
      </div>

      <div className="space-y-3">
        <Label htmlFor="edit-activity-type-trigger">Activity Type</Label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              id="edit-activity-type-trigger"
              type="button"
              variant="outline"
              className="w-full justify-between"
            >
              {form.activityType || "Select activity type"}
              <ChevronDown className="size-4 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width)">
            {activityTypes.map((type) => (
              <DropdownMenuItem
                key={type}
                onClick={() => handleChange("activityType", type)}
              >
                {type}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-activity-date-trigger">Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="edit-activity-date-trigger"
              type="button"
              variant="outline"
              className="w-full justify-between font-normal"
            >
              {selectedDate
                ? format(selectedDate, "PPP")
                : form.date || "Pick a date"}
              <ChevronDown className="size-4 opacity-70" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(nextDate) => {
                setSelectedDate(nextDate);
                handleChange(
                  "date",
                  nextDate ? format(nextDate, "yyyy-MM-dd") : "",
                );
              }}
              disabled={{ before: new Date() }}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-activity-time">Time</Label>
        <Input
          id="edit-activity-time"
          value={form.time}
          onChange={(e) => handleChange("time", e.target.value)}
          placeholder="e.g. 10:00 AM - 12:00 PM"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-activity-location">Meeting Location</Label>
        <Input
          id="edit-activity-location"
          value={form.location}
          onChange={(e) => handleChange("location", e.target.value)}
          placeholder="e.g. Bedok Sports Hall"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-activity-max-participants">Max Participants</Label>
        <Input
          id="edit-activity-max-participants"
          type="number"
          min={2}
          value={form.maxParticipants}
          onChange={(e) =>
            handleChange("maxParticipants", Number(e.target.value))
          }
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-activity-description">Description</Label>
        <textarea
          id="edit-activity-description"
          value={form.description}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="Add activity details..."
          rows={4}
          required
          className={cn(
            "border-input placeholder:text-muted-foreground w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none",
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 border-t pt-5">
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
