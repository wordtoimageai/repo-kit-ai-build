import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Eye, GitBranch, Upload, FileText } from 'lucide-react'

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch user's analyses
  const { data: analyses } = await supabase
    .from('analyses')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const getInputIcon = (type: string) => {
    switch (type) {
      case 'github_url':
        return <GitBranch className="h-4 w-4" />
      case 'zip_upload':
        return <Upload className="h-4 w-4" />
      case 'text_prompt':
        return <FileText className="h-4 w-4" />
      default:
        return <GitBranch className="h-4 w-4" />
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Analysis History</h1>
        <p className="mt-2 text-muted-foreground">
          View and manage your previous repository analyses
        </p>
      </div>

      {!analyses || analyses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <GitBranch className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">No analyses yet</h3>
            <p className="mb-6 text-center text-sm text-muted-foreground">
              Start by analyzing your first repository
            </p>
            <Button asChild>
              <Link href="/dashboard">New Analysis</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {analyses.map((analysis) => (
            <Card key={analysis.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {analysis.repo_name}
                      <Badge variant={analysis.is_deployable ? 'default' : 'secondary'}>
                        Score: {analysis.deploy_score}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="mt-2 flex items-center gap-4">
                      <span className="flex items-center gap-1.5">
                        {getInputIcon(analysis.input_type)}
                        {analysis.input_type.replace('_', ' ')}
                      </span>
                      <span>•</span>
                      <span>
                        {new Date(analysis.created_at).toLocaleDateString()} at{' '}
                        {new Date(analysis.created_at).toLocaleTimeString()}
                      </span>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex gap-6 text-sm">
                    {analysis.detected_framework && (
                      <div>
                        <span className="text-muted-foreground">Framework:</span>{' '}
                        <span className="font-medium">{analysis.detected_framework}</span>
                      </div>
                    )}
                    {analysis.detected_language && (
                      <div>
                        <span className="text-muted-foreground">Language:</span>{' '}
                        <span className="font-medium">{analysis.detected_language}</span>
                      </div>
                    )}
                    {analysis.package_manager && (
                      <div>
                        <span className="text-muted-foreground">Package Manager:</span>{' '}
                        <span className="font-medium">{analysis.package_manager}</span>
                      </div>
                    )}
                  </div>
                  <Button size="sm" asChild>
                    <Link href={`/dashboard/analysis/${analysis.id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
