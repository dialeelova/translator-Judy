import { useEffect, useMemo, useState } from 'react'
import { sounds, isSoundOn, setSound } from './sounds.js'
import { getWords, addWord, hasWord } from './store.js'
import Jar from './Jar.jsx'

const CODES = 'af sq am ar hy as ay az bm eu be bn bho bs bg ca ceb zh-Hans zh-Hant co hr cs da dv doi nl en eo et ee fil fi fr fy gl ka de el gn gu ht ha haw he hi hmn hu is ig ilo id ga it ja jv kn kk km rw gom ko kri ku ckb ky lo la lv ln lt lg lb mk mai mg ms ml mt mi mr mni-Mtei lus mn my ne no or om ps fa pl pt pa qu ro ru sm sa gd nso sr st sn sd si sk sl so es su sw sv tg ta tt te th ti ts tr tk ak uk ur ug uz vi cy xh yi yo zu'.split(' ')

const EXTRA = {
  'zh-Hans': 'Chinese (Simplified)',
  'zh-Hant': 'Chinese (Traditional)',
  ku: 'Kurdish (Kurmanji)',
  ckb: 'Kurdish (Sorani)',
  'mni-Mtei': 'Meiteilon (Manipuri)',
  bho: 'Bhojpuri',
  doi: 'Dogri',
  gom: 'Konkani',
  kri: 'Krio',
  lus: 'Mizo',
  nso: 'Sepedi',
  ilo: 'Ilocano',
  mai: 'Maithili'
}

function buildLanguages() {
  const dn = new Intl.DisplayNames(['en'], { type: 'language' })
  return CODES.map((code) => {
    let name = EXTRA[code]
    if (!name) {
      try { name = dn.of(code) } catch (e) { name = code }
    }
    if (!name || name.toLowerCase() === code.toLowerCase()) name = code.toUpperCase()
    return { code, name }
  }).sort((a, b) => a.name.localeCompare(b.name, 'en'))
}

const DEMO = { word: 'biblioteca', meaning: 'library', example: 'Voy a la biblioteca.' }

function Gear() {
  const teeth = []
  for (let i = 0; i < 8; i++) {
    teeth.push(<polygon key={i} points="-2.7,-6 2.7,-6 1.9,-10.6 -1.9,-10.6" transform={'rotate(' + i * 45 + ')'} />)
  }
  return (
    <svg viewBox="-11 -11 22 22" width="12" height="12" fill="currentColor">
      <mask id="gear-hole">
        <rect x="-11" y="-11" width="22" height="22" fill="white" />
        <circle r="3.3" fill="black" />
      </mask>
      <g mask="url(#gear-hole)">
        <circle r="7.4" />
        {teeth}
      </g>
    </svg>
  )
}

function Arrow() {
  const rows = ['...X.....', '..XX.....', '.XXXXXXXX', 'XXXXXXXXX', '.XXXXXXXX', '..XX.....', '...X.....']
  const cells = []
  rows.forEach((r, y) => {
    r.split('').forEach((ch, x) => {
      if (ch === 'X') cells.push(<rect key={x + '-' + y} x={x} y={y} width="1" height="1" />)
    })
  })
  return (
    <svg viewBox="0 0 9 7" width="9" height="7" shapeRendering="crispEdges" fill="currentColor">
      {cells}
    </svg>
  )
}

function Check() {
  const rows = ['.......X.', '......XX.', '.....XX..', 'X...XX...', 'XX.XX....', '.XXX.....', '..X......']
  const cells = []
  rows.forEach((r, y) => {
    r.split('').forEach((ch, x) => {
      if (ch === 'X') cells.push(<rect key={x + '-' + y} x={x} y={y} width="1" height="1" />)
    })
  })
  return (
    <svg viewBox="0 0 9 7" width="18" height="14" shapeRendering="crispEdges" fill="currentColor">
      {cells}
    </svg>
  )
}

function Keys({ k }) {
  return (
    <span className="keys">
      {k.map((x) => <kbd key={x}>{x}</kbd>)}
    </span>
  )
}

