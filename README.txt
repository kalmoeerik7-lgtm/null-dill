NULL DILL – første PWA-prototype

Dette er en første fungerende app-prototype:
- Leser offentlige innlegg fra Blogger via JSONP-feed.
- Søk og kategorifilter.
- Favoritter lagres lokalt på enheten.
- Handleliste lagres lokalt.
- Oppsett for installasjon som PWA.

Viktig:
1. Appen må publiseres på HTTPS for å kunne installeres som PWA.
2. Blogger-feeden må være offentlig. Hvis Blogger endrer eller blokkerer JSONP-feed, kobler vi om til offisiell Blogger API v3 (som krever en Google API-nøkkel for offentlige data).
3. Dette er en prototype; vi har ennå ikke testet feeden mot live-bloggen fra dette miljøet. Test den etter publisering.
4. Design og innhold kan justeres videre, blant annet med den endelige NULL DILL-logoen.

Filer:
index.html, styles.css, app.js, manifest.webmanifest, sw.js, icon.svg
