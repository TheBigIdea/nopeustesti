# Nopeustesti – edistyminen

Spesifikaatio: `NOPEUSTESTI_SPEC.md`. Kaikki vaiheet 1–6 toteutettu (2026-10-20).
Muutospyyntö `NOPEUSTESTI_MUUTOKSET.md` (jälkeen jääminen, toistojen painotus, Vaikea pois, uusi ulkoasu) toteutettu 2026-11-07.

## Repo ja julkaisu
- GitHub: https://github.com/TheBigIdea/nopeustesti (julkinen), haara `main` (nimetty uudelleen masterista).
- GitHub Pages (legacy-build `main` / root, otettu käyttöön API:lla): https://thebigidea.github.io/nopeustesti/ – päivittyy ~1 min jokaisesta pushista `main`iin.
- Käyttäjän GitHub-tili on **TheBigIdea** (gitin `user.name` "Lauriboy" on eri asia; sillä nimellä on erillinen GitHub-tili).
- Autentikointi: HTTPS + Git Credential Manager (token Windowsin tunnustenhallinnassa). Koneen SSH-avain `~/.ssh/id_rsa` on salasanasuojattu eikä sitä ole lisätty GitHubiin → älä käytä SSH:ta.
- `gh`-CLI:tä ei ole asennettu; GitHub API:a voi kutsua GCM:n tokenilla (`git credential fill`).
- Ensimmäinen kirjautuminen ei onnistunut Claude Coden `!`-komennolla (ei interaktiivinen), vaan käyttäjän omassa päätteessä.

## Tiedostot
- `index.html` – koko peli (HTML + CSS + JS). Kaikki säädöt `CONFIG`-objektissa.
- `manifest.json`, `sw.js` (sivu network-first 3 s aikakatkaisulla, muut tiedostot stale-while-revalidate; `CACHE_VERSION` nostettava kun tiedostolista tai SW muuttuu; nyt `v3`. Aiempi pelkkä stale-while-revalidate näytti päivityksen vasta toisella avauksella, ja käyttäjä näki vanhan tulosnäkymän), `icons/` (192, 512, apple-touch 180).
- `fonts/` – Bungee, Rubik (variable, kattaa painot 400/600/700) ja Share Tech Mono, Google Fontsin latin-osajoukot (sis. ä/ö) itse hostattuina, jotta peli toimii offline. Service worker cachettaa vain saman originin tiedostot, joten Google Fonts -linkki ei olisi toiminut offline.
- Kuvakkeet generoitiin stdlib-Python-skriptillä (ei Pillowia koneella); skripti oli vain scratchpadissa. Kuvakkeet ovat yhä vanhan tumman tyylin mukaiset.

## Ulkoasu
- **Ainoa totuus ulkoasusta on Claude-kangas** https://claude.ai/code/artifact/c01a1e9b-ee00-4f35-a84d-f9fc6b873160 (tiedostot `project/Main.dc.html`, `project/Peli.dc.html`, `project/Loppu.dc.html`, luetaan Artifact-työkalulla). Kun käyttäjä pyytää "päivitä ulkoasu kankaan mukaan", lue ne uudelleen ja siirrä muutokset tavallisena HTML/CSS:nä `index.html`:ään.
- Suunnittelumitat 844 × 390. `#stage` on tämän kokoinen ja skaalataan `fitStage()`-funktiolla (ResizeObserver) mittasuhteet säilyttäen safe-arean sisään. Ympärille jäävä tila on `#6E0812`.
- Kolme näkymää (`#viewStart`, `#viewGame`, `#viewResult`), `showView()` vaihtaa. Pisteet nollilla täytettyinä (`pad()`, 3 numeroa). 7-segmentti-SVG poistettu; pisteet Share Tech Monolla kuten kankaassa.
- Napit vasemmalta: keltainen, vihreä, sininen, punainen. Äänikytkentä ennallaan (punainen=1, keltainen=2, vihreä=3, sininen=4 – sininen korvasi oranssin).
- Äänet- ja koko näyttö -painikkeet (kankaassa ei paikkaa): pienet keltaiset kuvakkeet (`#tools`) kortin oikeassa yläkulmassa aloitus- ja tulosnäkymässä, piilossa pelin aikana. Koko näyttö -kuvake piilossa iOS Safarissa ja asennettuna.
- Pystytilan peittokuva: punainen pohja, keltainen kehys ja Bungee-teksti.

