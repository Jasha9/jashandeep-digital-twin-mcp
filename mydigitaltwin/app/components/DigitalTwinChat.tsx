'use client'

import { useState, useRef, useEffect } from 'react'
import { queryDigitalTwin, getSampleQuestions, testConnection, compareRAGApproaches, type DigitalTwinResponse } from '../../lib/digital-twin-actions'

type InterviewType = 'technical_interview' | 'behavioral_interview' | 'executive_interview' | 'general_interview'

interface Message {
  role: 'user' | 'assistant'
  content: string
  sources?: Array<{
    title: string
    relevance: number
  }>
  enhanced?: boolean
  interviewType?: InterviewType
  metrics?: {
    queryEnhancementTime: number
    vectorSearchTime: number
    responseFormattingTime: number
    totalTime: number
    tokensUsed: number
    enhancedQuery: string
  }
}

interface ConnectionStatus {
  success: boolean
  message: string
  vectorCount?: number
  responseTime?: number
  lastChecked?: Date
}

interface ErrorState {
  hasError: boolean
  message: string
  code?: string
  retryable: boolean
}

export default function DigitalTwinChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sampleQuestions, setSampleQuestions] = useState<Array<{question: string, type: InterviewType}>>([])
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null)
  const [errorState, setErrorState] = useState<ErrorState>({ hasError: false, message: '', retryable: false })
  const [retryCount, setRetryCount] = useState(0)
  const [isInitializing, setIsInitializing] = useState(true)
  const [useEnhanced, setUseEnhanced] = useState(true)
  const [showComparison, setShowComparison] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const maxRetries = 3

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const clearError = () => {
    setErrorState({ hasError: false, message: '', retryable: false })
  }

  const handleRetry = async () => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1)
      clearError()
      await initializeComponent()
    }
  }

  const initializeComponent = async () => {
    try {
      setIsInitializing(true)
      console.log('🔄 Initializing Digital Twin Chat component...')
      
      // Load sample questions with fallback
      try {
        const questions = await getSampleQuestions()
        setSampleQuestions(questions)
        console.log(`✅ Loaded ${questions.length} sample questions`)
      } catch (questionError) {
        console.warn('⚠️ Failed to load sample questions, using fallback:', questionError)
        setSampleQuestions([
          { question: "Tell me about your experience", type: "general_interview" },
          { question: "What are your technical skills?", type: "technical_interview" },
          { question: "What are your career goals?", type: "general_interview" }
        ])
      }
      
      // Test connection with detailed status
      try {
        const status = await testConnection()
        setConnectionStatus({
          ...status,
          lastChecked: new Date()
        })
        
        if (status.success) {
          console.log('✅ Connection test successful')
          clearError()
        } else {
          console.warn('⚠️ Connection test failed:', status.message)
          setErrorState({
            hasError: true,
            message: `Connection issue: ${status.message}`,
            retryable: true
          })
        }
      } catch (connectionError) {
        console.error('❌ Connection test error:', connectionError)
        setErrorState({
          hasError: true,
          message: 'Failed to test system connection. Please check your internet connection.',
          retryable: true
        })
        setConnectionStatus({
          success: false,
          message: 'Connection test failed',
          lastChecked: new Date()
        })
      }
      
    } catch (error) {
      console.error('❌ Component initialization failed:', error)
      setErrorState({
        hasError: true,
        message: 'Failed to initialize chat component. Please refresh the page.',
        retryable: true
      })
    } finally {
      setIsInitializing(false)
    }
  }

  useEffect(() => {
    // Load sample questions and test connection on component mount
    const initializeComponent = async () => {
      try {
        const questions = await getSampleQuestions()
        setSampleQuestions(questions)
        
        const status = await testConnection()
        setConnectionStatus(status)
      } catch (error) {
        console.error('Failed to initialize component:', error)
      }
    }
    
    initializeComponent()
  }, [])

  const handleSubmit = async (question: string) => {
    if (!question.trim()) return

    const userMessage: Message = { role: 'user', content: question }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response: DigitalTwinResponse = await queryDigitalTwin(question, useEnhanced)
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.success ? response.answer! : `Error: ${response.error}`,
        sources: response.sources,
        enhanced: response.enhanced,
        interviewType: response.interviewType,
        metrics: response.metrics
      }
      
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      const errorMessage: Message = {
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-xl overflow-hidden">
      {/* Connection Status */}
      {connectionStatus && (
        <div className={`p-4 text-sm ${
          connectionStatus.success 
            ? 'bg-green-50 text-green-800 border-b border-green-200' 
            : 'bg-red-50 text-red-800 border-b border-red-200'
        }`}>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus.success ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <span>
              {connectionStatus.message}
              {connectionStatus.vectorCount !== undefined && (
                <span className="ml-2 font-mono">
                  ({connectionStatus.vectorCount} vectors)
                </span>
              )}
            </span>
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <div className="h-96 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-lg font-semibold mb-2">Ask me anything!</h3>
            <p>I&apos;m your digital twin powered by AI. Ask about my experience, skills, or goals.</p>
          </div>
        )}
        
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : message.enhanced
                  ? 'bg-gradient-to-r from-purple-50 to-blue-50 text-gray-900 border border-purple-200'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div className="text-sm">{message.content}</div>
              
              {message.enhanced && message.interviewType && (
                <div className="mt-2 pt-2 border-t border-purple-200">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-semibold">
                      🚀 Enhanced RAG
                    </span>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {message.interviewType.replace('_', ' ')}
                    </span>
                  </div>
                  {message.metrics && (
                    <div className="mt-1 text-xs text-purple-600">
                      Total: {message.metrics.totalTime.toFixed(0)}ms
                      • Enhancement: {message.metrics.queryEnhancementTime.toFixed(0)}ms
                      • Search: {message.metrics.vectorSearchTime.toFixed(0)}ms
                      • Format: {message.metrics.responseFormattingTime.toFixed(0)}ms
                    </div>
                  )}
                </div>
              )}
              
              {message.sources && message.sources.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <div className="text-xs font-semibold text-gray-500 mb-1">Sources:</div>
                  {message.sources.map((source, idx) => (
                    <div key={idx} className="text-xs text-gray-600">
                      • {source.title} ({(source.relevance * 100).toFixed(1)}%)
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Sample Questions */}
      {messages.length === 0 && sampleQuestions.length > 0 && (
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Sample Questions:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {sampleQuestions.slice(0, 6).map((item, index) => {
              const typeEmojis = {
                technical_interview: "💻",
                behavioral_interview: "🤝", 
                executive_interview: "👔",
                general_interview: "💬"
              }
              return (
                <button
                  key={index}
                  onClick={() => handleSubmit(item.question)}
                  className="text-left text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded transition-colors"
                  disabled={isLoading}
                  title={`${item.type.replace('_', ' ')} question`}
                >
                  <span className="mr-1">{typeEmojis[item.type]}</span>
                  {item.question}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Enhanced RAG Controls */}
      <div className="px-6 pt-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={useEnhanced}
                onChange={(e) => setUseEnhanced(e.target.checked)}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="font-medium">🚀 Enhanced RAG</span>
              <span className="text-gray-500">(LLM-optimized responses)</span>
            </label>
          </div>
          <div className="text-xs text-gray-500">
            Enhanced RAG provides interview-optimized responses with type detection
          </div>
        </div>
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSubmit(input)
        }}
        className="p-6 pt-3 border-t border-gray-200"
      >
        <div className="flex space-x-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me about my experience, skills, or goals..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className={`px-6 py-2 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
              useEnhanced 
                ? 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 focus:ring-purple-500' 
                : 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-500'
            }`}
          >
            {isLoading ? 'Sending...' : useEnhanced ? '🚀 Send' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  )
}