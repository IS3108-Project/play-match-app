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
import { ChevronDown, Monitor, Moon, Sun } from "lucide-react";
import logo from "@/assets/logo.svg";
import { useTheme } from "@/hooks/useTheme";
import { useRole } from "@/hooks/useRole";
import { authClient } from "@/lib/client-auth";

const navLinks = [
  { name: "Explore", href: "/" },
  { name: "My Activities", href: "/my-activities" },
  { name: "Community", href: "/community" },
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
    ? [...navLinks, { name: "Users", href: "/admin" }]
    : navLinks;

  return (
    <header className="fixed inset-x-0 top-3 z-50 px-3">
      <nav className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between rounded-2xl border bg-background/90 px-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/70 sm:px-4">
        {/* Left: logo (optional on mobile) */}
        <Link to="/" className="hidden md:flex items-center">
          <img src={logo} alt="PlayMatch" className="h-6 w-auto" />
        </Link>

        {/* Nav Links */}
        <ul className="flex items-center gap-8 justify-between">
          {allNavLinks.map((link) => {
            const isActive = location.pathname === link.href;
            return (
              <li key={link.href}>
                <Link
                  to={link.href}
                  className={`relative py-4 text-sm font-medium transition-colors hover:text-primary ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {link.name}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 outline-none">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? "User"} />
              <AvatarFallback className="bg-primary text-white">
                {user?.name?.charAt(0).toUpperCase() ?? "U"}
              </AvatarFallback>
            </Avatar>
            <span className="hidden text-sm font-medium sm:inline">{user?.name ?? "User"}</span>
            <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:block" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to="/profile">Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings">Settings</Link>
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
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
    </header>
  );
}
