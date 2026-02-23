import type { DetectedTechnology } from './types'

export interface TemplateContext extends DetectedTechnology {
  repoName: string
  port?: string
}

// Docker templates
export function generateDockerfile(context: TemplateContext): string {
  const { language, framework, nodeVersion = '20', buildCommand, startCommand } = context

  if (language === 'javascript' || language === 'typescript') {
    return `FROM node:${nodeVersion}-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
${context.packageManager === 'pnpm' ? 'COPY pnpm-lock.yaml ./' : ''}
${context.packageManager === 'yarn' ? 'COPY yarn.lock ./' : ''}

# Install dependencies
${context.packageManager === 'pnpm' ? 'RUN npm install -g pnpm && pnpm install --frozen-lockfile' : ''}
${context.packageManager === 'yarn' ? 'RUN yarn install --frozen-lockfile' : ''}
${context.packageManager === 'npm' || !context.packageManager ? 'RUN npm ci' : ''}

# Copy application code
COPY . .

# Build application
${buildCommand ? `RUN ${buildCommand}` : framework === 'next' ? 'RUN npm run build' : ''}

# Expose port
EXPOSE ${context.port || '3000'}

# Start application
CMD [${startCommand ? `"${startCommand.split(' ')[0]}", "${startCommand.split(' ').slice(1).join(' ')}"` : '"npm", "start"'}]
`
  }

  if (language === 'python') {
    return `FROM python:3.11-slim

WORKDIR /app

# Copy requirements
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE ${context.port || '8000'}

# Start application
CMD ${startCommand ? `["${startCommand.split(' ')[0]}", "${startCommand.split(' ').slice(1).join(' ')}"]` : '["python", "app.py"]'}
`
  }

  return `FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install
EXPOSE ${context.port || '3000'}
CMD ["npm", "start"]
`
}

// Vercel configuration
export function generateVercelJson(context: TemplateContext): string {
  const { framework, buildCommand } = context

  const config: any = {
    version: 2
  }

  if (buildCommand) {
    config.buildCommand = buildCommand
  }

  if (framework === 'next') {
    config.framework = 'nextjs'
  } else if (framework === 'vite' || framework === 'react') {
    config.framework = 'vite'
    config.outputDirectory = 'dist'
  }

  return JSON.stringify(config, null, 2)
}

// Railway configuration
export function generateRailwayJson(context: TemplateContext): string {
  const config = {
    $schema: 'https://railway.app/railway.schema.json',
    build: {
      builder: 'NIXPACKS',
      buildCommand: context.buildCommand || undefined
    },
    deploy: {
      startCommand: context.startCommand || undefined,
      restartPolicyType: 'ON_FAILURE',
      restartPolicyMaxRetries: 10
    }
  }

  return JSON.stringify(config, null, 2)
}

// Render configuration
export function generateRenderYaml(context: TemplateContext): string {
  const { repoName, framework, buildCommand, startCommand, language } = context

  return `services:
  - type: web
    name: ${repoName}
    runtime: ${language === 'python' ? 'python' : 'node'}
    ${buildCommand ? `buildCommand: ${buildCommand}` : ''}
    ${startCommand ? `startCommand: ${startCommand}` : 'startCommand: npm start'}
    ${language === 'python' ? 'pythonVersion: "3.11"' : ''}
    ${language !== 'python' ? 'nodeVersion: "20"' : ''}
    envVars:
      - key: NODE_ENV
        value: production
    autoDeploy: true
`
}

// Fly.io configuration
export function generateFlyToml(context: TemplateContext): string {
  const { repoName, port = '3000' } = context

  return `app = "${repoName.toLowerCase().replace(/[^a-z0-9-]/g, '-')}"
primary_region = "iad"

[build]

[http_service]
  internal_port = ${port}
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0
  processes = ["app"]

[[vm]]
  memory = '1gb'
  cpu_kind = 'shared'
  cpus = 1
`
}

// Docker Compose
export function generateDockerCompose(context: TemplateContext): string {
  const { repoName, port = '3000' } = context

  return `version: '3.8'

services:
  app:
    build: .
    ports:
      - "${port}:${port}"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
`
}

// .env.example
export function generateEnvExample(context: TemplateContext): string {
  const { framework } = context

  let envVars = [
    '# Environment Configuration',
    'NODE_ENV=production',
    ''
  ]

  if (framework === 'next') {
    envVars.push(
      '# Next.js Configuration',
      'NEXT_PUBLIC_API_URL=',
      ''
    )
  }

  envVars.push(
    '# Add your environment variables here',
    '# DATABASE_URL=',
    '# API_KEY=',
  )

  return envVars.join('\n')
}

// GitHub Actions CI/CD
export function generateGitHubActions(context: TemplateContext): string {
  const { framework, buildCommand, packageManager = 'npm' } = context

  return `name: CI/CD Pipeline

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: '${packageManager}'
      
      - name: Install dependencies
        run: ${packageManager === 'pnpm' ? 'pnpm install' : packageManager === 'yarn' ? 'yarn install' : 'npm ci'}
      
      ${buildCommand ? `- name: Build
        run: ${buildCommand}
      ` : ''}
      - name: Run tests
        run: ${packageManager} test
        continue-on-error: true
`
}
