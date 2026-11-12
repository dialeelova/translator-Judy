# translator-Judy

A cute pixel desktop translator. Select a word in any app, press a shortcut, and Judy the cat shows you the translation. Save the words you want to remember as paper stars in a jar.

## What it does

- **Translate anything on your screen.** Select a word (or a short phrase) in a browser, Word, a PDF reader or a chat app and press `Ctrl + Shift + J`. Judy pops to the front and shows the translation. Your clipboard is put back the way it was.
- **Short, easy meanings.** For single words you get a few short meanings and the part of speech, for example "verb".
- **Collect words as stars.** Press the little star button to drop a word into your jar. Open the jar to browse your stars, click one to see its word and translation, and remove it with the trash button.
- **Any language pair.** Choose "from" (or Auto-detect) and "to" from about 130 languages, listed A-Z.
- **Cozy extras.** A layered pixel sky with drifting clouds and twinkling stars, a blinking cat, and soft bell sounds you can switch off in settings.

## Shortcuts

| Shortcut | What it does |
| --- | --- |
| `Ctrl + Shift + J` | Translate the selected text |
| `Ctrl + Shift + K` | Read text from an image (planned, not working yet) |

## Getting started

You need Windows 10 or 11 and [Node.js](https://nodejs.org) (the LTS version). Then run:

    git clone https://github.com/dialeelova/translator-Judy.git
    cd translator-Judy
    npm install
    npm run dev

The first launch downloads Electron, which takes a minute or two.

## Good to know

- **Best for words and short phrases.** Judy is made for looking up words. Whole sentences and paragraphs are translated too, but only for a quick look, not as a polished translation.
- **A word is translated without its sentence,** so a word with many meanings can show the wrong one.
- **Machine translation can be wrong,** especially for smaller languages.
- **Translations come from Google's free web translator.** This is an unofficial service that can change or be limited at any time.
- **Windows only for now.** The part that copies your selection uses Windows PowerShell.
- **`Ctrl + Shift + J` opens DevTools in Chrome and Edge.** While Judy is running, she takes that shortcut.

## Privacy

Your saved words and settings stay on your computer. The text you select is sent to Google to be translated. Nothing else is sent anywhere.

## Roadmap

- [x] Capture the selected text with a global shortcut
- [x] Translation with short meanings
- [x] Save stars to the jar and delete them
- [ ] Better meanings that fit the sentence (needs a paid AI service)
- [ ] Read text from an image
- [ ] Windows installer, start with Windows, tray icon

## Built with

Electron, React, Vite, and the Pixelify Sans font (SIL Open Font License, via Fontsource).

## License

MIT, see the LICENSE file.
