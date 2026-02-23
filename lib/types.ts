// Core types for RepoKit AI

export type InputType = 'github_url' | 'zip_upload' | 'text_prompt'
export type AnalysisStatus = 'pending' | 'analyzing' | 'completed' | 'failed'
export type DeploymentStatus = 'pending' | 'deploying' | 'success' | 'failed'
export type DeploymentPlatform = 'vercel' | 'railway' | 'render' | 'fly'
export type FileType = 'dockerfile' | 'vercel' | 'railway' | 'render' | 'fly' | 'compose' | 'github_action' | 'env_example' | 'other'

export interface Analysis {
  id: string
  user_id: string
  input_type: InputType
  input_value: string
  repo_name?: string
  repo_url?: string
  detected_framework?: string
  detected_language?: string
  package_manager?: string
  deploy_score: number
  is_deployable: boolean
  missing_files: string[]
  warnings: string[]
  status: AnalysisStatus
  error_message?: string
  created_at: string
  updated_at: string
}

export interface GeneratedFile {
  id: string
  analysis_id: string
  file_name: string
  file_path: string
  file_content: string
  file_type: FileType
  platform?: string
  is_required: boolean
  created_at: string
}

export interface Deployment {
  id: string
  analysis_id: string
  user_id: string
  platform: DeploymentPlatform
  deployment_url?: string
  deployment_id?: string
  status: DeploymentStatus
  error_message?: string
  created_at: string
  updated_at: string
}

export interface PlatformRecommendation {
  id: string
  analysis_id: string
  platform: string
  compatibility_score: number
  estimated_cost: string
  avg_latency: string
  pros: string[]
  cons: string[]
  recommended_tier: string
  created_at: string
}

export interface DetectedTechnology {
  framework?: string
  language?: string
  packageManager?: string
  buildCommand?: string
  startCommand?: string
  nodeVersion?: string
}

export interface AnalysisResult {
  analysis: Analysis
  generatedFiles: GeneratedFile[]
  recommendations: PlatformRecommendation[]
}
