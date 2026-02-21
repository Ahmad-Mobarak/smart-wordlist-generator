"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, ChevronLeft, ChevronRight, Copy, Check } from "lucide-react"

interface WordListTableProps {
  words: string[]
}

const PAGE_SIZE = 100

export function WordListTable({ words }: WordListTableProps) {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const [copied, setCopied] = useState(false)

  const filtered = useMemo(() => {
    if (!search) return words
    const lower = search.toLowerCase()
    return words.filter((w) => w.toLowerCase().includes(lower))
  }, [words, search])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const currentPage = Math.min(page, totalPages - 1)
  const displayedWords = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE)

  const handleCopyAll = async () => {
    const text = filtered.join("\n")
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Word List</CardTitle>
        <CardDescription>
          Showing {filtered.length.toLocaleString()} word{filtered.length !== 1 ? "s" : ""}
          {search && ` matching "${search}"`}
        </CardDescription>
        <CardAction>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyAll}
            className="gap-1.5"
          >
            {copied ? (
              <>
                <Check className="size-3.5" />
                Copied
              </>
            ) : (
              <>
                <Copy className="size-3.5" />
                Copy All
              </>
            )}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search words..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(0)
            }}
            className="pl-9"
            aria-label="Search generated words"
          />
        </div>

        {/* Word Grid */}
        <ScrollArea className="h-[400px] rounded-lg border">
          {displayedWords.length > 0 ? (
            <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {displayedWords.map((word, i) => (
                <div
                  key={`${currentPage}-${i}`}
                  className="flex items-center gap-2 bg-card px-3 py-2"
                >
                  <span className="text-xs text-muted-foreground tabular-nums min-w-[2.5rem]">
                    {(currentPage * PAGE_SIZE + i + 1).toLocaleString()}
                  </span>
                  <span className="font-mono text-sm">{word}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
              {search ? "No words match your search" : "No words generated yet"}
            </div>
          )}
        </ScrollArea>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Page {currentPage + 1} of {totalPages.toLocaleString()}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => setPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                aria-label="Previous page"
              >
                <ChevronLeft className="size-4" />
              </Button>
              {/* Page number badges */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number
                  if (totalPages <= 5) {
                    pageNum = i
                  } else if (currentPage < 3) {
                    pageNum = i
                  } else if (currentPage > totalPages - 4) {
                    pageNum = totalPages - 5 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === currentPage ? "default" : "outline"}
                      size="icon"
                      className="size-8 text-xs"
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum + 1}
                    </Button>
                  )
                })}
              </div>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => setPage(Math.min(totalPages - 1, currentPage + 1))}
                disabled={currentPage >= totalPages - 1}
                aria-label="Next page"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
