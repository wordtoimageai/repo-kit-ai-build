'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Send, Loader2, Wand2, FileCode, Rocket, RotateCcw,
  ChevronRight, Check, AlertCircle, Download, ExternalLink, Zap
} from 'lucide-react'

interface ScaffoldResult {
  repoName: string
  framework: string
  language: string
  deployScore: number
  analysisId: string
  files: { name: string; content: string; platform?: string }[]
  deployUrls: Record<string, string>
}

const STARTER_PROMPTS = [
  'A Next.js SaaS dashboard with authentication and Stripe billing',
  'A Python FastAPI REST API with PostgreSQL and Docker',
  'A React + Vite portfolio site with dark mode and animations',
  'An Express.js REST API with JWT auth and rate limiting',
]

export default function BuilderPage() {
  const router = useRouter()
  const [scaffoldResult, setScaffoldResult] = useState<ScaffoldResult | null>(null)
  const [isScaffolding, setIsScaffolding] = useState(false)
  const [scaffoldError, setScaffoldError] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/builder/chat' }),
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!input.trim() || isLoading) return
    sendMessage({ text: input })
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleScaffold = async (prompt: string) => {
    setIsScaffolding(true)
    setScaffoldError(null)
    try {
      const response = await fetch('/api/builder/scaffold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      const data = await response.json()
      if (!response.ok) {
        setScaffoldError(data.error || 'Scaffolding failed. Please try again.')
        return
      }
      setScaffoldResult(data)
    } catch {
      setScaffoldError('Network error. Please check your connection.')
    } finally {
      setIsScaffolding(false)
    }
  }

  const handleStarterPrompt = (prompt: string) => {
    setInput(prompt)
  }

  const getMessageText = (msg: (typeof messages)[0]) => {
    if (!msg.parts || !Array.isArray(msg.parts)) return ''
    return msg.parts
      .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
      .map((p) => p.text)
      .join('')
  }

  const scoreColor =
    scaffoldResult && scaffoldResult.deployScore >= 80
      ? 'text-accent'
      : scaffoldResult && scaffoldResult.deployScore >= 60
        ? 'text-primary'
        : 'text-destructive'

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Wand2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">AI Web Builder</h1>
            <p className="text-sm text-muted-foreground">
              Describe your project, get instant scaffolding and deploy configs
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left: Chat */}
        <div className="flex flex-col gap-4">
          <Card className="flex flex-col" style={{ height: '520px' }}>
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Zap className="h-4 w-4 text-primary" />
                Chat with AI Builder
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-0 overflow-hidden p-0">
              <ScrollArea className="flex-1 px-4 py-4">
                {messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-6 py-12">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <Wand2 className="h-8 w-8 text-primary" />
                    </div>
                    <div className="text-center">
                      <p className="font-medium">Describe your project</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Tell me what you want to build and I'll plan the architecture, suggest files, and generate deployment configs.
                      </p>
                    </div>
                    <div className="grid w-full gap-2">
                      {STARTER_PROMPTS.map((prompt) => (
                        <button
                          key={prompt}
                          onClick={() => handleStarterPrompt(prompt)}
                          className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                        >
                          <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                          <span className="text-muted-foreground">{prompt}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg) => {
                      const text = getMessageText(msg)
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                              msg.role === 'user'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-foreground'
                            }`}
                          >
                            <div className="whitespace-pre-wrap">{text}</div>
                            {msg.role === 'assistant' && text && (
                              <div className="mt-3 border-t border-border/50 pt-3">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="h-7 text-xs"
                                  onClick={() => handleScaffold(
                                    messages.find(m => m.role === 'user')
                                      ? getMessageText(messages.find(m => m.role === 'user')!)
                                      : text
                                  )}
                                  disabled={isScaffolding}
                                >
                                  {isScaffolding ? (
                                    <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                                  ) : (
                                    <FileCode className="mr-1.5 h-3 w-3" />
                                  )}
                                  Generate Files & Configs
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="flex items-center gap-2 rounded-2xl bg-muted px-4 py-3">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Thinking...</span>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Input */}
              <div className="border-t border-border p-4">
                <div className="flex gap-2">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Describe your project... (Enter to send, Shift+Enter for new line)"
                    className="min-h-[60px] resize-none text-sm"
                    disabled={isLoading}
                    rows={2}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    size="icon"
                    className="h-auto self-end"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Scaffold Result */}
        <div className="flex flex-col gap-4">
          {isScaffolding ? (
            <Card className="flex items-center justify-center" style={{ height: '520px' }}>
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="font-medium">Generating files and configs...</p>
                <p className="text-sm text-muted-foreground">Analyzing your project requirements</p>
              </div>
            </Card>
          ) : scaffoldError ? (
            <Card className="border-destructive/50" style={{ height: '520px' }}>
              <CardContent className="flex h-full flex-col items-center justify-center gap-4">
                <AlertCircle className="h-10 w-10 text-destructive" />
                <p className="font-medium text-destructive">{scaffoldError}</p>
                <Button variant="outline" size="sm" onClick={() => setScaffoldError(null)}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : scaffoldResult ? (
            <div className="space-y-4">
              {/* Score card */}
              <Card>
                <CardContent className="flex items-center justify-between pt-4 pb-4">
                  <div>
                    <div className="font-semibold">{scaffoldResult.repoName}</div>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant="secondary" className="capitalize">{scaffoldResult.framework}</Badge>
                      <Badge variant="outline" className="capitalize">{scaffoldResult.language}</Badge>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className={`text-3xl font-bold ${scoreColor}`}>{scaffoldResult.deployScore}</div>
                    <div className="text-xs text-muted-foreground">deploy score</div>
                  </div>
                </CardContent>
              </Card>

              {/* Generated files */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <FileCode className="h-4 w-4 text-primary" />
                    Generated Files ({scaffoldResult.files.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <ScrollArea className="h-52">
                    <div className="space-y-2 pr-4">
                      {scaffoldResult.files.map((file, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2"
                        >
                          <div className="flex items-center gap-2">
                            <Check className="h-3.5 w-3.5 flex-shrink-0 text-accent" />
                            <span className="font-mono text-xs">{file.name}</span>
                            {file.platform && (
                              <Badge variant="outline" className="h-4 px-1.5 text-[10px] capitalize">
                                {file.platform}
                              </Badge>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => {
                              const blob = new Blob([file.content], { type: 'text/plain' })
                              const url = URL.createObjectURL(blob)
                              const a = document.createElement('a')
                              a.href = url
                              a.download = file.name
                              a.click()
                              URL.revokeObjectURL(url)
                            }}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Deploy buttons */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <Rocket className="h-4 w-4 text-primary" />
                    Direct Deploy
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(scaffoldResult.deployUrls).map(([platform, url]) => (
                      <Button
                        key={platform}
                        variant="outline"
                        size="sm"
                        className="capitalize"
                        asChild
                      >
                        <a href={url} target="_blank" rel="noopener noreferrer">
                          {platform}
                          <ExternalLink className="ml-2 h-3.5 w-3.5" />
                        </a>
                      </Button>
                    ))}
                  </div>
                  <Button
                    className="mt-3 w-full"
                    onClick={() => router.push(`/dashboard/analysis/${scaffoldResult.analysisId}`)}
                  >
                    View Full Analysis
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="flex items-center justify-center border-dashed" style={{ height: '520px' }}>
              <div className="flex flex-col items-center gap-4 px-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Rocket className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">Ready to generate</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    After chatting with the AI, click "Generate Files & Configs" to create your deployment-ready project scaffold.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
