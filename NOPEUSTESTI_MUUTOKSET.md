# Nopeustesti – muutokset (2026-11-07)

Tämä on päivityspyyntö **olemassa olevaan projektiin**, ei uuden rakentamista. Lue ensin `progress.md` ja `NOPEUSTESTI_SPEC.md`, jotta tiedät nykyisen toteutuksen. Pelin kaikki säädöt ovat `CONFIG`-objektissa `index.html`:ssä. Pidä kaikki uudet vakiot siellä.

Tee kaikki neljä osaa yhdellä kertaa, nosta `sw.js`:n `CACHE_VERSION` vain kerran, pushaa `main`-haaraan ja tarkista, että GitHub Pages päivittyy. Alkuperäisen laitteen äänet, tempoarvot, PWA, Wake Lock ja muut nykyiset toiminnot säilyvät ennallaan, ellei alla toisin sanota.

---

## 1. Jälkeen jääminen: tahti kiihtyy ja peli päättyy nopeammin

Nyt peli jatkuu liian pitkään, kun pelaaja jää jälkeen: pisteet eivät kasva, tahti ei kiihdy ja jono täyttyy vasta hitaasti 50:n rajaa kohti. Tavoite: kun pelaaja jää jälkeen, peli jatkaa hetken uusilla väreillä kasvavalla tahdilla ja päättyy sitten.

- Kun uusi valo syttyy ja jonossa on jo vähintään yksi kuittaamaton valo, intervalli lyhenee ylimääräisellä kertoimella `BEHIND_SPEEDUP = 0.96` (per uusi valo). Kerroin tulee normaalin pisteisiin ja aikaan perustuvan nopeutumisen **lisäksi**.
- Pienennä `MAX_BEHIND` arvosta 50 arvoon **6**. Kun jonossa on enemmän kuin `MAX_BEHIND` kuittaamatonta valoa, peli päättyy.
- Ei aikarajaa. Game over perustuu vain jonon pituuteen.
- Kun pelaaja kuittaa jonon tyhjäksi, ylimääräinen kiihtyvyys lakkaa. Jo saavutettu intervalli säilyy ennallaan eikä hidastu takaisin. Intervalli ei saa pudota `MIN_INTERVAL`:n alle.
- Hienosäätöön: `MAX_BEHIND` 4–10 ja `BEHIND_SPEEDUP` 0,93–0,98.

## 2. Samat värit peräkkäin

Poista `ALLOW_REPEAT` ja korvaa se painotetulla arvonnalla.

- `REPEAT_WEIGHTS: [0.5, 0.15, 0]`
- Laske, montako kertaa viimeisin väri on tullut peräkkäin (r). Seuraavassa arvonnassa saman värin paino on `REPEAT_WEIGHTS[min(r, 3) - 1]` ja kolmen muun värin paino on 1. Kun r on 3 tai enemmän, sama väri ei voi tulla uudelleen.
- Ensimmäisen valon kohdalla kaikki neljä väriä ovat yhtä todennäköisiä.
- Todennäköisyydet: yksi peräkkäin ~14 %, kaksi ~5 %, kolme 0 %.
- Testaa, ettei sama väri esiinny koskaan neljä kertaa peräkkäin (esim. 100 000 arvontaa) ja että game over tulee, kun pelaaja lopettaa painamisen kokonaan.

## 3. Poista "Vaikea"-tila kokonaan

Peliä ei pysty pelaamaan vaikealla tasolla, joten se ei kuulu tähän peliin.

- Poista "Vaikea"-painike ja siihen liittyvä koodi: `startGame(hard)`, aloituspistemäärä 100, erillinen ennätys `nopeustesti.best.hard` ja niiden `CONFIG`-asetukset.
- Normaalin pelin ennätys (`nopeustesti.best`) säilyy.
- Poista maininnat vaikeasta tilasta myös `NOPEUSTESTI_SPEC.md`:stä ja `progress.md`:stä.

## 4. Ulkoasun päivitys Claude-kankaan mukaan

Ulkoasu on suunniteltu tällä Claude-kankaalla:
https://claude.ai/code/artifact/c01a1e9b-ee00-4f35-a84d-f9fc6b873160

