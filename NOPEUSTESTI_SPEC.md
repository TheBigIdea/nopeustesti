# Nopeustesti – selainversio (spesifikaatio Claude Codelle)

## Tavoite
Rakenna mahdollisimman uskollinen selainkopio suomalaisesta Nopeustesti-reaktiopelistä (Coinline Oy, tunnettu Speden Speleistä). Peli pelataan puhelimella vaakatilassa, ja sen pitää skaalautua kaikille näytöille. Käytä omaa grafiikkaa – älä kopioi Coinlinen tai Speden Spelien logoja tai tavaramerkkejä.

## Teknologia
- **Yksi `index.html`**, jossa HTML, CSS ja JavaScript. Ei frameworkia, ei build-vaihetta, ei riippuvuuksia.
- Vanilla JS (ES2020+), Web Audio API äänille, `localStorage` ennätykselle.
- Koodin muuttujat ja kommentit englanniksi, käyttöliittymän tekstit suomeksi.
- Valinnainen myöhemmin: `manifest.json` + service worker (PWA, offline, kotinäytölle lisääminen).

## Pelimekaniikka
1. Neljä isoa pyöreää nappia vierekkäin: **punainen, keltainen, vihreä, oranssi** (järjestys ja värit konfiguroitavissa).
2. Peli sytyttää valon yhteen satunnaiseen nappiin kerrallaan, tasaisella rytmillä. Valo palaa lyhyesti (esim. ~60 % intervallista) ja sammuu.
3. Pelaaja painaa nappeja **samassa järjestyksessä kuin valot syttyivät**. Pelaaja voi olla jäljessä: syttyneet mutta kuittaamattomat valot jäävät jonoon (FIFO).
4. Jokainen oikea painallus = +1 piste.
5. **Peli päättyy**, jos:
   - pelaaja painaa väärää nappia (eli eri nappia kuin jonon ensimmäinen), tai
   - painaa kun jono on tyhjä (ennenaikainen painallus = virhe), tai
   - jono kasvaa yli `MAX_BEHIND`-rajan (oletus 50, konfiguroitava).
6. **Nopeutuminen:** intervalli riippuu ensisijaisesti **pistemäärästä** (eli mitä nopeammin pelaaja kuittaa, sitä nopeammin peli kiihtyy), ja lisäksi hitaasti **kuluneesta ajasta**. Esimerkkikaava:
   `interval = max(MIN_INTERVAL, START_INTERVAL * SCORE_FACTOR^score * TIME_FACTOR^seconds)`
   Kaikki vakiot `CONFIG`-objektiin yhteen paikkaan, jotta tuntumaa voi säätää.
7. Satunnaisuus: oletuksena sama nappi voi syttyä kahdesti peräkkäin; tee tästä asetus (`ALLOW_REPEAT`).
8. Vaikeustaso "Vaikea": peli alkaa pistemäärästä 100 vastaavalla nopeudella (kuten osassa alkuperäisistä laitteista).
9. Pelin lopussa: väärä/viimeinen nappi vilkkuu, lyhyt "game over" -ääni, pisteet jäävät näytölle. Ennätys tallentuu `localStorage`en.

## Ajoitus ja vasteaika (tärkeää)
- Käytä `pointerdown`-tapahtumia (ei `click`), jotta viivettä ei tule.
- Tue multitouchia: jokainen nappi käsittelee omat pointerinsa itsenäisesti.
- Ajoitus `performance.now()` + `requestAnimationFrame`-silmukka, joka laskee seuraavan syttymisen tarkasta aikaleimasta (älä ketjuta `setTimeout`eja, ne driftaavat).
- Pelin pysäytys, jos välilehti menee taustalle (`visibilitychange`).

## Äänet
Arvot on mitattu alkuperäisen laitteen äänityksestä (Speden sallitut leikit 1991). Kaikki generoidaan Web Audio API:lla, ei äänitiedostoja.

**Äänilähde:** alkuperäinen on pietsosummeri, jota ohjataan kanttiaallolla. Kuuluvat lähinnä parittomat yläsävelet summerin resonanssin kohdalla (~4,1–4,8 kHz). Perustaajuus on lähes kuulumaton. Toteutus:
`OscillatorNode('square', f0)` → `BiquadFilterNode('peaking' tai 'bandpass', 4300 Hz, Q ≈ 4–5)` → `GainNode`. Sekoita mukaan hieman (~5–10 %) suodattamatonta signaalia. Lopputulos on terävä ja "sähköinen", ja se toimii hyvin myös puhelimen kaiuttimesta.

**Nappien äänet (kanttiaallon perustaajuus):**
| Ääni | f0 |
|---|---|
| 1 (matalin) | 141.25 Hz |
| 2 | 183.2 Hz |
| 3 | 236.9 Hz |
| 4 (korkein) | 316.5 Hz |

Värikohtaista kytkentää ei voinut päätellä äänestä. Tee siitä `CONFIG`-asetus, oletuksena punainen=1, keltainen=2, vihreä=3, oranssi=4.

