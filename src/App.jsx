import { useEffect, useMemo, useState } from 'react'
import { sounds, isSoundOn, setSound } from './sounds.js'

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

function Keys({ k }) {
  return (
    <span className="keys">
      {k.map((x) => <kbd key={x}>{x}</kbd>)}
    </span>
  )
}

export default function App() {
  const langs = useMemo(buildLanguages, [])
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [from, setFrom] = useState(() => localStorage.getItem('from') || 'auto')
  const [to, setTo] = useState(() => localStorage.getItem('to') || 'en')
  const [soundOn, setSoundOn] = useState(isSoundOn())
  const [blink, setBlink] = useState(false)
  const [result, setResult] = useState(null)
  const starCount = 7

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
    setResult({ word: '', meaning: 'The jar opens in the next step!', example: '' })
  }

  return (
    <div className="window">
      <div className="titlebar">
        <span className="title">judy.exe</span>
        <div className="btns">
          <button className={settingsOpen ? 'on' : ''} title="Settings" onClick={toggleSettings}><Gear /></button>
          <button title="Minimize" onClick={() => window.judy.minimize()}>_</button>
          <button title="Close" onClick={() => window.judy.close()}>x</button>
        </div>
      </div>

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
            {result ? (
              <div className="result">
                {result.word ? <div className="word">{result.word}</div> : null}
                <div className="meaning">{result.meaning}</div>
                {result.example ? <div className="example">{result.example}</div> : null}
              </div>
            ) : (
              <div className="hint">Select a word and press Ctrl+Shift+J</div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

