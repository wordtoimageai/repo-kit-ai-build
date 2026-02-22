-- RepoKit AI Database Schema
-- Tables for storing analysis sessions and generated files

-- Create analyses table to store repository analysis sessions
CREATE TABLE IF NOT EXISTS public.analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Input details
  input_type TEXT NOT NULL CHECK (input_type IN ('github_url', 'zip_upload', 'text_prompt')),
  input_value TEXT NOT NULL,
  
  -- Repository details
  repo_name TEXT,
  repo_url TEXT,
  detected_framework TEXT,
  detected_language TEXT,
  package_manager TEXT,
  
  -- Analysis results
  deploy_score INTEGER NOT NULL CHECK (deploy_score >= 0 AND deploy_score <= 100),
  is_deployable BOOLEAN NOT NULL DEFAULT false,
  missing_files TEXT[], -- Array of missing file names
  warnings TEXT[],
  
  -- Status and metadata
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'analyzing', 'completed', 'failed')),
  error_message TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create generated_files table to store files generated for each analysis
CREATE TABLE IF NOT EXISTS public.generated_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  
  -- File details
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_content TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('dockerfile', 'vercel', 'railway', 'render', 'fly', 'compose', 'github_action', 'env_example', 'other')),
  
  -- Metadata
  platform TEXT, -- 'vercel', 'railway', 'render', 'fly', etc.
  is_required BOOLEAN NOT NULL DEFAULT true,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create deployments table to track deployment attempts
CREATE TABLE IF NOT EXISTS public.deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Deployment details
  platform TEXT NOT NULL CHECK (platform IN ('vercel', 'railway', 'render', 'fly')),
  deployment_url TEXT,
  deployment_id TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'deploying', 'success', 'failed')),
  error_message TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create platform_recommendations table
CREATE TABLE IF NOT EXISTS public.platform_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  
  platform TEXT NOT NULL,
  compatibility_score INTEGER NOT NULL CHECK (compatibility_score >= 0 AND compatibility_score <= 100),
  estimated_cost TEXT,
  avg_latency TEXT,
  pros TEXT[],
  cons TEXT[],
  recommended_tier TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for analyses table
CREATE POLICY "Users can view their own analyses" 
  ON public.analyses FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analyses" 
  ON public.analyses FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analyses" 
  ON public.analyses FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analyses" 
  ON public.analyses FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS Policies for generated_files table
CREATE POLICY "Users can view files from their analyses" 
  ON public.generated_files FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.analyses 
      WHERE analyses.id = generated_files.analysis_id 
      AND analyses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert files for their analyses" 
  ON public.generated_files FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.analyses 
      WHERE analyses.id = generated_files.analysis_id 
      AND analyses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete files from their analyses" 
  ON public.generated_files FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.analyses 
      WHERE analyses.id = generated_files.analysis_id 
      AND analyses.user_id = auth.uid()
    )
  );

-- RLS Policies for deployments table
CREATE POLICY "Users can view their own deployments" 
  ON public.deployments FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own deployments" 
  ON public.deployments FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own deployments" 
  ON public.deployments FOR UPDATE 
  USING (auth.uid() = user_id);

-- RLS Policies for platform_recommendations table
CREATE POLICY "Users can view recommendations for their analyses" 
  ON public.platform_recommendations FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.analyses 
      WHERE analyses.id = platform_recommendations.analysis_id 
      AND analyses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert recommendations for their analyses" 
  ON public.platform_recommendations FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.analyses 
      WHERE analyses.id = platform_recommendations.analysis_id 
      AND analyses.user_id = auth.uid()
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON public.analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON public.analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generated_files_analysis_id ON public.generated_files(analysis_id);
CREATE INDEX IF NOT EXISTS idx_deployments_analysis_id ON public.deployments(analysis_id);
CREATE INDEX IF NOT EXISTS idx_deployments_user_id ON public.deployments(user_id);
CREATE INDEX IF NOT EXISTS idx_platform_recommendations_analysis_id ON public.platform_recommendations(analysis_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_analyses_updated_at 
  BEFORE UPDATE ON public.analyses 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deployments_updated_at 
  BEFORE UPDATE ON public.deployments 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
