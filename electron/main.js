const { app, BrowserWindow, ipcMain, globalShortcut, clipboard, ClipboardItem } = require('electron')
const path = require('path')
const { spawn } = require('child_process')

const SHORTCUT = 'CommandOrControl+Shift+J'

const CSHARP = `
using System;
using System.Runtime.InteropServices;
public class K {
  [DllImport("user32.dll")]
  public static extern void keybd_event(byte vk, byte scan, uint flags, UIntPtr extra);
  public static void Copy() {
    byte[] mods = new byte[] { 0x10, 0x11, 0x12, 0xA0, 0xA1, 0xA2, 0xA3, 0xA4, 0xA5 };
    foreach (byte m in mods) { keybd_event(m, 0, 2, UIntPtr.Zero); }
    keybd_event(0x11, 0, 0, UIntPtr.Zero);
    keybd_event(0x43, 0, 0, UIntPtr.Zero);
    keybd_event(0x43, 0, 2, UIntPtr.Zero);
    keybd_event(0x11, 0, 2, UIntPtr.Zero);
  }
}
`

const SCRIPT = [
  "$code = @'",
  CSHARP.trim(),
  "'@",
  'Add-Type -TypeDefinition $code',
  "[Console]::Out.WriteLine('ready')",
  'while ($true) {',
  '  $line = [Console]::In.ReadLine()',
  '  if ($null -eq $line) { break }',
  "  if ($line -eq 'copy') { [K]::Copy(); [Console]::Out.WriteLine('done') }",
  '}'
].join('\r\n')

let win = null
let ps = null
let psReady = false
let waiting = null
let busy = false

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function startHelper() {
  if (process.platform !== 'win32') return
  const encoded = Buffer.from(SCRIPT, 'utf16le').toString('base64')
  ps = spawn(
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', encoded],
    { windowsHide: true }
  )
  let buf = ''
  ps.stdout.on('data', (d) => {
    buf += d.toString()
    let i = buf.indexOf('\n')
    while (i >= 0) {
      const line = buf.slice(0, i).trim()
      buf = buf.slice(i + 1)
      if (line === 'ready') { psReady = true; console.log('[helper] ready') }
      if (line === 'done' && waiting) {
        const resolve = waiting
        waiting = null
        resolve()
      }
      i = buf.indexOf('\n')
    }
  })
  ps.on('error', (e) => console.log('[helper] failed to start:', e.message))
  ps.on('exit', (code) => {
    console.log('[helper] exited with code', code)
    ps = null
    psReady = false
  })
}

function pressCopy() {
  return new Promise((resolve) => {
    if (!ps || !psReady) return resolve(false)
    const timer = setTimeout(() => {
      waiting = null
      resolve(false)
    }, 2000)
    waiting = () => {
      clearTimeout(timer)
      resolve(true)
    }
    ps.stdin.write('copy\n')
  })
}

async function snapshot() {
  const out = []
  try {
    const items = await clipboard.read()
    for (const item of items) {
      const data = {}
      for (const type of item.types) {
        try { data[type] = await item.getType(type) } catch (e) {}
      }
      if (Object.keys(data).length) out.push(data)
    }
  } catch (e) {
    console.log('Could not read the old clipboard:', e.message)
  }
  return out
}

async function restore(snap, text) {
  try {
    if (snap.length) {
      await clipboard.write(snap.map((d) => new ClipboardItem(d)))
      return
    }
  } catch (e) {
    console.log('Rich restore failed, using plain text:', e.message)
  }
  try {
    if (text) await clipboard.writeText(text)
    else await clipboard.clear()
  } catch (e) {
    console.log('Could not restore the clipboard:', e.message)
  }
}

async function grabSelection() {
  const snap = await snapshot()
  let savedText = ''
  try { savedText = (await clipboard.readText()) || '' } catch (e) {}
  try { await clipboard.clear() } catch (e) {}
  await pressCopy()
  let text = ''
  for (let i = 0; i < 20; i++) {
    text = (await clipboard.readText()) || ''
    if (text) break
    await sleep(40)
  }
  await restore(snap, savedText)
  console.log('Captured length:', text.length)
  return text.trim()
}

function popUp() {
  if (!win) return
  if (win.isMinimized()) win.restore()
  win.setAlwaysOnTop(true, 'screen-saver')
  win.showInactive()
  win.moveTop()
  setTimeout(() => { if (win) win.setAlwaysOnTop(false) }, 150)
}

