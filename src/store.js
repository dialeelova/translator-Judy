const KEY = 'words'

const DEMO_WORDS = [
  { word: 'biblioteca', meaning: 'library', example: 'Voy a la biblioteca.', color: 1 },
  { word: 'mariposa', meaning: 'butterfly', example: 'Una mariposa azul.', color: 2 },
  { word: 'ventana', meaning: 'window', example: 'Abre la ventana, por favor.', color: 3 },
  { word: 'estrella', meaning: 'star', example: 'Veo una estrella.', color: 4 },
  { word: 'gato', meaning: 'cat', example: 'El gato duerme.', color: 5 },
  { word: 'luna', meaning: 'moon', example: 'La luna es grande.', color: 6 },
  { word: 'nube', meaning: 'cloud', example: 'Hay una nube rosa.', color: 7 },
  { word: 'lluvia', meaning: 'rain', example: 'Me gusta la lluvia.', color: 1 },
  { word: 'libro', meaning: 'book', example: 'Este libro es viejo.', color: 2 },
  { word: 'amigo', meaning: 'friend', example: 'Mi amigo vive aqu\u00ed.', color: 3 },
  { word: 'sue\u00f1o', meaning: 'dream', example: 'Tuve un sue\u00f1o raro.', color: 4 },
  { word: 'cielo', meaning: 'sky', example: 'El cielo est\u00e1 claro.', color: 5 }
]

export function getWords() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {}
  localStorage.setItem(KEY, JSON.stringify(DEMO_WORDS))
  return DEMO_WORDS
}

export function setWords(list) {
  localStorage.setItem(KEY, JSON.stringify(list))
}
