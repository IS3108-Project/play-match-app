// community.service.ts
// Business logic for Groups, Discussions, Comments, and Likes.

import { prisma } from "../config/prisma";
import { deleteFromR2 } from "../config/storage";

// ── Types ────────────────────────────────────────────────────────────────

export interface CreateGroupData {
  name: string;
  description: string;
  icon: string;
  iconBgColor: string;
  profileImageUrl?: string | null;
}

export interface CreateDiscussionData {
  title: string;
  content: string;
  imageUrl?: string | null;
  groupId?: string | null;
  isPublic?: boolean;
  linkedActivityId?: string | null;
}

// ── Groups ───────────────────────────────────────────────────────────────

export async function getGroups(userId: string) {
  const groups = await prisma.group.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { members: true, discussions: true },
      },
      members: {
        take: 4,
        include: {
          user: { select: { image: true, name: true } },
        },
      },
    },
  });

  // Check which groups the user is already in
  const membershipSet = new Set(
    (
      await prisma.groupMember.findMany({
        where: { userId },
        select: { groupId: true },
      })
    ).map((m) => m.groupId)
  );

  // Compute featured: top 2 by (memberCount + discussionCount)
  const scored = groups
    .map((g) => ({
      id: g.id,
      score: g._count.members + g._count.discussions,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((g) => g.id);
  const featuredSet = new Set(scored);

  return groups.map((g) => ({
    id: g.id,
    name: g.name,
    description: g.description,
    icon: g.icon,
    iconBgColor: g.iconBgColor,
    profileImageUrl: g.profileImageUrl,
    memberCount: g._count.members,
    discussionCount: g._count.discussions,
    isJoined: membershipSet.has(g.id),
    isOwner: g.creatorId === userId,
    isFeatured: featuredSet.has(g.id),
    memberAvatars: g.members.map((m) => ({
      name: m.user.name,
      image: m.user.image ?? null,
    })),
  }));
}

export async function createGroup(userId: string, data: CreateGroupData) {
  const group = await prisma.group.create({
    data: {
      name: data.name,
      description: data.description,
      icon: data.icon,
      iconBgColor: data.iconBgColor,
      profileImageUrl: data.profileImageUrl ?? null,
      creatorId: userId,
      members: {
        create: { userId },
      },
    },
    include: {
      _count: { select: { members: true, discussions: true } },
    },
  });

  return {
    id: group.id,
    name: group.name,
    description: group.description,
    icon: group.icon,
    iconBgColor: group.iconBgColor,
    profileImageUrl: group.profileImageUrl,
    memberCount: group._count.members,
    discussionCount: group._count.discussions,
    isJoined: true,
    isOwner: true,
    isFeatured: false,
    avatarUrls: [],
  };
}

export async function getGroupById(groupId: string, userId: string) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      _count: { select: { members: true, discussions: true } },
      members: {
        take: 4,
        include: { user: { select: { image: true, name: true } } },
      },
      discussions: {
        orderBy: { createdAt: "desc" },
        include: {
          author: { select: { id: true, name: true, image: true } },
          _count: { select: { likes: true, comments: true } },
          likes: { where: { userId }, select: { id: true } },
          linkedActivity: {
            select: {
              id: true, title: true, activityType: true, date: true,
              startTime: true, endTime: true, location: true,
              skillLevel: true, status: true,
              requireApproval: true, maxParticipants: true, hostId: true,
              host: { select: { id: true, name: true, image: true } },
              _count: { select: { participants: { where: { status: "CONFIRMED" } }, guests: true } },
              participants: { where: { userId }, select: { status: true }, take: 1 },
            },
          },
        },
      },
    },
  });

  if (!group) return null;

  const isJoined = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId, groupId } },
  });

  return {
    id: group.id,
    name: group.name,
    description: group.description,
    icon: group.icon,
    iconBgColor: group.iconBgColor,
    profileImageUrl: group.profileImageUrl,
    memberCount: group._count.members,
    discussionCount: group._count.discussions,
    isJoined: !!isJoined,
    isOwner: group.creatorId === userId,
    isFeatured: false,
    memberAvatars: group.members.map((m) => ({
      name: m.user.name,
      image: m.user.image ?? null,
    })),
    discussions: group.discussions.map((d) => ({
      id: d.id,
      title: d.title,
      content: d.content,
      imageUrl: d.imageUrl,
      groupId: group.id,
      groupName: group.name,
      authorId: d.author.id,
      authorName: d.author.name,
      authorImage: d.author.image,
      likeCount: d._count.likes,
      commentCount: d._count.comments,
      isLiked: d.likes.length > 0,
      isOwner: d.author.id === userId,
      canDelete: d.author.id === userId || group.creatorId === userId,
      linkedActivity: d.linkedActivity ? {
        id: d.linkedActivity.id,
        title: d.linkedActivity.title,
        activityType: d.linkedActivity.activityType,
        date: d.linkedActivity.date.toISOString(),
        startTime: d.linkedActivity.startTime,
        endTime: d.linkedActivity.endTime,
        location: d.linkedActivity.location,
        skillLevel: d.linkedActivity.skillLevel,
        status: d.linkedActivity.status,
        requireApproval: d.linkedActivity.requireApproval,
        hostId: d.linkedActivity.hostId,
        slotsLeft: Math.max(0, d.linkedActivity.maxParticipants - d.linkedActivity._count.participants - d.linkedActivity._count.guests),
        myStatus: (d.linkedActivity.participants[0]?.status ?? null) as string | null,
        host: d.linkedActivity.host,
      } : null,
      createdAt: d.createdAt.toISOString(),
    })),
  };
}

