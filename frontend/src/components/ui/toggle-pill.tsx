import { Button } from "@/components/ui/button"

type TogglePillProps = {
  label: string
  selected: boolean
  onClick: () => void
}

export function TogglePill({ label, selected, onClick }: TogglePillProps) {
  return (
    <Button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full border px-4 py-2 text-sm font-semibold tracking-wide uppercase transition-colors",
        selected
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-background text-muted-foreground border-border hover:bg-muted",
      ].join(" ")}
    >
      {label}
    </Button>
  )
}