import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin } from "lucide-react";

type UserProfileCardProps = {
  image?: string | null;
  name?: string | null;
  location?: string;
  level?: string;
};

export default function UserProfileCard({
  image,
  name,
  location = "Singapore",
  level = "Intermediate Level",
}: UserProfileCardProps) {
  const displayName = name?.trim() || "User";
  const fallbackInitial = displayName.charAt(0).toUpperCase();

  return (
    <section className="relative flex flex-col items-center border-b pb-6">
      <Avatar className="mt-4 h-28 w-28 rounded-full border-4 border-background object-cover shadow-md">
        <AvatarImage src={image ?? undefined} alt={displayName} />
        <AvatarFallback className="bg-primary text-4xl text-white">
          {fallbackInitial}
        </AvatarFallback>
      </Avatar>

      <h1 className="mt-4 text-2xl font-bold">{displayName}</h1>

      <div className="mt-2 flex items-center gap-1 text-muted-foreground">
        <MapPin className="h-4 w-4" />
        <span>{location}</span>
      </div>

      <span className="mt-2 rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
        {level}
      </span>
    </section>
  );
}