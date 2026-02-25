import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateDeployScore, generatePlatformRecommendations } from '@/lib/analyzer'
import {
  generateDockerfile,
  generateVercelJson,
  generateRailwayJson,
  generateRenderYaml,
  generateFlyToml,
  generateDockerCompose,
  generateEnvExample,
  generateGitHubActions,
  type TemplateContext
} from '@/lib/templates'
import type { FileType } from '@/lib/types'

const DEPLOY_URLS: Record<string, string> = {
  vercel: 'https://vercel.com/new',
  railway: 'https://railway.app/new',
  render: 'https://dashboard.render.com/select-repo',
  fly: 'https://fly.io/docs/hands-on/install-flyctl/',
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prompt } = await request.json()

    if (!prompt?.trim()) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    // Generate mock files from prompt (same logic as analyze route's generateFromPrompt)
    const repoFiles = generateFromPrompt(prompt)
    const repoName = extractRepoName(prompt)

    // Analyze
    const analysisResult = calculateDeployScore({ files: repoFiles, repoName })

    // Save analysis
    const { data: analysis, error: analysisError } = await supabase
      .from('analyses')
      .insert({
        user_id: user.id,
        input_type: 'text_prompt',
        input_value: prompt,
        repo_name: repoName,
        repo_url: null,
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
      console.error('[v0] Scaffold analysis insert error:', analysisError)
      return NextResponse.json({ error: 'Failed to create analysis' }, { status: 500 })
    }

    const templateContext: TemplateContext = {
      repoName,
      ...analysisResult.detectedTech
    }

    const generatedFiles = [
      { name: 'Dockerfile', content: generateDockerfile(templateContext), file_type: 'dockerfile' as FileType, platform: null, is_required: true },
      { name: 'vercel.json', content: generateVercelJson(templateContext), file_type: 'vercel' as FileType, platform: 'vercel', is_required: false },
      { name: 'railway.json', content: generateRailwayJson(templateContext), file_type: 'railway' as FileType, platform: 'railway', is_required: false },
      { name: 'render.yaml', content: generateRenderYaml(templateContext), file_type: 'render' as FileType, platform: 'render', is_required: false },
      { name: 'fly.toml', content: generateFlyToml(templateContext), file_type: 'fly' as FileType, platform: 'fly', is_required: false },
      { name: 'docker-compose.yml', content: generateDockerCompose(templateContext), file_type: 'compose' as FileType, platform: null, is_required: false },
      { name: '.env.example', content: generateEnvExample(templateContext), file_type: 'env_example' as FileType, platform: null, is_required: true },
      { name: 'deploy.yml', content: generateGitHubActions(templateContext), file_type: 'github_action' as FileType, platform: null, is_required: false },
    ]

    // Insert files to DB
    const { error: filesError } = await supabase
      .from('generated_files')
      .insert(
        generatedFiles.map(f => ({
          analysis_id: analysis.id,
          file_name: f.name,
          file_path: f.name === 'deploy.yml' ? '.github/workflows/deploy.yml' : f.name,
          file_content: f.content,
          file_type: f.file_type,
          platform: f.platform,
          is_required: f.is_required,
        }))
      )

    if (filesError) {
      console.error('[v0] Scaffold files insert error:', filesError)
    }

    // Insert recommendations
    const recommendations = generatePlatformRecommendations(analysisResult.detectedTech)
    const { error: recsError } = await supabase
      .from('platform_recommendations')
      .insert(recommendations.map(rec => ({ ...rec, analysis_id: analysis.id })))

    if (recsError) {
      console.error('[v0] Scaffold recommendations insert error:', recsError)
    }

    return NextResponse.json({
      success: true,
      analysisId: analysis.id,
      repoName,
      framework: analysisResult.detectedTech.framework || 'unknown',
      language: analysisResult.detectedTech.language || 'unknown',
      deployScore: analysisResult.deployScore,
      files: generatedFiles.map(f => ({ name: f.name, content: f.content, platform: f.platform ?? undefined })),
      deployUrls: DEPLOY_URLS,
    })
  } catch (error) {
    console.error('[v0] Scaffold API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function generateFromPrompt(prompt: string): Record<string, string> {
  const lower = prompt.toLowerCase()
  const isNextJs = lower.includes('next')
  const isReact = lower.includes('react')
  const isExpress = lower.includes('express') || lower.includes('api') || lower.includes('backend')
  const isPython = lower.includes('python') || lower.includes('flask') || lower.includes('django') || lower.includes('fastapi')

  const files: Record<string, string> = {}

  if (isNextJs) {
    files['package.json'] = JSON.stringify({
      name: extractRepoName(prompt), version: '1.0.0',
      scripts: { dev: 'next dev', build: 'next build', start: 'next start' },
      dependencies: { next: '^14.0.0', react: '^18.0.0', 'react-dom': '^18.0.0' }
    })
    files['README.md'] = `# ${extractRepoName(prompt)}\n\n${prompt}`
    files['.gitignore'] = 'node_modules\n.env\n.next'
  } else if (isReact) {
    files['package.json'] = JSON.stringify({
      name: extractRepoName(prompt), version: '1.0.0',
      scripts: { dev: 'vite', build: 'vite build', start: 'vite preview' },
      dependencies: { react: '^18.0.0', 'react-dom': '^18.0.0' },
      devDependencies: { vite: '^5.0.0', '@vitejs/plugin-react': '^4.0.0' }
    })
    files['README.md'] = `# ${extractRepoName(prompt)}\n\n${prompt}`
    files['.gitignore'] = 'node_modules\n.env\ndist'
  } else if (isExpress) {
    files['package.json'] = JSON.stringify({
      name: extractRepoName(prompt), version: '1.0.0',
      scripts: { start: 'node index.js', dev: 'nodemon index.js' },
      dependencies: { express: '^4.18.0' }
    })
    files['index.js'] = 'const express = require("express");\nconst app = express();\napp.get("/", (req, res) => res.json({ status: "ok" }));\napp.listen(3000);'
    files['README.md'] = `# ${extractRepoName(prompt)}\n\n${prompt}`
    files['.gitignore'] = 'node_modules\n.env'
  } else if (isPython) {
    files['requirements.txt'] = lower.includes('flask') ? 'flask\ngunicorn' : lower.includes('fastapi') ? 'fastapi\nuvicorn' : 'flask\ngunicorn'
    files['app.py'] = '# Auto-generated\nprint("Hello World")'
    files['README.md'] = `# ${extractRepoName(prompt)}\n\n${prompt}`
    files['.gitignore'] = '__pycache__\n.env\nvenv'
  } else {
    files['package.json'] = JSON.stringify({
      name: extractRepoName(prompt), version: '1.0.0',
      scripts: { start: 'node index.js' }, dependencies: {}
    })
    files['index.js'] = '// Auto-generated\nconsole.log("Hello World");'
    files['README.md'] = `# ${extractRepoName(prompt)}\n\n${prompt}`
    files['.gitignore'] = 'node_modules\n.env'
  }

  return files
}

function extractRepoName(input: string): string {
  const words = input.trim().split(/\s+/).slice(0, 4).join('-').toLowerCase()
  return words.replace(/[^a-z0-9-]/g, '').slice(0, 40) || 'my-project'
}