async function onCapture() {
  console.log('Shortcut pressed. helper ready:', psReady, 'busy:', busy)
  if (busy) return
  busy = true
  try {
    let payload
    if (!psReady) {
      payload = { status: 'busy', text: '' }
    } else {
      const text = await grabSelection()
      payload = { status: text ? 'ok' : 'empty', text }
    }
    if (win) {
      popUp()
      win.webContents.send('captured', payload)
    }
  } catch (e) {
    console.log('Capture failed:', e.message)
  } finally {
    busy = false
  }
}

function createWindow() {
  win = new BrowserWindow({
    width: 330,
    height: 420,
    frame: false,
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    resizable: false,
    backgroundColor: '#c9d2ee',
    webPreferences: { preload: path.join(__dirname, 'preload.js') }
  })
  if (app.isPackaged) win.loadFile(path.join(__dirname, '..', 'dist', 'index.html')); else win.loadURL('http://127.0.0.1:5173')
  win.on('closed', () => { win = null })
}

const FIX = { 'zh-Hans': 'zh-CN', 'zh-Hant': 'zh-TW', fil: 'tl' }
const fixCode = (c) => FIX[c] || c

ipcMain.handle('translate', async (e, args) => {
  try {
    const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&dj=1&dt=t&dt=bd'
      + '&sl=' + encodeURIComponent(fixCode(args.from))
      + '&tl=' + encodeURIComponent(fixCode(args.to))
      + '&q=' + encodeURIComponent(args.text)
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return { ok: false, error: 'HTTP ' + res.status }
    const data = await res.json()
    const full = (data.sentences || []).map((s) => s.trans || '').join('').trim()
    const first = (data.dict || [])[0]
    const pos = first ? (first.pos || '') : ''
    const entries = first ? (first.entry || []).map((x) => x.word).filter(Boolean) : []
    let lead = full
    if (entries.length && full) {
      const hit = entries.find((w) => w.toLowerCase() === full.toLowerCase())
      if (hit) lead = hit
      else if (entries.every((w) => w[0] === w[0].toLowerCase())) lead = full.charAt(0).toLowerCase() + full.slice(1)
    }
    const meanings = []
    for (const w of [lead, ...entries]) {
      if (w && !meanings.some((m) => m.toLowerCase() === w.toLowerCase())) meanings.push(w)
    }
    return { ok: true, full, meanings: meanings.slice(0, 4), pos, src: data.src || args.from }
  } catch (err) {
    console.log('Translate failed:', err.message)
    return { ok: false, error: err.message }
  }
})

ipcMain.on('win:minimize', () => { if (win) win.minimize() })
ipcMain.on('win:close', () => { if (win) win.close() })

app.whenReady().then(() => {
  createWindow()
  startHelper()
  const ok = globalShortcut.register(SHORTCUT, onCapture)
  console.log('Shortcut registered:', ok)
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
  if (ps) ps.kill()
})
app.on('window-all-closed', () => app.quit())




// ---- OCR snip (Ctrl+Shift+K) ----
const { desktopCapturer, screen } = require('electron')
const { createWorker } = require('tesseract.js')

const SNIP_SHORTCUT = 'CommandOrControl+Shift+K'
const OCR_LANGS = 'eng'
let snipping = false
let ocrWorker = null

function pickRegion(display, thumb) {
  return new Promise((resolve) => {
    const ov = new BrowserWindow({
      x: display.bounds.x, y: display.bounds.y,
      width: display.bounds.width, height: display.bounds.height,
      frame: false, resizable: false, movable: false, skipTaskbar: true, alwaysOnTop: true, hasShadow: false,
      webPreferences: { preload: path.join(__dirname, 'snip-preload.js') }
    })
    ov.setAlwaysOnTop(true, 'screen-saver')
    let finished = false
    const onDone = (e, r) => finish(r)
    const finish = (r) => {
      if (finished) return
      finished = true
      ipcMain.removeListener('snip:done', onDone)
      if (!ov.isDestroyed()) ov.close()
      resolve(r)
    }
    ipcMain.on('snip:done', onDone)
    ov.on('closed', () => finish(null))
    ov.loadFile(path.join(__dirname, 'snip.html'))
    ov.webContents.once('did-finish-load', () => {
      ov.webContents.send('snip:image', thumb.toDataURL())
      ov.focus()
    })
  })
}

async function readTextOld(img) {
  if (!ocrWorker) ocrWorker = await createWorker(OCR_LANGS, 1, { cachePath: app.getPath('userData') })
  await ocrWorker.setParameters({ tessedit_pageseg_mode: '6' })
  const { data } = await ocrWorker.recognize(img.toPNG())
  return (data.text || '').replace(/\s+/g, ' ').trim()
}

