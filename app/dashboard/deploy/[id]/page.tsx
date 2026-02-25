import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  ExternalLink, Info, Check, Copy, Download, GitBranch,
  Rocket, AlertCircle, ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import { DeployActions } from './_components/deploy-actions'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ platform?: string }>
}

export default async function DeployPage({ params, searchParams }: Props) {
  const { id } = await params
  const { platform = 'vercel' } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: analysis } = await supabase
    .from('analyses')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!analysis) {
    redirect('/dashboard')
  }

  // Fetch generated files
  const { data: files } = await supabase
    .from('generated_files')
    .select('*')
    .eq('analysis_id', id)
    .order('file_name')

  // Build one-click deploy URLs using repo URL if available
  const repoUrl = analysis.repo_url
  const encodedRepo = repoUrl ? encodeURIComponent(repoUrl) : null

  const deployOptions: Record<string, { label: string; url: string; description: string; badge: string }> = {
    vercel: {
      label: 'Deploy to Vercel',
      url: encodedRepo
        ? `https://vercel.com/new/clone?repository-url=${encodedRepo}&project-name=${analysis.repo_name}`
        : 'https://vercel.com/new',
      description: encodedRepo
        ? 'One-click clone & deploy directly from your GitHub repository'
        : 'Connect your GitHub repo on Vercel to deploy',
      badge: 'Recommended'
    },
    railway: {
      label: 'Deploy to Railway',
      url: encodedRepo
        ? `https://railway.app/new/template?template=${encodedRepo}`
        : 'https://railway.app/new',
      description: 'Full-stack apps with databases and environment management',
      badge: 'Great for APIs'
    },
    render: {
      label: 'Deploy to Render',
      url: encodedRepo
        ? `https://render.com/deploy?repo=${encodedRepo}`
        : 'https://dashboard.render.com/select-repo',
      description: 'Free tier with SSL, pull request previews included',
      badge: 'Free tier'
    },
    fly: {
      label: 'Deploy to Fly.io',
      url: 'https://fly.io/docs/hands-on/',
      description: 'Edge deployment close to users globally with Docker',
      badge: 'Docker-based'
    }
  }

  const currentPlatform = deployOptions[platform] || deployOptions.vercel

  const gitCommands = `git add .
git commit -m "chore: add deployment configuration files"
git push origin main`

  const platformFiles = files?.filter(f => !f.platform || f.platform === platform || f.is_required) || []

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" size="sm" className="mb-4 -ml-2" asChild>
          <Link href={`/dashboard/analysis/${id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Analysis
          </Link>
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight capitalize">Deploy to {platform}</h1>
            <p className="mt-2 text-muted-foreground">
              {analysis.repo_name} — Score: <span className="font-medium text-foreground">{analysis.deploy_score}/100</span>
            </p>
          </div>
          <Badge variant={analysis.is_deployable ? 'default' : 'secondary'}>
            {analysis.is_deployable ? 'Deploy Ready' : 'Needs Attention'}
          </Badge>
        </div>
      </div>

      {/* Platform Switcher */}
      <div className="mb-6 flex flex-wrap gap-2">
        {Object.entries(deployOptions).map(([key, opt]) => (
          <Button
            key={key}
            variant={key === platform ? 'default' : 'outline'}
            size="sm"
            asChild
          >
            <Link href={`/dashboard/deploy/${id}?platform=${key}`} className="capitalize">
              {key}
            </Link>
          </Button>
        ))}
      </div>

      {/* Info banner */}
      <Alert className="mb-8">
        <Info className="h-4 w-4" />
        <AlertDescription>
          {analysis.repo_url
            ? 'Your GitHub repository was detected. One-click deploy URLs are pre-filled with your repo.'
            : 'No GitHub repository detected. You\'ll need to push your code to GitHub first, then deploy.'}
        </AlertDescription>
      </Alert>

      {/* Step 1: Files */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">1</span>
                Download Configuration Files
              </CardTitle>
              <CardDescription className="mt-2">
                Download these {platformFiles.length} files and add them to your repository
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 space-y-2">
            {platformFiles.map((file) => (
              <div key={file.id} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-accent" />
                  <span className="font-mono text-sm">{file.file_name}</span>
                  {file.is_required && (
                    <Badge variant="default" className="h-4 px-1.5 text-[10px]">Required</Badge>
                  )}
                </div>
                <DeployActions fileName={file.file_name} fileContent={file.file_content} />
              </div>
            ))}
          </div>
          <Button variant="outline" asChild>
            <Link href={`/dashboard/analysis/${id}`}>
              <GitBranch className="mr-2 h-4 w-4" />
              View All Files
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Step 2: Git push */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">2</span>
            Push to GitHub
          </CardTitle>
          <CardDescription>
            Commit the config files and push to your main branch
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative rounded-lg bg-muted p-4">
            <pre className="text-sm leading-relaxed">
              <code>{gitCommands}</code>
            </pre>
            <DeployActions isCopy content={gitCommands} label="Copy Commands" />
          </div>
          {analysis.warnings && analysis.warnings.length > 0 && (
            <div className="mt-4 space-y-2">
              {analysis.warnings.map((warning: string, idx: number) => (
                <div key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-destructive" />
                  <span>{warning}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 3: One-click deploy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">3</span>
            One-Click Deploy
          </CardTitle>
          <CardDescription>
            {currentPlatform.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Badge variant="secondary">{currentPlatform.badge}</Badge>
          </div>
          <Button size="lg" className="mt-4 w-full" asChild>
            <a href={currentPlatform.url} target="_blank" rel="noopener noreferrer">
              <Rocket className="mr-2 h-5 w-5" />
              {currentPlatform.label}
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Opens {platform} in a new tab. Make sure you've completed steps 1 and 2 first.
          </p>
        </CardContent>
      </Card>

      {/* All platforms grid */}
      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold">All Platforms</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {Object.entries(deployOptions).map(([key, opt]) => (
            <Card key={key} className={key === platform ? 'border-primary' : ''}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold capitalize">{key}</span>
                      <Badge variant="outline" className="text-xs">{opt.badge}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{opt.description}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="mt-3 w-full" asChild>
                  <a href={opt.url} target="_blank" rel="noopener noreferrer">
                    Deploy
                    <ExternalLink className="ml-2 h-3.5 w-3.5" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
