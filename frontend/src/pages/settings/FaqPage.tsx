import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ChevronDown } from "lucide-react";

export default function FaqPage() {
  return (
    <div className="rounded-3xl border bg-card px-6 py-4 shadow-sm">
      <Accordion type="single" collapsible className="w-full">
        {[
          {
            id: "join",
            q: "How do I join an activity?",
            a: "Open an activity card and tap Join. If the activity requires approval, you’ll see a pending status until the host confirms. You can always check your upcoming activities to confirm you’re in.",
          },
          {
            id: "leave-cancel",
            q: "How do I leave or cancel an activity I already joined?",
            a: "Go to the activity details and select 'cancel RSVP'.",
          },
          {
            id: "profile",
            q: "Can I update my skill level, position, or preferences later?",
            a: "Yes. You can edit your profile details any time. Keeping these up to date helps match you with more relevant activities and buddies.",
          },
          {
            id: "notifications",
            q: "I’m not getting notifications. What should I check?",
            a: "First, confirm notifications are enabled in Settings → Notifications. Then check your device notification settings (system-level permissions, focus modes, and notification channels).",
          },
          {
            id: "location",
            q: "How is my location used?",
            a: "Location is used to show nearby activities and help you discover matches in your area. If location is disabled, you can still browse, but results may be less relevant or default to a broader area.",
          },
          {
            id: "safety",
            q: "How do I report a user or an inappropriate activity?",
            a: "You will see a report option on the profile or activity. Include as much detail as you can (what happened, where, and when). Reports are reviewed to help keep the community safe, and the admins will take actions on a case by case basis.",
          },
        ].map((item) => (
          <AccordionItem key={item.id} value={item.id}>
            <AccordionTrigger className="flex-row">
              <span className="flex-1 text-left">{item.q}</span>
              <ChevronDown className="h-4 w-4" />
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-muted-foreground">{item.a}</p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
