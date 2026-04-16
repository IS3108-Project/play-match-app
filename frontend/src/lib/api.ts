const BASE_URL = "http://localhost:3000/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }

  return res.json();
}

// ── Types ───────────────────────────────────────────────────────────────

export interface Activity {
  id: string;
  title: string;
  description: string;
  activityType: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  skillLevel: string;
  maxParticipants: number;
  requireApproval: boolean;
  status: "ACTIVE" | "CANCELLED" | "COMPLETED";
  imageSrc?: string | null;
  hostId: string;
  host: { id: string; name: string; image?: string | null };
  _count: { confirmed: number };
  slotsLeft: number;
  myStatus: "CONFIRMED" | "PENDING" | "WAITLISTED" | "CANCELLED" | "REJECTED" | null;
  mySource?: "REQUESTED" | "INVITED" | null;
  pendingCount?: number;
  createdAt: string;
  distance?: number | null; // Distance in km from user (only when lat/lng provided)
  participantUserIds?: string[]; // User IDs of all participants (for invite tracking)
}

export interface ActivityDetail extends Activity {
  participants: Array<{
    id: string;
    userId: string;
    status: string;
    attendanceStatus:
      | "PENDING"
      | "ATTENDED"
      | "LATE"
      | "NO_SHOW"
      | "LATE_CANCEL"
      | "CANCELLED";
    joinedAt: string;
    rejectionNote?: string | null;
    user: { id: string; name: string; image?: string | null; email: string };
    reliability: {
      totalAttended: number;
      totalLate: number;
      totalNoShow: number;
      totalActivities: number;
      attendanceRate: number;
      noShowRate: number;
    };
    badge: ReliabilityBadge;
  }>;
  guests: Array<{
    id: string;
    name: string;
    contactType: string;
    contact: string;
    invitedById: string;
    createdAt: string;
  }>;
}

export interface CreateActivityPayload {
  title: string;
  description: string;
  activityType: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  skillLevel: string;
  maxParticipants: number;
  requireApproval: boolean;
  imageSrc?: string | null;
}

export interface GuestPayload {
  name: string;
  contactType: "email" | "telegram";
  contact: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

export interface ReliabilityBadge {
  label:
    | "Always on Time!"
    | "Consistent"
    | "No-Show Warning"
    | "Active"
    | "New";
  icon: string;
  colour: "gold" | "green" | "red" | "blue" | "grey";
}

export interface ActivityListParams {
  search?: string;
  activityType?: string;
  skillLevel?: string;
  region?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: "date" | "createdAt" | "distance";
  page?: number;
  limit?: number;
  // Distance-based filtering
  lat?: number;
  lng?: number;
  maxDistance?: number; // in km
}

export interface CancelInfo {
  hasOtherParticipants: boolean;
  confirmedParticipants: Array<{
    id: string;
    userId: string;
    name: string;
    image?: string | null;
  }>;
}

// ── Activity API ────────────────────────────────────────────────────────

export const activityApi = {
  list: (params?: ActivityListParams) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          searchParams.set(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    return request<PaginatedResponse<Activity>>(`/activities${query ? `?${query}` : ""}`);
  },

  mine: (params: {
    time?: string[];
    host?: string[];
    search?: string;
    page?: number;
    limit?: number;
  } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.time?.length) searchParams.set("time", params.time.join(","));
    if (params.host?.length) searchParams.set("host", params.host.join(","));
    if (params.search) searchParams.set("search", params.search);
    if (params.page) searchParams.set("page", String(params.page));
    if (params.limit) searchParams.set("limit", String(params.limit));
    const query = searchParams.toString();
    return request<PaginatedResponse<Activity & { isHosted: boolean }>>(`/activities/mine${query ? `?${query}` : ""}`);
  },

  get: (id: string) =>
    request<ActivityDetail>(`/activities/${id}`),