export async function joinGroup(groupId: string, userId: string) {
  await prisma.groupMember.create({
    data: { groupId, userId },
  });
}

export async function leaveGroup(groupId: string, userId: string) {
  await prisma.groupMember.delete({
    where: { userId_groupId: { userId, groupId } },
  });
}

// ── Discussions ──────────────────────────────────────────────────────────

export async function getDiscussions(userId: string, myGroupsOnly?: boolean) {
  let groupIdFilter: { in: string[] } | undefined;

  if (myGroupsOnly) {
    const memberships = await prisma.groupMember.findMany({
      where: { userId },
      select: { groupId: true },
    });
    groupIdFilter = { in: memberships.map((m) => m.groupId) };
  }

  const ownedGroupIds = new Set(
    (await prisma.group.findMany({ where: { creatorId: userId }, select: { id: true } }))
      .map((g) => g.id)
  );

  const discussions = await prisma.discussion.findMany({
    where: {
      isPublic: true,
      ...(myGroupsOnly && groupIdFilter
        ? { groupId: groupIdFilter }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { id: true, name: true, image: true } },
      group: { select: { id: true, name: true } },
      _count: { select: { likes: true, comments: true } },
      likes: { where: { userId }, select: { id: true } },
      linkedActivity: {
        select: {
          id: true, title: true, activityType: true, date: true,
          startTime: true, endTime: true, location: true,
          skillLevel: true, status: true,
          requireApproval: true, maxParticipants: true, hostId: true,
          host: { select: { id: true, name: true, image: true } },
          _count: { select: { participants: { where: { status: "CONFIRMED" } }, guests: true } },
          participants: { where: { userId }, select: { status: true }, take: 1 },
        },
      },
    },
  });

  return discussions.map((d) => ({
    id: d.id,
    title: d.title,
    content: d.content,
    imageUrl: d.imageUrl,
    groupId: d.group?.id ?? null,
    groupName: d.group?.name ?? null,
    authorName: d.author.name,
    authorImage: d.author.image,
    likeCount: d._count.likes,
    commentCount: d._count.comments,
    isLiked: d.likes.length > 0,
    isOwner: d.authorId === userId,
    canDelete: d.authorId === userId || (!!d.group?.id && ownedGroupIds.has(d.group.id)),
    linkedActivity: d.linkedActivity ? {
      id: d.linkedActivity.id,
      title: d.linkedActivity.title,
      activityType: d.linkedActivity.activityType,
      date: d.linkedActivity.date.toISOString(),
      startTime: d.linkedActivity.startTime,
      endTime: d.linkedActivity.endTime,
      location: d.linkedActivity.location,
      skillLevel: d.linkedActivity.skillLevel,
      status: d.linkedActivity.status,
      requireApproval: d.linkedActivity.requireApproval,
      hostId: d.linkedActivity.hostId,
      slotsLeft: Math.max(0, d.linkedActivity.maxParticipants - d.linkedActivity._count.participants - d.linkedActivity._count.guests),
      myStatus: (d.linkedActivity.participants[0]?.status ?? null) as string | null,
      host: d.linkedActivity.host,
    } : null,
    createdAt: d.createdAt.toISOString(),
  }));
}

