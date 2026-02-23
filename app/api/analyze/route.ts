import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateDeployScore, generatePlatformRecommendations, detectTechnology } from '@/lib/analyzer'
import { 
  generateDockerfile, 
  generateVercelJson, 
  generateRailwayJson, 
  generateRenderYaml, 
  generateFlyToml,
  generateDockerCompose,
  generateEnvExample,
  generateGitHubActions
} from '@/lib/templates'
import type { FileType } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const contentType = request.headers.get('content-type')
    let input_type: string
    let input_value: string
    let repoFiles: any = {}

    // Handle different input types
    if (contentType?.includes('multipart/form-data')) {
      // ZIP upload
      const formData = await request.formData()
      const file = formData.get('file') as File
      input_type = 'zip_upload'
      input_value = file.name

      // For MVP, we'll simulate file extraction
      // In production, you'd extract the ZIP and parse files
      repoFiles = await extractZipFiles(file)
    } else {
      // JSON payload (GitHub URL or text prompt)
      const body = await request.json()
      input_type = body.input_type
      input_value = body.input_value

      if (input_type === 'github_url') {
        repoFiles = await fetchGitHubRepo(input_value)
      } else if (input_type === 'text_prompt') {
        repoFiles = await generateFromPrompt(input_value)
      }
    }

    // Extract repo name
    const repoName = extractRepoName(input_value)

    // Analyze repository
    const analysisResult = calculateDeployScore({
      files: repoFiles,
      repoUrl: input_type === 'github_url' ? input_value : undefined,
      repoName
    })

    // Create analysis record
    const { data: analysis, error: analysisError } = await supabase
      .from('analyses')
      .insert({
        user_id: user.id,
        input_type,
        input_value,
        repo_name: repoName,
        repo_url: input_type === 'github_url' ? input_value : null,
        detected_framework: analysisResult.detectedTech.framework,
        detected_language: analysisResult.detectedTech.language,
        package_manager: analysisResult.detectedTech.packageManager,
        deploy_score: analysisResult.deployScore,
        is_deployable: analysisResult.isDeployable,
        missing_files: analysisResult.missingFiles,
        warnings: analysisResult.warnings,
        status: 'completed'
      })
      .select()
      .single()

    if (analysisError) {
      console.error('[v0] Analysis insert error:', analysisError)
      return NextResponse.json({ error: 'Failed to create analysis' }, { status: 500 })
    }

    // Generate configuration files
    const templateContext = {
      repoName,
      ...analysisResult.detectedTech
    }

    const generatedFiles = [
      {
        file_name: 'Dockerfile',
        file_path: 'Dockerfile',
        file_content: generateDockerfile(templateContext),
        file_type: 'dockerfile' as FileType,
        platform: null,
        is_required: true
      },
      {
        file_name: 'vercel.json',
        file_path: 'vercel.json',
        file_content: generateVercelJson(templateContext),
        file_type: 'vercel' as FileType,
        platform: 'vercel',
        is_required: false
      },
      {
        file_name: 'railway.json',
        file_path: 'railway.json',
        file_content: generateRailwayJson(templateContext),
        file_type: 'railway' as FileType,
        platform: 'railway',
        is_required: false
      },
      {
        file_name: 'render.yaml',
        file_path: 'render.yaml',
        file_content: generateRenderYaml(templateContext),
        file_type: 'render' as FileType,
        platform: 'render',
        is_required: false
      },
      {
        file_name: 'fly.toml',
        file_path: 'fly.toml',
        file_content: generateFlyToml(templateContext),
        file_type: 'fly' as FileType,
        platform: 'fly',
        is_required: false
      },
      {
        file_name: 'docker-compose.yml',
        file_path: 'docker-compose.yml',
        file_content: generateDockerCompose(templateContext),
        file_type: 'compose' as FileType,
        platform: null,
        is_required: false
      },
      {
        file_name: '.env.example',
        file_path: '.env.example',
        file_content: generateEnvExample(templateContext),
        file_type: 'env_example' as FileType,
        platform: null,
        is_required: true
      },
      {
        file_name: 'deploy.yml',
        file_path: '.github/workflows/deploy.yml',
        file_content: generateGitHubActions(templateContext),
        file_type: 'github_action' as FileType,
        platform: null,
        is_required: false
      }
    ]

    // Insert generated files
    const filesWithAnalysisId = generatedFiles.map(file => ({
      ...file,
      analysis_id: analysis.id
    }))

    const { error: filesError } = await supabase
      .from('generated_files')
      .insert(filesWithAnalysisId)

    if (filesError) {
      console.error('[v0] Files insert error:', filesError)
    }

    // Generate platform recommendations
    const recommendations = generatePlatformRecommendations(analysisResult.detectedTech)
    const recommendationsWithAnalysisId = recommendations.map(rec => ({
      ...rec,
      analysis_id: analysis.id
    }))

    const { error: recsError } = await supabase
      .from('platform_recommendations')
      .insert(recommendationsWithAnalysisId)

    if (recsError) {
      console.error('[v0] Recommendations insert error:', recsError)
    }

    return NextResponse.json({ 
      success: true,
      analysisId: analysis.id,
      deployScore: analysisResult.deployScore,
      isDeployable: analysisResult.isDeployable
    })

  } catch (error) {
    console.error('[v0] Analysis API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper functions

async function fetchGitHubRepo(url: string): Promise<any> {
  // For MVP, simulate GitHub API call
  // In production, use Octokit to fetch actual repo contents
  const mockFiles: any = {
    'package.json': JSON.stringify({
      name: 'example-app',
      version: '1.0.0',
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start'
      },
      dependencies: {
        next: '^14.0.0',
        react: '^18.0.0',
        'react-dom': '^18.0.0'
      }
    }),
    'package-lock.json': '',
    'README.md': '# Example App',
    '.gitignore': 'node_modules\n.env\n.next'
  }
  
  return mockFiles
}

async function extractZipFiles(file: File): Promise<any> {
  // For MVP, return mock structure
  // In production, extract and parse ZIP contents
  const mockFiles: any = {
    'package.json': JSON.stringify({
      name: 'uploaded-project',
      version: '1.0.0',
      scripts: {
        start: 'node index.js'
      },
      dependencies: {
        express: '^4.18.0'
      }
    }),
    'index.js': 'console.log("Hello World")',
    'README.md': '# Uploaded Project'
  }
  
  return mockFiles
}

async function generateFromPrompt(prompt: string): Promise<any> {
  // For MVP, create basic structure based on keywords
  // In production, use AI to generate full structure
  const isNextJs = prompt.toLowerCase().includes('next')
  const isReact = prompt.toLowerCase().includes('react')
  const isExpress = prompt.toLowerCase().includes('express')

  const mockFiles: any = {}

  if (isNextJs) {
    mockFiles['package.json'] = JSON.stringify({
      name: 'ai-generated-nextjs',
      version: '1.0.0',
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start'
      },
      dependencies: {
        next: '^14.0.0',
        react: '^18.0.0',
        'react-dom': '^18.0.0'
      }
    })
    mockFiles['README.md'] = '# AI Generated Next.js App\n\n' + prompt
  } else if (isReact || isExpress) {
    mockFiles['package.json'] = JSON.stringify({
      name: 'ai-generated-app',
      version: '1.0.0',
      dependencies: isReact ? { react: '^18.0.0' } : { express: '^4.18.0' }
    })
    mockFiles['README.md'] = '# AI Generated App\n\n' + prompt
  }

  return mockFiles
}

function extractRepoName(input: string): string {
  // Extract repo name from GitHub URL or use input
  if (input.includes('github.com')) {
    const parts = input.split('/')
    return parts[parts.length - 1].replace('.git', '')
  }
  return input.split('/').pop() || 'repository'
}
