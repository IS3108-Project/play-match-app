import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { resolveProfileImage } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { Checkbox } from "@/components/ui/checkbox";
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
  DropdownMenuSeparator,
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
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  History,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import ConfirmDrawer from "@/components/ui/ConfirmDrawer";
import {
  adminApi,
  type AdminUser,
  type AdminReport,
  type AdminActivity,
  type AdminDiscussion,
  type AdminDashboardStats,
  type AdminUserDetail,
  type AdminAuditLog,
} from "@/lib/api";

// ── Main Page ──────────────────────────────────────────────────────────

export default function UsersPage() {
  const [stats, setStats] = React.useState<AdminDashboardStats | null>(null);

  React.useEffect(() => {
    adminApi.getStats().then(setStats).catch(console.error);
  }, []);

  const handleExport = (type: "users" | "activities" | "reports" | "audit-logs") => {
    const urls: Record<string, string> = {
      users: adminApi.exportUsers(),
      activities: adminApi.exportActivities(),
      reports: adminApi.exportReports(),
      "audit-logs": adminApi.exportAuditLogs(),
    };
    // Open in new tab to download
    window.open(urls[type], "_blank");
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 pt-24 pb-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage users, review reports, and moderate content
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleExport("users")}>
              Export Users (CSV)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("activities")}>
              Export Activities (CSV)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("reports")}>
              Export Reports (CSV)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleExport("audit-logs")}>
              Export Audit Logs (CSV)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Stats Cards */}
      {stats && <StatsBar stats={stats} />}

      {/* Tabs */}
      <Tabs defaultValue="reports" className="mt-6">
        <TabsList className="w-full grid grid-cols-5">
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
          <TabsTrigger value="audit" className="gap-1.5 text-xs sm:text-sm">
            <History className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Audit</span>
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
        <TabsContent value="audit">
          <AuditLogsTab />
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

// ── Pagination Component ───────────────────────────────────────────────

