import { prisma } from "../config/prisma";

interface User {
  id: number;
  name: string;
}

export const getAllUsers = async (): Promise<User[]> => {
  // Business logic: fetch from DB, filter, transform, etc.
  return [{ id: 1, name: "Jordan" }];
};

export const getUserById = async (id: number): Promise<User | null> => {
  // Business logic: fetch, validate, transform
  return { id: Number(id), name: "Jordan" };
};

export const updateLocationSharing = async (
  userId: string,
  enabled: boolean
) => {
  return prisma.user.update({
    where: { id: userId },
    data: { locationSharingEnabled: enabled },
    select: { locationSharingEnabled: true },
  });
};

interface UpdateProfileInput {
  name?: string;
  preferredAreas?: string[];
  skillLevel?: string;
  sportInterests?: string[];
  preferredTimes?: string[];
  locationSharingEnabled?: boolean;
  image?: string | null;
  bio?: string;
  matchRadius?: number;
}

export const updateProfile = async (
  userId: string,
  input: UpdateProfileInput
) => {
  return prisma.user.update({
    where: { id: userId },
    data: input,
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      preferredAreas: true,
      skillLevel: true,
      sportInterests: true,
      preferredTimes: true,
      locationSharingEnabled: true,
      bio: true,
      matchRadius: true,
    },
  });
};
