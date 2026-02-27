import { Link, useNavigate } from "react-router";
import { ChevronRight, LogOut } from "lucide-react";

import { authClient } from "@/lib/client-auth";
import { cn } from "@/lib/utils";
import { OPTIONS, type SettingsOption } from "./SettingsLayout";

function SettingsRowLink({ option }: { option: SettingsOption }) {
  const Icon = option.icon;

  return (
    <Link
      to={option.path}
      className={"flex w-full items-center gap-4 px-5 py-4 text-left"}
      aria-label={`Open ${option.title}`}
    >
      <div
        className={cn(
          "flex size-11 items-center justify-center rounded-2xl bg-secondary",
        )}
      >
        <Icon className="h-5 w-5 text-secondary-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold">{option.title}</div>
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground" />
    </Link>
  );
}

export default function SettingsPage() {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          navigate("/login");
        },
      },
    });
  };

  // Categorize settings options into sections
  const account = OPTIONS.slice(0, 2);
  const preferences = OPTIONS.slice(-2);

  return (
    <>
      <section className="space-y-2">
        <div className="px-1 text-xs font-semibold tracking-widest text-muted-foreground">
          ACCOUNT
        </div>
        <div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
          <div className="divide-y">
            {account.map((opt) => (
              <SettingsRowLink key={opt.path} option={opt} />
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <div className="px-1 text-xs font-semibold tracking-widest text-muted-foreground">
          PREFERENCES
        </div>
        <div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
          <div className="divide-y">
            {preferences.map((opt) => (
              <SettingsRowLink key={opt.path} option={opt} />
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <button
          type="button"
          onClick={handleSignOut}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-3xl border px-5 py-4",
            "border-destructive/30 bg-destructive/5 text-destructive shadow-sm",
          )}
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Log Out</span>
        </button>
      </section>
    </>
  );
}
