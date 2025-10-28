"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { Send, ImageIcon, MessageSquare, Loader2 } from "lucide-react"
import { put } from "@vercel/blob"

interface ChatInterfaceProps {
  currentUser: any
  conversations: any[]
  farmers: any[]
}

export function ChatInterface({ currentUser, conversations: initialConversations, farmers }: ChatInterfaceProps) {
  const [conversations, setConversations] = useState(initialConversations)
  const [selectedConversation, setSelectedConversation] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createBrowserClient()
  const { toast } = useToast()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id)
    }
  }, [selectedConversation])

  const loadMessages = async (conversationId: string) => {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })

    if (!error && data) {
      setMessages(data)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return

    setLoading(true)
    try {
      const senderType = currentUser.role === "farmer" ? "farmer" : "agent"
      const senderId = currentUser.role === "farmer" ? selectedConversation.farmer_id : currentUser.id

      const { data, error } = await supabase
        .from("chat_messages")
        .insert([
          {
            conversation_id: selectedConversation.id,
            sender_id: senderId,
            sender_type: senderType,
            message_type: "text",
            content: newMessage,
          },
        ])
        .select()
        .single()

      if (error) throw error

      setMessages([...messages, data])
      setNewMessage("")
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedConversation) return

    setUploading(true)
    try {
      // Upload to Vercel Blob
      const blob = await put(`chat/${Date.now()}-${file.name}`, file, {
        access: "public",
      })

      const senderType = currentUser.role === "farmer" ? "farmer" : "agent"
      const senderId = currentUser.role === "farmer" ? selectedConversation.farmer_id : currentUser.id

      const { data, error } = await supabase
        .from("chat_messages")
        .insert([
          {
            conversation_id: selectedConversation.id,
            sender_id: senderId,
            sender_type: senderType,
            message_type: "image",
            image_url: blob.url,
          },
        ])
        .select()
        .single()

      if (error) throw error

      setMessages([...messages, data])
      toast({
        title: "Success",
        description: "Image sent successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const getOtherPartyName = (conversation: any) => {
    if (currentUser.role === "farmer") {
      return `${conversation.agents.first_name} ${conversation.agents.last_name}`
    }
    return `${conversation.farmers.first_name} ${conversation.farmers.last_name}`
  }

  return (
    <div className="flex h-[calc(100vh-80px)]">
      {/* Conversations List */}
      <div className="w-80 border-r border-[rgba(0,0,0,0.12)] bg-white">
        <div className="p-4 border-b border-[rgba(0,0,0,0.12)]">
          <h2 className="text-lg font-poppins font-semibold text-[#000000]">Messages</h2>
          <p className="text-xs text-[rgba(0,0,0,0.65)] font-inter mt-1">
            {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
          </p>
        </div>
        <ScrollArea className="h-[calc(100vh-160px)]">
          {conversations.length > 0 ? (
            <div className="p-2">
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation)}
                  className={`w-full p-3 rounded-[10px] mb-2 text-left transition-colors ${
                    selectedConversation?.id === conversation.id ? "bg-[rgba(57,181,74,0.1)]" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-[#39B54A] text-white font-semibold text-sm">
                        {getOtherPartyName(conversation)
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-inter font-medium text-sm text-[#000000] truncate">
                        {getOtherPartyName(conversation)}
                      </p>
                      <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter">
                        {new Date(conversation.last_message_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-[rgba(0,0,0,0.25)] mx-auto mb-3" />
              <p className="text-sm text-[rgba(0,0,0,0.45)] font-inter">No conversations yet</p>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-[rgba(0,0,0,0.12)] bg-white">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-[#39B54A] text-white font-semibold text-sm">
                    {getOtherPartyName(selectedConversation)
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-inter font-semibold text-[#000000]">{getOtherPartyName(selectedConversation)}</p>
                  <p className="text-xs text-[rgba(0,0,0,0.45)] font-inter">
                    {currentUser.role === "farmer" ? "Extension Agent" : "Farmer"}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => {
                  const isOwnMessage =
                    (currentUser.role === "farmer" && message.sender_type === "farmer") ||
                    (currentUser.role !== "farmer" && message.sender_type === "agent")

                  return (
                    <div key={message.id} className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[70%] rounded-[15px] p-3 ${
                          isOwnMessage
                            ? "bg-[#39B54A] text-white"
                            : "bg-white border border-[rgba(0,0,0,0.12)] text-[#000000]"
                        }`}
                      >
                        {message.message_type === "text" ? (
                          <p className="text-sm font-inter">{message.content}</p>
                        ) : (
                          <img
                            src={message.image_url || "/placeholder.svg"}
                            alt="Shared image"
                            className="rounded-[10px] max-w-full h-auto"
                          />
                        )}
                        <p
                          className={`text-xs mt-1 ${isOwnMessage ? "text-white/70" : "text-[rgba(0,0,0,0.45)]"} font-inter`}
                        >
                          {new Date(message.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-[rgba(0,0,0,0.12)] bg-white">
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="h-10 w-10 rounded-full hover:bg-gray-100"
                >
                  {uploading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-[#39B54A]" />
                  ) : (
                    <ImageIcon className="h-5 w-5 text-[rgba(0,0,0,0.65)]" />
                  )}
                </Button>
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 rounded-[10px] border-[rgba(0,0,0,0.12)] font-inter"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={loading || !newMessage.trim()}
                  className="bg-[#39B54A] hover:bg-[#2D5016] text-white rounded-[10px] font-inter"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="h-16 w-16 text-[rgba(0,0,0,0.25)] mx-auto mb-4" />
              <h3 className="text-lg font-poppins font-semibold text-[#000000] mb-2">No conversation selected</h3>
              <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter">Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
