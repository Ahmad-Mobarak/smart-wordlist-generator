"use client"

import { Card, CardContent } from "@/components/ui/card"
import { LetterText, ArrowLeft } from "lucide-react"

export function EmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-muted">
          <LetterText className="size-8 text-muted-foreground" />
        </div>
        <h3 className="mb-1 text-lg font-semibold text-balance text-center">
          No Word List Generated
        </h3>
        <p className="max-w-sm text-sm text-muted-foreground text-center text-pretty leading-relaxed">
          Enter your characters and configure the generation parameters in the panel, then click Generate to create your customized word list.
        </p>
        <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground lg:hidden">
          <ArrowLeft className="size-3" />
          <span>Scroll up to configure</span>
        </div>
      </CardContent>
    </Card>
  )
}
