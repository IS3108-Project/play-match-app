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
  skillLevel: string;
  maxParticipants: number;
  requireApproval: boolean;
  status: "ACTIVE" | "CANCELLED" | "COMPLETED";
  imageSrc?: string | null;
  hostId: string;
  host: { id: string; name: string; image?: string | null };
  _count: { confirmed: number };
  slotsLeft: number;
  myStatus:
    | "CONFIRMED"
    | "PENDING"
    | "WAITLISTED"
    | "CANCELLED"
    | "REJECTED"
    | null;
  pendingCount?: number;
  createdAt: string;
}

export type AttendanceStatus =
  | "PENDING"
  | "ATTENDED"
  | "NO_SHOW"
  | "LATE_CANCEL"
  | "CANCELLED";

export interface ReliabilityBadge {
  label:
    | "Rock Solid"
    | "Consistent"
    | "Inconsistent"
    | "No-Show Warning"
    | "New";
  icon: string;
  colour: "green" | "yellow" | "orange" | "red" | "grey";
}

export interface ActivityParticipant {
  id: string;
  userId: string;
  status: string;
  attendanceStatus: AttendanceStatus;
  joinedAt: string;
  rejectionNote?: string | null;
  reliabilityScore: number | null;
  reliabilityBadge: ReliabilityBadge;
  user: { id: string; name: string; image?: string | null; email: string };
}

export interface ActivityDetail extends Activity {
  participants: ActivityParticipant[];
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
  skillLevel: string;
  maxParticipants: number;
  requireApproval: boolean;
  imageSrc?: string;
}

export interface GuestPayload {
  name: string;
  contactType: "email" | "telegram";
  contact: string;
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
  list: (params?: Record<string, string>) =>
    request<Activity[]>(
      `/activities${params ? `?${new URLSearchParams(params)}` : ""}`,
    ),

  mine: (tab: string) => request<Activity[]>(`/activities/mine?tab=${tab}`),

  get: (id: string) => request<ActivityDetail>(`/activities/${id}`),

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
      attendanceStatus: AttendanceStatus;
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

  addGuest: (id: string, data: GuestPayload) =>
    request<{ id: string }>(`/activities/${id}/guests`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  removeGuest: (id: string, guestId: string) =>
    request<{ message: string }>(`/activities/${id}/guests/${guestId}`, {
      method: "DELETE",
    }),

  // attendance: { [participantId]: "ATTENDED" | "NO_SHOW" | "LATE_CANCEL" }
  markAttendance: (id: string, attendance: Record<string, AttendanceStatus>) =>
    request<{ message: string }>(`/activities/${id}/attendance`, {
      method: "POST",
      body: JSON.stringify({ attendance }),
    }),

  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("image", file);
    const res = await fetch(`${BASE_URL}/upload/image`, {
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
};
// ── User / Profile API ──────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  name: string;
  image?: string | null;
  bio?: string | null;
  sportInterests: string[];
  skillLevel?: string | null;
  preferredAreas: string[];
  preferredTimes: string[];
  memberSince: string;
  reliabilityScore: number | null;
  reliabilityBadge: ReliabilityBadge;
  stats: {
    totalAttended: number;
    thisMonth: number;
    activitiesHosted: number;
    currentStreak: number;
    longestStreak: number;
    favoriteSport: string | null;
  };
  activityHistory: Array<{
    id: string;
    title: string;
    activityType: string;
    date: string;
    startTime: string;
    location: string;
    skillLevel: string;
    participantStatus: string;
    attendanceStatus: AttendanceStatus;
    host: { id: string; name: string; image?: string | null };
  }>;
  isOwnProfile: boolean;
}

export const userApi = {
  getProfile: (userId: string) =>
    request<UserProfile>(`/users/${userId}/profile`),

  updateMe: (data: {
    bio?: string;
    name?: string;
    image?: string;
    sportInterests?: string[];
    skillLevel?: string;
    preferredAreas?: string[];
    preferredTimes?: string[];
  }) =>
    request<Partial<UserProfile>>("/users/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};

// ── Report API ──────────────────────────────────────────────────────────

export type ReportType =
  | "NO_SHOW"
  | "RUDE_UNSAFE"
  | "MISREPRESENTED"
  | "SPAM"
  | "OTHER";

export const reportApi = {
  create: (data: {
    reportedUserId: string;
    activityId?: string;
    type: ReportType;
    details: string;
    anonymous: boolean;
  }) =>
    request<{ message: string }>("/reports", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  adminList: (status?: string) =>
    request<any[]>(`/reports/admin${status ? `?status=${status}` : ""}`),

  resolve: (reportId: string, status: "REVIEWED" | "DISMISSED") =>
    request<any>(`/reports/${reportId}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
};
