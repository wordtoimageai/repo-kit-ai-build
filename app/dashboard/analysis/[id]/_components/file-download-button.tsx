'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Check, Download } from 'lucide-react'

interface Props {
  fileName: string
  fileContent: string
}

export function FileDownloadButton({ fileName, fileContent }: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fileContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([fileContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" variant="outline" onClick={handleDownload}>
        <Download className="mr-2 h-4 w-4" />
        Download
      </Button>
      <Button size="sm" variant="ghost" onClick={handleCopy}>
        {copied ? <Check className="mr-2 h-4 w-4 text-accent" /> : <Copy className="mr-2 h-4 w-4" />}
        {copied ? 'Copied!' : 'Copy'}
      </Button>
    </div>
  )
}
