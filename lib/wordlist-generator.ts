export interface GeneratorConfig {
  characters: string
  length: number
  maxSingleCharRepeat: number
  maxConsecutiveRepeat: number
  minUniqueChars: number
}

export interface GeneratorStats {
  totalCombinations: number
  keptCount: number
  eliminatedCount: number
  eliminatedPercent: number
  elapsedMs: number
}

export interface GeneratorResult {
  words: string[]
  stats: GeneratorStats
}

export const DEFAULT_CONFIG: GeneratorConfig = {
  characters: '',
  length: 4,
  maxSingleCharRepeat: 4,
  maxConsecutiveRepeat: 3,
  minUniqueChars: 2,
}

/**
 * Check if a combination passes all realism filters.
 * Ported from the provided Python script logic.
 */
function isValid(
  comboStr: string,
  maxSingleCharRepeat: number,
  maxConsecutiveRepeat: number,
  minUniqueChars: number,
  invalidSequences: string[]
): boolean {
  const uniqueChars = new Set(comboStr)

  // Rule 3: must have at least minUniqueChars distinct characters
  if (uniqueChars.size < minUniqueChars) {
    return false
  }

  // Rule 1: no single character appears more than maxSingleCharRepeat times
  for (const c of uniqueChars) {
    let count = 0
    for (let i = 0; i < comboStr.length; i++) {
      if (comboStr[i] === c) count++
    }
    if (count > maxSingleCharRepeat) {
      return false
    }
  }

  // Rule 2: no more than maxConsecutiveRepeat identical chars in a row
  for (const seq of invalidSequences) {
    if (comboStr.includes(seq)) {
      return false
    }
  }

  return true
}

/**
 * Estimate total combinations for a given character set and length.
 */
export function estimateTotalCombinations(charCount: number, length: number): number {
  return Math.pow(charCount, length)
}

/**
 * Check whether a generation config is feasible to run in the browser.
 * Returns a warning message if too large, or null if safe.
 */
export function checkFeasibility(config: GeneratorConfig): string | null {
  const total = estimateTotalCombinations(config.characters.length, config.length)
  if (total > 50_000_000) {
    return `This configuration would generate ${total.toLocaleString()} combinations, which is too large for in-browser processing. Try reducing the character set or word length.`
  }
  if (total > 5_000_000) {
    return `This will evaluate ${total.toLocaleString()} combinations. It may take a while. Consider reducing the character set or word length for faster results.`
  }
  return null
}

/**
 * Generate all valid word combinations based on the given config.
 * Uses iterative cartesian product to avoid memory issues.
 */
export function generateWordList(config: GeneratorConfig): GeneratorResult {
  const { characters, length, maxSingleCharRepeat, maxConsecutiveRepeat, minUniqueChars } = config
  const chars = [...new Set(characters)].join('') // deduplicate
  const charArray = chars.split('')
  const charCount = charArray.length

  if (charCount === 0 || length <= 0) {
    return {
      words: [],
      stats: {
        totalCombinations: 0,
        keptCount: 0,
        eliminatedCount: 0,
        eliminatedPercent: 0,
        elapsedMs: 0,
      },
    }
  }

  // Pre-compute invalid consecutive sequences
  const invalidSequences = charArray.map(c => c.repeat(maxConsecutiveRepeat + 1))

  const totalCombinations = Math.pow(charCount, length)
  const startTime = performance.now()
  const words: string[] = []

  // Iterative cartesian product using index array
  const indices = new Array(length).fill(0)
  let done = false

  while (!done) {
    // Build current combination string
    let combo = ''
    for (let i = 0; i < length; i++) {
      combo += charArray[indices[i]]
    }

    if (isValid(combo, maxSingleCharRepeat, maxConsecutiveRepeat, minUniqueChars, invalidSequences)) {
      words.push(combo)
    }

    // Increment indices (odometer style)
    let pos = length - 1
    while (pos >= 0) {
      indices[pos]++
      if (indices[pos] < charCount) {
        break
      }
      indices[pos] = 0
      pos--
    }
    if (pos < 0) {
      done = true
    }
  }

  const elapsedMs = performance.now() - startTime
  const keptCount = words.length
  const eliminatedCount = totalCombinations - keptCount

  return {
    words,
    stats: {
      totalCombinations,
      keptCount,
      eliminatedCount,
      eliminatedPercent: totalCombinations > 0 ? (eliminatedCount / totalCombinations) * 100 : 0,
      elapsedMs,
    },
  }
}
