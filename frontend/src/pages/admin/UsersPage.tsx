import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  Flag,
  CalendarDays,
  MessageSquare,
  Search,
  Ban,
  ShieldCheck,
  EllipsisVertical,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import {
  adminApi,
  type AdminUser,
  type AdminReport,
  type AdminActivity,
  type AdminDiscussion,
  type AdminDashboardStats,
  type AdminUserDetail,
} from "@/lib/api";

// ── Main Page ──────────────────────────────────────────────────────────

export default function UsersPage() {
  const [stats, setStats] = React.useState<AdminDashboardStats | null>(null);

  React.useEffect(() => {
    adminApi.getStats().then(setStats).catch(console.error);
  }, []);

  return (
    <div className="container mx-auto max-w-5xl px-4 pt-24 pb-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage users, review reports, and moderate content
        </p>
      </div>

      {/* Stats Cards */}
      {stats && <StatsBar stats={stats} />}

      {/* Tabs */}
      <Tabs defaultValue="reports" className="mt-6">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="reports" className="gap-1.5 text-xs sm:text-sm">
            <Flag className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Reports</span>
            {stats && stats.pendingReports > 0 && (
              <span className="ml-1 rounded-full bg-destructive px-1.5 py-0.5 text-[10px] text-destructive-foreground">
                {stats.pendingReports}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5 text-xs sm:text-sm">
            <Users className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="activities" className="gap-1.5 text-xs sm:text-sm">
            <CalendarDays className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Activities</span>
          </TabsTrigger>
          <TabsTrigger value="discussions" className="gap-1.5 text-xs sm:text-sm">
            <MessageSquare className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Posts</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reports">
          <ReportsTab onStatsChange={() => adminApi.getStats().then(setStats)} />
        </TabsContent>
        <TabsContent value="users">
          <UsersTab />
        </TabsContent>
        <TabsContent value="activities">
          <ActivitiesTab />
        </TabsContent>
        <TabsContent value="discussions">
          <DiscussionsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Stats Bar ──────────────────────────────────────────────────────────

function StatsBar({ stats }: { stats: AdminDashboardStats }) {
  const items = [
    { label: "Users", value: stats.totalUsers, icon: Users },
    { label: "Banned", value: stats.bannedUsers, icon: Ban, destructive: stats.bannedUsers > 0 },
    { label: "Pending Reports", value: stats.pendingReports, icon: Flag, destructive: stats.pendingReports > 0 },
    { label: "Activities", value: stats.totalActivities, icon: CalendarDays },
    { label: "Posts", value: stats.totalDiscussions, icon: MessageSquare },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg border p-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <item.icon className="h-4 w-4" />
            <span className="text-xs">{item.label}</span>
          </div>
          <p className={`mt-1 text-xl font-bold ${item.destructive ? "text-destructive" : ""}`}>
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

// ── Reports Tab ────────────────────────────────────────────────────────

function ReportsTab({ onStatsChange }: { onStatsChange: () => void }) {
  const [reports, setReports] = React.useState<AdminReport[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<string>("PENDING");
  const [resolving, setResolving] = React.useState<string | null>(null);
  const [noteDrawer, setNoteDrawer] = React.useState<{ reportId: string; action: "REVIEWED" | "DISMISSED" } | null>(null);
  const [adminNote, setAdminNote] = React.useState("");

  const fetchReports = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.listReports(filter || undefined);
      setReports(data);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  React.useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleResolve = async (reportId: string, status: "REVIEWED" | "DISMISSED", note?: string) => {
    setResolving(reportId);
    try {
      await adminApi.resolveReport(reportId, status, note);
      toast.success(`Report ${status.toLowerCase()}`);
      fetchReports();
      onStatsChange();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setResolving(null);
    }
  };

  const reportTypeLabel: Record<string, string> = {
    NO_SHOW: "No Show",
    RUDE_UNSAFE: "Rude / Unsafe",
    MISREPRESENTED: "Misrepresented",
    SPAM: "Spam",
    OTHER: "Other",
  };

  return (
    <div className="mt-4 space-y-4">
      {/* Filter */}
      <div className="flex gap-2">
        {["PENDING", "REVIEWED", "DISMISSED", ""].map((s) => (
          <Button
            key={s}
            variant={filter === s ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(s)}
          >
            {s || "All"}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="py-12 grid place-items-center">
          <Spinner className="size-8 text-primary" />
        </div>
      ) : reports.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <Flag className="mx-auto h-8 w-8 mb-2 opacity-40" />
          <p>No reports found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <div key={report.id} className="rounded-lg border p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={report.reportedUser.image ?? undefined} />
                    <AvatarFallback className="bg-destructive/10 text-destructive text-xs">
                      {report.reportedUser.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">
                      Report against <span className="text-destructive">{report.reportedUser.name}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      by {report.anonymous ? "Anonymous" : report.reporter.name} &middot;{" "}
                      {new Date(report.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    report.status === "PENDING"
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                      : report.status === "REVIEWED"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {report.status}
                </span>
              </div>

              <div className="rounded bg-muted/50 p-3 text-sm">
                <span className="font-medium text-xs text-muted-foreground">
                  {reportTypeLabel[report.type] || report.type}
                  {report.activity && ` — ${report.activity.title}`}
                </span>
                <p className="mt-1">{report.details}</p>
              </div>

              {report.adminNote && (
                <div className="rounded bg-primary/5 p-3 text-sm">
                  <span className="font-medium text-xs text-primary">Admin Note</span>
                  <p className="mt-1">{report.adminNote}</p>
                </div>
              )}

              {report.status === "PENDING" && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-green-600"
                    disabled={resolving === report.id}
                    onClick={() => {
                      setNoteDrawer({ reportId: report.id, action: "REVIEWED" });
                      setAdminNote("");
                    }}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    Review
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={resolving === report.id}
                    onClick={() => {
                      setNoteDrawer({ reportId: report.id, action: "DISMISSED" });
                      setAdminNote("");
                    }}
                  >
                    <XCircle className="h-3.5 w-3.5 mr-1" />
                    Dismiss
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Admin Note Drawer */}
      <Drawer open={!!noteDrawer} onOpenChange={(open) => !open && setNoteDrawer(null)}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="text-center">
              {noteDrawer?.action === "REVIEWED" ? "Review Report" : "Dismiss Report"}
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 py-2">
            <label className="text-sm font-medium">Admin Note (optional)</label>
            <textarea
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Add a note about this decision..."
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
            />
          </div>
          <DrawerFooter>
            <Button
              onClick={() => {
                if (noteDrawer) {
                  handleResolve(noteDrawer.reportId, noteDrawer.action, adminNote || undefined);
                  setNoteDrawer(null);
                }
              }}
              className="w-full"
            >
              Confirm {noteDrawer?.action === "REVIEWED" ? "Review" : "Dismiss"}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

// ── Users Tab ──────────────────────────────────────────────────────────

function UsersTab() {
  const [users, setUsers] = React.useState<AdminUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [detailDrawer, setDetailDrawer] = React.useState<string | null>(null);
  const [userDetail, setUserDetail] = React.useState<AdminUserDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = React.useState(false);

  const fetchUsers = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.listUsers(search ? { search } : undefined);
      setUsers(data);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [search]);

  React.useEffect(() => {
    const timer = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  const openDetail = async (userId: string) => {
    setDetailDrawer(userId);
    setLoadingDetail(true);
    try {
      const data = await adminApi.getUserDetail(userId);
      setUserDetail(data);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleBan = async (userId: string) => {
    try {
      await adminApi.banUser(userId);
      toast.success("User banned");
      fetchUsers();
      if (detailDrawer === userId) {
        const updated = await adminApi.getUserDetail(userId);
        setUserDetail(updated);
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleUnban = async (userId: string) => {
    try {
      await adminApi.unbanUser(userId);
      toast.success("User unbanned");
      fetchUsers();
      if (detailDrawer === userId) {
        const updated = await adminApi.getUserDetail(userId);
        setUserDetail(updated);
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="mt-4 space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search users by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="py-12 grid place-items-center">
          <Spinner className="size-8 text-primary" />
        </div>
      ) : users.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <Users className="mx-auto h-8 w-8 mb-2 opacity-40" />
          <p>No users found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/30 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarImage src={user.image ?? undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{user.name}</p>
                    {user.role === "ADMIN" && (
                      <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                        ADMIN
                      </span>
                    )}
                    {user.banned && (
                      <span className="rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium text-destructive">
                        BANNED
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {user._count.reportsReceived > 0 && (
                  <span className="text-xs text-destructive flex items-center gap-1">
                    <Flag className="h-3 w-3" />
                    {user._count.reportsReceived}
                  </span>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <EllipsisVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openDetail(user.id)}>
                      <Eye className="h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    {user.role !== "ADMIN" && (
                      user.banned ? (
                        <DropdownMenuItem onClick={() => handleUnban(user.id)}>
                          <ShieldCheck className="h-4 w-4" />
                          Unban User
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() => handleBan(user.id)}
                          className="text-destructive"
                        >
                          <Ban className="h-4 w-4 text-destructive" />
                          Ban User
                        </DropdownMenuItem>
                      )
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* User Detail Drawer */}
      <Drawer open={!!detailDrawer} onOpenChange={(open) => !open && setDetailDrawer(null)}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="border-b">
            <DrawerTitle className="text-center">User Details</DrawerTitle>
          </DrawerHeader>
          {loadingDetail || !userDetail ? (
            <div className="py-12 grid place-items-center">
              <Spinner className="size-8 text-primary" />
            </div>
          ) : (
            <div className="overflow-y-auto px-4 py-4 space-y-4">
              {/* Profile Header */}
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={userDetail.image ?? undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                    {userDetail.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{userDetail.name}</h3>
                    {userDetail.banned && (
                      <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">
                        BANNED
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{userDetail.email}</p>
                  {userDetail.bio && <p className="text-sm mt-1">{userDetail.bio}</p>}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Hosted", value: userDetail._count.hostedActivities },
                  { label: "Joined", value: userDetail._count.participations },
                  { label: "Posts", value: userDetail._count.authoredDiscussions },
                  { label: "Comments", value: userDetail._count.authoredComments },
                  { label: "Reports Filed", value: userDetail._count.reportsFiled },
                  { label: "Reports Against", value: userDetail._count.reportsReceived, destructive: true },
                ].map((s) => (
                  <div key={s.label} className="rounded-md border p-2 text-center">
                    <p className={`text-lg font-bold ${s.destructive && s.value > 0 ? "text-destructive" : ""}`}>
                      {s.value}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Sports & Skill */}
              {userDetail.sportInterests.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Sports</p>
                  <div className="flex flex-wrap gap-1">
                    {userDetail.sportInterests.map((s) => (
                      <span key={s} className="rounded-full bg-muted px-2 py-0.5 text-xs">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Reports Against This User */}
              {userDetail.reportsAgainst.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Reports Received</p>
                  <div className="space-y-2">
                    {userDetail.reportsAgainst.map((r) => (
                      <div key={r.id} className="rounded border p-2 text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="font-medium">{r.type.replace("_", " ")}</span>
                          <span
                            className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                              r.status === "PENDING"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                                : r.status === "REVIEWED"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                  : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {r.status}
                          </span>
                        </div>
                        <p className="text-muted-foreground">{r.details}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Joined Date */}
              <p className="text-xs text-muted-foreground">
                Joined {new Date(userDetail.createdAt).toLocaleDateString()}
                {userDetail.bannedAt && (
                  <> &middot; Banned {new Date(userDetail.bannedAt).toLocaleDateString()}</>
                )}
              </p>
            </div>
          )}
          <DrawerFooter className="border-t">
            {userDetail && userDetail.role !== "ADMIN" && (
              userDetail.banned ? (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    handleUnban(userDetail.id);
                  }}
                >
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Unban User
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => {
                    handleBan(userDetail.id);
                  }}
                >
                  <Ban className="h-4 w-4 mr-2" />
                  Ban User
                </Button>
              )
            )}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

// ── Activities Tab ─────────────────────────────────────────────────────

function ActivitiesTab() {
  const [activities, setActivities] = React.useState<AdminActivity[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");

  const fetchActivities = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.listActivities(search || undefined);
      setActivities(data);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [search]);

  React.useEffect(() => {
    const timer = setTimeout(fetchActivities, 300);
    return () => clearTimeout(timer);
  }, [fetchActivities]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this activity? This cannot be undone.")) return;
    try {
      await adminApi.deleteActivity(id);
      toast.success("Activity deleted");
      fetchActivities();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="mt-4 space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search activities..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="py-12 grid place-items-center">
          <Spinner className="size-8 text-primary" />
        </div>
      ) : activities.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <CalendarDays className="mx-auto h-8 w-8 mb-2 opacity-40" />
          <p>No activities found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{activity.title}</p>
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                      activity.status === "ACTIVE"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : activity.status === "CANCELLED"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {activity.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {activity.activityType} &middot; Host: {activity.host.name} &middot;{" "}
                  {new Date(activity.date).toLocaleDateString()} &middot;{" "}
                  {activity._count.participants} participants
                  {activity._count.reports > 0 && (
                    <span className="text-destructive ml-1">
                      &middot; {activity._count.reports} report(s)
                    </span>
                  )}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive shrink-0"
                onClick={() => handleDelete(activity.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Discussions Tab ────────────────────────────────────────────────────

function DiscussionsTab() {
  const [discussions, setDiscussions] = React.useState<AdminDiscussion[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");

  const fetchDiscussions = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.listDiscussions(search || undefined);
      setDiscussions(data);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [search]);

  React.useEffect(() => {
    const timer = setTimeout(fetchDiscussions, 300);
    return () => clearTimeout(timer);
  }, [fetchDiscussions]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this discussion? This cannot be undone.")) return;
    try {
      await adminApi.deleteDiscussion(id);
      toast.success("Discussion deleted");
      fetchDiscussions();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="mt-4 space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search discussions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="py-12 grid place-items-center">
          <Spinner className="size-8 text-primary" />
        </div>
      ) : discussions.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <MessageSquare className="mx-auto h-8 w-8 mb-2 opacity-40" />
          <p>No discussions found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {discussions.map((disc) => (
            <div
              key={disc.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{disc.title}</p>
                <p className="text-xs text-muted-foreground truncate">
                  by {disc.author.name}
                  {disc.group && <> in {disc.group.name}</>}
                  {" "}&middot; {disc._count.likes} likes &middot; {disc._count.comments} comments
                  {" "}&middot; {new Date(disc.createdAt).toLocaleDateString()}
                </p>
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                  {disc.content}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive shrink-0"
                onClick={() => handleDelete(disc.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
