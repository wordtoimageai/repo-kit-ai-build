import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Zap, Shield, Code, Rocket, GitBranch, Check } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Code className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold">RepoKit AI</span>
          </Link>
          
          <nav className="flex items-center gap-4">
            <Link href="/auth/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Sign in
            </Link>
            <Button asChild>
              <Link href="/auth/sign-up">Get Started</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-1.5 text-sm">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">Analyze, Generate, Deploy</span>
          </div>
          
          <h1 className="mt-8 max-w-4xl text-balance text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            Deploy Any Repository in
            <span className="text-primary"> Seconds</span>
          </h1>
          
          <p className="mt-6 max-w-2xl text-balance text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Detect missing deployment files, auto-generate configurations for Vercel, Railway, Render, and Fly.io. Get a deploy-readiness score like Lighthouse.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
            <Button size="lg" className="group" asChild>
              <Link href="/auth/sign-up">
                Start Analyzing
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/auth/login">Sign In</Link>
            </Button>
          </div>

          <div className="mt-6 flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-accent" />
              <span>No credit card</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-accent" />
              <span>Free forever</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <GitBranch className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Multiple Input Methods</h3>
            <p className="text-muted-foreground leading-relaxed">
              Analyze from GitHub URL, upload ZIP files, or describe your project in text and let AI scaffold the structure.
            </p>
          </div>

          <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
              <Zap className="h-6 w-6 text-accent" />
            </div>
            <h3 className="text-xl font-semibold">Instant Analysis</h3>
            <p className="text-muted-foreground leading-relaxed">
              Get a 0-100 deploy-readiness score with detected framework, language, and missing file recommendations.
            </p>
          </div>

          <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Code className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Auto-Generate Configs</h3>
            <p className="text-muted-foreground leading-relaxed">
              Automatically create Dockerfile, vercel.json, railway.json, render.yaml, and fly.toml with smart templates.
            </p>
          </div>

          <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
              <Shield className="h-6 w-6 text-accent" />
            </div>
            <h3 className="text-xl font-semibold">Platform Recommendations</h3>
            <p className="text-muted-foreground leading-relaxed">
              Compare deployment platforms with compatibility scores, cost estimates, and latency projections.
            </p>
          </div>

          <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Rocket className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">One-Click Deploy</h3>
            <p className="text-muted-foreground leading-relaxed">
              Deploy directly to Vercel, Railway, Render, or Fly.io with generated configurations and one-click buttons.
            </p>
          </div>

          <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
              <GitBranch className="h-6 w-6 text-accent" />
            </div>
            <h3 className="text-xl font-semibold">Session History</h3>
            <p className="text-muted-foreground leading-relaxed">
              Save and retrieve past analyses with Supabase. Track all your deployments and configurations.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-background to-accent/5 p-12 text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to deploy anything?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-lg text-muted-foreground">
            Join developers who are deploying faster with RepoKit AI. Analyze your first repository in seconds.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" className="group" asChild>
              <Link href="/auth/sign-up">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <Code className="h-5 w-5 text-primary" />
              <span className="font-semibold">RepoKit AI</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Built with Next.js, Supabase, and Tailwind CSS
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
