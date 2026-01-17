"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getOrCreateConversation(businessId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Check if conversation already exists
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase as any)
    .from("conversations")
    .select("id")
    .eq("business_id", businessId)
    .eq("customer_id", user.id)
    .maybeSingle();

  if (existing) {
    return { conversationId: existing.id as string };
  }

  // Create new conversation
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: newConversation, error } = await (supabase as any)
    .from("conversations")
    .insert({
      business_id: businessId,
      customer_id: user.id,
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  return { conversationId: newConversation.id as string };
}

export async function sendMessage(conversationId: string, body: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  if (!body.trim()) {
    return { error: "Message cannot be empty" };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    body: body.trim(),
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/messages/${conversationId}`);
  return { success: true };
}

export async function getConversationMessages(conversationId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated", messages: [] };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: messages, error } = await (supabase as any)
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) {
    return { error: error.message, messages: [] };
  }

  return { messages: messages || [] };
}

export async function getConversationDetails(conversationId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: conversation, error } = await (supabase as any)
    .from("conversations")
    .select("id, business_id, customer_id, created_at")
    .eq("id", conversationId)
    .single();

  if (error || !conversation) {
    return { error: error?.message || "Conversation not found" };
  }

  // Get business details separately
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: business } = await (supabase as any)
    .from("businesses")
    .select("id, name, owner_id")
    .eq("id", conversation.business_id)
    .single();

  if (!business) {
    return { error: "Business not found" };
  }

  // Determine if current user is business owner or customer
  const isBusinessOwner = (business.owner_id as string | null) === user.id;
  const isCustomer = conversation.customer_id === user.id;

  if (!isBusinessOwner && !isCustomer) {
    return { error: "Unauthorized" };
  }

  return {
    conversation: {
      id: conversation.id as string,
      businessId: conversation.business_id as string,
      businessName: business.name as string,
      customerId: conversation.customer_id as string,
      createdAt: conversation.created_at as string,
    },
    currentUserId: user.id,
    isBusinessOwner,
  };
}

export async function getBusinessInboxConversations() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated", conversations: [] };
  }

  // Get the business owned by this user
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: business } = await (supabase as any)
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!business) {
    return { error: "No business found", conversations: [] };
  }

  const businessId = business.id as string;

  // Get all conversations for this business
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: conversations, error } = await (supabase as any)
    .from("conversations")
    .select("id, customer_id, created_at")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  if (error) {
    return { error: error.message, conversations: [] };
  }

  // Get customer emails for each conversation
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const customerIds = (conversations || []).map((c: any) => c.customer_id) as string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profiles } = await (supabase as any)
    .from("profiles")
    .select("id, email")
    .in("id", customerIds);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profileMap = new Map((profiles || []).map((p: any) => [p.id, p.email]));

  // Transform data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transformedConversations = (conversations || []).map((conv: any) => ({
    id: conv.id as string,
    customerId: conv.customer_id as string,
    customerEmail: (profileMap.get(conv.customer_id) || "Unknown") as string,
    createdAt: conv.created_at as string,
  }));

  return { conversations: transformedConversations };
}
