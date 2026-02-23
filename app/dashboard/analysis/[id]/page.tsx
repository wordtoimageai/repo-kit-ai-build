import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Check, AlertCircle, Download, ExternalLink, TrendingUp } from 'lucide-react'
import Link from 'next/link'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AnalysisDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch analysis
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

  // Fetch platform recommendations
  const { data: recommendations } = await supabase
    .from('platform_recommendations')
    .select('*')
    .eq('analysis_id', id)
    .order('compatibility_score', { ascending: false })

  const scoreColor = analysis.deploy_score >= 80 ? 'text-accent' : analysis.deploy_score >= 60 ? 'text-primary' : 'text-destructive'
  const scoreLabel = analysis.deploy_score >= 80 ? 'Excellent' : analysis.deploy_score >= 60 ? 'Good' : 'Needs Work'

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{analysis.repo_name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Analyzed {new Date(analysis.created_at).toLocaleDateString()}
            </p>
          </div>
          <Badge variant={analysis.is_deployable ? 'default' : 'secondary'} className="text-sm">
            {analysis.is_deployable ? 'Deploy Ready' : 'Needs Attention'}
          </Badge>
        </div>
      </div>

      {/* Deploy Score */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Deploy Readiness Score</CardTitle>
          <CardDescription>Overall deployment preparedness assessment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-8">
            <div className="flex flex-col items-center gap-2">
              <div className={`text-6xl font-bold ${scoreColor}`}>
                {analysis.deploy_score}
              </div>
              <div className="text-sm font-medium text-muted-foreground">{scoreLabel}</div>
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="font-medium">Framework: {analysis.detected_framework || 'Not detected'}</div>
                  <div className="text-sm text-muted-foreground">Language: {analysis.detected_language || 'Unknown'}</div>
                </div>
              </div>
              {analysis.package_manager && (
                <div className="text-sm text-muted-foreground">
                  Package Manager: {analysis.package_manager}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warnings */}
      {analysis.warnings && analysis.warnings.length > 0 && (
        <Card className="mb-8 border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Warnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.warnings.map((warning: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-destructive" />
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="files" className="w-full">
        <TabsList>
          <TabsTrigger value="files">Generated Files ({files?.length || 0})</TabsTrigger>
          <TabsTrigger value="platforms">Platform Recommendations</TabsTrigger>
          <TabsTrigger value="missing">Missing Files ({analysis.missing_files?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="files" className="mt-6 space-y-4">
          {files?.map((file) => (
            <Card key={file.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{file.file_name}</CardTitle>
                    <CardDescription>{file.file_path}</CardDescription>
                  </div>
                  <Badge variant={file.is_required ? 'default' : 'secondary'}>
                    {file.is_required ? 'Required' : 'Optional'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
                  <code>{file.file_content}</code>
                </pre>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="platforms" className="mt-6 space-y-4">
          {recommendations?.map((rec) => (
            <Card key={rec.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="capitalize">{rec.platform}</CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-primary">{rec.compatibility_score}</span>
                    <span className="text-sm text-muted-foreground">/100</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Estimated Cost</div>
                    <div className="mt-1">{rec.estimated_cost}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Avg. Latency</div>
                    <div className="mt-1">{rec.avg_latency}</div>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium">Pros</div>
                  <ul className="mt-2 space-y-1">
                    {rec.pros.map((pro, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent" />
                        <span>{pro}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <div className="text-sm font-medium">Cons</div>
                  <ul className="mt-2 space-y-1">
                    {rec.cons.map((con, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                        <span>{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button className="w-full" asChild>
                  <Link href={`/dashboard/deploy/${analysis.id}?platform=${rec.platform}`}>
                    Deploy to {rec.platform}
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="missing" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Missing Files</CardTitle>
              <CardDescription>
                These files are recommended for deployment
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analysis.missing_files && analysis.missing_files.length > 0 ? (
                <ul className="space-y-2">
                  {analysis.missing_files.map((file: string, idx: number) => (
                    <li key={idx} className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono text-sm">{file}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No missing files detected!</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