**Äänen käyttäytyminen pelin aikana (mitattu):**
- Kun valo syttyy, sen nappia vastaava ääni alkaa ja soi **jatkuvasti seuraavan valon syttymiseen asti**. Seuraava valo vaihtaa sävelkorkeuden suoraan ilman taukoa.
- Jokainen napin painallus **mykistää äänen ~220 ms ajaksi** (mitattu 210–230 ms, vakio myös pelin nopeutuessa). Tämän jälkeen soi taas viimeksi syttyneen valon ääni.
- Tee näistä asetukset (`TONE_SUSTAIN`, `PRESS_MUTE_MS = 220`), jotta vaihtoehtoista käytöstä voi kokeilla.

**Game over (kaksivaiheinen, mitattu viidestä pelistä):**
1. **Vaihe 1:** puhdas siniääni **4186 Hz**, noin 12–15 dB hiljaisempi kuin peliäänet. Kesto vaihteli äänityksessä 1–5 s, oletus 2,5 s.
2. **Vaihe 2:** kova kanttiaalto **610.7 Hz** saman resonanssisuotimen läpi (kuuluu lähinnä 7. yläsävel ~4275 Hz sekä 1830, 3055 ja 5500 Hz). Kesto 4–5,3 s, oletus 4,5 s. Tämän jälkeen hiljaisuus.
- Molemmat kestot `CONFIG`iin. Ääni loppuu, jos pelaaja aloittaa uuden pelin.

**Muuta:**
- Lisää 3–5 ms fade in/out jokaiseen äänen alkuun ja loppuun, jotta naksahduksia ei kuulu.
- Äänen mykistys -painike.
- AudioContext käynnistetään ensimmäisestä käyttäjän kosketuksesta (mobiiliselainten vaatimus).

## Mitattu tahti (alkuperäinen, 1. peli)
- Painalluksia noin 41 kpl 15,5 sekunnissa.
- Valojen väli alussa ~0,50 s, noin 10 painalluksen kohdalla ~0,42 s, noin 25 painalluksen kohdalla ~0,33 s ja lopussa ~0,30 s.
- Nopeutumiskaavan oletusarvoiksi: `START_INTERVAL = 500 ms`, `SCORE_FACTOR ≈ 0.982` (per piste), `MIN_INTERVAL` aluksi 150 ms. `TIME_FACTOR` vain pieni lisä.

## Ulkoasu ja skaalautuvuus
- Vaakatila on pääkäyttö. Pystytilassa näytetään peittokuva "Käännä puhelin vaakatasoon".
- Asettelu: pistenäyttö ylhäällä keskellä (punainen 7-segmentti-tyylinen LED-numeronäyttö, CSS:llä tai SVG:llä), neljä nappia alla rivissä.
- Napin koko lasketaan näytön mitoista, esim. `min(20vw, 55dvh)`. Käytä `dvh`/`dvw`-yksiköitä ja `env(safe-area-inset-*)` loven ja kotipalkin huomioimiseksi.
- Napit näyttävät fyysisiltä arcade-napeilta: sammuneena tumma sävy, syttyneenä kirkas väri + hehku (`box-shadow`), painettaessa pieni painuma-animaatio.
- Estä selaimen häiriöt: `touch-action: none`, `user-select: none`, ei tuplanapautuszoomia, ei kontekstivalikkoa pitkällä painalluksella, `overscroll-behavior: none`.
- `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`
- "Koko näyttö" -painike: Fullscreen API ja sen jälkeen `screen.orientation.lock('landscape')` (toimii Androidilla; iOS:llä ohitetaan virheettä).
- Screen Wake Lock API pelin ajaksi, jotta näyttö ei sammu.
- Tumma tausta, joka muistuttaa laitteen koteloa.

## Valikko
- Aloitusnäkymä: "Aloita" (normaali), "Vaikea", ennätys, äänet päälle/pois, koko näyttö.
- Lyhyt 3–2–1-lähtölaskenta ennen pelin alkua.

## Laatuvaatimukset
- Toimii Chrome Androidilla ja Safari iOS:llä.
- Ei konsolivirheitä. 60 fps animaatiot.
- Testaa selaimen kehittäjätyökalujen mobiiliemulaatiolla ainakin 667×375, 844×390 ja 1024×768.

## Toteutusjärjestys
1. Pelilogiikka (jono, ajastus, nopeutuminen, game over) + yksinkertainen ulkoasu.
2. Kosketusohjaus ja vasteaika.
3. Äänet.
4. Skaalautuva ulkoasu, pystytilan peittokuva, fullscreen, wake lock.
5. Viimeistely: LED-näyttö, napin hehkut, valikko, ennätys.
6. (Valinnainen) PWA.

Kun yksi vaihe on valmis, käynnistä paikallinen palvelin (esim. `npx serve` tai `python3 -m http.server`) ja kerro, miten pääsen testaamaan puhelimella samassa lähiverkossa.
