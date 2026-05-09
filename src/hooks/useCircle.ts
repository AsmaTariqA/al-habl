"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getClientAccessToken } from "@/lib/client-access";
import {
  createComment,
  createPost,
  getComments,
  likePost as likePostRequest,
  logActivityDay,
} from "@/lib/qf-api";
import { qfKeys } from "@/lib/qf/queryKeys";
import {
  qfMembersQueryFn,
  qfPostsQueryFn,
  qfProfileQueryFn,
  qfRoomQueryFn,
} from "@/lib/qf/queryFns";
import { getTodayVerseKey, type Lens } from "@/lib/circle-constants";
import { session } from "@/lib/session";
import type { Comment, Post, RoomMember, UserProfile } from "@/types/circle";

type CommentMap = Record<string, Comment[]>;
type LoadingMap = Record<string, boolean>;

function sortPosts(posts: Post[]) {
  return [...posts].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

function shouldReplaceUsername(post: Post) {
  return (
    !post.username ||
    post.username === "Anonymous" ||
    post.username === post.user_id
  );
}

function resolvePostAuthor(
  post: Post,
  roomMembers: RoomMember[],
  currentProfile: UserProfile | null,
  currentUserId: string | null,
) {
  const member = roomMembers.find((entry) => entry.user_id === post.user_id);
  const isCurrentUser = Boolean(
    currentUserId && post.user_id === currentUserId,
  );
  const username =
    member?.username ?? (isCurrentUser ? currentProfile?.username : undefined);
  const avatar =
    member?.avatar ?? (isCurrentUser ? currentProfile?.avatar : undefined);

  return {
    ...post,
    username:
      shouldReplaceUsername(post) && username ? username : post.username,
    avatar: post.avatar ?? avatar,
  };
}

const roomStale = 60_000;
const postsStale = 45_000;

export function useCircle(initialRoomId?: string | null) {
  const queryClient = useQueryClient();
  const roomId = initialRoomId ?? null;
  const enabled = Boolean(roomId);

  const roomIdRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (roomId) {
      session.setRoomId(roomId);
      roomIdRef.current = roomId;
    }
  }, [roomId]);

  const userId = useMemo(() => session.getUserId(), []);

  const profileQ = useQuery({
    queryKey: qfKeys.profile(),
    queryFn: qfProfileQueryFn,
    staleTime: 120_000,
    enabled,
  });

  const roomQ = useQuery({
    queryKey: qfKeys.room(roomId!),
    queryFn: () => qfRoomQueryFn(roomId!),
    staleTime: roomStale,
    enabled,
  });

  const membersQ = useQuery({
    queryKey: qfKeys.members(roomId!),
    queryFn: () => qfMembersQueryFn(roomId!),
    staleTime: roomStale,
    enabled,
  });

  const postsQ = useQuery({
    queryKey: qfKeys.posts(roomId!),
    queryFn: () => qfPostsQueryFn(roomId!),
    staleTime: postsStale,
    enabled,
  });

  const room = roomQ.data ?? null;
  const members = useMemo(() => membersQ.data ?? [], [membersQ.data]);
  const profile = profileQ.data ?? null;

  const mapPostsForDisplay = useCallback(
    (
      nextPosts: Post[],
      roomMembers: RoomMember[],
      currentProfile: UserProfile | null,
    ) =>
      sortPosts(
        nextPosts.map((post) =>
          resolvePostAuthor(post, roomMembers, currentProfile, userId),
        ),
      ),
    [userId],
  );

  const displayPosts = useMemo(
    () => mapPostsForDisplay(postsQ.data ?? [], members, profile),
    [postsQ.data, members, profile, mapPostsForDisplay],
  );

  const loading =
    enabled &&
    (profileQ.isPending ||
      roomQ.isPending ||
      membersQ.isPending ||
      postsQ.isPending);

  const error =
    enabled && (roomQ.isError || (roomQ.isSuccess && !roomQ.data))
      ? "We couldn't load your circle."
      : null;

  const [commentsByPost, setCommentsByPost] = useState<CommentMap>({});
  const [loadingComments, setLoadingComments] = useState<LoadingMap>({});
  const [submitting, setSubmitting] = useState(false);
  const [reflectionError, setReflectionError] = useState<string | null>(null);

  const ensureAccessToken = useCallback(async (): Promise<string | null> => {
    return getClientAccessToken();
  }, []);

  const refreshPosts = useCallback(async () => {
    if (!roomId) return;
    await queryClient.invalidateQueries({ queryKey: qfKeys.posts(roomId) });
  }, [queryClient, roomId]);

  const refetchCircle = useCallback(async () => {
    if (!roomId) return;
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: qfKeys.room(roomId) }),
      queryClient.invalidateQueries({ queryKey: qfKeys.members(roomId) }),
      queryClient.invalidateQueries({ queryKey: qfKeys.posts(roomId) }),
      queryClient.invalidateQueries({ queryKey: qfKeys.profile() }),
    ]);
  }, [queryClient, roomId]);

  const postReflection = useCallback(
    async (body: string, lens: Lens) => {
      const token = await ensureAccessToken();
      const rid = roomIdRef.current;
      if (!token || !rid || !userId) return null;

      setSubmitting(true);
      setReflectionError(null);

      const profileData =
        queryClient.getQueryData<UserProfile | null>(qfKeys.profile()) ??
        (await queryClient.fetchQuery({
          queryKey: qfKeys.profile(),
          queryFn: qfProfileQueryFn,
          staleTime: 120_000,
        }));
      const memberList =
        queryClient.getQueryData<RoomMember[]>(qfKeys.members(rid)) ?? members;

      const currentProfile = profileData;
      const member = memberList.find((entry) => entry.user_id === userId);
      const username =
        member?.username ?? currentProfile?.username ?? "Anonymous";
      const avatar = member?.avatar ?? currentProfile?.avatar;

      const optimisticPost: Post = {
        id: `temp-${Date.now()}`,
        room_id: rid,
        user_id: userId,
        username,
        avatar,
        body,
        tags: [lens, getTodayVerseKey()],
        lens,
        verse_key: getTodayVerseKey(),
        created_at: new Date().toISOString(),
        like_count: 0,
        comment_count: 0,
        liked_by_me: false,
      };

      queryClient.setQueryData<Post[]>(qfKeys.posts(rid), (old = []) =>
        sortPosts([optimisticPost, ...old]),
      );

      const created = await createPost(
        token,
        body,
        rid,
        optimisticPost.verse_key ?? getTodayVerseKey(),
        lens,
        { userId, username, avatar },
      ).catch(() => null);

      if (!created || !mountedRef.current) {
        queryClient.setQueryData<Post[]>(qfKeys.posts(rid), (old = []) =>
          old.filter((post) => post.id !== optimisticPost.id),
        );
        setReflectionError("Your reflection couldn't be posted.");
        setSubmitting(false);
        return null;
      }

      const hydratedCreated = resolvePostAuthor(
        created,
        memberList,
        currentProfile ?? null,
        userId,
      );

      queryClient.setQueryData<Post[]>(qfKeys.posts(rid), (old = []) =>
        sortPosts(
          old.map((post) =>
            post.id === optimisticPost.id ? hydratedCreated : post,
          ),
        ),
      );

      queryClient.setQueryData<RoomMember[]>(qfKeys.members(rid), (old = []) =>
        old.map((entry) =>
          entry.user_id === userId
            ? { ...entry, has_reflected_today: true }
            : entry,
        ),
      );

      await logActivityDay(
        token,
        optimisticPost.created_at.slice(0, 10),
        optimisticPost.verse_key ?? getTodayVerseKey(),
      ).catch(() => null);

      void queryClient.invalidateQueries({ queryKey: qfKeys.streaks() });

      setSubmitting(false);
      return hydratedCreated;
    },
    [ensureAccessToken, members, queryClient, userId],
  );

  const likePost = useCallback(
    async (postId: string) => {
      const token = await ensureAccessToken();
      const rid = roomIdRef.current;
      if (!token || !rid) return false;

      const raw = queryClient.getQueryData<Post[]>(qfKeys.posts(rid)) ?? [];
      const currentPost = raw.find((post) => post.id === postId);
      if (!currentPost) return false;

      queryClient.setQueryData<Post[]>(qfKeys.posts(rid), (old = []) =>
        old.map((post) =>
          post.id === postId
            ? {
                ...post,
                liked_by_me: !post.liked_by_me,
                like_count: Math.max(
                  post.like_count + (post.liked_by_me ? -1 : 1),
                  0,
                ),
              }
            : post,
        ),
      );

      const liked = await likePostRequest(token, postId).catch(() => false);

      if (!liked) {
        queryClient.setQueryData<Post[]>(qfKeys.posts(rid), raw);
      }

      return liked;
    },
    [ensureAccessToken, queryClient],
  );

  const loadComments = useCallback(
    async (postId: string) => {
      if (postId.startsWith("temp-")) return null;
      if (commentsByPost[postId]) return commentsByPost[postId];

      const token = await ensureAccessToken();
      if (!token) return null;

      setLoadingComments((current) => ({ ...current, [postId]: true }));

      const comments = await getComments(token, postId).catch(() => null);

      setLoadingComments((current) => ({ ...current, [postId]: false }));

      if (!comments) return null;

      setCommentsByPost((current) => ({
        ...current,
        [postId]: comments,
      }));

      return comments;
    },
    [commentsByPost, ensureAccessToken],
  );

  const addComment = useCallback(
    async (postId: string, body: string) => {
      if (postId.startsWith("temp-")) return null;

      const token = await ensureAccessToken();
      if (!token || !userId) return null;

      const rid = roomIdRef.current;
      if (!rid) return null;
      const memberList =
        (rid
          ? queryClient.getQueryData<RoomMember[]>(qfKeys.members(rid))
          : null) ?? members;
      const prof =
        queryClient.getQueryData<UserProfile | null>(qfKeys.profile()) ??
        profile;

      const member = memberList.find((entry) => entry.user_id === userId);

      const optimisticComment: Comment = {
        id: `temp-comment-${Date.now()}`,
        post_id: postId,
        user_id: userId,
        username: member?.username ?? prof?.username ?? "Anonymous",
        body,
        created_at: new Date().toISOString(),
      };

      setCommentsByPost((current) => ({
        ...current,
        [postId]: [...(current[postId] ?? []), optimisticComment],
      }));

      queryClient.setQueryData<Post[]>(qfKeys.posts(rid!), (old = []) =>
        old.map((post) =>
          post.id === postId
            ? { ...post, comment_count: post.comment_count + 1 }
            : post,
        ),
      );

      const created = await createComment(token, postId, body).catch(
        () => null,
      );

      if (!created) {
        setCommentsByPost((current) => ({
          ...current,
          [postId]: (current[postId] ?? []).filter(
            (c) => c.id !== optimisticComment.id,
          ),
        }));

        queryClient.setQueryData<Post[]>(qfKeys.posts(rid!), (old = []) =>
          old.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  comment_count: Math.max(post.comment_count - 1, 0),
                }
              : post,
          ),
        );

        return null;
      }

      setCommentsByPost((current) => ({
        ...current,
        [postId]: (current[postId] ?? []).map((c) =>
          c.id === optimisticComment.id ? created : c,
        ),
      }));

      return created;
    },
    [ensureAccessToken, members, profile, queryClient, userId],
  );

  return {
    room,
    members,
    posts: displayPosts,
    commentsByPost,
    loadingComments,
    loading,
    submitting,
    error: error ?? reflectionError,
    profile,
    fetchRoom: refetchCircle,
    postReflection,
    refreshPosts,
    likePost,
    loadComments,
    addComment,
  };
}
