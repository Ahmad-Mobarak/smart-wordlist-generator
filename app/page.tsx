"use client"

import { useState, useCallback } from "react"
import { AppHeader } from "@/components/app-header"
import { ConfigPanel } from "@/components/config-panel"
import { StatsDisplay } from "@/components/stats-display"
import { WordListTable } from "@/components/word-list-table"
import { ExportPanel } from "@/components/export-panel"
import { EmptyState } from "@/components/empty-state"
import { Toaster, toast } from "sonner"
import type { GeneratorConfig, GeneratorResult } from "@/lib/wordlist-generator"
import { DEFAULT_CONFIG, generateWordList, checkFeasibility } from "@/lib/wordlist-generator"

export default function Home() {
  const [config, setConfig] = useState<GeneratorConfig>({
    ...DEFAULT_CONFIG,
    characters: "",
    length: 4,
    maxSingleCharRepeat: 4,
    maxConsecutiveRepeat: 3,
    minUniqueChars: 2,
  })
  const [result, setResult] = useState<GeneratorResult | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = useCallback(() => {
    const uniqueChars = [...new Set(config.characters)].join("")
    if (uniqueChars.length === 0) {
      toast.error("Please enter at least one character")
      return
    }
    if (uniqueChars.length < config.minUniqueChars) {
      toast.error(`Need at least ${config.minUniqueChars} unique characters`)
      return
    }

    const warning = checkFeasibility({ ...config, characters: uniqueChars })
    if (warning && warning.includes("too large")) {
      toast.error(warning)
      return
    }

    setIsGenerating(true)

    // Use a timeout to allow the UI to update with the loading state
    setTimeout(() => {
      try {
        const genResult = generateWordList({ ...config, characters: uniqueChars })
        setResult(genResult)
        toast.success(
          `Generated ${genResult.stats.keptCount.toLocaleString()} words in ${
            genResult.stats.elapsedMs < 1000
              ? `${Math.round(genResult.stats.elapsedMs)}ms`
              : `${(genResult.stats.elapsedMs / 1000).toFixed(2)}s`
          }`
        )
      } catch (err) {
        toast.error("An error occurred during generation")
        console.error(err)
      } finally {
        setIsGenerating(false)
      }
    }, 50)
  }, [config])

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 lg:px-6 lg:py-8">
        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          {/* Left Sidebar - Config */}
          <aside className="flex flex-col gap-6">
            <ConfigPanel
              config={config}
              onConfigChange={setConfig}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
            />
            <ExportPanel
              words={result?.words ?? []}
              config={
                result
                  ? { characters: config.characters, length: config.length }
                  : undefined
              }
            />
          </aside>

          {/* Main Content Area */}
          <section className="flex flex-col gap-6" aria-label="Generated results">
            {result ? (
              <>
                <StatsDisplay stats={result.stats} />
                <WordListTable words={result.words} />
              </>
            ) : (
              <EmptyState />
            )}
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 lg:px-6">
          <p className="text-xs text-muted-foreground">
            WordForge -- Customizable word list generator
          </p>
          <p className="text-xs text-muted-foreground">
            All processing happens locally in your browser
          </p>
        </div>
      </footer>

      <Toaster richColors position="bottom-right" />
    </div>
  )
}
