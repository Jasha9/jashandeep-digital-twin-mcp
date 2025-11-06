'use client'

import React, { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ChatbotWidgetProps {
  isOpen?: boolean
  onToggle?: () => void
}

const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({ isOpen = false, onToggle }) => {
  const [isChatOpen, setIsChatOpen] = useState(isOpen)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m Jashandeep\'s Digital Twin. Ask me anything about his experience, skills, or projects! 🤖\n\n💡 **Tip**: Please wait 30 seconds between questions to avoid rate limits.',
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [lastRequestTime, setLastRequestTime] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Sync with external state
  useEffect(() => {
    setIsChatOpen(isOpen)
  }, [isOpen])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const toggleChat = () => {
    const newState = !isChatOpen
    setIsChatOpen(newState)
    onToggle?.()
    console.log('Chat toggled:', newState)
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    // Rate limiting: enforce 15-second minimum between requests
    const now = Date.now()
    const timeSinceLastRequest = now - lastRequestTime
    const minInterval = 15000 // 15 seconds

    if (timeSinceLastRequest < minInterval && lastRequestTime > 0) {
      const waitTime = Math.ceil((minInterval - timeSinceLastRequest) / 1000)
      const rateLimitMessage: Message = {
        role: 'assistant',
        content: `⏳ **Please wait ${waitTime} more seconds** before asking another question to avoid rate limits. This ensures reliable responses! 🤖`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, rateLimitMessage])
      return
    }

    const userMessage: Message = {
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)
    setLastRequestTime(now)

    try {
      const response = await fetch('/api/digital-twin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: userMessage.content
        }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response')
      }
      
      let assistantMessage: Message

      // Handle rate limiting specifically
      if (!data.success && data.error && data.error.includes('Rate limit exceeded')) {
        assistantMessage = {
          role: 'assistant',
          content: '⏳ **Rate Limit Reached** - Please wait 30-60 seconds before your next question. Your Digital Twin services (Groq AI + Upstash) are working perfectly - just need a brief pause! 🤖✨',
          timestamp: new Date()
        }
      } else {
        assistantMessage = {
          role: 'assistant',
          content: data.success ? (data.answer || 'Sorry, I couldn\'t find an answer.') : (data.error || 'Sorry, I couldn\'t process that request.'),
          timestamp: new Date()
        }
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Chat error:', error)
      
      let errorContent = 'Sorry, I\'m having trouble connecting right now. Please try again in a moment.'
      
      if (error instanceof Error && error.message.includes('Rate limit')) {
        errorContent = '⏳ **Rate Limit** - Please wait 30-60 seconds between questions. Your services need a brief pause! 🤖'
      }
      
      const errorMessage: Message = {
        role: 'assistant',
        content: errorContent,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {/* Backdrop overlay when chat is open */}
      {isChatOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[99990]"
          style={{ position: 'fixed', zIndex: 99990 }}
          onClick={toggleChat}
        />
      )}
      
      {/* Floating Chat Button */}
      <button
        onClick={toggleChat}
        className="fixed bottom-4 right-4 w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full shadow-xl transition-all duration-200 z-[99999] flex items-center justify-center"
        style={{ 
          position: 'fixed', 
          bottom: '16px', 
          right: '16px', 
          zIndex: 99999,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}
        aria-label="Toggle chat"
      >
        {isChatOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <span className="text-2xl">🤖</span>
        )}
      </button>

      {/* Chat Window */}
      {isChatOpen && (
        <div className="fixed bottom-20 right-4 w-80 h-96 bg-white backdrop-blur-xl border border-gray-300 rounded-2xl shadow-2xl z-[99999] flex flex-col overflow-hidden"
             style={{ 
               position: 'fixed', 
               bottom: '80px', 
               right: '16px', 
               zIndex: 99999,
               backgroundColor: 'white',
               boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
             }}>
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                  <span className="text-lg">🤖</span>
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">Digital Twin</h3>
                  <p className="text-white/90 text-xs">Ask about Jashandeep</p>
                </div>
              </div>
              <button
                onClick={toggleChat}
                className="text-white/80 hover:text-white transition-colors p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-2 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                      : 'bg-gray-100 text-gray-800 border border-gray-200'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 border border-gray-200 p-2 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 border-t border-gray-200">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about Jashandeep..."
                className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-xl transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ChatbotWidget