export async function createDiscussion(userId: string, data: CreateDiscussionData) {
  const discussion = await prisma.discussion.create({
    data: {
      title: data.title,
      content: data.content,
      imageUrl: data.imageUrl ?? null,
      groupId: data.groupId ?? null,
      isPublic: data.isPublic ?? true,
      linkedActivityId: data.linkedActivityId ?? null,
      authorId: userId,
    },
    include: {
      author: { select: { id: true, name: true, image: true } },
      group: { select: { id: true, name: true } },
      _count: { select: { likes: true, comments: true } },
      linkedActivity: {
        select: {
          id: true, title: true, activityType: true, date: true,
          startTime: true, endTime: true, location: true,
          skillLevel: true, status: true,
          requireApproval: true, maxParticipants: true, hostId: true,
          host: { select: { id: true, name: true, image: true } },
          _count: { select: { participants: { where: { status: "CONFIRMED" } }, guests: true } },
          participants: { where: { userId }, select: { status: true }, take: 1 },
        },
      },
    },
  });

  return {
    id: discussion.id,
    title: discussion.title,
    content: discussion.content,
    imageUrl: discussion.imageUrl,
    groupId: discussion.group?.id ?? null,
    groupName: discussion.group?.name ?? null,
    authorId: discussion.author.id,
    authorName: discussion.author.name,
    authorImage: discussion.author.image,
    likeCount: 0,
    commentCount: 0,
    isLiked: false,
    isOwner: true,
    canDelete: true,
    linkedActivity: discussion.linkedActivity ? {
      id: discussion.linkedActivity.id,
      title: discussion.linkedActivity.title,
      activityType: discussion.linkedActivity.activityType,
      date: discussion.linkedActivity.date.toISOString(),
      startTime: discussion.linkedActivity.startTime,
      endTime: discussion.linkedActivity.endTime,
      location: discussion.linkedActivity.location,
      skillLevel: discussion.linkedActivity.skillLevel,
      status: discussion.linkedActivity.status,
      requireApproval: discussion.linkedActivity.requireApproval,
      hostId: discussion.linkedActivity.hostId,
      slotsLeft: Math.max(0, discussion.linkedActivity.maxParticipants - discussion.linkedActivity._count.participants - discussion.linkedActivity._count.guests),
      myStatus: (discussion.linkedActivity.participants[0]?.status ?? null) as string | null,
      host: discussion.linkedActivity.host,
    } : null,
    createdAt: discussion.createdAt.toISOString(),
  };
}

