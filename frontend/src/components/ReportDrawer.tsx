import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { reportApi, type CreateReportPayload } from "@/lib/api";
import { toast } from "sonner";

const REPORT_TYPES: { value: CreateReportPayload["type"]; label: string; description: string }[] = [
  { value: "NO_SHOW", label: "No Show", description: "User did not attend the activity" },
  { value: "RUDE_UNSAFE", label: "Rude / Unsafe", description: "Inappropriate or unsafe behaviour" },
  { value: "MISREPRESENTED", label: "Misrepresented", description: "False or misleading information" },
  { value: "SPAM", label: "Spam", description: "Spam content or activity" },
  { value: "OTHER", label: "Other", description: "Other reason" },
];

type ReportDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportedUserId: string;
  reportedUserName: string;
  activityId?: string;
};

export default function ReportDrawer({
  open,
  onOpenChange,
  reportedUserId,
  reportedUserName,
  activityId,
}: ReportDrawerProps) {
  const [type, setType] = React.useState<CreateReportPayload["type"] | null>(null);
  const [details, setDetails] = React.useState("");
  const [anonymous, setAnonymous] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const resetForm = () => {
    setType(null);
    setDetails("");
    setAnonymous(false);
  };

  const handleSubmit = async () => {
    if (!type) {
      toast.error("Please select a report type");
      return;
    }
    if (!details.trim()) {
      toast.error("Please provide details");
      return;
    }

    setSubmitting(true);
    try {
      await reportApi.create({
        reportedUserId,
        activityId,
        type,
        details: details.trim(),
        anonymous,
      });
      toast.success("Report submitted. Our team will review it.");
      resetForm();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="border-b">
          <DrawerTitle className="text-center">
            Report {reportedUserName}
          </DrawerTitle>
        </DrawerHeader>

        <div className="overflow-y-auto px-4 py-4 space-y-4">
          {/* Report Type Selection */}
          <div>
            <label className="text-sm font-medium">What are you reporting?</label>
            <div className="mt-2 space-y-2">
              {REPORT_TYPES.map((rt) => (
                <label
                  key={rt.value}
                  className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                    type === rt.value
                      ? "border-primary bg-primary/5"
                      : "hover:bg-accent/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="reportType"
                    value={rt.value}
                    checked={type === rt.value}
                    onChange={() => setType(rt.value)}
                    className="mt-0.5 accent-primary"
                  />
                  <div>
                    <p className="text-sm font-medium">{rt.label}</p>
                    <p className="text-xs text-muted-foreground">{rt.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Details */}
          <div>
            <label className="text-sm font-medium">Details</label>
            <textarea
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Describe what happened..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />
          </div>

          {/* Anonymous Toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
              className="accent-primary"
            />
            <span className="text-sm">Submit anonymously</span>
          </label>
        </div>

        <DrawerFooter className="border-t">
          <Button
            className="w-full"
            variant="destructive"
            onClick={handleSubmit}
            disabled={submitting || !type || !details.trim()}
          >
            {submitting ? "Submitting..." : "Submit Report"}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
