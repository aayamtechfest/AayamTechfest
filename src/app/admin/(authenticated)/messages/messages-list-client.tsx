"use client";

import { useState, useTransition } from "react";
import { markContactMessageRead, deleteContactMessage, toggleContactMessageRead } from "@/actions/contact.actions";
import { toast } from "sonner";
import { Mail, MailOpen, Trash2, Calendar, User } from "lucide-react";
import { formatDateTimeIST } from "@/lib/utils";

interface Message {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  isRead: boolean;
  createdAt: Date | string;
}

interface MessagesListClientProps {
  initialMessages: Message[];
}

export function MessagesListClient({ initialMessages }: MessagesListClientProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isPending, startTransition] = useTransition();

  const unreadCount = messages.filter((m) => !m.isRead).length;

  function handleMarkRead(id: string) {
    startTransition(async () => {
      try {
        const res = await markContactMessageRead(id);
        if (res.success) {
          setMessages((prev) =>
            prev.map((m) => (m.id === id ? { ...m, isRead: true } : m))
          );
          if (selectedMessage?.id === id) {
            setSelectedMessage((prev) => prev ? { ...prev, isRead: true } : null);
          }
          toast.success("Message marked as read");
        } else {
          toast.error(res.error || "Failed to update status");
        }
      } catch (error) {
        console.error(error);
        toast.error("Something went wrong");
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this message?")) return;
    
    startTransition(async () => {
      try {
        const res = await deleteContactMessage(id);
        if (res.success) {
          setMessages((prev) => prev.filter((m) => m.id !== id));
          if (selectedMessage?.id === id) {
            setSelectedMessage(null);
          }
          toast.success("Message deleted successfully");
        } else {
          toast.error(res.error || "Failed to delete message");
        }
      } catch (error) {
        console.error(error);
        toast.error("Something went wrong");
      }
    });
  }

  function handleToggleRead(id: string, currentReadStatus: boolean) {
    startTransition(async () => {
      try {
        const newReadStatus = !currentReadStatus;
        const res = await toggleContactMessageRead(id, newReadStatus);
        if (res.success) {
          setMessages((prev) =>
            prev.map((m) => (m.id === id ? { ...m, isRead: newReadStatus } : m))
          );
          if (selectedMessage?.id === id) {
            setSelectedMessage((prev) => prev ? { ...prev, isRead: newReadStatus } : null);
          }
          toast.success(newReadStatus ? "Message marked as read" : "Message marked as unread");
        } else {
          toast.error(res.error || "Failed to update status");
        }
      } catch (error) {
        console.error(error);
        toast.error("Something went wrong");
      }
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      {/* Inbox List */}
      <div className={selectedMessage ? "lg:col-span-6 space-y-4" : "lg:col-span-12 space-y-4"}>
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            Inbox
            {unreadCount > 0 && (
              <span className="rounded-full bg-indigo-500 px-2.5 py-0.5 text-xs font-bold text-white">
                {unreadCount} new
              </span>
            )}
          </h2>
        </div>

        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 py-12 text-center">
            <Mail className="mb-3 h-10 w-10 text-gray-600 animate-pulse" />
            <p className="text-gray-400">Your inbox is empty</p>
            <p className="mt-1 text-sm text-gray-500">
              No public messages or inquiries have been received yet.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
            {messages.map((message) => {
              const isSelected = selectedMessage?.id === message.id;
              return (
                <div
                  key={message.id}
                  onClick={() => {
                    setSelectedMessage(message);
                    if (!message.isRead) {
                      handleMarkRead(message.id);
                    }
                  }}
                  className={`cursor-pointer rounded-2xl border p-4 transition-all duration-200 hover:-translate-y-px ${
                    isSelected
                      ? "border-indigo-500 bg-indigo-500/10"
                      : message.isRead
                      ? "border-white/5 bg-white/5 hover:bg-white/[0.08]"
                      : "border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/[0.08] shadow-sm shadow-indigo-500/5"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {!message.isRead && (
                          <div className="h-2 w-2 shrink-0 rounded-full bg-indigo-400 animate-pulse" />
                        )}
                        <p className={`truncate text-sm font-semibold ${message.isRead ? "text-gray-300" : "text-white font-bold"}`}>
                          {message.name}
                        </p>
                      </div>
                      <p className="truncate text-xs text-gray-500 mt-0.5">{message.email}</p>
                      <h4 className={`truncate text-sm mt-2 ${isSelected ? "text-indigo-300 font-medium" : "text-white"}`}>
                        {message.subject || "No Subject"}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-gray-500 font-medium">
                        {formatDateTimeIST(message.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Message Reader / Detail View */}
      {selectedMessage && (
        <div className="lg:col-span-6">
          <div className="sticky top-6 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-xl flex flex-col h-full min-h-[400px]">
            {/* Header info */}
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4 mb-6">
              <div className="space-y-1 min-w-0">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                  selectedMessage.isRead 
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25" 
                    : "bg-indigo-500/10 text-indigo-400 border-indigo-500/25"
                }`}>
                  {selectedMessage.isRead ? (
                    <>
                      <MailOpen className="h-3 w-3" />
                      Read
                    </>
                  ) : (
                    <>
                      <Mail className="h-3 w-3" />
                      Unread
                    </>
                  )}
                </span>
                <h3 className="text-xl font-bold text-white tracking-tight mt-2 break-words">
                  {selectedMessage.subject || "No Subject"}
                </h3>
              </div>

              <div className="flex gap-2 shrink-0 items-center">
                <button
                  type="button"
                  onClick={() => handleToggleRead(selectedMessage.id, selectedMessage.isRead)}
                  disabled={isPending}
                  className={`flex h-9 px-3 items-center justify-center gap-1.5 rounded-xl border text-xs font-semibold transition-colors ${
                    selectedMessage.isRead
                      ? "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
                      : "bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-500"
                  }`}
                  title={selectedMessage.isRead ? "Mark as Unread" : "Mark as Read"}
                >
                  {selectedMessage.isRead ? <Mail className="h-4.5 w-4.5" /> : <MailOpen className="h-4.5 w-4.5" />}
                  <span>{selectedMessage.isRead ? "Mark Unread" : "Mark Read"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(selectedMessage.id)}
                  disabled={isPending}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10 text-red-400 transition-colors hover:bg-red-500/20"
                  title="Delete message"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Sender card details */}
            <div className="rounded-xl bg-[#16213e] p-4 space-y-3 mb-6">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-indigo-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-gray-400">From</p>
                  <p className="text-sm font-semibold text-white truncate">{selectedMessage.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-indigo-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-gray-400">Email Address</p>
                  <a href={`mailto:${selectedMessage.email}`} className="text-sm text-indigo-300 hover:underline truncate block">
                    {selectedMessage.email}
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-indigo-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-gray-400">Received Date</p>
                  <p className="text-sm text-white">{formatDateTimeIST(selectedMessage.createdAt)}</p>
                </div>
              </div>
            </div>

            {/* Message Body */}
            <div className="flex-1 whitespace-pre-wrap rounded-xl border border-white/5 bg-black/20 p-5 text-sm leading-relaxed text-gray-300 overflow-y-auto max-h-[300px]">
              {selectedMessage.message}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
