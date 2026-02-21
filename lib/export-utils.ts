/**
 * Export utilities for word lists.
 * Supports CSV, PDF, and DOCX formats - all generated client-side.
 */

/**
 * Export words as a CSV file.
 */
export function exportToCSV(words: string[], filename: string = 'wordlist'): void {
  const header = 'Index,Word\n'
  const rows = words.map((word, i) => `${i + 1},${word}`).join('\n')
  const csv = header + rows
  downloadFile(csv, `${filename}.csv`, 'text/csv;charset=utf-8;')
}

/**
 * Export words as a plain text file (one word per line).
 */
export function exportToTXT(words: string[], filename: string = 'wordlist'): void {
  const content = words.join('\n')
  downloadFile(content, `${filename}.txt`, 'text/plain;charset=utf-8;')
}

/**
 * Export words as a PDF file.
 * Uses a lightweight canvas-based PDF generation approach.
 */
export function exportToPDF(
  words: string[],
  filename: string = 'wordlist',
  config?: { characters: string; length: number }
): void {
  const pageWidth = 595.28 // A4 width in points
  const pageHeight = 841.89 // A4 height in points
  const margin = 50
  const lineHeight = 14
  const colWidth = 120
  const headerHeight = 80

  const cols = Math.floor((pageWidth - 2 * margin) / colWidth)
  const rowsPerPage = Math.floor((pageHeight - margin - headerHeight) / lineHeight)
  const wordsPerPage = cols * rowsPerPage

  const pages: string[][] = []
  for (let i = 0; i < words.length; i += wordsPerPage) {
    pages.push(words.slice(i, i + wordsPerPage))
  }

  // Build a minimal PDF manually
  let pdf = '%PDF-1.4\n'
  const objects: string[] = []
  let objectId = 1

  // Catalog
  const catalogId = objectId++
  objects.push(`${catalogId} 0 obj\n<< /Type /Catalog /Pages ${catalogId + 1} 0 R >>\nendobj`)

  // Pages object (will be filled after we know page count)
  const pagesId = objectId++
  const pageObjIds: number[] = []

  // Font
  const fontId = objectId++
  objects.push(`${fontId} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj`)

  const titleFontId = objectId++
  objects.push(`${titleFontId} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj`)

  // Create pages
  for (let p = 0; p < pages.length; p++) {
    const pageWords = pages[p]
    const pageObjId = objectId++
    pageObjIds.push(pageObjId)

    // Build content stream
    let stream = ''

    // Header on first page
    if (p === 0) {
      stream += `BT /F2 16 Tf ${margin} ${pageHeight - margin - 20} Td (WordForge - Generated Word List) Tj ET\n`
      if (config) {
        stream += `BT /F1 9 Tf ${margin} ${pageHeight - margin - 38} Td (Characters: ${escPdf(config.characters)} | Length: ${config.length} | Total: ${words.length.toLocaleString()} words) Tj ET\n`
      }
      stream += `BT /F1 9 Tf ${margin} ${pageHeight - margin - 52} Td (Page ${p + 1} of ${pages.length}) Tj ET\n`
    } else {
      stream += `BT /F1 9 Tf ${margin} ${pageHeight - margin - 12} Td (Page ${p + 1} of ${pages.length}) Tj ET\n`
    }

    // Words in columns
    const startY = pageHeight - headerHeight - margin
    for (let i = 0; i < pageWords.length; i++) {
      const col = Math.floor(i / rowsPerPage)
      const row = i % rowsPerPage
      const x = margin + col * colWidth
      const y = startY - row * lineHeight
      stream += `BT /F1 9 Tf ${x} ${y} Td (${escPdf(pageWords[i])}) Tj ET\n`
    }

    const contentId = objectId++
    objects.push(`${contentId} 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}endstream\nendobj`)
    objects.push(`${pageObjId} 0 obj\n<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Contents ${contentId} 0 R /Resources << /Font << /F1 ${fontId} 0 R /F2 ${titleFontId} 0 R >> >> >>\nendobj`)
  }

  // Fill in Pages object
  const pageRefs = pageObjIds.map(id => `${id} 0 R`).join(' ')
  objects[1] = `${pagesId} 0 obj\n<< /Type /Pages /Kids [${pageRefs}] /Count ${pages.length} >>\nendobj`

  // Assemble PDF
  const offsets: number[] = []
  for (const obj of objects) {
    offsets.push(pdf.length)
    pdf += obj + '\n'
  }

  const xrefOffset = pdf.length
  pdf += 'xref\n'
  pdf += `0 ${objectId}\n`
  pdf += '0000000000 65535 f \n'
  for (const offset of offsets) {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`
  }
  pdf += 'trailer\n'
  pdf += `<< /Size ${objectId} /Root ${catalogId} 0 R >>\n`
  pdf += 'startxref\n'
  pdf += `${xrefOffset}\n`
  pdf += '%%EOF'

  downloadFile(pdf, `${filename}.pdf`, 'application/pdf')
}

function escPdf(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

/**
 * Export words as a DOCX file.
 * Builds a minimal OOXML document using raw XML + zip via Blob.
 */
export async function exportToDOCX(
  words: string[],
  filename: string = 'wordlist',
  config?: { characters: string; length: number }
): Promise<void> {
  // Build the document.xml content
  const rows = words.map(
    (word, i) =>
      `<w:tr><w:tc><w:p><w:r><w:t>${i + 1}</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:rPr><w:rFonts w:ascii="Courier New" w:hAnsi="Courier New"/></w:rPr><w:t>${escXml(word)}</w:t></w:r></w:p></w:tc></w:tr>`
  )

  const headerParagraph = config
    ? `<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>WordForge - Generated Word List</w:t></w:r></w:p><w:p><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>Characters: ${escXml(config.characters)} | Length: ${config.length} | Total: ${words.length.toLocaleString()} words</w:t></w:r></w:p>`
    : '<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Generated Word List</w:t></w:r></w:p>'

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    ${headerParagraph}
    <w:tbl>
      <w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders>
        <w:top w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
        <w:left w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
        <w:bottom w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
        <w:right w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
        <w:insideH w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
        <w:insideV w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
      </w:tblBorders></w:tblPr>
      <w:tr><w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>#</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Word</w:t></w:r></w:p></w:tc></w:tr>
      ${rows.join('\n')}
    </w:tbl>
  </w:body>
</w:document>`

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`

  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`

  // Use JSZip-like approach with raw zip creation
  const zipBlob = await createMinimalZip({
    '[Content_Types].xml': contentTypesXml,
    '_rels/.rels': relsXml,
    'word/document.xml': documentXml,
  })

  const url = URL.createObjectURL(zipBlob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.docx`
  a.click()
  URL.revokeObjectURL(url)
}

function escXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/**
 * Create a minimal zip file from a map of filename -> content strings.
 * Implements the ZIP format spec for storing (no compression) files.
 */
async function createMinimalZip(files: Record<string, string>): Promise<Blob> {
  const entries = Object.entries(files)
  const parts: Uint8Array[] = []
  const centralDirectory: Uint8Array[] = []
  let offset = 0

  for (const [name, content] of entries) {
    const nameBytes = new TextEncoder().encode(name)
    const contentBytes = new TextEncoder().encode(content)
    const crc = crc32(contentBytes)

    // Local file header
    const localHeader = new Uint8Array(30 + nameBytes.length)
    const lv = new DataView(localHeader.buffer)
    lv.setUint32(0, 0x04034b50, true) // signature
    lv.setUint16(4, 20, true) // version needed
    lv.setUint16(6, 0, true) // flags
    lv.setUint16(8, 0, true) // compression (store)
    lv.setUint16(10, 0, true) // mod time
    lv.setUint16(12, 0, true) // mod date
    lv.setUint32(14, crc, true) // crc32
    lv.setUint32(18, contentBytes.length, true) // compressed size
    lv.setUint32(22, contentBytes.length, true) // uncompressed size
    lv.setUint16(26, nameBytes.length, true) // name length
    lv.setUint16(28, 0, true) // extra length
    localHeader.set(nameBytes, 30)

    // Central directory entry
    const cdEntry = new Uint8Array(46 + nameBytes.length)
    const cv = new DataView(cdEntry.buffer)
    cv.setUint32(0, 0x02014b50, true) // signature
    cv.setUint16(4, 20, true) // version made by
    cv.setUint16(6, 20, true) // version needed
    cv.setUint16(8, 0, true) // flags
    cv.setUint16(10, 0, true) // compression
    cv.setUint16(12, 0, true) // mod time
    cv.setUint16(14, 0, true) // mod date
    cv.setUint32(16, crc, true) // crc32
    cv.setUint32(20, contentBytes.length, true) // compressed
    cv.setUint32(24, contentBytes.length, true) // uncompressed
    cv.setUint16(28, nameBytes.length, true) // name length
    cv.setUint16(30, 0, true) // extra length
    cv.setUint16(32, 0, true) // comment length
    cv.setUint16(34, 0, true) // disk start
    cv.setUint16(36, 0, true) // internal attr
    cv.setUint32(38, 0, true) // external attr
    cv.setUint32(42, offset, true) // local header offset
    cdEntry.set(nameBytes, 46)

    parts.push(localHeader)
    parts.push(contentBytes)
    centralDirectory.push(cdEntry)
    offset += localHeader.length + contentBytes.length
  }

  const cdOffset = offset
  let cdSize = 0
  for (const cd of centralDirectory) {
    parts.push(cd)
    cdSize += cd.length
  }

  // End of central directory
  const eocd = new Uint8Array(22)
  const ev = new DataView(eocd.buffer)
  ev.setUint32(0, 0x06054b50, true) // signature
  ev.setUint16(4, 0, true)
  ev.setUint16(6, 0, true)
  ev.setUint16(8, entries.length, true)
  ev.setUint16(10, entries.length, true)
  ev.setUint32(12, cdSize, true)
  ev.setUint32(16, cdOffset, true)
  ev.setUint16(20, 0, true)
  parts.push(eocd)

  return new Blob(parts, { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
}

/**
 * CRC-32 implementation for ZIP file generation.
 */
function crc32(data: Uint8Array): number {
  let crc = 0xFFFFFFFF
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i]
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0)
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0
}

/**
 * Generic file download helper.
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
