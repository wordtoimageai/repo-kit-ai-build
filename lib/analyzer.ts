import type { DetectedTechnology } from './types'

interface FileStructure {
  [key: string]: string
}

export interface AnalysisInput {
  files: FileStructure
  repoUrl?: string
  repoName?: string
}

export interface AnalysisOutput {
  detectedTech: DetectedTechnology
  deployScore: number
  isDeployable: boolean
  missingFiles: string[]
  warnings: string[]
}

// Detect technology stack from files
export function detectTechnology(files: FileStructure): DetectedTechnology {
  const tech: DetectedTechnology = {}

  // Detect package manager
  if ('pnpm-lock.yaml' in files) {
    tech.packageManager = 'pnpm'
  } else if ('yarn.lock' in files) {
    tech.packageManager = 'yarn'
  } else if ('package-lock.json' in files) {
    tech.packageManager = 'npm'
  }

  // Parse package.json if available
  if ('package.json' in files) {
    try {
      const pkg = JSON.parse(files['package.json'])
      
      // Detect framework
      if (pkg.dependencies?.next || pkg.devDependencies?.next) {
        tech.framework = 'next'
        tech.language = 'typescript'
      } else if (pkg.dependencies?.vite || pkg.devDependencies?.vite) {
        tech.framework = 'vite'
        tech.language = 'typescript'
      } else if (pkg.dependencies?.react || pkg.devDependencies?.react) {
        tech.framework = 'react'
        tech.language = 'typescript'
      } else if (pkg.dependencies?.express) {
        tech.framework = 'express'
        tech.language = 'javascript'
      } else if (pkg.dependencies?.fastify) {
        tech.framework = 'fastify'
        tech.language = 'javascript'
      }

      // Detect build/start commands
      if (pkg.scripts?.build) {
        tech.buildCommand = pkg.scripts.build
      }
      if (pkg.scripts?.start) {
        tech.startCommand = pkg.scripts.start
      }

      // Detect Node version
      if (pkg.engines?.node) {
        const version = pkg.engines.node.replace(/[^0-9.]/g, '')
        tech.nodeVersion = version.split('.')[0]
      }

      // Check if TypeScript
      if (pkg.dependencies?.typescript || pkg.devDependencies?.typescript) {
        tech.language = 'typescript'
      } else if (!tech.language) {
        tech.language = 'javascript'
      }
    } catch (e) {
      // Invalid package.json
    }
  }

  // Detect Python
  if ('requirements.txt' in files || 'Pipfile' in files || 'pyproject.toml' in files) {
    tech.language = 'python'
    
    if ('manage.py' in files) {
      tech.framework = 'django'
      tech.startCommand = 'python manage.py runserver'
    } else if (files['requirements.txt']?.includes('flask')) {
      tech.framework = 'flask'
      tech.startCommand = 'python app.py'
    } else if (files['requirements.txt']?.includes('fastapi')) {
      tech.framework = 'fastapi'
      tech.startCommand = 'uvicorn main:app --host 0.0.0.0'
    }
  }

  // Detect Go
  if ('go.mod' in files) {
    tech.language = 'go'
    tech.buildCommand = 'go build'
    tech.startCommand = './main'
  }

  // Detect Rust
  if ('Cargo.toml' in files) {
    tech.language = 'rust'
    tech.buildCommand = 'cargo build --release'
  }

  return tech
}

