# Nopeustesti – edistyminen

Spesifikaatio: `NOPEUSTESTI_SPEC.md`. Kaikki vaiheet 1–6 toteutettu (2026-10-20). Ei vielä committeja.

## Tiedostot
- `index.html` – koko peli (HTML + CSS + JS). Kaikki säädöt `CONFIG`-objektissa.
- `manifest.json`, `sw.js` (stale-while-revalidate, `CACHE_VERSION` nostettava kun tiedostolista muuttuu), `icons/` (192, 512, apple-touch 180).
- Kuvakkeet generoitiin stdlib-Python-skriptillä (ei Pillowia koneella); skripti oli vain scratchpadissa.

## Rakenne (index.html)
- `audio`-olio: Web Audio, pietsosummerin jäljitelmä (kanttiaalto → bandpass 4300 Hz Q 4.5 + 8 % dry). Yksi jatkuva "voice", jonka sävel vaihtuu valon mukana; painallus mykistää 220 ms. `oneShot` game overille ja lähtölaskennan piippauksille.
- `led`-olio: 7-segmenttinäyttö SVG:nä (3 numeroa, levenee tarvittaessa).
- `state` + `tick()` (rAF, absoluuttiset aikaleimat), `press()`, `gameOver()`, `pause()/resume()`, `startGame(hard)`.
- Lähtölaskenta: phase on 'playing', mutta `now < startTime` = laskenta, painallukset ohitetaan.
- Erilliset ennätykset normaali/vaikea (`nopeustesti.best`, `nopeustesti.best.hard`).
- `wake`-olio (Wake Lock), fullscreen + orientation lock, pystytilan peittokuva pysäyttää pelin.
- `?debug` näyttää fps, syöteviiveen, intervallin, jonon ja wake lockin tilan.

## Käyttäjän päätökset (poikkeamat spesifikaatiosta)
- **Tempo:** spesifikaation mitatut arvot (500/150/0.982/0.999) olivat liian vaikeita. Käytössä START_INTERVAL 650 ms, MIN_INTERVAL 180 ms, SCORE_FACTOR 0.992, TIME_FACTOR 0.998 – käyttäjä tyytyväinen ("ei lopu heti, mutta ei kestä loputtomasti").
- **Game over -ääni:** spesifikaation kaksivaiheinen ääni (4186 Hz sini + 610.7 Hz summeri) oli "kamala"; matala lowpass-ääni ei kuulunut puhelimesta. Nyt: 95 Hz kanttiaalto saman resonanssisuotimen läpi, 800 ms, 250 ms hiipuminen, 80 % peliäänten tasosta. Käyttäjä hyväksyi tämän ("Ääni on hyvä").

## Testaus
- Paikallinen palvelin: `python -m http.server 8000 --bind 0.0.0.0`, puhelimella http://192.168.1.152:8000
- Wake Lock ja service worker vaativat HTTPS:n (tai localhostin) → eivät toimi LAN-osoitteessa. Vaihtoehdot: Chrome-flag `unsafely-treat-insecure-origin-as-secure`, tunneli (localtunnel/cloudflared) tai julkaisu (GitHub Pages tms.).
- Headless-Chrome + CDP -skripteillä tarkistettu: asettelu 667×375, 844×390, 1024×768, ei konsolivirheitä, PWA asennettava ja toimii offline. Ääntä ei ole voitu kuunnella – käyttäjä testaa korvalla.
