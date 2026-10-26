"use client";

import { useState, useRef, useEffect } from "react";
import { useMessaging } from "@/lib/hooks/useMessaging";
import { uploadMessageImage } from "@/lib/api/messages";
import { hidePhoneNumbers, revealPhoneNumbers } from "@/lib/utils/phone-utils";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import Image from "next/image";
import DOMPurify from "dompurify";
import {
  Send,
  Image as ImageIcon,
  AlertTriangle,
  ArrowLeft,
  MoreVertical,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Message, User } from "@/lib/types";

interface ChatWindowProps {
  conversationId: string;
  currentUser: User;
  otherUser: User;
  isOnline: boolean;
  onBack?: () => void;
}

export function ChatWindow({
  conversationId,
  currentUser,
  otherUser,
  isOnline,
  onBack,
}: ChatWindowProps) {
  const { messages, isLoading, typingUsers, sendMessage, handleTyping } =
    useMessaging(conversationId, currentUser.id);

  const [messageText, setMessageText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [showScamWarning, setShowScamWarning] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Check for scam patterns
  useEffect(() => {
    const scamKeywords = [
      "wire transfer",
      "send money first",
      "western union",
      "moneygram",
      "bank transfer only",
      "pay before delivery",
    ];

    const hasScamPattern = messages.some((msg) =>
      scamKeywords.some((keyword) =>
        msg.content.toLowerCase().includes(keyword),
      ),
    );

    setShowScamWarning(hasScamPattern);
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;

    try {
      await sendMessage(messageText);
      setMessageText("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const imageUrl = await uploadMessageImage(file);
      await sendMessage("", imageUrl);
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const isTyping = typingUsers.length > 0;

  return (
    <div className="flex flex-col h-full bg-dark-bg">
      {/* Header */}
      <div className="p-4 border-b border-dark-border flex items-center gap-3 bg-dark-card">
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="md:hidden"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}

        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-naija-green to-neon-cyan flex items-center justify-center text-white font-bold">
            {otherUser.avatar_url ? (
              <Image
                src={otherUser.avatar_url}
                alt={otherUser.username}
                width={40}
                height={40}
                className="rounded-full object-cover"
              />
            ) : (
              otherUser.username.charAt(0).toUpperCase()
            )}
          </div>
          {isOnline && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-dark-card" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white truncate">
            {otherUser.username}
          </h3>
          <p className="text-xs text-gray-400">
            {isOnline ? "Online" : "Offline"}
          </p>
        </div>

        <Button variant="ghost" size="icon">
          <MoreVertical className="w-5 h-5" />
        </Button>
      </div>

      {/* Scam Warning */}
      {showScamWarning && (
        <div className="bg-red-500/10 border-l-4 border-red-500 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-red-500 mb-1">
              Scam Protection Warning
            </h4>
            <p className="text-sm text-gray-300">
              This conversation contains suspicious keywords. Never send money
              before receiving the item. Meet in public places and inspect items
              before payment.
            </p>
          </div>
        </div>
      )}

      {/* Safety Tips */}
      <div className="bg-naija-green/10 border-l-4 border-naija-green p-3 flex items-start gap-2">
        <div className="flex-1">
          <p className="text-xs text-gray-300">
            💡 <strong>Safety Tip:</strong> Meet in public places, inspect items
            before payment, and never share sensitive information.
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-naija-green" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const isOwn = message.sender_id === currentUser.id;
              const showTimestamp =
                index === 0 ||
                new Date(message.created_at).getTime() -
                  new Date(messages[index - 1].created_at).getTime() >
                  300000; // 5 minutes

              return (
                <div key={message.id}>
                  {showTimestamp && (
                    <div className="text-center text-xs text-gray-400 my-4">
                      {format(new Date(message.created_at), "MMM d, h:mm a")}
                    </div>
                  )}
                  <MessageBubble message={message} isOwn={isOwn} />
                </div>
              );
            })}
          </>
        )}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:100ms]" />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:200ms]" />
            </div>
            <span>{otherUser.username} is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-dark-border bg-dark-card">
        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            aria-label="Upload image"
          />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex-shrink-0"
          >
            <ImageIcon className="w-5 h-5" />
          </Button>

          <Textarea
            value={messageText}
            onChange={(e) => {
              setMessageText(e.target.value);
              handleTyping();
            }}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 min-h-[44px] max-h-32 resize-none bg-dark-bg border-dark-border text-white"
            rows={1}
          />

          <Button
            onClick={handleSendMessage}
            disabled={!messageText.trim() || isUploading}
            className="flex-shrink-0 bg-naija-green hover:bg-naija-green/90"
            size="icon"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const [revealedPhones, setRevealedPhones] = useState<Set<number>>(new Set());

  // Sanitize content when displaying (Requirement 6.9)
  const sanitizedContent = DOMPurify.sanitize(message.content, {
    ALLOWED_TAGS: [], // Strip all HTML tags
    ALLOWED_ATTR: [], // Strip all attributes
  });

  // Hide phone numbers in message content (Requirement 6.10)
  const { text: hiddenText, phoneNumbers } = hidePhoneNumbers(sanitizedContent);

  // Split text by phone placeholders to render reveal buttons
  const renderMessageContent = () => {
    if (phoneNumbers.length === 0) {
      return <p className="text-sm break-words">{sanitizedContent}</p>;
    }

    const parts: React.ReactNode[] = [];
    let currentText = hiddenText;
    let lastIndex = 0;

    phoneNumbers.forEach((phone, index) => {
      const placeholder = `[PHONE_${index}]`;
      const placeholderIndex = currentText.indexOf(placeholder);

      if (placeholderIndex !== -1) {
        // Add text before placeholder
        if (placeholderIndex > 0) {
          parts.push(
            <span key={`text-${index}`}>
              {currentText.substring(0, placeholderIndex)}
            </span>,
          );
        }

        // Add reveal button or revealed phone
        if (revealedPhones.has(index)) {
          // Show formatted phone number (Requirement 6.11)
          const formattedPhone = revealPhoneNumbers("", [phone]).trim();
          parts.push(
            <span
              key={`phone-${index}`}
              className="font-mono font-semibold underline"
            >
              {formattedPhone}
            </span>,
          );
        } else {
          // Show "Tap to Reveal" button (Requirement 6.10)
          parts.push(
            <button
              key={`reveal-${index}`}
              onClick={() => {
                setRevealedPhones((prev) => new Set(prev).add(index));
              }}
              className={cn(
                "inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold",
                "transition-colors",
                isOwn
                  ? "bg-white/20 hover:bg-white/30 text-white"
                  : "bg-naija-green/20 hover:bg-naija-green/30 text-naija-green",
              )}
            >
              <Eye className="w-3 h-3" />
              Tap to Reveal
            </button>,
          );
        }

        // Update current text to remaining part
        currentText = currentText.substring(
          placeholderIndex + placeholder.length,
        );
      }
    });

    // Add remaining text
    if (currentText) {
      parts.push(<span key="text-end">{currentText}</span>);
    }

    return <div className="text-sm break-words space-x-1">{parts}</div>;
  };

  return (
    <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[70%] rounded-2xl px-4 py-2",
          isOwn
            ? "bg-naija-green text-white rounded-br-sm"
            : "bg-dark-card text-white rounded-bl-sm",
        )}
      >
        {message.media_url && (
          <Image
            src={message.media_url}
            alt="Shared image"
            width={300}
            height={200}
            className="rounded-lg mb-2 max-w-full h-auto"
          />
        )}
        {message.content && renderMessageContent()}
        <div
          className={cn(
            "text-xs mt-1 flex items-center gap-1",
            isOwn ? "text-white/70" : "text-gray-400",
          )}
        >
          <span>{format(new Date(message.created_at), "h:mm a")}</span>
          {isOwn && message.is_read && <span>✓✓</span>}
        </div>
      </div>
    </div>
  );
}
