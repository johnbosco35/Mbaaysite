"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  Plus,
  Paperclip,
  Smile,
  SendIcon,
  Edit,
  Trash,
  Reply,
  Pin,
  X,
  // Check,
  Video,
  Play,
  Pause,
  Copy,
  Forward,
  ChevronRight,
  Save,
  VolumeX,
  Volume2,
  Maximize,
} from "lucide-react"
import EmojiPicker from "emoji-picker-react"

interface Message {
  id: string
  content: string
  sender: string
  timestamp: string
  isVendor: boolean
  files?: {
    type: "image" | "document" | "video"
    url: string
    name: string
    size: number
    duration?: string
  }[]
  replyTo?: string
  isPinned?: boolean
  isEdited?: boolean
  deletedFor: "none" | "me" | "everyone"
}

interface Chat {
  id: string
  name: string
  avatar: string
  lastMessage: string
  timestamp: string
  isVendor: boolean
  isOnline: boolean
  messages: Message[]
  pinnedMessageId?: string
}

interface DeleteDialogState {
  isOpen: boolean
  messageId: string | null
}

interface VideoPlayerState {
  isOpen: boolean
  videoUrl: string | null
}

interface ForwardDialogState {
  isOpen: boolean
  messageId: string | null
}

const LOCAL_STORAGE_KEY = "chatInterfaceData"

interface StoredData {
  chats: Chat[]
  activeChat: string
}