## Pelilogiikka (index.html)
- `audio`-olio: Web Audio, pietsosummerin jäljitelmä (kanttiaalto → bandpass 4300 Hz Q 4.5 + 8 % dry). Yksi jatkuva "voice", jonka sävel vaihtuu valon mukana; painallus mykistää 220 ms. `oneShot` game overille ja lähtölaskennan piippauksille.
- `state` + `tick()` (rAF, absoluuttiset aikaleimat), `press()`, `gameOver(flashIndex)`, `interrupt()`, `startGame()`.
- Lähtölaskenta: phase on 'playing', mutta `now < startTime` = laskenta (näkyy pistenäytössä), painallukset ohitetaan.
- **Jälkeen jääminen:** kun uusi valo syttyy ja jonossa on jo ≥ `BEHIND_THRESHOLD` (2) valoa, `state.behindFactor *= BEHIND_SPEEDUP` (0.96). Kun jono putoaa alle kynnyksen, kerroin nollautuu heti (normaali käyrä jatkuu – käyttäjän päätös, poikkeaa muutospyynnön "nopeus säilyy" -kohdasta). `MAX_BEHIND` = 6: game over kun jonossa 7. Testattu: ilman painalluksia peli päättyy 7. valoon ~3,7 s kohdalla.
- **Toistot:** `REPEAT_WEIGHTS` [0.5, 0.15, 0] korvasi `ALLOW_REPEAT`in; `state.runLength` laskee peräkkäiset. Testattu 100 000 arvonnalla: tupla 14,3 %, kolmonen 4,9 %, nelonen 0, värijakauma tasainen.
- **Ei taukoa** (käyttäjän päätös): taustalle meneminen tai pystyyn kääntäminen päättää pelin ja tulos tallentuu (`interrupt()` → tulosnäkymä). Lähtölaskennan aikana keskeytys palaa aloitusnäkymään tallentamatta.
- Game over: väärä/viimeinen nappi vilkkuu `GAME_OVER_VIEW_MS` (1200 ms, käyttäjä hyväksyi puhelimella), sitten automaattisesti tulosnäkymä (ei kankaan "VÄÄRÄ NAPPI" -peittokuvaa – käyttäjän päätös). Tulosnäkymä (kankaan päivitys 2026-11-07) on aloitusnäkymän kaltainen: iso "PELI PÄÄTTYI", vasemmalla pisteet ja joko "Uusi ennätys!" -pilleri + EDELLINEN ENNÄTYS -laatikko tai ENNÄTYS-laatikko, oikealla iso ALOITA-ympyrä (aloittaa uuden pelin; ei Alkuun-nappia). ALOITA ohittaa painallukset `RESULT_LOCK_MS` (400 ms) ajan.
- localStorage: `nopeustesti.best` (ennätys), `nopeustesti.last` (edellinen tulos, uusi), `nopeustesti.muted`. Vaikea-tila ja `nopeustesti.best.hard` poistettu.
- `wake`-olio (Wake Lock pelin ajan), fullscreen + orientation lock.
- `?debug` näyttää fps, syöteviiveen, intervallin, behind-kertoimen, jonon ja wake lockin tilan.

## Käyttäjän päätökset (poikkeamat spesifikaatiosta)
- **Tempo:** spesifikaation mitatut arvot (500/150/0.982/0.999) olivat liian vaikeita. Käytössä START_INTERVAL 650 ms, MIN_INTERVAL 180 ms, SCORE_FACTOR 0.992, TIME_FACTOR 0.998 – käyttäjä tyytyväinen ("ei lopu heti, mutta ei kestä loputtomasti").
- **Game over -ääni:** spesifikaation kaksivaiheinen ääni (4186 Hz sini + 610.7 Hz summeri) oli "kamala"; matala lowpass-ääni ei kuulunut puhelimesta. Nyt: 95 Hz kanttiaalto saman resonanssisuotimen läpi, 800 ms, 250 ms hiipuminen, 80 % peliäänten tasosta. Käyttäjä hyväksyi tämän ("Ääni on hyvä").
- **Vaikea-tila poistettu** (ei pelattavissa).
- 2026-11-07 muutospyynnön tarkennukset: kiihdytyksen kynnys 2 (ei 1), kerroin nollautuu kiinni saadessa, game over → tulos automaattisesti, ei taukoa, reunatila `#6E0812`.

## Testaus
- Paikallinen palvelin: `python -m http.server 8000 --bind 0.0.0.0`, puhelimella http://192.168.1.152:8000
- Wake Lock ja service worker vaativat HTTPS:n (tai localhostin) → eivät toimi LAN-osoitteessa. Testaa ne GitHub Pages -osoitteessa.
- Headless-Chrome + CDP: Node 24:n sisäänrakennettu WebSocket riittää (Pythonista puuttuu websocket-moduuli). Chrome tarvitsee absoluuttisen `--user-data-dir`-polun. Tarkistettu 844×390, 667×375, 1024×768 ja pystytila, ei konsolivirheitä. Käyttäjä on kuunnellut äänet puhelimella: hyvät (2026-11-07). Wake lock varmistettu toimivaksi käyttäjän puhelimella Pages-osoitteessa (`?debug`, 2026-11-07).
