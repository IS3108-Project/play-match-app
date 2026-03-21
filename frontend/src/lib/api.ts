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
  pendingCount?: number;
  createdAt: string;
  distance?: number | null; // Distance in km from user (only when lat/lng provided)
}

export interface ActivityDetail extends Activity {
  participants: Array<{
    id: string;
    userId: string;
    status: string;
    attendanceStatus: "PENDING" | "ATTENDED" | "NO_SHOW" | "LATE_CANCEL" | "CANCELLED";
    joinedAt: string;
    rejectionNote?: string | null;
    user: { id: string; name: string; image?: string | null; email: string };
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

  mine: (tab: string) =>
    request<Activity[]>(`/activities/mine?tab=${tab}`),

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
    request<{ message: string }>(`/activities/${id}/leave`, { method: "POST" }),

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

  markAttendance: (id: string, participantIds: string[]) =>
    request<{ message: string }>(`/activities/${id}/attendance`, {
      method: "POST",
      body: JSON.stringify({ participantIds }),
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

// ── User API ────────────────────────────────────────────────────────────

export interface UpdateProfilePayload {
  name?: string;
  preferredAreas?: string[];
  skillLevel?: string;
  sportInterests?: string[];
  preferredTimes?: string[];
  locationSharingEnabled?: boolean;
  image?: string | null;
  bio?: string;
}

export const userApi = {
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
      bio: string | null;
    }>("/users/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};
