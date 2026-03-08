"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import { reportApi, type ReportType } from "@/lib/api";
import { toast } from "sonner";

type ReportUserDrawerProps = {
  /** The user being reported */
  reportedUserId: string;
  reportedUserName: string;
  /** Optionally tie the report to a specific activity */
  activityId?: string;
  className?: string;
  /** Render a custom trigger instead of the default flag button */
  trigger?: React.ReactNode;
};

const REPORT_TYPES: {
  value: ReportType;
  label: string;
  description: string;
}[] = [
  {
    value: "NO_SHOW",
    label: "No-Show",
    description: "Confirmed but never appeared",
  },
  {
    value: "RUDE_UNSAFE",
    label: "Rude / Unsafe",
    description: "Disrespectful or unsafe behaviour",
  },
  {
    value: "MISREPRESENTED",
    label: "Misrepresentation",
    description: "Lied about skill level or identity",
  },
  {
    value: "SPAM",
    label: "Spam",
    description: "Sent unsolicited messages or links",
  },
  {
    value: "OTHER",
    label: "Other",
    description: "Something else not listed above",
  },
];

export default function ReportUserDrawer({
  reportedUserId,
  reportedUserName,
  activityId,
  className,
  trigger,
}: ReportUserDrawerProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedType, setSelectedType] = React.useState<ReportType | null>(
    null,
  );
  const [details, setDetails] = React.useState("");
  const [anonymous, setAnonymous] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const reset = () => {
    setSelectedType(null);
    setDetails("");
    setAnonymous(false);
  };

  const handleSubmit = async () => {
    if (!selectedType) {
      toast.error("Please select a reason");
      return;
    }
    setSubmitting(true);
    try {
      await reportApi.create({
        reportedUserId,
        activityId,
        type: selectedType,
        details: details.trim(),
        anonymous,
      });
      toast.success(
        "Report submitted. Thank you for helping keep the community safe.",
      );
      reset();
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      direction="bottom"
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DrawerTrigger asChild>
        {trigger ?? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              "text-destructive border-destructive/30 hover:bg-destructive/10",
              className,
            )}
          >
            <Flag className="size-4" />
            Report
          </Button>
        )}
      </DrawerTrigger>

      <DrawerContent className="h-[88vh] flex flex-col">
        <DrawerHeader className="border-b">
          <DrawerTitle className="text-center">
            Report {reportedUserName}
          </DrawerTitle>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
          {/* Reason selection */}
          <section className="space-y-2">
            <p className="text-sm font-semibold">What's the issue?</p>
            <div className="space-y-2">
              {REPORT_TYPES.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSelectedType(opt.value)}
                  className={cn(
                    "w-full rounded-lg border p-3 text-left transition-colors",
                    selectedType === opt.value
                      ? "border-destructive bg-destructive/5"
                      : "border-input bg-background hover:bg-accent/50",
                  )}
                >
                  <p
                    className={cn(
                      "text-sm font-medium",
                      selectedType === opt.value ? "text-destructive" : "",
                    )}
                  >
                    {opt.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {opt.description}
                  </p>
                </button>
              ))}
            </div>
          </section>

          {/* Additional details */}
          <section className="space-y-2">
            <p className="text-sm font-semibold">
              Additional details{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </p>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Describe what happened…"
              rows={4}
              maxLength={500}
              className="border-input placeholder:text-muted-foreground w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none resize-none"
            />
            <p className="text-right text-xs text-muted-foreground">
              {details.length}/500
            </p>
          </section>

          {/* Anonymous toggle — use shadcn Checkbox for consistency */}
          <section>
            <label className="flex items-center gap-3 cursor-pointer rounded-lg border p-3 hover:bg-accent/50 transition-colors">
              <Checkbox
                checked={anonymous}
                onCheckedChange={(v) => setAnonymous(v === true)}
              />
              <div>
                <p className="text-sm font-medium">Submit anonymously</p>
                <p className="text-xs text-muted-foreground">
                  Your name won't be shared with the reported user.
                </p>
              </div>
            </label>
          </section>
        </div>

        <DrawerFooter className="border-t space-y-2">
          <p className="text-xs text-muted-foreground text-center">
            Reports are reviewed by admins. Misuse may result in account action.
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleSubmit}
              disabled={submitting || !selectedType}
            >
              {submitting ? "Submitting…" : "Submit Report"}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