  create: (data: CreateActivityPayload) =>
    request<Activity>("/activities", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<CreateActivityPayload>) =>
    request<Activity>(`/activities/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  cancelInfo: (id: string) =>
    request<CancelInfo>(`/activities/${id}/cancel-info`),

  cancel: (id: string, body?: { transferToUserId: string }) =>
    request<{ action: "cancelled" | "transferred"; newHostName?: string }>(
      `/activities/${id}`,
      {
        method: "DELETE",
        body: body ? JSON.stringify(body) : undefined,
      },
    ),

  join: (id: string) =>
    request<{ status: string }>(`/activities/${id}/join`, { method: "POST" }),

  leave: (id: string) =>
    request<{
      message: string;
      isLateCancellation: boolean;
      attendanceStatus: "CANCELLED" | "NO_SHOW";
    }>(`/activities/${id}/leave`, { method: "POST" }),

  approve: (id: string, participantId: string) =>
    request<{ status: string }>(`/activities/${id}/approve/${participantId}`, {
      method: "POST",
    }),

  reject: (id: string, participantId: string, rejectionNote?: string) =>
    request<{ message: string }>(`/activities/${id}/reject/${participantId}`, {
      method: "POST",
      body: JSON.stringify({ rejectionNote }),
    }),

  invite: (activityId: string, userId: string) =>
    request<{ status: string }>(`/activities/${activityId}/invite/${userId}`, {
      method: "POST",
    }),

  acceptInvitation: (activityId: string) =>
    request<{ status: string }>(`/activities/${activityId}/accept-invitation`, {
      method: "POST",
    }),

  declineInvitation: (activityId: string) =>
    request<{ success: boolean }>(`/activities/${activityId}/decline-invitation`, {
      method: "POST",
    }),

  addGuest: (id: string, data: GuestPayload) =>
    request<{ id: string }>(`/activities/${id}/guests`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  removeGuest: (id: string, guestId: string) =>
    request<{ message: string }>(`/activities/${id}/guests/${guestId}`, {
      method: "DELETE",
    }),

  markAttendance: (
    id: string,
    attendanceOrParticipantIds:
      | Record<string, "ATTENDED" | "LATE" | "NO_SHOW">
      | string[],
  ) =>
    request<{ message: string }>(`/activities/${id}/attendance`, {
      method: "POST",
      body: JSON.stringify(
        Array.isArray(attendanceOrParticipantIds)
          ? { participantIds: attendanceOrParticipantIds }
          : { attendance: attendanceOrParticipantIds },
      ),
    }),

  uploadImage: async (file: File, folder: string = "activities"): Promise<string> => {
    const formData = new FormData();
    formData.append("image", file);
    const res = await fetch(`${BASE_URL}/upload/image?folder=${folder}`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Upload failed");
    }
    const data = await res.json();
    return data.url;
  },

  deleteProfileImage: () =>
    fetch(`${BASE_URL}/upload/profile-image`, {
      method: "DELETE",
      credentials: "include",
    }),
};

// ── User API ────────────────────────────────────────────────────────────

export interface UpdateProfilePayload {
  name?: string;
  preferredAreas?: string[];
  skillLevel?: string;
  sportInterests?: string[];
  preferredTimes?: string[];
  locationSharingEnabled?: boolean;
  emailNotificationsEnabled?: boolean;
  activityRemindersEnabled?: boolean;
  image?: string | null;
  bio?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  bio?: string | null;
  memberSince: string;
  preferredAreas: string[];
  skillLevel?: string | null;
  sportInterests: string[];
  preferredTimes: string[];
  locationSharingEnabled: boolean;
  emailNotificationsEnabled: boolean;
  activityRemindersEnabled: boolean;
  reliability: {
    totalAttended: number;
    totalLate: number;
    totalNoShow: number;
    totalActivities: number;
    attendanceRate: number;
    punctualityRate: number;
    noShowRate: number;
  };
  badge: ReliabilityBadge;
  stats: {
    currentStreak: number;
    longestStreak: number;
    joinedThisMonth: number;
    newFriendsMet: number;
    activitiesHosted: number;
    totalActivitiesJoined: number;
    favoriteSport: string | null;
    hostCancellationRate: number;
    totalCancelledAsHost: number;
  };
  calendar: {
    monthLabel: string;
    year: number;
    month: number;
    streakActivities: number;
    days: Array<{
      date: string;
      latestActivityType: string | null;
    }>;
  };
  isOwnProfile: boolean;
}

export const userApi = {
  getProfile: (userId: string, opts?: { year?: number; month?: number }) => {
    const params = new URLSearchParams();
    if (opts?.year != null) params.set("year", String(opts.year));
    if (opts?.month != null) params.set("month", String(opts.month));
    const qs = params.toString();
    return request<UserProfile>(`/users/${userId}/profile${qs ? `?${qs}` : ""}`);
  },

  updateLocationSharing: (enabled: boolean) =>
    request<{ locationSharingEnabled: boolean }>("/users/location-sharing", {
      method: "PATCH",
      body: JSON.stringify({ enabled }),
    }),

  updateProfile: (data: UpdateProfilePayload) =>
    request<{
      id: string;
      name: string;
      email: string;
      image: string | null;
      preferredAreas: string[];
      skillLevel: string | null;
      sportInterests: string[];
      preferredTimes: string[];
      locationSharingEnabled: boolean;
      emailNotificationsEnabled: boolean;
      activityRemindersEnabled: boolean;
      bio: string | null;
    }>("/users/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};

// ── Buddy Matching API ──────────────────────────────────────────────────

export interface BuddyMatch {
  id: string;
  name: string;
  image: string | null;
  bio: string | null;
  sportInterests: string[];
  skillLevel: string | null;
  preferredTimes: string[];
  preferredAreas: string[];
  compatibilityScore: number;
  commonSports: string[];
  commonTimes: string[];
  commonAreas: string[];
  upcomingActivities: Array<{
    id: string;
    title: string;
    activityType: string;
    date: string;
    startTime: string;
    location: string;
    slotsLeft: number;
  }>;
}

export const buddyApi = {
  /** Get potential buddy matches */
  getPotentialMatches: () => request<BuddyMatch[]>("/buddy/matches"),
};

// ── Community API ────────────────────────────────────────────────────────

export interface CommunityGroup {
  id: string;
  name: string;
  description: string;
  icon: string;
  iconBgColor: string;
  profileImageUrl?: string | null;
  memberCount: number;
  discussionCount: number;
  isJoined: boolean;
  isOwner: boolean;
  isFeatured: boolean;
  memberAvatars: { name: string; image: string | null }[];
  discussions?: CommunityDiscussion[];
}

export interface LinkedActivityPreview {
  id: string;
  title: string;
  activityType: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  skillLevel: string;
  status: string;
  requireApproval: boolean;
  hostId: string;
  slotsLeft: number;
  myStatus: string | null;
  host: { id: string; name: string; image?: string | null };
}

export interface CommunityDiscussion {
  id: string;
  title: string;
  content: string;
  imageUrl?: string | null;
  groupId?: string | null;
  groupName?: string | null;
  authorId: string;
  authorName: string;
  authorImage?: string | null;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  isOwner: boolean;
  canDelete?: boolean;
  linkedActivity?: LinkedActivityPreview | null;
  createdAt: string;
}

export interface CommunityComment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorImage?: string | null;
  likeCount: number;
  isLiked: boolean;
  isOwner: boolean;
  createdAt: string;
}

export interface CommunityDiscussionDetail extends CommunityDiscussion {
  comments: CommunityComment[];
}

export interface CreateGroupPayload {
  name: string;
  description: string;
  icon: string;
  iconBgColor: string;
  profileImageUrl?: string | null;
}

export interface CreateDiscussionPayload {
  title: string;
  content: string;
  imageUrl?: string | null;
  groupId?: string | null;
  isPublic?: boolean;
  linkedActivityId?: string | null;
}

export const communityApi = {
  getGroups: () =>
    request<CommunityGroup[]>("/community/groups"),

  createGroup: (data: CreateGroupPayload) =>
    request<CommunityGroup>("/community/groups", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getGroup: (id: string) =>
    request<CommunityGroup>(`/community/groups/${id}`),

  joinGroup: (id: string) =>
    request<{ message: string }>(`/community/groups/${id}/join`, { method: "POST" }),

  leaveGroup: (id: string) =>
    request<{ message: string }>(`/community/groups/${id}/leave`, { method: "DELETE" }),

  updateGroup: (id: string, data: Partial<CreateGroupPayload>) =>
    request<CommunityGroup>(`/community/groups/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteGroup: (id: string) =>
    request<{ message: string }>(`/community/groups/${id}`, { method: "DELETE" }),

  updateDiscussion: (id: string, data: Partial<CreateDiscussionPayload>) =>
    request<CommunityDiscussion>(`/community/discussions/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteDiscussion: (id: string) =>
    request<{ message: string }>(`/community/discussions/${id}`, { method: "DELETE" }),

  deleteComment: (id: string) =>
    request<{ message: string }>(`/community/comments/${id}`, { method: "DELETE" }),

  getDiscussions: (myGroups?: boolean) =>
    request<CommunityDiscussion[]>(`/community/discussions${myGroups ? "?myGroups=true" : ""}`),

  createDiscussion: (data: CreateDiscussionPayload) =>
    request<CommunityDiscussion>("/community/discussions", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getDiscussion: (id: string) =>
    request<CommunityDiscussionDetail>(`/community/discussions/${id}`),

  toggleDiscussionLike: (id: string) =>
    request<{ liked: boolean; likeCount: number }>(`/community/discussions/${id}/like`, {
      method: "POST",
    }),

  addComment: (id: string, content: string) =>
    request<CommunityComment>(`/community/discussions/${id}/comments`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),

  toggleCommentLike: (id: string) =>
    request<{ liked: boolean; likeCount: number }>(`/community/comments/${id}/like`, {
      method: "POST",
    }),

  uploadImage: async (file: File, folder: string = "discussions"): Promise<string> => {
    const formData = new FormData();
    formData.append("image", file);
    const res = await fetch(`${BASE_URL}/upload/image?folder=${folder}`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Upload failed");
    }
    const data = await res.json();
    return data.url as string;
  },
};

// ── Report API (for regular users) ─────────────────────────────────────

export interface CreateReportPayload {
  reportedUserId: string;
  activityId?: string;
  type: "NO_SHOW" | "RUDE_UNSAFE" | "MISREPRESENTED" | "SPAM" | "OTHER";
  details: string;
  anonymous: boolean;
}

export const reportApi = {
  create: (data: CreateReportPayload) =>
    request<{ id: string }>("/reports", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ── Admin API ──────────────────────────────────────────────────────────

export interface AdminPaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
}

export interface AdminUserListParams extends AdminListParams {
  banned?: boolean;
  hasReports?: boolean;
  role?: "USER" | "ADMIN";
}

export interface AdminActivityListParams extends AdminListParams {
  status?: string;
}

export interface AdminDashboardStats {
  totalUsers: number;
  bannedUsers: number;
  totalActivities: number;
  activeActivities: number;
  pendingReports: number;
  totalReports: number;
  totalDiscussions: number;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: "USER" | "ADMIN";
  banned: boolean;
  bannedAt: string | null;
  createdAt: string;
  _count: {
    reportsReceived: number;
    hostedActivities: number;
    participations: number;
    authoredDiscussions: number;
  };
}

export interface AdminUserDetail extends AdminUser {
  bio: string | null;
  sportInterests: string[];
  skillLevel: string | null;
  _count: AdminUser["_count"] & {
    reportsFiled: number;
    authoredComments: number;
  };
  reportsAgainst: AdminReport[];
}

export interface AdminReport {
  id: string;
  reporterId: string;
  reportedUserId: string;
  activityId: string | null;
  type: string;
  details: string;
  anonymous: boolean;
  status: "PENDING" | "REVIEWED" | "DISMISSED";
  adminNote: string | null;
  createdAt: string;
  resolvedAt: string | null;
  reporter: { id: string; name: string; email: string; image: string | null };
  reportedUser: { id: string; name: string; email: string; image: string | null; banned: boolean };
  activity: { id: string; title: string } | null;
}

export interface AdminActivity {
  id: string;
  title: string;
  activityType: string;
  date: string;
  status: string;
  createdAt: string;
  host: { id: string; name: string; image: string | null };
  _count: { participants: number; reports: number };
}

export interface AdminDiscussion {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  author: { id: string; name: string; image: string | null };
  group: { id: string; name: string } | null;
  _count: { likes: number; comments: number };
}

export interface AdminAuditLog {
  id: string;
  adminId: string;
  action: string;
  targetType: string;
  targetId: string;
  details: { 
    targetName?: string; 
    reason?: string; 
    bulk?: boolean; 
    title?: string;
    status?: string;
    adminNote?: string;
    [key: string]: unknown;
  } | null;
  createdAt: string;
  admin: { id: string; name: string; image: string | null } | null;
}

function buildAdminQueryString(params?: AdminListParams | AdminUserListParams | AdminActivityListParams): string {
  if (!params) return "";
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortOrder) searchParams.set("sortOrder", params.sortOrder);
  if (params.search) searchParams.set("search", params.search);
  if ("banned" in params && params.banned !== undefined) searchParams.set("banned", String(params.banned));
  if ("hasReports" in params && params.hasReports) searchParams.set("hasReports", "true");
  if ("role" in params && params.role) searchParams.set("role", params.role);
  if ("status" in params && params.status) searchParams.set("status", params.status);
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export const adminApi = {
  getStats: () =>
    request<AdminDashboardStats>("/admin/stats"),

  // Users
  listUsers: (params?: AdminUserListParams) =>
    request<AdminPaginatedResponse<AdminUser>>(`/admin/users${buildAdminQueryString(params)}`),

  getUserDetail: (id: string) =>
    request<AdminUserDetail>(`/admin/users/${id}`),

  banUser: (id: string, reason?: string) =>
    request<{ message: string }>(`/admin/users/${id}/ban`, { 
      method: "POST",
      body: JSON.stringify({ reason }),
    }),

  unbanUser: (id: string) =>
    request<{ message: string }>(`/admin/users/${id}/unban`, { method: "POST" }),

  bulkBanUsers: (userIds: string[], reason?: string) =>
    request<{ count: number; skipped: number }>("/admin/users/bulk/ban", {
      method: "POST",
      body: JSON.stringify({ userIds, reason }),
    }),

  bulkUnbanUsers: (userIds: string[]) =>
    request<{ count: number }>("/admin/users/bulk/unban", {
      method: "POST",
      body: JSON.stringify({ userIds }),
    }),

  // Reports
  listReports: (params?: AdminListParams & { status?: string }) =>
    request<AdminPaginatedResponse<AdminReport>>(`/admin/reports${buildAdminQueryString(params)}`),

  resolveReport: (id: string, status: "REVIEWED" | "DISMISSED", adminNote?: string) =>
    request<{ message: string }>(`/admin/reports/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status, adminNote }),
    }),

  bulkResolveReports: (reportIds: string[], status: "REVIEWED" | "DISMISSED", adminNote?: string) =>
    request<{ count: number }>("/admin/reports/bulk/resolve", {
      method: "POST",
      body: JSON.stringify({ reportIds, status, adminNote }),
    }),

  // Activities
  listActivities: (params?: AdminActivityListParams) =>
    request<AdminPaginatedResponse<AdminActivity>>(`/admin/activities${buildAdminQueryString(params)}`),

  deleteActivity: (id: string) =>
    request<{ message: string }>(`/admin/activities/${id}`, { method: "DELETE" }),

  bulkDeleteActivities: (activityIds: string[]) =>
    request<{ count: number }>("/admin/activities/bulk/delete", {
      method: "POST",
      body: JSON.stringify({ activityIds }),
    }),

  // Discussions
  listDiscussions: (params?: AdminListParams) =>
    request<AdminPaginatedResponse<AdminDiscussion>>(`/admin/discussions${buildAdminQueryString(params)}`),

  deleteDiscussion: (id: string) =>
    request<{ message: string }>(`/admin/discussions/${id}`, { method: "DELETE" }),

  bulkDeleteDiscussions: (discussionIds: string[]) =>
    request<{ count: number }>("/admin/discussions/bulk/delete", {
      method: "POST",
      body: JSON.stringify({ discussionIds }),
    }),

  // Audit Logs
  listAuditLogs: (params?: AdminListParams & { adminId?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.limit) searchParams.set("limit", String(params.limit));
    if (params?.adminId) searchParams.set("adminId", params.adminId);
    const query = searchParams.toString();
    return request<AdminPaginatedResponse<AdminAuditLog>>(`/admin/audit-logs${query ? `?${query}` : ""}`);
  },

  // Export - these return CSV files, so we handle them differently
  exportUsers: () => `${BASE_URL}/admin/export/users`,
  exportActivities: () => `${BASE_URL}/admin/export/activities`,
  exportReports: () => `${BASE_URL}/admin/export/reports`,
  exportAuditLogs: () => `${BASE_URL}/admin/export/audit-logs`,
};