Lue sen tiedostot Artifact-työkalulla: `project/Main.dc.html` (aloitus), `project/Peli.dc.html` (peli) ja `project/Loppu.dc.html` (tulos). Ota värit, fontit, koot, välistykset ja rakenne niistä tarkasti. **Kangas on ainoa totuus ulkoasusta**: kun käyttäjä pyytää "päivitä ulkoasu kankaan mukaan", lue tiedostot uudelleen ja tee muutokset niiden mukaan. Älä kopioi kankaan `.dc.html`-formaattia tai sen JavaScript-logiikkaa. Ne ovat vain malli. Toteuta tavallisena HTML/CSS/JS:nä nykyiseen `index.html`:ään, äläkä riko olemassa olevaa pelilogiikkaa, ääniä tai PWA-toimintoja.

Varmuuden vuoksi nykyiset perusarvot (jos kangas ja nämä eroavat, **kangas voittaa**):
- Pohja `#B3101F`, tummempi punainen `#8E0B1C` ja `#6E0812`, keltainen `#FFD100`, musta näyttö `#141414`
- Fontit (Google Fonts): **Bungee** (otsikot, nappitekstit), **Share Tech Mono** (pistenumerot), **Rubik** (muu teksti)
- Pelinapit: keltainen, vihreä, sininen, punainen. Keltainen reunus, palava nappi kirkas ja hehkuva, muut himmeitä.
- **Huomio:** nappien värit muuttuvat nykyisestä (punainen, keltainen, vihreä, oranssi), koska oranssin tilalle tulee sininen. Nappien ja äänten kytkentä (`CONFIG`) säilyy ennallaan, joten tarkista, että jokaisella napilla on edelleen oma sävelkorkeutensa.

### Näkymät
1. **Aloitus:** otsikko NOPEUSTESTI yhdellä rivillä, ennätys (korostettuna punaisella pohjalla, keltainen kehys ja tähti), edellinen tulos (musta näyttölaatikko), iso keltainen ALOITA-nappi. Ei ohjetekstejä.
2. **Peli:** pistenäyttö ylhäällä, neljä isoa nappia rivissä.
3. **Tulos:** "PELI PÄÄTTYI", pisteet, "Uusi ennätys!" -merkki kun ennätys rikkoutuu, PELAA UUDESTAAN ja Alkuun.

### Tiedot
- Ennätys ja **edellinen tulos** tallennetaan `localStorage`en. Edellinen tulos on uusi toiminto, lisää sille oma avain (esim. `nopeustesti.last`).
- Jokainen oikea painallus = 1 piste (ennallaan).

### Tekniset vaatimukset
- Kosketus reagoi heti (`pointerdown`, ei viivettä), ei tuplanapautuszoomia eikä tekstin valintaa. Nämä on jo toteutettu. Tarkista, ettei uusi ulkoasu riko niitä.
- Pystyasennossa näytetään kehotus kääntää puhelin (nykyinen toiminto säilyy, päivitä sen tyyli uuden ulkoasun mukaiseksi).
- Skaalaa koko näkymä näytön mukaan säilyttäen mittasuhteet. Suunnittelumitat ovat **844 × 390**. Tarkista myös 667×375 ja 1024×768.
- Äänen mykistys ja koko näyttö -toiminnot sekä Wake Lock säilytetään. Jos kankaassa ei ole niille paikkaa, tee niistä pienet, huomaamattomat kuvakepainikkeet ulkoasun tyyliin, äläkä poista toimintoja. Kerro lopuksi, mitä teit.

---

## Valmis, kun
- Pelin ulkoasu vastaa kangasta kaikissa kolmessa näkymässä.
- Tuplat ja kolmoset noudattavat painotuksia (ei nelosia).
- Pelaajan jäädessä jälkeen tahti kiihtyy ja game over tulee noin 6 valon jälkeen.
- Vaikeaa tilaa ei löydy enää koodista, valikosta eikä dokumenteista.
- `CACHE_VERSION` nostettu, pushattu ja Pages-osoitteessa toimii.
- `progress.md` päivitetty (uudet vakiot, poistettu Vaikea, uusi ulkoasu).