export default function ChatInterface() {
  const [chats, setChats] = useState<Chat[]>([])
  const [activeChat, setActiveChat] = useState<string>("")
  const [message, setMessage] = useState("")
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({
    isOpen: false,
    messageId: null,
  })
  const [deleteType, setDeleteType] = useState<"me" | "everyone">("me")
  const [videoPlayer, setVideoPlayer] = useState<VideoPlayerState>({
    isOpen: false,
    videoUrl: null,
  })
  const [forwardDialog, setForwardDialog] = useState<ForwardDialogState>({
    isOpen: false,
    messageId: null,
  })
  const [isPlaying, setIsPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const fallbackStorage = useRef(new Map<string, string>())

  useEffect(() => {
    loadFromLocalStorage()
  }, [])

  useEffect(() => {
    saveToLocalStorage()
  }, [chats, activeChat])

  const isLocalStorageAvailable = () => {
    try {
      localStorage.setItem("test", "test")
      localStorage.removeItem("test")
      return true
    } catch (e) {
      return false
    }
  }

  const loadFromLocalStorage = () => {
    let storedData: StoredData | null = null
    if (isLocalStorageAvailable()) {
      try {
        const data = localStorage.getItem(LOCAL_STORAGE_KEY)
        if (data) {
          storedData = JSON.parse(data)
        }
      } catch (error) {
        console.error("Failed to load from localStorage:", error)
      }
    }

    if (!storedData) {
      storedData = loadFallback()
    }

    if (storedData) {
      setChats(storedData.chats)
      setActiveChat(storedData.activeChat)
    } else {
      initializeDefaultData()
    }
  }

  const saveToLocalStorage = () => {
    const dataToStore: StoredData = {
      chats,
      activeChat,
    }
    if (isLocalStorageAvailable()) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToStore))
      } catch (error) {
        console.error("Failed to save to localStorage:", error)
        if (
          error instanceof DOMException &&
          (error.name === "QuotaExceededError" || error.name === "NS_ERROR_DOM_QUOTA_REACHED")
        ) {
          showFeedback("Local storage is full. Your changes may not persist across sessions.")
        } else {
          showFeedback("Unable to save data locally. Your changes may not persist.")
        }
        saveFallback(dataToStore)
      }
    } else {
      console.warn("localStorage is not available. Using fallback storage.")
      saveFallback(dataToStore)
      showFeedback("Unable to use local storage. Your changes may not persist across sessions.")
    }
  }

  const saveFallback = (data: StoredData) => {
    try {
      fallbackStorage.current.set(LOCAL_STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.error("Failed to save to fallback storage:", error)
      showFeedback("Unable to save data. Your changes may not persist.")
    }
  }

  const loadFallback = (): StoredData | null => {
    const data = fallbackStorage.current.get(LOCAL_STORAGE_KEY)
    if (data) {
      try {
        return JSON.parse(data)
      } catch (error) {
        console.error("Failed to parse fallback data:", error)
        return null
      }
    }
    return null
  }

  const initializeDefaultData = () => {
    const defaultChats: Chat[] = [
      {
        id: "1",
        name: "Ricky Smith",
        avatar:
          "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-02-11%20170005-w7p56CC6KmLQ43N0vioZq5pqM0k03k.png",
        lastMessage: "Hi!, How are You? 👋",
        timestamp: "2 min ago",
        isVendor: true,
        isOnline: true,
        messages: [
          {
            id: "1",
            content: "Hi!, How are You? 👋",
            sender: "Ricky Smith",
            timestamp: "11:00AM",
            isVendor: true,
            deletedFor: "none",
          },
        ],
      },
    ]
    setChats(defaultChats)
    setActiveChat("1")
  }

  const activeMessages = chats.find((chat) => chat.id === activeChat)?.messages || []
  const activeChatDetails = chats.find((chat) => chat.id === activeChat)
  const pinnedMessage = activeChatDetails?.messages.find((msg) => msg.id === activeChatDetails.pinnedMessageId)

  useEffect(() => {
    scrollToBottom()
  }, [chats, activeChat])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const newMessage: Message = {
          id: Date.now().toString(),
          content: file.name,
          sender: "You",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isVendor: false,
          files: [
            {
              type: file.type.startsWith("image/") ? "image" : "document",
              url: reader.result as string,
              name: file.name,
              size: file.size,
            },
          ],
          replyTo: replyingTo || undefined,
          deletedFor: "none",
        }
        addMessageToChat(newMessage)
        setReplyingTo(null)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const video = document.createElement("video")
        video.src = URL.createObjectURL(file)
        video.onloadedmetadata = () => {
          const duration = Math.round(video.duration)
          const minutes = Math.floor(duration / 60)
          const seconds = duration % 60
          const durationString = `${minutes}:${seconds.toString().padStart(2, "0")}`

          const newMessage: Message = {
            id: Date.now().toString(),
            content: `Video: ${file.name}`,
            sender: "You",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            isVendor: false,
            files: [
              {
                type: "video",
                url: reader.result as string,
                name: file.name,
                size: file.size,
                duration: durationString,
              },
            ],
            replyTo: replyingTo || undefined,
            deletedFor: "none",
          }
          addMessageToChat(newMessage)
          setReplyingTo(null)
          URL.revokeObjectURL(video.src)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleEmojiSelect = (emoji: string) => {
    setMessage((prev) => prev + emoji)
  }

  const handleSendMessage = () => {
    const trimmed = message.trim()
    if (!trimmed) {
      return
    }

    const replyToId = replyingTo || undefined

    // Clear input and UI states first for snappier UX
    setMessage("")
    setReplyingTo(null)
    setShowEmojiPicker(false)

    const newMessage: Message = {
      id: Date.now().toString(),
      content: trimmed,
      sender: "You",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isVendor: false,
      replyTo: replyToId,
      deletedFor: "none",
    }

    addMessageToChat(newMessage)
  }

  const addMessageToChat = (newMessage: Message) => {
    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === activeChat
          ? {
              ...chat,
              messages: [...chat.messages, newMessage],
              lastMessage: `You: ${newMessage.content.slice(0, 20)}${newMessage.content.length > 20 ? "..." : ""}`,
              timestamp: "Just now",
            }
          : chat,
      ),
    )
  }

  const handleReply = (messageId: string) => {
    setReplyingTo(messageId)
    showFeedback("Replying to message")
  }

  const handleDeleteClick = (messageId: string) => {
    setDeleteDialog({
      isOpen: true,
      messageId,
    })
  }

  const handleDeleteConfirm = () => {
    if (deleteDialog.messageId) {
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === activeChat
            ? {
                ...chat,
                messages: chat.messages.map((msg) =>
                  msg.id === deleteDialog.messageId ? { ...msg, deletedFor: deleteType } : msg,
                ),
                pinnedMessageId: chat.pinnedMessageId === deleteDialog.messageId ? undefined : chat.pinnedMessageId,
              }
            : chat,
        ),
      )
      showFeedback(`Message deleted ${deleteType === "me" ? "for you" : "for everyone"}`)
    }
    setDeleteDialog({ isOpen: false, messageId: null })
    setDeleteType("me")
  }

  const handleDeleteCancel = () => {
    setDeleteDialog({ isOpen: false, messageId: null })
    setDeleteType("me")
  }

  const handleEdit = (messageId: string) => {
    setEditingMessageId(messageId)
    const messageToEdit = activeMessages.find((msg) => msg.id === messageId)
    if (messageToEdit) {
      setMessage(messageToEdit.content)
    }
    showFeedback("Editing message")
  }

  const handleSaveEdit = () => {
    if (editingMessageId) {
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === activeChat
            ? {
                ...chat,
                messages: chat.messages.map((msg) =>
                  msg.id === editingMessageId
                    ? {
                        ...msg,
                        content: message,
                        isEdited: true,
                        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                      }
                    : msg,
                ),
              }
            : chat,
        ),
      )
      setEditingMessageId(null)
      setMessage("")
      showFeedback("Message edited")
    }
  }

  const handlePin = (messageId: string) => {
    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === activeChat
          ? {
              ...chat,
              pinnedMessageId: chat.pinnedMessageId === messageId ? undefined : messageId,
            }
          : chat,
      ),
    )
    showFeedback(activeChatDetails?.pinnedMessageId === messageId ? "Message unpinned" : "Message pinned")
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " bytes"
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB"
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + " MB"
    else return (bytes / 1073741824).toFixed(1) + " GB"
  }

  const handlePlayVideo = (videoUrl: string) => {
    setVideoPlayer({ isOpen: true, videoUrl })
  }

  const handleCloseVideoPlayer = () => {
    setVideoPlayer({ isOpen: false, videoUrl: null })
    setIsPlaying(false)
    setIsMuted(false)
  }

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleCopyText = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        showFeedback("Message copied to clipboard")
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err)
        showFeedback("Failed to copy message")
      })
  }

  const handleForward = (messageId: string) => {
    setForwardDialog({
      isOpen: true,
      messageId,
    })
  }

  const handleForwardMessage = (targetChatId: string) => {
    if (forwardDialog.messageId) {
      const messageToForward = activeMessages.find((m) => m.id === forwardDialog.messageId)
      if (messageToForward) {
        const forwardedMessage: Message = {
          ...messageToForward,
          id: Date.now().toString(),
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }

        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat.id === targetChatId
              ? {
                  ...chat,
                  messages: [...chat.messages, forwardedMessage],
                  lastMessage: `You: ${forwardedMessage.content.slice(0, 20)}${forwardedMessage.content.length > 20 ? "..." : ""}`,
                  timestamp: "Just now",
                }
              : chat,
          ),
        )
        showFeedback("Message forwarded")
      }
    }
    setForwardDialog({ isOpen: false, messageId: null })
  }

  const showFeedback = (message: string) => {
    setFeedbackMessage(message)
    setTimeout(() => setFeedbackMessage(null), 3000)
  }

  const handleSaveVideo = (videoUrl: string) => {
    const link = document.createElement("a")
    link.href = videoUrl
    link.download = "video.mp4"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showFeedback("Video saved to device")
  }

  const handleToggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted
      setIsMuted(!isMuted)
    }
  }

  const handleToggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        videoRef.current.requestFullscreen()
      }
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  useEffect(() => {
    const videoElement = videoRef.current
    if (videoElement) {
      const updateTime = () => setCurrentTime(videoElement.currentTime)
      const updateDuration = () => setDuration(videoElement.duration)

      videoElement.addEventListener("timeupdate", updateTime)
      videoElement.addEventListener("loadedmetadata", updateDuration)

      return () => {
        videoElement.removeEventListener("timeupdate", updateTime)
        videoElement.removeEventListener("loadedmetadata", updateDuration)
      }
    }
  }, [videoPlayer.isOpen])

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Chat List Sidebar */}
      <motion.div initial={{ x: -300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="w-80 border-r bg-white">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold">Chats</h1>
            <motion.button className="p-2 hover:bg-gray-100 rounded-full">
              <Plus className="w-5 h-5" />
            </motion.button>
          </div>
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search message"
              className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>
        <div className="overflow-y-auto h-[calc(100vh-120px)]">
          <AnimatePresence>
            {chats.map((chat) => (
              <motion.button
                key={chat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                whileHover={{ backgroundColor: "rgba(0,0,0,0.05)" }}
                onClick={() => setActiveChat(chat.id)}
                className={`w-full p-4 flex items-start gap-3 border-b ${activeChat === chat.id ? "bg-orange-50" : ""}`}
              >
                <div className="relative">
                  <img src={chat.avatar || "/placeholder.svg"} alt={chat.name} className="w-12 h-12 rounded-full" />
                  {chat.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{chat.name}</p>
                      <span className="text-xs text-orange-500">{chat.isVendor ? "Vendor" : "Customer"}</span>
                    </div>
                    <span className="text-xs text-gray-500">{chat.timestamp}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{chat.lastMessage}</p>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        {activeChatDetails && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="p-4 border-b bg-white flex items-center gap-3"
          >
            <div className="relative">
              <img
                src={activeChatDetails.avatar || "/placeholder.svg"}
                alt={activeChatDetails.name}
                className="w-10 h-10 rounded-full"
              />
              {activeChatDetails.isOnline && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
              )}
            </div>
            <div>
              <h2 className="font-semibold">{activeChatDetails.name}</h2>
              <span className="text-xs text-green-500">{activeChatDetails.isOnline ? "Online" : "Offline"}</span>
            </div>
          </motion.div>
        )}

        {/* Pinned Message */}
        {pinnedMessage && (
          <div className="bg-orange-100 p-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Pin className="w-4 h-4 text-orange-500" />
              <p className="text-sm text-orange-700 truncate">{pinnedMessage.content}</p>
            </div>
            <motion.button onClick={() => handlePin(pinnedMessage.id)} className="text-orange-500 hover:text-orange-700">
              <X className="w-4 h-4" />
            </motion.button>
          </div>
        )}

        {/* Feedback Message */}
        {feedbackMessage && <div className="bg-green-100 p-2 text-center text-green-800">{feedbackMessage}</div>}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          <AnimatePresence initial={false}>
            {activeMessages
              .filter((msg) => msg.deletedFor !== "everyone" && msg.deletedFor !== "me")
              .map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`flex gap-3 mb-4 ${msg.isVendor ? "" : "justify-end"}`}
                >
                  {msg.isVendor && activeChatDetails && (
                    <img
                      src={activeChatDetails.avatar || "/placeholder.svg"}
                      alt={msg.sender}
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <div className={`max-w-[70%] ${msg.isVendor ? "order-2" : "order-1"}`}>
                    {msg.replyTo && (
                      <div className="bg-gray-100 p-2 rounded-t-lg text-sm text-gray-600 mb-1">
                        Replying to: {activeMessages.find((m) => m.id === msg.replyTo)?.content.slice(0, 50)}...
                      </div>
                    )}
                    <div className={`p-3 rounded-lg ${msg.isVendor ? "bg-white border" : "bg-orange-500 text-white"}`}>
                      {msg.files?.map((file, i) => (
                        <div key={i} className="mb-2">
                          {file.type === "image" ? (
                            <img
                              src={file.url || "/placeholder.svg"}
                              alt={file.name}
                              className="max-w-full rounded-lg cursor-pointer"
                              onClick={() => window.open(file.url, "_blank")}
                            />
                          ) : file.type === "video" ? (
                            <div className="relative">
                              <div
                                className="relative cursor-pointer rounded-lg overflow-hidden bg-black"
                                onClick={() => handlePlayVideo(file.url)}
                              >
                                <video src={file.url} className="w-full" poster={file.url} />
                                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
                                  <Play className="w-12 h-12 text-white" />
                                </div>
                                <div className="absolute bottom-2 left-2 text-white text-sm">{file.duration}</div>
                                <div className="absolute bottom-2 right-2 text-white text-sm">
                                  {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 bg-white/10 p-2 rounded">
                              <Paperclip className="w-4 h-4" />
                              <span>
                                {file.name} ({formatFileSize(file.size)})
                              </span>
                              <button
                                onClick={() => window.open(file.url, "_blank")}
                                className="ml-2 text-blue-500 hover:text-blue-700"
                              >
                                View
                              </button>
                              <a
                                href={file.url}
                                download={file.name}
                                className="ml-2 text-green-500 hover:text-green-700"
                              >
                                Download
                              </a>
                            </div>
                          )}
                        </div>
                      ))}
                      <p className="whitespace-pre-line">{msg.content}</p>
                    </div>
                    <div
                      className={`flex items-center gap-1 mt-1 text-xs text-gray-500 ${
                        msg.isVendor ? "justify-start" : "justify-end"
                      }`}
                    >
                      {msg.timestamp}
                      {msg.isEdited && <span className="text-gray-400 ml-1">(edited)</span>}
                      <div className="flex gap-2 ml-2">
                        <button onClick={() => handleReply(msg.id)} className="hover:text-orange-500 group relative">
                          <Reply className="w-4 h-4" />
                          <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            Reply
                          </span>
                        </button>
                        <button
                          onClick={() => handleCopyText(msg.content)}
                          className="hover:text-orange-500 group relative"
                        >
                          <Copy className="w-4 h-4" />
                          <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            Copy
                          </span>
                        </button>
                        <button onClick={() => handleForward(msg.id)} className="hover:text-orange-500 group relative">
                          <Forward className="w-4 h-4" />
                          <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            Forward
                          </span>
                        </button>
                        {!msg.isVendor && (
                          <>
                            <button onClick={() => handleEdit(msg.id)} className="hover:text-orange-500 group relative">
                              <Edit className="w-4 h-4" />
                              <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                Edit
                              </span>
                            </button>
                            <button
                              onClick={() => handleDeleteClick(msg.id)}
                              className="hover:text-orange-500 group relative"
                            >
                              <Trash className="w-4 h-4" />
                              <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                Delete
                              </span>
                            </button>
                          </>
                        )}
                        <button onClick={() => handlePin(msg.id)} className="hover:text-orange-500 group relative">
                          <Pin className="w-4 h-4" />
                          <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {msg.isPinned ? "Unpin" : "Pin"}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                  {!msg.isVendor && <img src="/placeholder.svg" alt="You" className="w-8 h-8 rounded-full order-3" />}
                </motion.div>
              ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Reply Preview */}
        {replyingTo && (
          <div className="bg-gray-100 p-2 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Replying to: {activeMessages.find((m) => m.id === replyingTo)?.content.slice(0, 50)}...
            </p>
            <motion.button onClick={() => setReplyingTo(null)} className="text-gray-500 hover:text-gray-700">
              <X className="w-4 h-4" />
            </motion.button>
          </div>
        )}

        {/* Message Input */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="p-4 border-t bg-white relative"
        >
          <div className="flex items-center gap-2">
            <motion.input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
            <motion.input type="file" ref={videoInputRef} className="hidden" accept="video/*" onChange={handleVideoUpload} />
            <motion.button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-gray-100 rounded-full">
              <Paperclip className="w-5 h-5 text-gray-500" />
            </motion.button>
            <motion.button type="button" onClick={() => videoInputRef.current?.click()} className="p-2 hover:bg-gray-100 rounded-full">
              <Video className="w-5 h-5 text-gray-500" />
            </motion.button>

            <div className="flex-1 relative">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={editingMessageId ? "Edit message..." : "Write Something..."}
                className="w-full pl-4 pr-10 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    editingMessageId ? handleSaveEdit() : handleSendMessage()
                  }
                }}
              />
              <motion.button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="absolute right-10 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full"
              >
                <Smile className="w-5 h-5 text-gray-500" />
              </motion.button>
              <motion.button
                type="button"
                onClick={editingMessageId ? handleSaveEdit : handleSendMessage}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-orange-600 bg-orange-500 rounded-full text-white"
              >
                <SendIcon className="w-5 h-5" />
              </motion.button>
            </div>
            {/* <button
              onClick={editingMessageId ? handleSaveEdit : handleSendMessage}
              className="p-2 bg-orange-500 hover:bg-orange-600 rounded-full text-white"
            >
              {editingMessageId ? <Check className="w-5 h-5" /> : <SendIcon className="w-5 h-5" />}
            </button> */}
          </div>

          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div className="absolute bottom-full right-0 mb-2 bg-white border rounded-lg shadow-lg">
              <EmojiPicker
                onEmojiClick={(emojiObject) => handleEmojiSelect(emojiObject.emoji)}
                autoFocusSearch={false}
                // native
              />
            </div>
          )}
        </motion.div>
      </div>

      {/* Delete Dialog */}
      {deleteDialog.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Delete message?</h3>
            <p className="text-sm text-gray-600 mb-4">You can delete messages for everyone or just for yourself.</p>
            <div className="space-y-2 mb-6">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="deleteType"
                  value="me"
                  checked={deleteType === "me"}
                  onChange={() => setDeleteType("me")}
                  className="mr-2"
                />
                <span>Delete for me</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="deleteType"
                  value="everyone"
                  checked={deleteType === "everyone"}
                  onChange={() => setDeleteType("everyone")}
                  className="mr-2"
                />
                <span>Delete for everyone</span>
              </label>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleDeleteCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Video Player */}
      {videoPlayer.isOpen && videoPlayer.videoUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 w-full max-w-4xl aspect-video relative">
            <div className="absolute top-2 right-2 flex items-center gap-2 z-10">
              <motion.button
                onClick={() => handleSaveVideo(videoPlayer.videoUrl!)}
                className="p-2 bg-gray-800 hover:bg-gray-700 rounded-full text-white"
              >
                <Save className="w-5 h-5" />
              </motion.button>
              <motion.button
                onClick={handleCloseVideoPlayer}
                className="p-2 bg-gray-800 hover:bg-gray-700 rounded-full text-white"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>
            <div className="relative w-full h-full">
              <video
                ref={videoRef}
                src={videoPlayer.videoUrl}
                className="w-full h-full rounded-lg object-contain"
                onClick={handlePlayPause}
                controls
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePlayPause}
                      className="p-2 bg-gray-800 hover:bg-gray-700 rounded-full text-white"
                    >
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={handleToggleMute}
                      className="p-2 bg-gray-800 hover:bg-gray-700 rounded-full text-white"
                    >
                      {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </button>
                    <div className="text-white text-sm">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.button
                      onClick={handleToggleFullscreen}
                      className="p-2 bg-gray-800 hover:bg-gray-700 rounded-full text-white"
                    >
                      <Maximize className="w-5 h-5" />
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Forward Dialog */}
      {forwardDialog.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Forward Message</h3>
            <div className="max-h-96 overflow-y-auto">
              {chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => handleForwardMessage(chat.id)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg"
                >
                  <img src={chat.avatar || "/placeholder.svg"} alt={chat.name} className="w-10 h-10 rounded-full" />
                  <div className="flex-1 text-left">
                    <p className="font-semibold">{chat.name}</p>
                    <span className="text-xs text-orange-500">{chat.isVendor ? "Vendor" : "Customer"}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setForwardDialog({ isOpen: false, messageId: null })}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

