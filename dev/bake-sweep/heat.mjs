// Side-by-side PNG (vector | 8 px | baked) -> an amplified difference heatmap next to both, 2x enlarged.
import path from 'path'
import { createRequire } from 'module'
const sharp = createRequire(path.resolve('package.json'))('sharp')
for (const f of process.argv.slice(2)) {
  const img = sharp(f)
  const { width, height } = await img.metadata()
  const w = (width - 8) / 2
  const a = await sharp(f).extract({ left: 0, top: 0, width: w, height }).ensureAlpha().raw().toBuffer()
  const b = await sharp(f).extract({ left: w + 8, top: 0, width: w, height }).ensureAlpha().raw().toBuffer()
  const d = Buffer.alloc(a.length)
  for (let i = 0; i < a.length; i += 4) {
    const v = Math.min(255, 4 * Math.max(Math.abs(a[i] - b[i]), Math.abs(a[i + 1] - b[i + 1]), Math.abs(a[i + 2] - b[i + 2])))
    d[i] = v; d[i + 1] = v > 100 ? 0 : v; d[i + 2] = 0; d[i + 3] = 255
  }
  const out = f.replace(/\.png$/, '-heat.png')
  await sharp({ create: { width: w * 3 + 16, height, channels: 4, background: '#fff' } })
    .composite([{ input: await sharp(f).extract({ left: 0, top: 0, width: w, height }).png().toBuffer(), left: 0, top: 0 },
      { input: await sharp(f).extract({ left: w + 8, top: 0, width: w, height }).png().toBuffer(), left: w + 8, top: 0 },
      { input: await sharp(d, { raw: { width: w, height, channels: 4 } }).png().toBuffer(), left: 2 * w + 16, top: 0 }])
    .resize({ width: (w * 3 + 16) * 2, kernel: 'nearest' }).png().toFile(out)
  console.log(out)
}
