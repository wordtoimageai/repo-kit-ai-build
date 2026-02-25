'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Check, Download } from 'lucide-react'

interface DeployActionsProps {
  fileName?: string
  fileContent?: string
  isCopy?: boolean
  content?: string
  label?: string
}

export function DeployActions({ fileName, fileContent, isCopy, content, label }: DeployActionsProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const text = content || fileContent || ''
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    if (!fileName || !fileContent) return
    const blob = new Blob([fileContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
    URL.revokeObjectURL(url)
  }

  if (isCopy) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="absolute right-2 top-2 h-7 gap-1.5 px-2 text-xs"
        onClick={handleCopy}
      >
        {copied ? <Check className="h-3.5 w-3.5 text-accent" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? 'Copied!' : (label || 'Copy')}
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="sm" className="h-7 px-2" onClick={handleCopy} title="Copy content">
        {copied ? <Check className="h-3.5 w-3.5 text-accent" /> : <Copy className="h-3.5 w-3.5" />}
      </Button>
      <Button variant="ghost" size="sm" className="h-7 px-2" onClick={handleDownload} title="Download file">
        <Download className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}
