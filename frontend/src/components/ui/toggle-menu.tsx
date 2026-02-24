import { TogglePill } from "@/components/ui/toggle-pill"

type ToggleMenuProps = {
  label: string
  options: string[]
  selected: string[]
  onSelectedChange: (next: string[]) => void
  formatOptionLabel?: (value: string) => string
  className?: string
}

export function ToggleMenu({
  label: _label,
  options,
  selected,
  onSelectedChange,
  formatOptionLabel = (v) => v,
  className,
}: ToggleMenuProps) {
  const toggle = (value: string, checked: boolean) => {
    if (checked) onSelectedChange([...selected, value])
    else onSelectedChange(selected.filter((v) => v !== value))
  }

  return (
    <div className={["flex flex-wrap gap-3", className].filter(Boolean).join(" ")}>
      {options.map((option) => (
        <TogglePill
          key={option}
          label={formatOptionLabel(option)}
          selected={selected.includes(option)}
          onClick={() => toggle(option, !selected.includes(option))}
        />
      ))}
    </div>
  )
}