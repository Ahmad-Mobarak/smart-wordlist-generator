"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Download, FileText, FileSpreadsheet, FileIcon, Check } from "lucide-react"
import { exportToCSV, exportToTXT, exportToPDF, exportToDOCX } from "@/lib/export-utils"

interface ExportPanelProps {
  words: string[]
  config?: { characters: string; length: number }
}

export function ExportPanel({ words, config }: ExportPanelProps) {
  const [filename, setFilename] = useState("wordlist")
  const [exportingFormat, setExportingFormat] = useState<string | null>(null)

  const formats = [
    {
      id: "csv",
      label: "CSV",
      description: "Comma-separated values",
      icon: FileSpreadsheet,
      action: () => exportToCSV(words, filename),
    },
    {
      id: "txt",
      label: "TXT",
      description: "Plain text, one per line",
      icon: FileText,
      action: () => exportToTXT(words, filename),
    },
    {
      id: "pdf",
      label: "PDF",
      description: "Portable document format",
      icon: FileIcon,
      action: () => exportToPDF(words, filename, config),
    },
    {
      id: "docx",
      label: "DOCX",
      description: "Microsoft Word document",
      icon: FileIcon,
      action: async () => await exportToDOCX(words, filename, config),
    },
  ]

  const handleExport = async (format: typeof formats[number]) => {
    setExportingFormat(format.id)
    try {
      await format.action()
    } finally {
      setTimeout(() => setExportingFormat(null), 1500)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Export</CardTitle>
        <CardDescription>
          Download your word list in multiple formats
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Filename */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="filename" className="text-sm">
            Filename
          </Label>
          <Input
            id="filename"
            value={filename}
            onChange={(e) => setFilename(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""))}
            placeholder="wordlist"
            className="font-mono"
          />
        </div>

        {/* Export Buttons */}
        <div className="grid grid-cols-2 gap-2">
          {formats.map((format) => {
            const isExporting = exportingFormat === format.id
            const isDone = exportingFormat === null && false
            return (
              <Button
                key={format.id}
                variant="outline"
                className="flex h-auto flex-col items-start gap-1 p-3"
                onClick={() => handleExport(format)}
                disabled={words.length === 0 || exportingFormat !== null}
              >
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isExporting ? (
                      <Check className="size-4 text-accent" />
                    ) : (
                      <format.icon className="size-4" />
                    )}
                    <Badge variant="secondary" className="text-xs font-mono">
                      .{format.id}
                    </Badge>
                  </div>
                  <Download className="size-3.5 text-muted-foreground" />
                </div>
                <span className="text-xs text-muted-foreground font-normal text-left">
                  {format.description}
                </span>
              </Button>
            )
          })}
        </div>

        {words.length === 0 && (
          <p className="text-center text-xs text-muted-foreground">
            Generate a word list first to enable exports
          </p>
        )}
      </CardContent>
    </Card>
  )
}