export default function App() {
  const langs = useMemo(buildLanguages, [])
  const [view, setView] = useState('home')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [from, setFrom] = useState(() => localStorage.getItem('from') || 'auto')
  const [to, setTo] = useState(() => localStorage.getItem('to') || 'en')
  const [soundOn, setSoundOn] = useState(isSoundOn())
  const [blink, setBlink] = useState(false)
  const [result, setResult] = useState(null)
  const starCount = getWords().length

  useEffect(() => {
    localStorage.setItem('from', from)
    localStorage.setItem('to', to)
  }, [from, to])

  useEffect(() => {
    let t
    const loop = () => {
      t = setTimeout(() => {
        setBlink(true)
        t = setTimeout(() => {
          setBlink(false)
          loop()
        }, 150)
      }, 3000 + Math.random() * 2000)
    }
    loop()
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const BACK = { 'zh-CN': 'zh-Hans', 'zh-TW': 'zh-Hant', tl: 'fil', iw: 'he', jw: 'jv' }
    const nameOf = (code) => {
      const c = BACK[code] || code
      const hit = langs.find((l) => l.code === c)
      return hit ? hit.name : String(code).toUpperCase()
    }
    return window.judy.onCaptured(async (p) => {
      setSettingsOpen(false)
      setView('home')
      if (p.status === 'busy') {
        sounds.pop()
        setResult({ word: '', meaning: 'Waking up... try again!', example: '', size: 'long' })
        return
      }
      if (p.status === 'empty') {
        sounds.pop()
        setResult({ word: '', meaning: 'Nothing selected!', example: '', size: 'long' })
        return
      }
      sounds.star()
      const text = p.text.slice(0, 300)
      const fromCode = localStorage.getItem('from') || 'auto'
      const toCode = localStorage.getItem('to') || 'en'
      setResult({ word: '', meaning: '...', example: '', size: 'big' })
      const r = await window.judy.translate(text, fromCode, toCode)
      if (!r || !r.ok) {
        setResult({ word: '', meaning: 'Could not translate. Check your internet!', example: '', size: 'long' })
        return
      }
      const srcCode = BACK[r.src] || r.src
      if ((fromCode === 'auto' ? srcCode : fromCode) === toCode) {
        setResult({ word: '', meaning: 'Same language! Change the "to" language at the top.', example: '', size: 'long' })
        return
      }
      const single = text.split(/\s+/).length <= 2 && text.length <= 24
      let meaning = r.full
      if (single && r.meanings.length) {
        meaning = ''
        for (const m of r.meanings) {
          const next = meaning ? meaning + ', ' + m : m
          if (meaning && next.length > 26) break
          meaning = next
        }
      }
      let size = 'big'
      if (!single || meaning.length > 26) size = 'long'
      else if (meaning.length > 14) size = 'mid'
      setResult({
        word: single ? text + (r.pos ? ' - ' + r.pos : '') : '',
        meaning: meaning,
        example: single ? nameOf(srcCode) + ' to ' + nameOf(toCode) : '',
        size: size,
        saveable: single,
        raw: text,
        from: fromCode,
        to: toCode,
        color: (getWords().length % 7) + 1,
        saved: single ? hasWord(text, toCode) : false
      })
    })
  }, [])
  useEffect(() => {
    const BACK = { 'zh-CN': 'zh-Hans', 'zh-TW': 'zh-Hant', tl: 'fil', iw: 'he', jw: 'jv' }
    const nameOf = (code) => {
      const c = BACK[code] || code
      const hit = langs.find((l) => l.code === c)
      return hit ? hit.name : String(code).toUpperCase()
    }
    return window.judy.onCaptured(async (p) => {
      setSettingsOpen(false)
      setView('home')
      if (p.status === 'busy') {
        sounds.pop()
        setResult({ word: '', meaning: 'Waking up... try again!', example: '', size: 'long' })
        return
      }
      if (p.status === 'empty') {
        sounds.pop()
        setResult({ word: '', meaning: 'Nothing selected!', example: '', size: 'long' })
        return
      }
      sounds.star()
      const text = p.text.slice(0, 300)
      const fromCode = localStorage.getItem('from') || 'auto'
      const toCode = localStorage.getItem('to') || 'en'
      setResult({ word: '', meaning: '...', example: '', size: 'big' })
      const r = await window.judy.translate(text, fromCode, toCode)
      if (!r || !r.ok) {
        setResult({ word: '', meaning: 'Could not translate. Check your internet!', example: '', size: 'long' })
        return
      }
      const srcCode = BACK[r.src] || r.src
      if ((fromCode === 'auto' ? srcCode : fromCode) === toCode) {
        setResult({ word: '', meaning: 'Same language! Change the "to" language at the top.', example: '', size: 'long' })
        return
      }
      const single = text.split(/\s+/).length <= 2 && text.length <= 24
      let meaning = r.full
      if (single && r.meanings.length) {
        meaning = ''
        for (const m of r.meanings) {
          const next = meaning ? meaning + ', ' + m : m
          if (meaning && next.length > 26) break
          meaning = next
        }
      }
      let size = 'big'
      if (!single || meaning.length > 26) size = 'long'
      else if (meaning.length > 14) size = 'mid'
      setResult({
        word: single ? text + (r.pos ? ' - ' + r.pos : '') : '',
        meaning: meaning,
        example: single ? nameOf(srcCode) + ' to ' + nameOf(toCode) : '',
        size: size,
        saveable: single,
        raw: text,
        from: fromCode,
        to: toCode,
        color: (getWords().length % 7) + 1,
        saved: single ? hasWord(text, toCode) : false
      })
    })
  }, [])
  const saveStar = () => {
    if (!result || !result.saveable || result.saved) return
    const out = addWord({
      word: result.raw,
      meaning: result.meaning,
      example: result.example,
      color: result.color,
      from: result.from,
      to: result.to
    })
    if (out.added) sounds.save()
    else sounds.pop()
    setResult({ ...result, saved: true })
  }

  const toggleSettings = () => {
    sounds.tab()
    setSettingsOpen((v) => !v)
  }
  const swap = () => {
    if (from === 'auto') return
    sounds.pop()
    setFrom(to)
    setTo(from)
  }
  const toggleSound = () => {
    const next = !soundOn
    setSound(next)
    setSoundOn(next)
    if (next) sounds.pop()
  }
  const touchJudy = () => {
    sounds.star()
    setResult(DEMO)
  }
  const openJar = () => {
    sounds.jar()
    setSettingsOpen(false)
    setView('jar')
  }
  const backToJudy = () => {
    sounds.tab()
    setView('home')
  }

  return (
    <div className="window">
      <div className="titlebar">
        <div className="left">
          {view === 'jar' ? (
            <div className="btns">
              <button title="Back to Judy" onClick={backToJudy}><Arrow /></button>
            </div>
          ) : null}
          <span className="title">{view === 'jar' ? 'star jar' : 'judy.exe'}</span>
        </div>
        <div className="btns">
          {view === 'home' ? (
            <button className={settingsOpen ? 'on' : ''} title="Settings" onClick={toggleSettings}><Gear /></button>
          ) : null}
          <button title="Minimize" onClick={() => window.judy.minimize()}>_</button>
          <button title="Close" onClick={() => window.judy.close()}>x</button>
        </div>
      </div>

      {view === 'jar' ? (
        <Jar />
      ) : (
        <>
          <div className="langbar">
            <select title="Translate from" value={from} onChange={(e) => { sounds.pop(); setFrom(e.target.value) }}>
              <option value="auto">Auto-detect</option>
              {langs.map((l) => (
                <option key={l.code} value={l.code}>{l.name}</option>
              ))}
            </select>
            <button className="swap" onClick={swap} disabled={from === 'auto'} title="Swap languages">
              {'\u21C4'}
            </button>
            <select title="Translate to" value={to} onChange={(e) => { sounds.pop(); setTo(e.target.value) }}>
              {langs.map((l) => (
                <option key={l.code} value={l.code}>{l.name}</option>
              ))}
            </select>
          </div>

          {settingsOpen ? (
            <div className="settings">
              <div className="sec">
                <div className="sec-title">shortcuts</div>
                <div className="row"><span>translate a word</span><Keys k={['Ctrl', 'Shift', 'J']} /></div>
                <div className="row"><span>read from image</span><Keys k={['Ctrl', 'Shift', 'K']} /></div>
              </div>

              <div className="sec">
                <div className="row">
                  <span>sound</span>
                  <button className={soundOn ? 'toggle on' : 'toggle'} onClick={toggleSound}>
                    {soundOn ? 'on' : 'off'}
                  </button>
                </div>
              </div>

              <button className="back" onClick={toggleSettings}>back to Judy</button>
            </div>
          ) : (
            <>
              <div className="scene">
                <div className="layer sky" />
                <div className="layer clouds" />
                <div className="layer sparkA" />
                <div className="layer sparkB" />
                <img
                  className="cat"
                  src={blink ? '/assets/mascot_blink.png' : '/assets/mascot_idle.png'}
                  alt="Judy"
                  onClick={touchJudy}
                />
                <button className="jarhold" title="Open the jar" onClick={openJar}>
                  <img src="/assets/jar_full.png" alt="jar" />
                  <span className="badge">{starCount}</span>
                </button>
              </div>

              <div className="bubble">
                <img className="bubble-star" src="/assets/star5.png" alt="" />
            {result && result.saveable ? (
              <button className={result.saved ? 'savebtn saved' : 'savebtn'} title={result.saved ? 'In your jar' : 'Save to the jar'} onClick={saveStar}>
                {result.saved ? <Check /> : <img src={'/assets/star' + result.color + '.png'} alt="" />}
              </button>
            ) : null}
                {result ? (
                  <div className="result" key={result.word + result.meaning}>
                    {result.word ? <div className="word">{result.word}</div> : null}
                    <div className={'meaning ' + (result.size || 'big')}>{result.meaning}</div>
                    {result.example ? <div className="example">{result.example}</div> : null}
                  </div>
                ) : (
                  <div className="hint">Select a word and press Ctrl+Shift+J</div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}





