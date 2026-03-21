import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, SlidersHorizontal, MapPin, Signal, Dumbbell } from "lucide-react";

export type SortBy = "date" | "distance";
export type Skill = "Beginner" | "Intermediate" | "Advanced";
export type MaxDistance = 5 | 10 | 25 | null;

type FilterBarProps = {
  selectedSkills: Skill[];
  onSelectedSkillsChange: (value: Skill[]) => void;

  sortBy: SortBy;
  onSortByChange: (value: SortBy) => void;

  activityTypes: string[];
  selectedActivityTypes: string[];
  onSelectedActivityTypesChange: (value: string[]) => void;

  /** Whether location features are enabled */
  locationEnabled?: boolean;

  /** Maximum distance filter in km */
  maxDistance: MaxDistance;
  onMaxDistanceChange: (value: MaxDistance) => void;
};

export default function FilterBar({
  selectedSkills,
  onSelectedSkillsChange,
  sortBy,
  onSortByChange,
  activityTypes,
  selectedActivityTypes,
  onSelectedActivityTypesChange,
  locationEnabled = false,
  maxDistance,
  onMaxDistanceChange,
}: FilterBarProps) {
  const sortLabel = sortBy === "date" ? "Date" : "Distance";
  const formatActivityType = (value: string) =>
    value.charAt(0).toUpperCase() + value.slice(1);

  // Count active filters (include distance filter if set)
  const activeFilterCount =
    selectedSkills.length + selectedActivityTypes.length + (maxDistance ? 1 : 0);

  const SKILLS: Skill[] = ["Beginner", "Intermediate", "Advanced"];
  const DISTANCE_OPTIONS: { value: MaxDistance; label: string }[] = [
    { value: null, label: "Any distance" },
    { value: 5, label: "Within 5 km" },
    { value: 10, label: "Within 10 km" },
    { value: 25, label: "Within 25 km" },
  ];

  const toggleSkill = (skill: Skill, checked: boolean) => {
    if (checked) {
      onSelectedSkillsChange([...selectedSkills, skill]);
    } else {
      onSelectedSkillsChange(selectedSkills.filter((s) => s !== skill));
    }
  };

  const toggleActivityType = (type: string, checked: boolean) => {
    if (checked) {
      onSelectedActivityTypesChange([...selectedActivityTypes, type]);
    } else {
      onSelectedActivityTypesChange(
        selectedActivityTypes.filter((t) => t !== type),
      );
    }
  };

  const clearAllFilters = () => {
    onSelectedSkillsChange([]);
    onSelectedActivityTypesChange([]);
    onMaxDistanceChange(null);
  };

  const distanceLabel = maxDistance ? `Within ${maxDistance} km` : "Distance";

  return (
    <div className="mb-6 flex items-center gap-2 overflow-x-auto p-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="relative">
            <Button
              size="icon"
              className="h-9 w-9 shrink-0 rounded-xl"
              aria-label="Filters"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem
            onClick={clearAllFilters}
            disabled={activeFilterCount === 0}
            className="text-destructive focus:text-destructive"
          >
            Clear all filters
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="h-9 shrink-0 rounded-xl px-4"
            disabled={!locationEnabled}
          >
            <MapPin className="mr-1 h-4 w-4" />
            {maxDistance ? (
              <span className="font-normal text-primary">{distanceLabel}</span>
            ) : (
              distanceLabel
            )}
            <ChevronDown className="ml-1 size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {!locationEnabled ? (
            <DropdownMenuItem
              disabled
              className="text-muted-foreground text-xs"
            >
              Enable location in profile settings
            </DropdownMenuItem>
          ) : (
            <>
              {DISTANCE_OPTIONS.map((option) => (
                <DropdownMenuCheckboxItem
                  key={option.value ?? "any"}
                  checked={maxDistance === option.value}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onMaxDistanceChange(option.value);
                    }
                  }}
                >
                  {option.label}
                </DropdownMenuCheckboxItem>
              ))}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="h-9 shrink-0 rounded-xl px-4">
            <Signal className="mr-1 h-4 w-4" />
            {selectedSkills.length > 0 ? (
              <span className="font-normal text-primary">
                {selectedSkills.join(", ")}
              </span>
            ) : (
              "Skill level"
            )}
            <ChevronDown className="ml-1 size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {SKILLS.map((skill) => (
            <DropdownMenuCheckboxItem
              key={skill}
              checked={selectedSkills.includes(skill)}
              onCheckedChange={(checked) =>
                toggleSkill(skill, Boolean(checked))
              }
            >
              {skill.charAt(0).toUpperCase() + skill.slice(1)}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="h-9 shrink-0 rounded-xl px-4">
            <Dumbbell className="mr-1 h-4 w-4" />
            {selectedActivityTypes.length > 0 ? (
              <span className="font-normal text-primary">
                {selectedActivityTypes.map(formatActivityType).join(", ")}
              </span>
            ) : (
              "Activity types"
            )}
            <ChevronDown className="ml-1 size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="max-h-[200px] overflow-y-auto"
        >
          {activityTypes.map((type) => (
            <DropdownMenuCheckboxItem
              key={type}
              checked={selectedActivityTypes.includes(type)}
              onCheckedChange={(checked) =>
                toggleActivityType(type, Boolean(checked))
              }
            >
              {formatActivityType(type)}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Spacer to push Sort to the right */}
      <div className="flex-1" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="h-9 shrink-0 rounded-xl px-4">
            Sort by:
            <span className="font-normal text-primary">{sortLabel}</span>
            <ChevronDown className="ml-1 size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuCheckboxItem
            checked={sortBy === "date"}
            onCheckedChange={(checked) => checked && onSortByChange("date")}
          >
            Date
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={sortBy === "distance"}
            disabled={!locationEnabled}
            onCheckedChange={(checked) => checked && locationEnabled && onSortByChange("distance")}
            className={!locationEnabled ? "text-muted-foreground" : ""}
          >
            Distance
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
