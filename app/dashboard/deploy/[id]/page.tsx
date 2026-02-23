import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ExternalLink, Info } from 'lucide-react'

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

  // Platform-specific deployment URLs
  const deployUrls: Record<string, string> = {
    vercel: 'https://vercel.com/new',
    railway: 'https://railway.app/new',
    render: 'https://dashboard.render.com/select-repo',
    fly: 'https://fly.io/docs/hands-on/install-flyctl/'
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight capitalize">Deploy to {platform}</h1>
        <p className="mt-2 text-muted-foreground">
          Follow the steps below to deploy {analysis.repo_name}
        </p>
      </div>

      <Alert className="mb-8">
        <Info className="h-4 w-4" />
        <AlertDescription>
          Deployment requires a GitHub repository with the generated configuration files. Make sure to commit the generated files to your repository first.
        </AlertDescription>
      </Alert>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Step 1: Download Configuration Files</CardTitle>
          <CardDescription>
            Download and commit the generated configuration files to your repository
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <a href={`/dashboard/analysis/${id}`}>
              View Generated Files
            </a>
          </Button>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Step 2: Push to GitHub</CardTitle>
          <CardDescription>
            Commit and push the configuration files to your GitHub repository
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="rounded-lg bg-muted p-4 text-sm">
            <code>{`git add .
git commit -m "Add deployment configuration"
git push origin main`}</code>
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Step 3: Deploy on {platform}</CardTitle>
          <CardDescription>
            Click the button below to start the deployment process on {platform}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button size="lg" className="w-full" asChild>
            <a href={deployUrls[platform]} target="_blank" rel="noopener noreferrer">
              Deploy to {platform}
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </CardContent>
      </Card>

      <div className="mt-8 flex justify-center">
        <Button variant="outline" asChild>
          <a href={`/dashboard/analysis/${id}`}>
            Back to Analysis
          </a>
        </Button>
      </div>
    </div>
  )
}
