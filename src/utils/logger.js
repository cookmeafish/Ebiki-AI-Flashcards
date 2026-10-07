import { apiFetch } from '../platform'
// Collects OCR pipeline logs and writes them to logs/ directory via Vite dev server
const lines = []

export function ocrLog(msg, data) {
  const entry = data !== undefined ? `${msg} ${JSON.stringify(data)}` : msg
  lines.push(entry)
  console.log(`[Ebiki] ${entry}`)
}

export function ocrLogTable(label, rows) {
  lines.push(`${label}:`)
  if (rows.length === 0) {
    lines.push('  (empty)')
  } else {
    // Header
    const keys = Object.keys(rows[0])
    lines.push('  ' + keys.join('\t'))
    for (const row of rows) {
      lines.push('  ' + keys.map((k) => String(row[k] ?? '')).join('\t'))
    }
  }
  console.log(`[Ebiki] ${label}:`)
  console.table(rows)
}

export async function ocrLogFlush() {
  if (lines.length === 0) return
  // Taken BEFORE the await: a second scan logging while this flush is in flight keeps its lines for the next one.
  const content = lines.splice(0).join('\n')
  try {
    await apiFetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: content,
    })
  } catch (e) {
    console.warn('[Ebiki] Failed to write log file:', e.message)
  }
}
