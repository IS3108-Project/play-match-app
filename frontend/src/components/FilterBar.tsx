import { Button } from "@/components/ui/button"
import { DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, SlidersHorizontal } from "lucide-react"

export type SortBy = "date" | "distance"
export type Skill = "Beginner" | "Intermediate" | "Advanced"

type FilterBarProps = {
    radiusKm: number | "any"
    onRadiusKmChange: (value: number | "any") => void

    selectedSkills: Skill[]
    onSelectedSkillsChange: (value: Skill[]) => void

    sortBy: SortBy
    onSortByChange: (value: SortBy) => void
}


export default function FilterBar({
    radiusKm,
    onRadiusKmChange,
    selectedSkills,
    onSelectedSkillsChange,
    sortBy,
    onSortByChange,
}: FilterBarProps) {
    const sortLabel =
        sortBy === "date" ? "Date" : sortBy === "distance" ? "Distance" : "Rating"
    
        

const SKILLS: Skill[] = ["Beginner", "Intermediate", "Advanced"]

const toggleSkill = (skill: Skill, checked: boolean) => {
  if (checked) {
    onSelectedSkillsChange([...selectedSkills, skill])
  } else {
    onSelectedSkillsChange(selectedSkills.filter((s) => s !== skill))
  }
}

    return (
        <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-1">
            <Button size="icon" className="h-9 w-9 shrink-0 rounded-xl" aria-label="Filters">
                <SlidersHorizontal className="h-4 w-4" />
            </Button>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-9 shrink-0 rounded-xl px-4">
                        Sort by: 
                        <span className="font-normal">{sortLabel}</span>
                        <ChevronDown className="ml-1 size-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => onSortByChange("date")}>Date</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onSortByChange("distance")}>
                        Distance
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-9 shrink-0 rounded-xl px-4">
                        {radiusKm === "any" ? "Distance" : `${radiusKm} km`}
                        <ChevronDown className="ml-1 size-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => onRadiusKmChange("any")}>
                        Any distance
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onRadiusKmChange(5)}>Within 5 km</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onRadiusKmChange(10)}>Within 10 km</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onRadiusKmChange(20)}>Within 20 km</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-9 shrink-0 rounded-xl px-4">
                        {selectedSkills.length > 0 ? selectedSkills.join(", ") : "Skill level"}
                        <ChevronDown className="ml-1 size-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                    {SKILLS.map((skill) => (
                        <DropdownMenuCheckboxItem
                            key={skill}
                            checked={selectedSkills.includes(skill)}
                            onCheckedChange={(checked) => toggleSkill(skill, Boolean(checked))}
                        >
                            {skill.charAt(0).toUpperCase() + skill.slice(1)}
                        </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}