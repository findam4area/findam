"use client";

/**
 * Barter Negotiation Thread Component
 *
 * Dedicated messaging interface for exchange negotiations.
 * Displays proposal details and allows back-and-forth communication.
 *
 * Requirements: 12.7
 */

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { Send, ArrowLeftRight, CheckCircle, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: {
    username: string;
    avatar_url: string | null;
  };
}

interface BarterNegotiationThreadProps {
  proposalId: string;
  currentUserId: string;
}

export function BarterNegotiationThread({
  proposalId,
  currentUserId,
}: BarterNegotiationThreadProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [proposal, setProposal] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient() as any;

  // Fetch proposal details
  useEffect(() => {
    async function fetchProposal() {
      const { data, error } = await (supabase.from("barter_proposals") as any)
        .select(
          `
          *,
          target_listing:listings!target_listing_id(id, title, price, images),
          offered_listing:listings!offered_listing_id(id, title, price, images),
          proposer:users!proposer_id(id, username, avatar_url),
          receiver:users!receiver_id(id, username, avatar_url)
        `,
        )
        .eq("id", proposalId)
        .single();

      if (!error && data) {
        setProposal(data as any);
      }
    }

    fetchProposal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proposalId]);

  // Fetch messages
  useEffect(() => {
    async function fetchMessages() {
      const { data, error } = await (supabase.from("barter_messages") as any)
        .select(
          `
          *,
          sender:users!sender_id(username, avatar_url)
        `,
        )
        .eq("proposal_id", proposalId)
        .order("created_at", { ascending: true });

      if (!error && data) {
        setMessages(data as any);
      }
    }

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`barter_messages:${proposalId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "barter_messages",
          filter: `proposal_id=eq.${proposalId}`,
        },
        async (payload: any) => {
          // Fetch the full message with sender info
          const { data } = await (supabase.from("barter_messages") as any)
            .select(
              `
              *,
              sender:users!sender_id(username, avatar_url)
            `,
            )
            .eq("id", payload.new.id)
            .single();

          if (data) {
            setMessages((prev) => [...prev, data as any]);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proposalId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || loading) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("barter_messages").insert({
        proposal_id: proposalId,
        sender_id: currentUserId,
        content: newMessage.trim(),
      });

      if (!error) {
        setNewMessage("");
      }
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!proposal) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">Loading...</div>
      </Card>
    );
  }

  const isProposer = currentUserId === proposal.proposer_id;
  const otherUser = isProposer ? proposal.receiver : proposal.proposer;

  return (
    <div className="flex flex-col h-full">
      {/* Proposal Summary Header */}
      <Card className="p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Exchange Proposal</h3>
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              proposal.status === "accepted"
                ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                : proposal.status === "rejected"
                  ? "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                  : proposal.status === "countered"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                    : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
            }`}
          >
            {proposal.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground mb-1">
              {isProposer ? "You offer" : "They offer"}
            </p>
            <p className="font-medium truncate">
              {proposal.offered_listing.title}
            </p>
            <p className="text-muted-foreground">
              ₦{proposal.offered_listing.price.toLocaleString()}
            </p>
          </div>

          <div className="flex items-center justify-center">
            <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
          </div>

          <div>
            <p className="text-muted-foreground mb-1">
              {isProposer ? "They offer" : "You offer"}
            </p>
            <p className="font-medium truncate">
              {proposal.target_listing.title}
            </p>
            <p className="text-muted-foreground">
              ₦{proposal.target_listing.price.toLocaleString()}
            </p>
          </div>
        </div>

        {proposal.value_difference !== 0 && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Value difference:</span>
              <span className="font-medium">
                ₦{Math.abs(proposal.value_difference).toLocaleString()}
              </span>
            </div>
            {proposal.cash_adjustment > 0 && (
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-muted-foreground">Cash adjustment:</span>
                <span className="font-medium">
                  ₦{proposal.cash_adjustment.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        )}

        {proposal.message && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-sm text-muted-foreground">Initial message:</p>
            <p className="text-sm mt-1">{proposal.message}</p>
          </div>
        )}
      </Card>

      {/* Messages Thread */}
      <Card className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((message) => {
              const isCurrentUser = message.sender_id === currentUserId;
              return (
                <div
                  key={message.id}
                  className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      isCurrentUser
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {!isCurrentUser && (
                      <p className="text-xs font-medium mb-1">
                        {message.sender?.username}
                      </p>
                    )}
                    <p className="text-sm">{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        isCurrentUser
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground"
                      }`}
                    >
                      {formatDistanceToNow(new Date(message.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        {proposal.status === "pending" || proposal.status === "countered" ? (
          <form onSubmit={handleSendMessage} className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                disabled={loading}
                maxLength={500}
              />
              <Button
                type="submit"
                size="icon"
                disabled={loading || !newMessage.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        ) : (
          <div className="p-4 border-t bg-muted/50 text-center text-sm text-muted-foreground">
            This proposal has been {proposal.status}. No further messages can be
            sent.
          </div>
        )}
      </Card>
    </div>
  );
}