function Pagination({
  page,
  totalPages,
  total,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  
  return (
    <div className="flex items-center justify-between pt-4 border-t">
      <p className="text-xs text-muted-foreground">
        Page {page} of {totalPages} ({total} items)
      </p>
      <div className="flex gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ── Sort Button ────────────────────────────────────────────────────────

function SortDropdown({
  options,
  value,
  order,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  order: "asc" | "desc";
  onChange: (sortBy: string, sortOrder: "asc" | "desc") => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <ArrowUpDown className="h-3.5 w-3.5" />
          Sort
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {options.map((opt) => (
          <DropdownMenuItem
            key={opt.value}
            onClick={() => onChange(opt.value, value === opt.value && order === "desc" ? "asc" : "desc")}
          >
            {opt.label}
            {value === opt.value && (
              <span className="ml-2 text-xs text-muted-foreground">
                ({order === "asc" ? "↑" : "↓"})
              </span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ── Reports Tab ────────────────────────────────────────────────────────

function ReportsTab({ onStatsChange }: { onStatsChange: () => void }) {
  const [reports, setReports] = React.useState<AdminReport[]>([]);
  const [pagination, setPagination] = React.useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<string>("PENDING");
  const [sortBy, setSortBy] = React.useState("createdAt");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [resolving, setResolving] = React.useState<string | null>(null);
  const [noteDrawer, setNoteDrawer] = React.useState<{ reportId: string; action: "REVIEWED" | "DISMISSED" } | null>(null);
  const [bulkDrawer, setBulkDrawer] = React.useState<{ action: "REVIEWED" | "DISMISSED" } | null>(null);
  const [adminNote, setAdminNote] = React.useState("");

  const fetchReports = React.useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const result = await adminApi.listReports({
        page,
        status: filter || undefined,
        sortBy,
        sortOrder,
      });
      setReports(result.items);
      setPagination({ page: result.pagination.page, totalPages: result.pagination.totalPages, total: result.pagination.total });
      setSelected(new Set());
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [filter, sortBy, sortOrder]);

  React.useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleResolve = async (reportId: string, status: "REVIEWED" | "DISMISSED", note?: string) => {
    setResolving(reportId);
    try {
      await adminApi.resolveReport(reportId, status, note);
      toast.success(`Report ${status.toLowerCase()}`);
      fetchReports(pagination.page);
      onStatsChange();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setResolving(null);
    }
  };

  const handleBulkResolve = async (status: "REVIEWED" | "DISMISSED", note?: string) => {
    try {
      const result = await adminApi.bulkResolveReports(Array.from(selected), status, note);
      toast.success(`${result.count} report(s) ${status.toLowerCase()}`);
      fetchReports(pagination.page);
      onStatsChange();
      setBulkDrawer(null);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const toggleSelectAll = () => {
    if (selected.size === reports.filter(r => r.status === "PENDING").length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(reports.filter(r => r.status === "PENDING").map(r => r.id)));
    }
  };

  const reportTypeLabel: Record<string, string> = {
    NO_SHOW: "No Show",
    RUDE_UNSAFE: "Rude / Unsafe",
    MISREPRESENTED: "Misrepresented",
    SPAM: "Spam",
    OTHER: "Other",
  };

  const pendingReports = reports.filter(r => r.status === "PENDING");

  return (
    <div className="mt-4 space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Status Filter */}
        <div className="flex gap-1">
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
        
        <div className="flex-1" />
        
        <SortDropdown
          options={[
            { value: "createdAt", label: "Date Created" },
            { value: "status", label: "Status" },
          ]}
          value={sortBy}
          order={sortOrder}
          onChange={(by, order) => { setSortBy(by); setSortOrder(order); }}
        />
      </div>

      {/* Bulk Actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <Button size="sm" variant="outline" onClick={() => setBulkDrawer({ action: "REVIEWED" })}>
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
            Review All
          </Button>
          <Button size="sm" variant="outline" onClick={() => setBulkDrawer({ action: "DISMISSED" })}>
            <XCircle className="h-3.5 w-3.5 mr-1" />
            Dismiss All
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
            Clear
          </Button>
        </div>
      )}

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
        <>
          {/* Select All */}
          {filter === "PENDING" && pendingReports.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={selected.size === pendingReports.length && pendingReports.length > 0}
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-muted-foreground">Select all pending</span>
            </div>
          )}
          
          <div className="space-y-3">
            {reports.map((report) => (
              <div key={report.id} className="rounded-lg border p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {report.status === "PENDING" && (
                      <Checkbox
                        checked={selected.has(report.id)}
                        onCheckedChange={() => toggleSelect(report.id)}
                      />
                    )}
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={resolveProfileImage(report.reportedUser.image)} />
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

          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            onPageChange={fetchReports}
          />
        </>
      )}

      {/* Single Report Note Drawer */}
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

      {/* Bulk Resolve Drawer */}
      <Drawer open={!!bulkDrawer} onOpenChange={(open) => !open && setBulkDrawer(null)}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="text-center">
              {bulkDrawer?.action === "REVIEWED" ? "Review" : "Dismiss"} {selected.size} Reports
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 py-2">
            <label className="text-sm font-medium">Admin Note (optional)</label>
            <textarea
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Add a note for all selected reports..."
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
            />
          </div>
          <DrawerFooter>
            <Button
              onClick={() => bulkDrawer && handleBulkResolve(bulkDrawer.action, adminNote || undefined)}
              className="w-full"
            >
              Confirm {bulkDrawer?.action === "REVIEWED" ? "Review" : "Dismiss"} All
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
  const [pagination, setPagination] = React.useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [sortBy, setSortBy] = React.useState("createdAt");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");
  const [filterBanned, setFilterBanned] = React.useState<boolean | undefined>(undefined);
  const [filterHasReports, setFilterHasReports] = React.useState(false);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [detailDrawer, setDetailDrawer] = React.useState<string | null>(null);
  const [userDetail, setUserDetail] = React.useState<AdminUserDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = React.useState(false);
  const [banConfirm, setBanConfirm] = React.useState<{ userId: string; name: string } | null>(null);
  const [bulkBanConfirm, setBulkBanConfirm] = React.useState(false);

  const fetchUsers = React.useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const result = await adminApi.listUsers({
        page,
        search: search || undefined,
        sortBy,
        sortOrder,
        banned: filterBanned,
        hasReports: filterHasReports || undefined,
      });
      setUsers(result.items);
      setPagination({ page: result.pagination.page, totalPages: result.pagination.totalPages, total: result.pagination.total });
      setSelected(new Set());
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, sortBy, sortOrder, filterBanned, filterHasReports]);

  React.useEffect(() => {
    const timer = setTimeout(() => fetchUsers(), 300);
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
      fetchUsers(pagination.page);
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
      fetchUsers(pagination.page);
      if (detailDrawer === userId) {
        const updated = await adminApi.getUserDetail(userId);
        setUserDetail(updated);
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleBulkBan = async () => {
    try {
      const result = await adminApi.bulkBanUsers(Array.from(selected));
      toast.success(`${result.count} user(s) banned${result.skipped > 0 ? `, ${result.skipped} skipped (admins)` : ""}`);
      fetchUsers(pagination.page);
      setBulkBanConfirm(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleBulkUnban = async () => {
    try {
      const result = await adminApi.bulkUnbanUsers(Array.from(selected));
      toast.success(`${result.count} user(s) unbanned`);
      fetchUsers(pagination.page);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const toggleSelectAll = () => {
    const nonAdmins = users.filter(u => u.role !== "ADMIN");
    if (selected.size === nonAdmins.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(nonAdmins.map(u => u.id)));
    }
  };

  const nonAdminUsers = users.filter(u => u.role !== "ADMIN");

  return (
    <div className="mt-4 space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filters */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Filter className="h-3.5 w-3.5" />
              Filter
              {(filterBanned !== undefined || filterHasReports) && (
                <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">
                  {(filterBanned !== undefined ? 1 : 0) + (filterHasReports ? 1 : 0)}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => setFilterBanned(filterBanned === true ? undefined : true)}>
              <Checkbox checked={filterBanned === true} className="mr-2" />
              Show only banned
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterBanned(filterBanned === false ? undefined : false)}>
              <Checkbox checked={filterBanned === false} className="mr-2" />
              Show only active
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setFilterHasReports(!filterHasReports)}>
              <Checkbox checked={filterHasReports} className="mr-2" />
              Has reports
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { setFilterBanned(undefined); setFilterHasReports(false); }}>
              Clear filters
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <SortDropdown
          options={[
            { value: "createdAt", label: "Date Joined" },
            { value: "name", label: "Name" },
            { value: "reportsCount", label: "Reports" },
            { value: "activitiesCount", label: "Activities" },
          ]}
          value={sortBy}
          order={sortOrder}
          onChange={(by, order) => { setSortBy(by); setSortOrder(order); }}
        />
      </div>

      {/* Bulk Actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <Button size="sm" variant="outline" className="text-destructive" onClick={() => setBulkBanConfirm(true)}>
            <Ban className="h-3.5 w-3.5 mr-1" />
            Ban All
          </Button>
          <Button size="sm" variant="outline" onClick={handleBulkUnban}>
            <ShieldCheck className="h-3.5 w-3.5 mr-1" />
            Unban All
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
            Clear
          </Button>
        </div>
      )}

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
        <>
          {/* Select All */}
          {nonAdminUsers.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={selected.size === nonAdminUsers.length && nonAdminUsers.length > 0}
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-muted-foreground">Select all ({nonAdminUsers.length})</span>
            </div>
          )}
          
          <div className="space-y-2">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/30 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {user.role !== "ADMIN" && (
                    <Checkbox
                      checked={selected.has(user.id)}
                      onCheckedChange={() => toggleSelect(user.id)}
                    />
                  )}
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarImage src={resolveProfileImage(user.image)} />
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
                            onClick={() => setBanConfirm({ userId: user.id, name: user.name })}
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

          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            onPageChange={fetchUsers}
          />
        </>
      )}

      {/* Single Ban Confirm */}
      <ConfirmDrawer
        open={!!banConfirm}
        onOpenChange={(open) => !open && setBanConfirm(null)}
        title="Ban User"
        description={<>Are you sure you want to ban <span className="font-semibold">{banConfirm?.name}</span>? They will not be able to access the platform.</>}
        confirmText="Ban User"
        variant="warning"
        onConfirm={async () => {
          if (banConfirm) await handleBan(banConfirm.userId);
        }}
      />

      {/* Bulk Ban Confirm */}
      <ConfirmDrawer
        open={bulkBanConfirm}
        onOpenChange={setBulkBanConfirm}
        title={`Ban ${selected.size} Users`}
        description={<>Are you sure you want to ban {selected.size} user(s)? They will not be able to access the platform.</>}
        confirmText={`Ban ${selected.size} Users`}
        variant="warning"
        onConfirm={handleBulkBan}
      />

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
                  <AvatarImage src={resolveProfileImage(userDetail.image)} />
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
                  onClick={() => handleUnban(userDetail.id)}
                >
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Unban User
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => setBanConfirm({ userId: userDetail.id, name: userDetail.name })}
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
  const [pagination, setPagination] = React.useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [sortBy, setSortBy] = React.useState("createdAt");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = React.useState<{ id: string; title: string } | null>(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = React.useState(false);

  const fetchActivities = React.useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const result = await adminApi.listActivities({
        page,
        search: search || undefined,
        sortBy,
        sortOrder,
      });
      setActivities(result.items);
      setPagination({ page: result.pagination.page, totalPages: result.pagination.totalPages, total: result.pagination.total });
      setSelected(new Set());
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, sortBy, sortOrder]);

  React.useEffect(() => {
    const timer = setTimeout(() => fetchActivities(), 300);
    return () => clearTimeout(timer);
  }, [fetchActivities]);

  const handleDelete = async (id: string) => {
    try {
      await adminApi.deleteActivity(id);
      toast.success("Activity deleted");
      fetchActivities(pagination.page);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleBulkDelete = async () => {
    try {
      const result = await adminApi.bulkDeleteActivities(Array.from(selected));
      toast.success(`${result.count} activity(s) deleted`);
      fetchActivities(pagination.page);
      setBulkDeleteConfirm(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const toggleSelectAll = () => {
    if (selected.size === activities.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(activities.map(a => a.id)));
    }
  };

  return (
    <div className="mt-4 space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search activities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <SortDropdown
          options={[
            { value: "createdAt", label: "Date Created" },
            { value: "date", label: "Activity Date" },
            { value: "participantsCount", label: "Participants" },
            { value: "reportsCount", label: "Reports" },
          ]}
          value={sortBy}
          order={sortOrder}
          onChange={(by, order) => { setSortBy(by); setSortOrder(order); }}
        />
      </div>

      {/* Bulk Actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <Button size="sm" variant="outline" className="text-destructive" onClick={() => setBulkDeleteConfirm(true)}>
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Delete All
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
            Clear
          </Button>
        </div>
      )}

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
        <>
          {/* Select All */}
          <div className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={selected.size === activities.length && activities.length > 0}
              onCheckedChange={toggleSelectAll}
            />
            <span className="text-muted-foreground">Select all ({activities.length})</span>
          </div>

          <div className="space-y-2">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Checkbox
                    checked={selected.has(activity.id)}
                    onCheckedChange={() => toggleSelect(activity.id)}
                  />
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
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive shrink-0"
                  onClick={() => setDeleteConfirm({ id: activity.id, title: activity.title })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            onPageChange={fetchActivities}
          />
        </>
      )}

      {/* Delete Confirm */}
      <ConfirmDrawer
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
        title="Delete Activity"
        description={<>Are you sure you want to delete <span className="font-semibold">"{deleteConfirm?.title}"</span>? This action cannot be undone.</>}
        confirmText="Delete Activity"
        variant="destructive"
        onConfirm={async () => {
          if (deleteConfirm) await handleDelete(deleteConfirm.id);
        }}
      />

      {/* Bulk Delete Confirm */}
      <ConfirmDrawer
        open={bulkDeleteConfirm}
        onOpenChange={setBulkDeleteConfirm}
        title={`Delete ${selected.size} Activities`}
        description={<>Are you sure you want to delete {selected.size} activity(s)? This action cannot be undone.</>}
        confirmText={`Delete ${selected.size} Activities`}
        variant="destructive"
        onConfirm={handleBulkDelete}
      />
    </div>
  );
}

// ── Discussions Tab ────────────────────────────────────────────────────

function DiscussionsTab() {
  const [discussions, setDiscussions] = React.useState<AdminDiscussion[]>([]);
  const [pagination, setPagination] = React.useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [sortBy, setSortBy] = React.useState("createdAt");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = React.useState<{ id: string; title: string } | null>(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = React.useState(false);

  const fetchDiscussions = React.useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const result = await adminApi.listDiscussions({
        page,
        search: search || undefined,
        sortBy,
        sortOrder,
      });
      setDiscussions(result.items);
      setPagination({ page: result.pagination.page, totalPages: result.pagination.totalPages, total: result.pagination.total });
      setSelected(new Set());
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, sortBy, sortOrder]);

  React.useEffect(() => {
    const timer = setTimeout(() => fetchDiscussions(), 300);
    return () => clearTimeout(timer);
  }, [fetchDiscussions]);

  const handleDelete = async (id: string) => {
    try {
      await adminApi.deleteDiscussion(id);
      toast.success("Discussion deleted");
      fetchDiscussions(pagination.page);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleBulkDelete = async () => {
    try {
      const result = await adminApi.bulkDeleteDiscussions(Array.from(selected));
      toast.success(`${result.count} discussion(s) deleted`);
      fetchDiscussions(pagination.page);
      setBulkDeleteConfirm(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const toggleSelectAll = () => {
    if (selected.size === discussions.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(discussions.map(d => d.id)));
    }
  };

  return (
    <div className="mt-4 space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search discussions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <SortDropdown
          options={[
            { value: "createdAt", label: "Date Created" },
            { value: "likesCount", label: "Likes" },
            { value: "commentsCount", label: "Comments" },
          ]}
          value={sortBy}
          order={sortOrder}
          onChange={(by, order) => { setSortBy(by); setSortOrder(order); }}
        />
      </div>

      {/* Bulk Actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <Button size="sm" variant="outline" className="text-destructive" onClick={() => setBulkDeleteConfirm(true)}>
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Delete All
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
            Clear
          </Button>
        </div>
      )}

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
        <>
          {/* Select All */}
          <div className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={selected.size === discussions.length && discussions.length > 0}
              onCheckedChange={toggleSelectAll}
            />
            <span className="text-muted-foreground">Select all ({discussions.length})</span>
          </div>

          <div className="space-y-2">
            {discussions.map((disc) => (
              <div
                key={disc.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Checkbox
                    checked={selected.has(disc.id)}
                    onCheckedChange={() => toggleSelect(disc.id)}
                  />
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
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive shrink-0"
                  onClick={() => setDeleteConfirm({ id: disc.id, title: disc.title })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            onPageChange={fetchDiscussions}
          />
        </>
      )}

      {/* Delete Confirm */}
      <ConfirmDrawer
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
        title="Delete Discussion"
        description={<>Are you sure you want to delete <span className="font-semibold">"{deleteConfirm?.title}"</span>? This action cannot be undone.</>}
        confirmText="Delete Discussion"
        variant="destructive"
        onConfirm={async () => {
          if (deleteConfirm) await handleDelete(deleteConfirm.id);
        }}
      />

      {/* Bulk Delete Confirm */}
      <ConfirmDrawer
        open={bulkDeleteConfirm}
        onOpenChange={setBulkDeleteConfirm}
        title={`Delete ${selected.size} Discussions`}
        description={<>Are you sure you want to delete {selected.size} discussion(s)? This action cannot be undone.</>}
        confirmText={`Delete ${selected.size} Discussions`}
        variant="destructive"
        onConfirm={handleBulkDelete}
      />
    </div>
  );
}

// ── Audit Logs Tab ─────────────────────────────────────────────────────

function AuditLogsTab() {
  const [logs, setLogs] = React.useState<AdminAuditLog[]>([]);
  const [pagination, setPagination] = React.useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = React.useState(true);

  const fetchLogs = React.useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const result = await adminApi.listAuditLogs({ page, limit: 50 });
      setLogs(result.items);
      setPagination({ page: result.pagination.page, totalPages: result.pagination.totalPages, total: result.pagination.total });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const actionLabels: Record<string, { label: string; color: string }> = {
    BAN_USER: { label: "Banned User", color: "text-amber-600" },
    UNBAN_USER: { label: "Unbanned User", color: "text-green-600" },
    DELETE_ACTIVITY: { label: "Deleted Activity", color: "text-destructive" },
    DELETE_DISCUSSION: { label: "Deleted Discussion", color: "text-destructive" },
    RESOLVE_REPORT: { label: "Resolved Report", color: "text-primary" },
  };

  return (
    <div className="mt-4 space-y-4">
      <p className="text-sm text-muted-foreground">
        Track all administrative actions taken on the platform.
      </p>

      {loading ? (
        <div className="py-12 grid place-items-center">
          <Spinner className="size-8 text-primary" />
        </div>
      ) : logs.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <History className="mx-auto h-8 w-8 mb-2 opacity-40" />
          <p>No audit logs yet</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {logs.map((log) => {
              const actionInfo = actionLabels[log.action] || { label: log.action, color: "text-foreground" };
              const details = log.details;
              const targetName = details?.targetName || `${log.targetType} ${log.targetId.slice(0, 8)}...`;
              const adminName = log.admin?.name || "Unknown Admin";
              
              return (
                <div key={log.id} className="rounded-lg border p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <History className="h-4 w-4 text-muted-foreground" />
                      <span className={`text-sm font-medium ${actionInfo.color}`}>
                        {actionInfo.label}
                      </span>
                      <span className="text-sm text-muted-foreground">—</span>
                      <span className="text-sm font-medium">{targetName}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    by <span className="font-medium text-foreground">{adminName}</span>
                    {details?.bulk && <span className="ml-1 text-amber-600">(bulk action)</span>}
                  </p>
                  {details?.title && (
                    <p className="text-xs">Title: "{String(details.title)}"</p>
                  )}
                  {details?.status && (
                    <p className="text-xs">Status: {String(details.status)}</p>
                  )}
                  {details?.reason && (
                    <p className="text-xs">Reason: {String(details.reason)}</p>
                  )}
                  {details?.adminNote && (
                    <p className="text-xs">Note: {String(details.adminNote)}</p>
                  )}
                </div>
              );
            })}
          </div>

          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            onPageChange={fetchLogs}
          />
        </>
      )}
    </div>
  );
}
