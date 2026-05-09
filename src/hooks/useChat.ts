"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { qfKeys } from "@/lib/qf/queryKeys";
import { qfMembersQueryFn, qfProfileQueryFn } from "@/lib/qf/queryFns";
import { session } from "@/lib/session";
import type { RoomMember, UserProfile } from "@/types/circle";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

type ChatMessage = {
  id: string;
  room_id: string;
  user_id: string;
  username: string;
  body: string;
  created_at: string;
  lens?: string | null;
  [key: string]: unknown;
};

function shouldReplaceUsername(message: ChatMessage) {
  return (
    !message.username ||
    message.username === "You" ||
    message.username === "Anonymous" ||
    message.username === message.user_id
  );
}

function resolveMessageAuthor(
  message: ChatMessage,
  roomMembers: RoomMember[],
  profile: UserProfile | null,
  currentUserId: string | null,
) {
  const member = roomMembers.find((entry) => entry.user_id === message.user_id);
  const isCurrentUser = Boolean(
    currentUserId && message.user_id === currentUserId,
  );
  const resolvedUsername =
    member?.username ?? (isCurrentUser ? profile?.username : undefined);

  return {
    ...message,
    username: shouldReplaceUsername(message)
      ? (resolvedUsername ?? message.username ?? "Member")
      : message.username,
  };
}

const EMPTY_MEMBERS: RoomMember[] = [];

export function useChat(roomId?: string | null) {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const membersRef = useRef<RoomMember[]>([]);
  const profileRef = useRef<UserProfile | null>(null);
  const userId = useMemo(() => session.getUserId(), []);

  const enabled = Boolean(roomId);

  const profileQ = useQuery({
    queryKey: qfKeys.profile(),
    queryFn: qfProfileQueryFn,
    staleTime: 120_000,
    enabled,
  });

  const membersQ = useQuery({
    queryKey: qfKeys.members(roomId!),
    queryFn: () => qfMembersQueryFn(roomId!),
    staleTime: 60_000,
    enabled,
  });

  const profileData = profileQ.data ?? null;
  const membersData = membersQ.data ?? EMPTY_MEMBERS;

  useEffect(() => {
    profileRef.current = profileData;
    membersRef.current = membersData;
  }, [profileData, membersData]);

  const hydrateMessages = useCallback(
    (
      nextMessages: ChatMessage[],
      roomMembers: RoomMember[] = membersRef.current,
      currentProfile: UserProfile | null = profileRef.current,
    ) => {
      return nextMessages.map((message) =>
        resolveMessageAuthor(message, roomMembers, currentProfile, userId),
      );
    },
    [userId],
  );

  /** When circle/members caches warm, rehydrate visible rows. */
  useEffect(() => {
    setMessages((cur) =>
      cur.length ? hydrateMessages(cur, membersData, profileData) : cur,
    );
  }, [hydrateMessages, membersData, profileData]);

  const sendMessage = useCallback(
    async (body: string) => {
      if (!roomId) return;
      if (body.trim().length < 2) return;

      const currentUserId = userId ?? session.getUserId();
      if (!currentUserId) return;

      let roomMembers = membersData;
      let currentProfile = profileData;

      const member = roomMembers.find(
        (entry) => entry.user_id === currentUserId,
      );
      let username = member?.username ?? currentProfile?.username;

      if (!username) {
        currentProfile = await queryClient.fetchQuery({
          queryKey: qfKeys.profile(),
          queryFn: qfProfileQueryFn,
        });
        roomMembers = await queryClient.fetchQuery({
          queryKey: qfKeys.members(roomId),
          queryFn: () => qfMembersQueryFn(roomId),
        });
        username =
          roomMembers.find((e) => e.user_id === currentUserId)?.username ??
          currentProfile?.username ??
          "Anonymous";
      }

      const newMsg = {
        room_id: roomId,
        user_id: currentUserId,
        username: username ?? "Anonymous",
        body: body.trim(),
      };

      setSending(true);
      setError(null);

      const { data, error } = await supabase
        .from("messages")
        .insert([newMsg])
        .select()
        .single();

      if (error) {
        setError("Failed to send message");
        setSending(false);
        return;
      }

      if (data) {
        const createdMessage = hydrateMessages(
          [data as ChatMessage],
          roomMembers,
          currentProfile,
        )[0];

        setMessages((prev) => [...prev, createdMessage]);
      }

      setSending(false);
    },
    [hydrateMessages, membersData, profileData, queryClient, roomId, userId],
  );

  useEffect(() => {
    if (!roomId) return;

    let isMounted = true;

    const fetchInitial = async () => {
      setLoading(true);
      const { data, error: sbError } = await supabase
        .from("messages")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true });

      if (!isMounted) return;

      if (sbError) {
        setError("Failed to load messages");
        setLoading(false);
        return;
      }

      setMessages(
        hydrateMessages(
          (data ?? []) as ChatMessage[],
          membersRef.current,
          profileRef.current,
        ),
      );
      setLoading(false);
    };

    void fetchInitial();

    const channel = supabase
      .channel(`chat-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const row = payload.new as ChatMessage;
          const nextMessage = hydrateMessages(
            [row],
            membersRef.current,
            profileRef.current,
          )[0];
          setMessages((prev) =>
            prev.some((m) => m.id === nextMessage.id)
              ? prev
              : [...prev, nextMessage],
          );
        },
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [hydrateMessages, roomId]);

  const deleteMessage = useCallback(async (id: string) => {
    const { error } = await supabase.from("messages").delete().eq("id", id);

    if (error) {
      setError("Failed to delete message");
      return;
    }

    setMessages((prev) => prev.filter((msg) => msg.id !== id));
  }, []);

  return { messages, sendMessage, loading, sending, error, deleteMessage };
}