async function onSnip() {
  if (snipping || busy) return
  snipping = true
  try {
    if (win) { try { ocrLang = (await win.webContents.executeJavaScript("localStorage.getItem('from')")) || 'auto' } catch (e) {} }
    if (!toOcr(ocrLang)) {
      if (win) { popUp(); win.webContents.send('captured', { status: 'nolang', reason: (!ocrLang || ocrLang === 'auto') ? 'auto' : 'unsupported', text: '' }) }
      return
    }
    const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint())
    const sf = display.scaleFactor
    if (win) win.setOpacity(0)
    await sleep(150)
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: Math.round(display.bounds.width * sf), height: Math.round(display.bounds.height * sf) }
    })
    if (win) win.setOpacity(1)
    const src = sources.find((s) => s.display_id === String(display.id)) || sources[0]
    if (!src) return
    const r = await pickRegion(display, src.thumbnail)
    if (!r) return
    const ts = src.thumbnail.getSize()
    const kx = ts.width / (r.vw || display.bounds.width), ky = ts.height / (r.vh || display.bounds.height)
    let img = src.thumbnail.crop({ x: Math.max(0, Math.round(r.x * kx)), y: Math.max(0, Math.round(r.y * ky)), width: Math.max(1, Math.round(r.w * kx)), height: Math.max(1, Math.round(r.h * ky)) })
    const size = img.getSize()
    const f = Math.max(2, Math.min(4, Math.ceil(1000 / size.width))); img = img.resize({ width: size.width * f, height: size.height * f, quality: 'best' })
    
    const text = await readText(img)
    console.log('OCR length:', text.length)
    if (win) {
      popUp()
      win.webContents.send('captured', { status: text ? 'ok' : 'empty', text })
    }
  } catch (e) {
    console.log('Snip failed:', e.message)
    if (win) win.setOpacity(1)
  } finally {
    snipping = false
  }
}

app.whenReady().then(() => {
  console.log('Snip shortcut registered:', globalShortcut.register(SNIP_SHORTCUT, onSnip))
})
app.on('will-quit', () => { if (ocrWorker) ocrWorker.terminate() })





const LANG_MAP = {
  af:'afr', am:'amh', ar:'ara', as:'asm', az:'aze', be:'bel', bg:'bul', bn:'ben', bs:'bos', ca:'cat', ceb:'ceb',
  cs:'ces', cy:'cym', da:'dan', de:'deu', el:'ell', en:'eng', eo:'epo', es:'spa', et:'est', eu:'eus', fa:'fas',
  fi:'fin', fr:'fra', ga:'gle', gl:'glg', gu:'guj', he:'heb', iw:'heb', hi:'hin', hr:'hrv', ht:'hat', hu:'hun',
  id:'ind', is:'isl', it:'ita', ja:'jpn', jv:'jav', ka:'kat', kk:'kaz', km:'khm', kn:'kan', ko:'kor', ku:'kur',
  ky:'kir', la:'lat', lo:'lao', lt:'lit', lv:'lav', mk:'mkd', ml:'mal', mn:'mon', mr:'mar', ms:'msa', mt:'mlt',
  my:'mya', ne:'nep', nl:'nld', no:'nor', or:'ori', pa:'pan', pl:'pol', ps:'pus', pt:'por', ro:'ron', ru:'rus',
  sa:'san', si:'sin', sk:'slk', sl:'slv', sq:'sqi', sr:'srp', sv:'swe', sw:'swa', ta:'tam', te:'tel', tg:'tgk',
  th:'tha', ti:'tir', tr:'tur', ug:'uig', uk:'ukr', ur:'urd', uz:'uzb', vi:'vie', yi:'yid',
  'zh-CN':'chi_sim', 'zh-Hans':'chi_sim', 'zh-TW':'chi_tra', 'zh-Hant':'chi_tra'
}
let ocrLang = 'auto'
let ocrLoaded = ''
const BEST = 'https://tessdata.projectnaptha.com/4.0.0_best'
const toOcr = (c) => (!c || c === 'auto') ? null : (LANG_MAP[c] || null)

async function readText(img) {
  const want = toOcr(ocrLang)
  if (!ocrWorker || ocrLoaded !== want) {
    if (ocrWorker) await ocrWorker.terminate()
    ocrWorker = await createWorker(want, 1, { cachePath: path.join(app.getPath('userData'), 'ocr-fast') })
    await ocrWorker.setParameters({ tessedit_pageseg_mode: '6' })
    ocrLoaded = want
  }
  const { data } = await ocrWorker.recognize(img.toPNG())
  return (data.text || '').replace(/\s+/g, ' ').trim()
}






