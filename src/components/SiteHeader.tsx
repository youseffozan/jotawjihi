import { Link, useNavigate } from "@tanstack/react-router";
import { Moon, Sun, Menu, X, LogOut, User as UserIcon, Crown, Settings } from "lucide-react";
import { useState } from "react";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Logo } from "@/components/Logo";
import { SubjectSearch } from "@/components/SubjectSearch";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { formatDisplayName } from "@/lib/display-name";

export function SiteHeader() {
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const { user, isAdmin, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const displayName = formatDisplayName({
    first_name: profile?.first_name,
    last_name: profile?.last_name,
    full_name: profile?.full_name,
    email: user?.email,
  });

  const links = [
    { to: "/", label: "الرئيسية" },
    { to: "/leaderboard", label: "لوحة الصدارة" },
    { to: "/pricing", label: "الاشتراكات" },
    ...(isAdmin ? [{ to: "/admin", label: "لوحة الإدارة" }] : []),
  ] as const;

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <AnnouncementBanner />
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link key={l.to} to={l.to}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              activeProps={{ className: "rounded-lg px-3 py-2 text-sm font-medium bg-muted text-foreground" }}
              activeOptions={{ exact: l.to === "/" }}>
              {l.label}
            </Link>
          ))}
          {user && (
            <Link to="/profile/$userId" params={{ userId: user.id }}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              activeProps={{ className: "rounded-lg px-3 py-2 text-sm font-medium bg-muted text-foreground" }}>
              بروفايلي
            </Link>
          )}
        </nav>

        <div className="hidden flex-1 justify-center px-4 md:flex lg:px-8">
          <SubjectSearch />
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  {isAdmin ? <Crown className="h-4 w-4 text-amber-500" /> : <UserIcon className="h-4 w-4" />}
                  <span className="hidden max-w-[140px] truncate sm:inline">{displayName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem disabled className="text-xs opacity-100">
                  {user.email}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile/$userId" params={{ userId: user.id }}>
                    <UserIcon className="ml-2 h-4 w-4" /> بروفايلي العام
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/account"><Settings className="ml-2 h-4 w-4" /> إعدادات الحساب</Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin"><Crown className="ml-2 h-4 w-4" /> لوحة الإدارة</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="ml-2 h-4 w-4" /> تسجيل الخروج
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/auth">تسجيل الدخول</Link>
              </Button>
              <Button asChild size="sm" className="hidden sm:inline-flex">
                <Link to="/auth" search={{ mode: "signup" as const }}>إنشاء حساب</Link>
              </Button>
            </>
          )}

          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(!open)}>
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border/40 bg-background md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
            <div className="mb-2">
              <SubjectSearch compact onNavigate={() => setOpen(false)} />
            </div>
            {links.map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted">
                {l.label}
              </Link>
            ))}
            {user && (
              <Link to="/profile/$userId" params={{ userId: user.id }} onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted">
                بروفايلي
              </Link>
            )}
            {!user && (
              <div className="mt-2 flex gap-2">
                <Button asChild variant="outline" className="flex-1"><Link to="/auth">دخول</Link></Button>
                <Button asChild className="flex-1"><Link to="/auth" search={{ mode: "signup" as const }}>حساب جديد</Link></Button>
              </div>
            )}
            {user && (
              <>
                <Link to="/account" onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted">
                  إعدادات الحساب
                </Link>
                <Button onClick={handleSignOut} variant="outline" className="mt-2">
                  <LogOut className="ml-2 h-4 w-4" /> تسجيل الخروج
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
