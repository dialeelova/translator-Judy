const KEY = 'jar-words'

export function getWords() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {}
  return []
}

export function setWords(list) {
  localStorage.setItem(KEY, JSON.stringify(list))
}

export function hasWord(word, to) {
  const w = String(word).toLowerCase()
  return getWords().some((x) => String(x.word).toLowerCase() === w && x.to === to)
}

export function addWord(item) {
  if (hasWord(item.word, item.to)) return { added: false }
  const list = getWords()
  list.push(item)
  setWords(list)
  return { added: true, count: list.length }
}

export function removeWordAt(i) {
  const list = getWords()
  list.splice(i, 1)
  setWords(list)
  return list
}