export async function getDiscussionById(discussionId: string, userId: string) {
  const discussion = await prisma.discussion.findUnique({
    where: { id: discussionId },
    include: {
      author: { select: { id: true, name: true, image: true } },
      group: { select: { id: true, name: true, creatorId: true } },
      _count: { select: { likes: true, comments: true } },
      likes: { where: { userId }, select: { id: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: {
          author: { select: { id: true, name: true, image: true } },
          _count: { select: { likes: true } },
          likes: { where: { userId }, select: { id: true } },
        },
      },
      linkedActivity: {
        select: {
          id: true, title: true, activityType: true, date: true,
          startTime: true, endTime: true, location: true,
          skillLevel: true, status: true,
          requireApproval: true, maxParticipants: true, hostId: true,
          host: { select: { id: true, name: true, image: true } },
          _count: { select: { participants: { where: { status: "CONFIRMED" } }, guests: true } },
          participants: { where: { userId }, select: { status: true }, take: 1 },
        },
      },
    },
  });

  if (!discussion) return null;

  return {
    id: discussion.id,
    title: discussion.title,
    content: discussion.content,
    imageUrl: discussion.imageUrl,
    groupId: discussion.group?.id ?? null,
    groupName: discussion.group?.name ?? null,
    authorId: discussion.author.id,
    authorName: discussion.author.name,
    authorImage: discussion.author.image,
    likeCount: discussion._count.likes,
    commentCount: discussion._count.comments,
    isLiked: discussion.likes.length > 0,
    isOwner: discussion.authorId === userId,
    canDelete: discussion.authorId === userId || (!!discussion.group && discussion.group.creatorId === userId),
    linkedActivity: discussion.linkedActivity ? {
      id: discussion.linkedActivity.id,
      title: discussion.linkedActivity.title,
      activityType: discussion.linkedActivity.activityType,
      date: discussion.linkedActivity.date.toISOString(),
      startTime: discussion.linkedActivity.startTime,
      endTime: discussion.linkedActivity.endTime,
      location: discussion.linkedActivity.location,
      skillLevel: discussion.linkedActivity.skillLevel,
      status: discussion.linkedActivity.status,
      requireApproval: discussion.linkedActivity.requireApproval,
      hostId: discussion.linkedActivity.hostId,
      slotsLeft: Math.max(0, discussion.linkedActivity.maxParticipants - discussion.linkedActivity._count.participants - discussion.linkedActivity._count.guests),
      myStatus: (discussion.linkedActivity.participants[0]?.status ?? null) as string | null,
      host: discussion.linkedActivity.host,
    } : null,
    createdAt: discussion.createdAt.toISOString(),
    comments: discussion.comments.map((c) => ({
      id: c.id,
      content: c.content,
      authorId: c.author.id,
      authorName: c.author.name,
      authorImage: c.author.image,
      likeCount: c._count.likes,
      isLiked: c.likes.length > 0,
      isOwner: c.authorId === userId,
      createdAt: c.createdAt.toISOString(),
    })),
  };
}

export async function toggleDiscussionLike(discussionId: string, userId: string) {
  const existing = await prisma.discussionLike.findUnique({
    where: { userId_discussionId: { userId, discussionId } },
  });

  if (existing) {
    await prisma.discussionLike.delete({
      where: { userId_discussionId: { userId, discussionId } },
    });
  } else {
    await prisma.discussionLike.create({
      data: { userId, discussionId },
    });
  }

  const likeCount = await prisma.discussionLike.count({ where: { discussionId } });
  return { liked: !existing, likeCount };
}

export async function addComment(discussionId: string, userId: string, content: string) {
  const comment = await prisma.comment.create({
    data: { content, authorId: userId, discussionId },
    include: {
      author: { select: { id: true, name: true, image: true } },
    },
  });

  return {
    id: comment.id,
    content: comment.content,
    authorId: comment.author.id,
    authorName: comment.author.name,
    authorImage: comment.author.image,
    likeCount: 0,
    isLiked: false,
    createdAt: comment.createdAt.toISOString(),
  };
}

// ── Delete ───────────────────────────────────────────────────────────────

export async function deleteGroup(groupId: string, userId: string) {
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) throw new Error("NOT_FOUND");
  if (group.creatorId !== userId) throw new Error("FORBIDDEN");

  // Delete group image from R2
  if (group.profileImageUrl) {
    deleteFromR2(group.profileImageUrl).catch((err) => console.error("Failed to delete group image from R2:", err));
  }

  // Delete all discussions in this group first (cascades to comments/likes)
  await prisma.discussion.deleteMany({ where: { groupId } });
  await prisma.group.delete({ where: { id: groupId } });
}

