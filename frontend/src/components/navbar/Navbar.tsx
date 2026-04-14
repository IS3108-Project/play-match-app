import { Link, useLocation, useNavigate } from "react-router";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Monitor, Moon, Sun, UserRound, Settings, LogOut } from "lucide-react";
import logo from "@/assets/logo.svg";
import { useTheme } from "@/hooks/useTheme";
import { useRole } from "@/hooks/useRole";
import { authClient } from "@/lib/client-auth";

const navLinks = [
  { name: "Explore", shortName: "Explore", href: "/" },
  { name: "My Activities", shortName: "Activities", href: "/my-activities" },
  { name: "Buddies", shortName: "Buddies", href: "/buddy" },
  { name: "Community", shortName: "Community", href: "/community" },
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const { isAdmin, session } = useRole();
  const user = session?.user;
  const { theme, setTheme } = useTheme();

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          navigate("/login");
        },
      },
    });
  };

  // Build nav links dynamically based on role
  const allNavLinks = isAdmin
    ? [...navLinks, { name: "Admin", shortName: "Admin", href: "/admin" }]
    : navLinks;

  return (
    <header className="fixed inset-x-0 top-3 z-50 px-3">
      <nav className="mx-auto flex h-14 w-full max-w-5xl items-center justify-around min-[426px]:justify-between rounded-2xl border bg-background/90 px-2 shadow-sm backdrop-blur supports-backdrop-filter:bg-background/70 sm:px-4">
        {/* Left: logo (optional on mobile) */}
        <Link to="/" className="hidden md:flex items-center">
          <img src={logo} alt="PlayMatch" className="h-6 w-auto" />
        </Link>

        {/* Nav Links */}
        <ul className="flex min-w-0 flex-1 items-center justify-center gap-0.5 overflow-x-auto sm:flex-none sm:gap-4">
          {allNavLinks.map((link) => {
            const isActive = location.pathname === link.href;
            return (
              <li key={link.href}>
                <Link
                  to={link.href}
                  className={`relative px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium transition-all whitespace-nowrap rounded-lg ${
                    isActive 
                      ? "text-primary bg-primary/10" 
                      : "text-muted-foreground hover:text-primary hover:bg-muted"
                  }`}
                >
                  <span className="sm:hidden">{link.shortName}</span>
                  <span className="hidden sm:inline">{link.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex shrink-0 items-center gap-2 outline-none">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.image || undefined} alt={user?.name ?? "User"} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {user?.name?.charAt(0).toUpperCase() ?? "U"}
              </AvatarFallback>
            </Avatar>
            <span className="hidden text-sm font-medium sm:inline">{user?.name ?? "User"}</span>
            <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:block" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="z-70">
            <DropdownMenuItem onClick={() => navigate("/profile")}>
              <UserRound className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Theme Submenu */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Sun className="mr-2 h-4 w-4" />
                Theme
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  <Sun className="mr-2 h-4 w-4" />
                  Light
                  {theme === "light" && <span className="ml-auto">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  <Moon className="mr-2 h-4 w-4" />
                  Dark
                  {theme === "dark" && <span className="ml-auto">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                  <Monitor className="mr-2 h-4 w-4" />
                  System
                  {theme === "system" && <span className="ml-auto">✓</span>}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4 text-destructive" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
    </header>
  );
}
