// A COURSE'S STUDY GUIDE in a mode's knowledge base (the owner: "fill that knowledge base for security+ ... so that ebi
// can be a master at security+"). The course ships its chapters in public/careers/<course>/knowledge/ with a
// manifest.json { course, files: [{ file, title, version }] }; starting the course installs them into the mode's
// knowledge folder (docs/plans/2026-11-15-security-plus-knowledge.md, items 17 to 21). Rules:
//   - Course files are named `course-<course>-<file>`: a learner's own notes never collide and are never touched.
//   - A record `.course-<course>.json` in the knowledge folder remembers what was installed ({ files: { name: version } }).
//   - New file: written. Older version installed: replaced in place (a switched-off copy stays switched off).
//   - Installed before but gone now (the learner deleted it): left gone, unless `restore`.
//   - A course file no longer in the manifest (an older layout): removed, on or off.
// Pure of the dev server (fs, path, writeFileAtomic, readUtf8 passed in), so tests run it on a temp folder.
export const COURSE_ID_RE = /^[a-z0-9][a-z0-9-]{0,63}$/
export const courseFilePrefix = (course) => `course-${course}-`
const recordName = (course) => `.course-${course}.json`

export function readCourseManifest({ srcDir, fs, path, readUtf8 }) {
  const m = JSON.parse(readUtf8(path.join(srcDir, 'manifest.json')))
  if (!m || !Array.isArray(m.files)) throw new Error('bad course manifest')
  const files = m.files.filter((f) => f && /^[A-Za-z0-9_.-]+\.md$/.test(String(f.file)) && !/^\.+/.test(String(f.file)))
  return { course: String(m.course || ''), files: files.map((f) => ({ file: f.file, title: String(f.title || f.file), version: String(f.version || '') })) }
}

export function installCourseKnowledge({ course, srcDir, destDir, restore = false, fs, path, writeFileAtomic, readUtf8 }) {
  if (!COURSE_ID_RE.test(String(course || ''))) throw new Error('bad course id')
  const manifest = readCourseManifest({ srcDir, fs, path, readUtf8 })
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true })
  const prefix = courseFilePrefix(course)
  const recPath = path.join(destDir, recordName(course))
  let rec = { files: {} }
  try { rec = JSON.parse(readUtf8(recPath)) || rec } catch (e) { if (e && e.code !== 'ENOENT') { /* damaged record: start over, files on disk decide */ } }
  if (!rec.files || typeof rec.files !== 'object') rec.files = {}
  const onDisk = fs.readdirSync(destDir)
  const exists = (name) => onDisk.find((f) => f.toLowerCase() === name.toLowerCase())
  const out = { installed: [], updated: [], skipped: [], removed: [], kept: [] }
  const wanted = new Set()
  for (const f of manifest.files) {
    const name = prefix + f.file
    wanted.add(name.toLowerCase())
    const live = exists(name)
    const off = exists(`${name}.disabled`)
    const had = Object.prototype.hasOwnProperty.call(rec.files, name)
    if (!live && !off && had && !restore) { out.skipped.push(name); continue } // the learner removed it
    if ((live || off) && rec.files[name] === f.version && !restore) { out.kept.push(name); continue }
    const text = readUtf8(path.join(srcDir, f.file))
    const target = off && !live ? path.join(destDir, off) : path.join(destDir, live || name)
    writeFileAtomic(target, text)
    rec.files[name] = f.version
    ;(live || off ? out.updated : out.installed).push(name)
  }
  for (const f of onDisk) {
    const base = f.replace(/\.disabled$/i, '')
    if (!base.toLowerCase().startsWith(prefix.toLowerCase()) || wanted.has(base.toLowerCase())) continue
    fs.rmSync(path.join(destDir, f), { force: true })
    delete rec.files[base]
    out.removed.push(f)
  }
  for (const k of Object.keys(rec.files)) if (!wanted.has(k.toLowerCase())) delete rec.files[k]
  rec.course = course
  rec.at = new Date().toISOString()
  writeFileAtomic(recPath, JSON.stringify(rec, null, 2))
  return out
}
