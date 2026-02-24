'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { GitBranch, Upload, FileText, Loader2, AlertCircle } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [githubUrl, setGithubUrl] = useState('')
  const [textPrompt, setTextPrompt] = useState('')
  const [file, setFile] = useState<File | null>(null)

  const handleGitHubAnalysis = async () => {
    if (!githubUrl) return
    
    setAnalyzing(true)
    setError(null)
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input_type: 'github_url',
          input_value: githubUrl
        })
      })
      
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Analysis failed. Please try again.')
        return
      }
      router.push(`/dashboard/analysis/${data.analysisId}`)
    } catch (err) {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleZipUpload = async () => {
    if (!file) return
    
    setAnalyzing(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('input_type', 'zip_upload')
      
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Upload failed. Please try again.')
        return
      }
      router.push(`/dashboard/analysis/${data.analysisId}`)
    } catch (err) {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleTextPrompt = async () => {
    if (!textPrompt) return
    
    setAnalyzing(true)
    setError(null)
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input_type: 'text_prompt',
          input_value: textPrompt
        })
      })
      
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Generation failed. Please try again.')
        return
      }
      router.push(`/dashboard/analysis/${data.analysisId}`)
    } catch (err) {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Analyze Repository</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Choose your input method to get started
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="github" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="github">
            <GitBranch className="mr-2 h-4 w-4" />
            GitHub URL
          </TabsTrigger>
          <TabsTrigger value="zip">
            <Upload className="mr-2 h-4 w-4" />
            Upload ZIP
          </TabsTrigger>
          <TabsTrigger value="text">
            <FileText className="mr-2 h-4 w-4" />
            Describe Project
          </TabsTrigger>
        </TabsList>

        <TabsContent value="github" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Analyze from GitHub</CardTitle>
              <CardDescription>
                Enter a public GitHub repository URL to analyze
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="github-url">Repository URL</Label>
                <Input
                  id="github-url"
                  type="url"
                  placeholder="https://github.com/username/repository"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  disabled={analyzing}
                />
              </div>
              <Button 
                onClick={handleGitHubAnalysis} 
                disabled={!githubUrl || analyzing}
                className="w-full"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'Start Analysis'
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="zip" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload ZIP File</CardTitle>
              <CardDescription>
                Upload a ZIP archive of your repository
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="zip-file">ZIP Archive</Label>
                <Input
                  id="zip-file"
                  type="file"
                  accept=".zip"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  disabled={analyzing}
                />
              </div>
              <Button 
                onClick={handleZipUpload} 
                disabled={!file || analyzing}
                className="w-full"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'Upload and Analyze'
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="text" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Describe Your Project</CardTitle>
              <CardDescription>
                Describe your project and AI will generate the structure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="text-prompt">Project Description</Label>
                <Textarea
                  id="text-prompt"
                  placeholder="Example: A Next.js blog with Tailwind CSS and MDX support..."
                  value={textPrompt}
                  onChange={(e) => setTextPrompt(e.target.value)}
                  disabled={analyzing}
                  rows={6}
                />
              </div>
              <Button 
                onClick={handleTextPrompt} 
                disabled={!textPrompt || analyzing}
                className="w-full"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate and Analyze'
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
