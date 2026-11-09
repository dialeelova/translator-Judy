import { useEffect, useState } from 'react'
import { sounds } from './sounds.js'
import { getWords, removeWordAt } from './store.js'

const JITTER = [0, 2, -2, 1, -1, 2, 0, -2]

function Bin() {
  const rows = ['...XXX...', 'XXXXXXXXX', '.X.X.X.X.', '.X.X.X.X.', '.X.X.X.X.', '.X.X.X.X.', '.XXXXXXX.']
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

export default function Jar() {
  const [words, setWordsState] = useState(() => getWords())
  const [sel, setSel] = useState(null)
  const [sure, setSure] = useState(false)

  const item = sel !== null && words[sel] ? words[sel] : null

  useEffect(() => {
    if (!sure) return
    const t = setTimeout(() => setSure(false), 3000)
    return () => clearTimeout(t)
  }, [sure])

  const pick = (i) => {
    sounds.star()
    setSel(i)
    setSure(false)
  }

  const remove = () => {
    if (!item) return
    if (!sure) {
      sounds.pop()
      setSure(true)
      return
    }
    const list = removeWordAt(sel)
    sounds.pop()
    setWordsState(list)
    setSel(null)
    setSure(false)
  }

  return (
    <>
      <div className="scene jarscene">
        <div className="layer sky" />
        <div className="layer clouds" />
        <div className="layer sparkA" />
        <div className="layer sparkB" />
        <div className="jarwrap">
          <img className="jlayer" src="/assets/jar_back.png" alt="" />
          <div className="inside">
            <div className="pile">
              {words.map((w, i) => (
                <button
                  key={i}
                  className={sel === i ? 'jstar sel' : 'jstar'}
                  style={{ top: JITTER[i % JITTER.length] }}
                  title={w.word}
                  onClick={() => pick(i)}
                >
                  <img src={'/assets/jstar' + w.color + '.png'} alt={w.word} />
                </button>
              ))}
            </div>
          </div>
          <img className="jlayer front" src="/assets/jar_front.png" alt="" />
        </div>
      </div>

      <div className="bubble">
        <img className="bubble-star" src="/assets/star5.png" alt="" />
        {item ? (
          <button
            className={sure ? 'savebtn del sure' : 'savebtn del'}
            title="Delete this star"
            onClick={remove}
          >
            {sure ? 'sure?' : <Bin />}
          </button>
        ) : null}
        {item ? (
          <div className="result" key={sel + item.word}>
            <div className="word">{item.word}</div>
            <div className="meaning">{item.meaning}</div>
            {item.example ? <div className="example">{item.example}</div> : null}
          </div>
        ) : (
          <div className="hint">
            {words.length ? 'Pick a star to see its word!' : 'Your jar is empty. Translate a word and save it!'}
          </div>
        )}
      </div>
    </>
  )
}
