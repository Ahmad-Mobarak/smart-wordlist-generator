"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { AlertCircle, Info, Loader2, Play } from "lucide-react"
import type { GeneratorConfig } from "@/lib/wordlist-generator"
import { estimateTotalCombinations, checkFeasibility } from "@/lib/wordlist-generator"

interface ConfigPanelProps {
  config: GeneratorConfig
  onConfigChange: (config: GeneratorConfig) => void
  onGenerate: () => void
  isGenerating: boolean
}

export function ConfigPanel({ config, onConfigChange, onGenerate, isGenerating }: ConfigPanelProps) {
  const uniqueChars = [...new Set(config.characters)].join("")
  const totalCombinations = config.characters.length > 0
    ? estimateTotalCombinations(uniqueChars.length, config.length)
    : 0
  const feasibilityWarning = config.characters.length > 0
    ? checkFeasibility({ ...config, characters: uniqueChars })
    : null

  const canGenerate = uniqueChars.length >= config.minUniqueChars && config.length > 0 && !isGenerating

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Configuration</CardTitle>
        <CardDescription>
          Define your character set and generation parameters
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {/* Characters Input */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="characters" className="text-sm font-medium">
            Character Set
          </Label>
          <Input
            id="characters"
            placeholder="e.g. abc123"
            value={config.characters}
            onChange={(e) => onConfigChange({ ...config, characters: e.target.value })}
            className="font-mono text-base tracking-wider"
            aria-describedby="char-info"
          />
          <div id="char-info" className="flex flex-wrap items-center gap-2">
            {uniqueChars.length > 0 && (
              <>
                <span className="text-xs text-muted-foreground">
                  {uniqueChars.length} unique character{uniqueChars.length !== 1 ? "s" : ""}:
                </span>
                <div className="flex flex-wrap gap-1">
                  {uniqueChars.split("").map((char, i) => (
                    <Badge key={i} variant="secondary" className="font-mono px-1.5 py-0 text-xs">
                      {char}
                    </Badge>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Word Length */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="length" className="text-sm font-medium">
              Word Length
            </Label>
            <Badge variant="outline" className="font-mono tabular-nums">
              {config.length}
            </Badge>
          </div>
          <Slider
            id="length"
            min={1}
            max={12}
            step={1}
            value={[config.length]}
            onValueChange={([val]) => onConfigChange({ ...config, length: val })}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1</span>
            <span>12</span>
          </div>
        </div>

        {/* Filter Settings */}
        <div className="flex flex-col gap-4 rounded-lg border bg-muted/30 p-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium">Filter Rules</h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="size-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-[250px]">
                  <p>These filters reduce the output by eliminating unrealistic combinations.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="maxSingleRepeat" className="text-xs">
                  Max single char repeat
                </Label>
                <Badge variant="outline" className="font-mono text-xs tabular-nums">
                  {config.maxSingleCharRepeat}
                </Badge>
              </div>
              <Slider
                id="maxSingleRepeat"
                min={1}
                max={config.length}
                step={1}
                value={[config.maxSingleCharRepeat]}
                onValueChange={([val]) => onConfigChange({ ...config, maxSingleCharRepeat: val })}
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="maxConsecutive" className="text-xs">
                  Max consecutive repeat
                </Label>
                <Badge variant="outline" className="font-mono text-xs tabular-nums">
                  {config.maxConsecutiveRepeat}
                </Badge>
              </div>
              <Slider
                id="maxConsecutive"
                min={1}
                max={config.length}
                step={1}
                value={[config.maxConsecutiveRepeat]}
                onValueChange={([val]) => onConfigChange({ ...config, maxConsecutiveRepeat: val })}
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="minUnique" className="text-xs">
                  Min unique characters
                </Label>
                <Badge variant="outline" className="font-mono text-xs tabular-nums">
                  {config.minUniqueChars}
                </Badge>
              </div>
              <Slider
                id="minUnique"
                min={1}
                max={Math.max(uniqueChars.length, 1)}
                step={1}
                value={[config.minUniqueChars]}
                onValueChange={([val]) => onConfigChange({ ...config, minUniqueChars: val })}
              />
            </div>
          </div>
        </div>

        {/* Estimate */}
        {totalCombinations > 0 && (
          <div className="flex flex-col gap-1.5 rounded-lg border p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total combinations</span>
              <span className="font-mono font-medium tabular-nums">{totalCombinations.toLocaleString()}</span>
            </div>
            {feasibilityWarning && (
              <div className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400">
                <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                <p>{feasibilityWarning}</p>
              </div>
            )}
          </div>
        )}

        {/* Generate Button */}
        <Button
          onClick={onGenerate}
          disabled={!canGenerate}
          size="lg"
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Play className="mr-2 size-4" />
              Generate Word List
            </>
          )}
        </Button>

        {uniqueChars.length > 0 && uniqueChars.length < config.minUniqueChars && (
          <p className="text-xs text-destructive text-center">
            Need at least {config.minUniqueChars} unique characters (have {uniqueChars.length})
          </p>
        )}
      </CardContent>
    </Card>
  )
}
