import { Link, Outlet, useLocation } from "react-router";
import {
  ArrowLeft,
  LockIcon,
  BellIcon,
  HelpCircleIcon,
  UserIcon,
} from "lucide-react";

export type SettingsOption = {
  path: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
};

export const OPTIONS: SettingsOption[] = [
  {
    path: "personal-info",
    title: "Personal Information",
    description: "Update your personal details and profile information",
    icon: UserIcon,
  },
  {
    path: "security",
    title: "Login & Security",
    description: "Manage your login and account security",
    icon: LockIcon,
  },
  {
    path: "notifications",
    title: "Notifications",
    description: "Manage your notification preferences",
    icon: BellIcon,
  },
  {
    path: "faq",
    title: "FAQ",
    description: "Find answers to common questions about PlayMatch",
    icon: HelpCircleIcon,
  },
];

export default function SettingsLayout() {
  const location = useLocation();
  const isRoot =
    location.pathname === "/settings" || location.pathname === "/settings/";

  const pathAfterSettings = location.pathname.split("/settings/")[1] ?? "";
  const activeKey = pathAfterSettings.split("/")[0];
  const activeOption = OPTIONS.find((o) => o.path === activeKey);

  const title = activeOption?.title ?? "Settings";
  const description =
    activeOption?.description ?? "Manage your account preferences.";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      <div className="flex items-start gap-3">
        {!isRoot && (
          <Link
            to="/settings"
            className="mt-0.5 inline-flex size-10 items-center justify-center"
            aria-label="Back to settings"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
        )}
        <div className="min-w-0">
          <h1 className="text-xl font-bold">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <Outlet />
    </div>
  );
}