// Calculate deployment readiness score
export function calculateDeployScore(input: AnalysisInput): AnalysisOutput {
  const { files } = input
  const detectedTech = detectTechnology(files)
  
  let score = 0
  const missingFiles: string[] = []
  const warnings: string[] = []

  // Base score for having recognizable structure (20 points)
  if (detectedTech.framework || detectedTech.language) {
    score += 20
  }

  // Package manager detected (10 points)
  if (detectedTech.packageManager) {
    score += 10
  }

  // Check for essential files
  const hasPackageJson = 'package.json' in files
  const hasDockerfile = 'Dockerfile' in files
  const hasVercelConfig = 'vercel.json' in files
  const hasRenderConfig = 'render.yaml' in files
  const hasRailwayConfig = 'railway.json' in files || 'railway.toml' in files
  const hasFlyConfig = 'fly.toml' in files
  const hasReadme = 'README.md' in files
  const hasGitignore = '.gitignore' in files
  const hasEnvExample = '.env.example' in files || '.env.sample' in files

  // Package.json (essential for Node.js) (15 points)
  if (detectedTech.language === 'javascript' || detectedTech.language === 'typescript') {
    if (hasPackageJson) {
      score += 15
    } else {
      missingFiles.push('package.json')
      warnings.push('Missing package.json file')
    }
  }

  // Build command defined (10 points)
  if (detectedTech.buildCommand) {
    score += 10
  } else if (detectedTech.framework === 'next' || detectedTech.framework === 'vite') {
    warnings.push('No build command found in package.json scripts')
  }

  // Start command defined (10 points)
  if (detectedTech.startCommand) {
    score += 10
  }

  // Deployment configuration (15 points total, divided by number present)
  const deployConfigs = [hasDockerfile, hasVercelConfig, hasRenderConfig, hasRailwayConfig, hasFlyConfig].filter(Boolean).length
  if (deployConfigs > 0) {
    score += 15
  } else {
    missingFiles.push('Dockerfile')
    if (detectedTech.framework === 'next') {
      missingFiles.push('vercel.json')
    }
    warnings.push('No deployment configuration files found')
  }

  // Documentation (5 points)
  if (hasReadme) {
    score += 5
  } else {
    missingFiles.push('README.md')
  }

  // .gitignore (5 points)
  if (hasGitignore) {
    score += 5
  } else {
    missingFiles.push('.gitignore')
  }

  // Environment example (5 points)
  if (hasEnvExample) {
    score += 5
  } else {
    missingFiles.push('.env.example')
  }

  // Security checks (5 points)
  if ('package.json' in files) {
    try {
      const pkg = JSON.parse(files['package.json'])
      if (pkg.dependencies || pkg.devDependencies) {
        score += 5
      }
    } catch (e) {
      warnings.push('Invalid package.json format')
    }
  }

  // Cap score at 100
  score = Math.min(score, 100)

  // Deployable if score >= 60
  const isDeployable = score >= 60

  return {
    detectedTech,
    deployScore: score,
    isDeployable,
    missingFiles: Array.from(new Set(missingFiles)), // Remove duplicates
    warnings
  }
}

// Generate platform recommendations based on detected technology
export function generatePlatformRecommendations(tech: DetectedTechnology) {
  const recommendations = []

  // Vercel
  const vercelScore = tech.framework === 'next' ? 100 : tech.framework === 'vite' || tech.framework === 'react' ? 90 : 70
  recommendations.push({
    platform: 'vercel',
    compatibility_score: vercelScore,
    estimated_cost: 'Free tier: Hobby, $20/mo: Pro',
    avg_latency: '~50-100ms',
    pros: [
      'Instant deployments from Git',
      'Edge network with automatic CDN',
      'Perfect for Next.js',
      'Zero-config deployments'
    ],
    cons: [
      'Limited backend execution time',
      'Can get expensive at scale',
      tech.framework !== 'next' ? 'Best optimized for Next.js' : ''
    ].filter(Boolean),
    recommended_tier: 'Hobby'
  })

  // Railway
  const railwayScore = tech.language === 'javascript' || tech.language === 'typescript' ? 90 : 85
  recommendations.push({
    platform: 'railway',
    compatibility_score: railwayScore,
    estimated_cost: 'Free $5 credit, then $0.000463/GB-hour',
    avg_latency: '~100-150ms',
    pros: [
      'Great for full-stack apps',
      'Supports databases easily',
      'Docker support',
      'Simple environment management'
    ],
    cons: [
      'Pay-per-use can be unpredictable',
      'Fewer regions than competitors',
      'No free tier after trial'
    ],
    recommended_tier: 'Pay as you go'
  })

  // Render
  const renderScore = 85
  recommendations.push({
    platform: 'render',
    compatibility_score: renderScore,
    estimated_cost: 'Free tier available, Static: Free, Web: $7/mo',
    avg_latency: '~150-200ms',
    pros: [
      'Free tier for web services',
      'Easy PostgreSQL setup',
      'Automatic SSL',
      'Pull request previews'
    ],
    cons: [
      'Free tier has spin-down delays',
      'Slower builds than Vercel',
      'Limited customization'
    ],
    recommended_tier: 'Starter'
  })

  // Fly.io
  const flyScore = tech.language === 'go' || tech.language === 'rust' ? 95 : 80
  recommendations.push({
    platform: 'fly',
    compatibility_score: flyScore,
    estimated_cost: 'Free: 3 VMs, then ~$1.94/mo per VM',
    avg_latency: '~80-120ms (edge deployment)',
    pros: [
      'Deploy close to users globally',
      'Great for Dockerized apps',
      'Low latency worldwide',
      'Run full VMs'
    ],
    cons: [
      'Requires Docker knowledge',
      'More complex setup',
      'Learning curve for beginners'
    ],
    recommended_tier: 'Free tier'
  })

  return recommendations.sort((a, b) => b.compatibility_score - a.compatibility_score)
}
