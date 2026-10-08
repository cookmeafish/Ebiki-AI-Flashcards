// A file size for a list row: "512 B", "3.4 KB", "1.2 MB". A 20-byte note showed as "0.0KB", which read as empty.
export const fileSizeLabel = (bytes) => {
  const n = Number(bytes)
  if (!Number.isFinite(n) || n < 0) return ''
  if (n < 1024) return `${Math.round(n)} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}