export async function updateGroup(groupId: string, userId: string, data: Partial<CreateGroupData>) {
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) throw new Error("NOT_FOUND");
  if (group.creatorId !== userId) throw new Error("FORBIDDEN");

  // Delete old image from R2 if being replaced
  if ("profileImageUrl" in data && group.profileImageUrl && group.profileImageUrl !== data.profileImageUrl) {
    deleteFromR2(group.profileImageUrl).catch((err) => console.error("Failed to delete old group image from R2:", err));
  }

  const updated = await prisma.group.update({
    where: { id: groupId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.description && { description: data.description }),
      ...(data.icon && { icon: data.icon }),
      ...(data.iconBgColor && { iconBgColor: data.iconBgColor }),
      ...("profileImageUrl" in data && { profileImageUrl: data.profileImageUrl ?? null }),
    },
    include: { _count: { select: { members: true, discussions: true } } },
  });
  return {
    id: updated.id,
    name: updated.name,
    description: updated.description,
    icon: updated.icon,
    iconBgColor: updated.iconBgColor,
    profileImageUrl: updated.profileImageUrl,
    memberCount: updated._count.members,
    discussionCount: updated._count.discussions,
    isJoined: true,
    isOwner: true,
    isFeatured: false,
    avatarUrls: [],
  };
}

export async function deleteDiscussion(discussionId: string, userId: string) {
  const discussion = await prisma.discussion.findUnique({
    where: { id: discussionId },
    include: { group: { select: { creatorId: true } } },
  });
  if (!discussion) throw new Error("NOT_FOUND");
  const isAuthor = discussion.authorId === userId;
  const isGroupOwner = !!discussion.group && discussion.group.creatorId === userId;
  if (!isAuthor && !isGroupOwner) throw new Error("FORBIDDEN");

  // Delete discussion image from R2
  if (discussion.imageUrl) {
    deleteFromR2(discussion.imageUrl).catch((err) => console.error("Failed to delete discussion image from R2:", err));
  }

  // Comments and likes cascade automatically via DB foreign keys
  await prisma.discussion.delete({ where: { id: discussionId } });
}

export async function updateDiscussion(discussionId: string, userId: string, data: Partial<CreateDiscussionData>) {
  const discussion = await prisma.discussion.findUnique({ where: { id: discussionId } });
  if (!discussion) throw new Error("NOT_FOUND");
  if (discussion.authorId !== userId) throw new Error("FORBIDDEN");

  // Delete old image from R2 if being replaced
  if ("imageUrl" in data && discussion.imageUrl && discussion.imageUrl !== data.imageUrl) {
    deleteFromR2(discussion.imageUrl).catch((err) => console.error("Failed to delete old discussion image from R2:", err));
  }

  const updated = await prisma.discussion.update({
    where: { id: discussionId },
    data: {
      ...(data.title && { title: data.title }),
      ...(data.content && { content: data.content }),
      ...("imageUrl" in data && { imageUrl: data.imageUrl ?? null }),
      ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
      ...("linkedActivityId" in data && { linkedActivityId: data.linkedActivityId ?? null }),
    },
    include: {
      author: { select: { id: true, name: true, image: true } },
      group: { select: { id: true, name: true } },
      _count: { select: { likes: true, comments: true } },
    },
  });
  return {
    id: updated.id,
    title: updated.title,
    content: updated.content,
    imageUrl: updated.imageUrl,
    groupId: updated.group?.id ?? null,
    groupName: updated.group?.name ?? null,
    authorId: updated.author.id,
    authorName: updated.author.name,
    authorImage: updated.author.image,
    likeCount: updated._count.likes,
    commentCount: updated._count.comments,
    isLiked: false,
    isOwner: true,
    createdAt: updated.createdAt.toISOString(),
  };
}

export async function deleteComment(commentId: string, userId: string) {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) throw new Error("NOT_FOUND");
  if (comment.authorId !== userId) throw new Error("FORBIDDEN");
  await prisma.comment.delete({ where: { id: commentId } });
}

// ── Comment Likes ────────────────────────────────────────────────────────

export async function toggleCommentLike(commentId: string, userId: string) {
  const existing = await prisma.commentLike.findUnique({
    where: { userId_commentId: { userId, commentId } },
  });

  if (existing) {
    await prisma.commentLike.delete({
      where: { userId_commentId: { userId, commentId } },
    });
  } else {
    await prisma.commentLike.create({
      data: { userId, commentId },
    });
  }

  const likeCount = await prisma.commentLike.count({ where: { commentId } });
  return { liked: !existing, likeCount };
}
