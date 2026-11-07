import { useState } from 'react'
import { sounds } from './sounds.js'
import { getWords } from './store.js'

const JITTER = [0, 2, -2, 1, -1, 2, 0, -2]

export default function Jar() {
  const [words] = useState(() => getWords())
  const [sel, setSel] = useState(null)

  const item = sel !== null && words[sel] ? words[sel] : null
  const pick = (i) => {
    sounds.star()
    setSel(i)
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
          <div className="result">
            <div className="word">{item.word}</div>
            <div className="meaning">{item.meaning}</div>
            {item.example ? <div className="example">{item.example}</div> : null}
          </div>
        ) : (
          <div className="hint">
            {words.length ? 'Pick a star to see its word!' : 'Your jar is empty. Save a word to get your first star!'}
          </div>
        )}
      </div>
    </>
  )
}
