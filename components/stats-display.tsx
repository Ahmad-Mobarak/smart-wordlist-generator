"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { GeneratorStats } from "@/lib/wordlist-generator"
import { Clock, Hash, Filter, TrendingDown } from "lucide-react"

interface StatsDisplayProps {
  stats: GeneratorStats
}

export function StatsDisplay({ stats }: StatsDisplayProps) {
  const statItems = [
    {
      icon: Hash,
      label: "Total Evaluated",
      value: stats.totalCombinations.toLocaleString(),
    },
    {
      icon: Filter,
      label: "Words Kept",
      value: stats.keptCount.toLocaleString(),
    },
    {
      icon: TrendingDown,
      label: "Eliminated",
      value: `${stats.eliminatedPercent.toFixed(1)}%`,
    },
    {
      icon: Clock,
      label: "Time Taken",
      value: stats.elapsedMs < 1000
        ? `${Math.round(stats.elapsedMs)}ms`
        : `${(stats.elapsedMs / 1000).toFixed(2)}s`,
    },
  ]

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Generation Results</CardTitle>
        <CardDescription>Summary of the word list generation</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {statItems.map((item) => (
            <div
              key={item.label}
              className="flex flex-col gap-1.5 rounded-lg border bg-muted/30 p-3"
            >
              <div className="flex items-center gap-1.5">
                <item.icon className="size-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{item.label}</span>
              </div>
              <Badge variant="secondary" className="w-fit font-mono text-sm tabular-nums">
                {item.value}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
