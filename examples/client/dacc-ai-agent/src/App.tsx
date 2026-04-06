import { useState, useRef, useEffect } from 'react'
import { daccAiAgent, allowDaccWallet } from 'dacc-js'
import { optimismSepolia, baseSepolia } from 'viem/chains'
import './App.css'

interface Message {
  id: string
  text: string
  sender: 'user' | 'ai'
  timestamp: Date
  isStreaming?: boolean
  isError?: boolean
}

interface DaccCredentials {
  daccPublickey: string
  passwordSecretkey: string
  apiKey: string
  model: string
}

interface AiAgentInstance {
  chat: (message: string) => Promise<{ text: string }>
  streamChat: (message: string) => Promise<{ textStream: AsyncIterable<string> }>
}

function App() {
  const [credentials, setCredentials] = useState<DaccCredentials>({
    daccPublickey: '',
    passwordSecretkey: '',
    apiKey: '',
    model: 'x-ai/grok-4.1-fast'
  })
  const streamingMessageRef = useRef<string>('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [aiAgent, setAiAgent] = useState<AiAgentInstance | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [walletAddress, setWalletAddress] = useState<string>('')

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleConnect = async () => {
    if (!credentials.daccPublickey || !credentials.passwordSecretkey || !credentials.apiKey) {
      setError('Please fill in all required fields')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Get wallet address first
      const wallet = await allowDaccWallet({
        daccPublickey: credentials.daccPublickey,
        passwordSecretkey: credentials.passwordSecretkey,
      })
      setWalletAddress(wallet.address)

      const ai = await daccAiAgent({
        chains: [optimismSepolia, baseSepolia],
        tokens: [
          {
            name: "OptimismUselessToken-Bridged",
            symbol: "OUTb",
            chain: optimismSepolia,
            address: "0x7c6b91D9Be155A6Db01f749217d76fF02A7227F2",
          },
          {
            name: "ChainLink Token", 
            symbol: "LINK",
            chain: baseSepolia,
            address: "0xE4aB69C077896252FAFBD49EFD26B5D171A32410",
          },
        ],
        daccPublickey: credentials.daccPublickey,
        passwordSecretkey: credentials.passwordSecretkey,
        llm: {
          baseURL: "https://openrouter.ai/api/v1",
          apiKey: credentials.apiKey,
          model: credentials.model,
        },
      })

      setAiAgent(ai)
      setIsConnected(true)
      setMessages([{
        id: Date.now().toString(),
        text: 'DACC AI Agent connected successfully! You can start chatting now.',
        sender: 'ai',
        timestamp: new Date()
      }])
    } catch (err) {
      setError(`Connection failed: ${err instanceof Error ? err.message : 'Unknown error occurred'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !aiAgent || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    }

    const messageInput = inputMessage
    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)
    streamingMessageRef.current = ''

    try {
      const streamResponse = await aiAgent.streamChat(messageInput)
      
      // Create initial AI message for streaming
      const aiMessageId = (Date.now() + 1).toString()
      const aiMessage: Message = {
        id: aiMessageId,
        text: '',
        sender: 'ai',
        timestamp: new Date(),
        isStreaming: true
      }

      setMessages(prev => [...prev, aiMessage])

      // Stream the response
      let hasContent = false
      for await (const chunk of streamResponse.textStream) {
        if (chunk && chunk.trim()) {
          hasContent = true
        }
        streamingMessageRef.current += chunk
        
        setMessages(prev => 
          prev.map(msg => 
            msg.id === aiMessageId 
              ? { ...msg, text: streamingMessageRef.current }
              : msg
          )
        )
      }

      // Check if no meaningful content was received
      if (!hasContent || !streamingMessageRef.current.trim()) {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === aiMessageId 
              ? { 
                  ...msg, 
                  text: 'API key may be invalid or you need credits. Please check your API key and credit balance.', 
                  isStreaming: false,
                  isError: true 
                }
              : msg
          )
        )
        return
      }

      // Mark streaming as complete
      setMessages(prev => 
        prev.map(msg => 
          msg.id === aiMessageId 
            ? { ...msg, isStreaming: false }
            : msg
        )
      )
    } catch (err) {
      const errorText = err instanceof Error ? err.message : 'Could not send message'
      let displayError = `Error: ${errorText}`
      
      // Check for common API issues
      if (errorText.includes('401') || errorText.includes('unauthorized') || 
          errorText.includes('invalid') || errorText.includes('quota') ||
          errorText.includes('credit') || errorText.includes('billing')) {
        displayError = 'API key may be invalid or you need credits. Please check your API key and credit balance.'
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: displayError,
        sender: 'ai',
        timestamp: new Date(),
        isError: true
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisconnect = () => {
    setIsConnected(false)
    setAiAgent(null)
    setMessages([])
    setWalletAddress('')
    setCredentials(prev => ({ ...prev, daccPublickey: '', passwordSecretkey: '' }))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!isConnected) {
    return (
      <div className="app">
        <div className="connection-form">
          <h1>DACC AI Agent</h1>
          <p>Connect your DACC wallet to start using AI Agent</p>
          
          <div className="form-group">
            <label htmlFor="daccId">DACC ID:</label>
            <input
              id="daccId"
              type="text"
              value={credentials.daccPublickey}
              onChange={(e) => setCredentials(prev => ({ ...prev, daccPublickey: e.target.value }))}
              placeholder="daccPublickey_0x123_XxX..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              id="password"
              type="password"
              value={credentials.passwordSecretkey}
              onChange={(e) => setCredentials(prev => ({ ...prev, passwordSecretkey: e.target.value }))}
              placeholder="Your DACC wallet password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="apiKey">OpenRouter API Key:</label>
            <input
              id="apiKey"
              type="password"
              value={credentials.apiKey}
              onChange={(e) => setCredentials(prev => ({ ...prev, apiKey: e.target.value }))}
              placeholder="sk-or-v1-xxx..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="model">Model:</label>
            <select
              id="model"
              value={credentials.model}
              onChange={(e) => setCredentials(prev => ({ ...prev, model: e.target.value }))}
            >
              <option value="x-ai/grok-4.1-fast">x-ai/grok-4.1-fast</option>
              <option value="openai/gpt-oss-120b">openai/gpt-oss-120b</option>
              <option value="qwen/qwen-turbo">qwen/qwen-turbo</option>
              <option value="nvidia/nemotron-3-nano-30b-a3b:free">nvidia/nemotron-3-nano-30b-a3b:free</option>
              <option value="qwen/qwen3-next-80b-a3b-instruct:free">qwen/qwen3-next-80b-a3b-instruct:free</option>
              <option value="openai/gpt-oss-20b:free">openai/gpt-oss-20b:free</option>
            </select>
          </div>

          {error && <div className="error">{error}</div>}

          <button 
            className="connect-btn" 
            onClick={handleConnect} 
            disabled={isLoading}
          >
            {isLoading ? 'Connecting...' : 'Connect'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="chat-header">
        <h1>DACC AI Agent</h1>
        <div className="header-controls">
          <div className="wallet-info">
            <div className="wallet-address" title={walletAddress}>
              {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : ''}
            </div>
            <div className="model-info">
              {credentials.model}
            </div>
          </div>
          <span className="status">Connected</span>
          <button className="disconnect-btn" onClick={handleDisconnect}>
            Disconnect
          </button>
        </div>
      </header>

      <div className="chat-container">
        <div className="messages">
          {messages.map((message) => (
            <div key={message.id} className={`message ${message.sender} ${message.isError ? 'error' : ''}`}>
              <div className="message-content">
                <div className="message-text">
                  {message.text}
                  {message.isStreaming && <span className="cursor">|</span>}
                </div>
                <div className="message-time">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="message ai">
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-area">
          <div className="input-wrapper">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Send 0.001 ETH to 0x... or check my balance"
              rows={1}
              disabled={isLoading}
            />
            <button 
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="send-btn"
            >
              Send
            </button>
          </div>
        </div>
      </div>

      <footer className="chat-footer">
        <p>Try: "Check my balance", "Send 0.001 ETH to 0x123...", "Create a transaction"</p>
      </footer>
    </div>
  )
}

export default App;