// daten.js
//
// Hier stehen ausschließlich die Daten des Prototyps.
// Diese Datei enthält bewusst keine einzige Funktion und keine Rechnung.


// Was gerade an ist. Die Verwaltungs-Rolle ist fertig gebaut und funktioniert,
// sie wird nur nicht angezeigt. Ein true hier holt sie vollständig zurück,
// ohne dass eine Zeile Code fehlt.
const verwaltungAktiv = false;


// Die zwölf Berliner Bezirke. Namen und Nummern sind die amtlichen, die
// Reihenfolge ist die amtliche Zählung von Mitte bis Reinickendorf.
//
// Eine geschätzte Hitzebelastung stand hier bis zum 13.09.2026 und ist wieder
// raus. Sie war frei geraten, sah neben einem echten Bezirksnamen aber aus wie
// ein Messwert. Damit steht auf dieser Seite jetzt nichts mehr, was Daten
// vortäuscht: die Bezirke sind echt, die Adressen kommen von OpenStreetMap,
// und alles Übrige haben die Nutzer selbst eingegeben.
//
// Wie heiß ein Bezirk ist, sagen jetzt die Meldungen der Bürger:innen. Das ist
// weniger genau, aber es ist ehrlich erhoben statt ausgedacht.
const bezirke = [
  { kennung: "mitte", nummer: "01", name: "Mitte" },
  { kennung: "friedrichshain-kreuzberg", nummer: "02", name: "Friedrichshain-Kreuzberg" },
  { kennung: "pankow", nummer: "03", name: "Pankow" },
  { kennung: "charlottenburg-wilmersdorf", nummer: "04", name: "Charlottenburg-Wilmersdorf" },
  { kennung: "spandau", nummer: "05", name: "Spandau" },
  { kennung: "steglitz-zehlendorf", nummer: "06", name: "Steglitz-Zehlendorf" },
  { kennung: "tempelhof-schoeneberg", nummer: "07", name: "Tempelhof-Schöneberg" },
  { kennung: "neukoelln", nummer: "08", name: "Neukölln" },
  { kennung: "treptow-koepenick", nummer: "09", name: "Treptow-Köpenick" },
  { kennung: "marzahn-hellersdorf", nummer: "10", name: "Marzahn-Hellersdorf" },
  { kennung: "lichtenberg", nummer: "11", name: "Lichtenberg" },
  { kennung: "reinickendorf", nummer: "12", name: "Reinickendorf" }
];


// Die Bauvorhaben. Die Liste startet leer, alles wird in der Anwendung
// angelegt. Gespeichert wird nichts, ein Neuladen der Seite leert sie wieder.
const bauvorhaben = [];


// Die eingegangenen Hitzemeldungen. Startet ebenfalls leer und füllt sich
// nur durch die Bürger-Ansicht.
const meldungen = [];


// Der Maßnahmenkatalog. Alle Preise und Förderquoten sind Demo-Werte.
//
// "kategorie" sagt, auf welche der sieben Kategorien die Maßnahme wirkt.
//
// "hebtAufAnteilDesZiels" sagt, wie weit sie hebt, gemessen am Zielwert dieser
// Kategorie. 1 heißt auf den vollen Zielwert, 0.5 auf die Hälfte davon. Der Umweg
// über einen Anteil statt einer festen Zahl ist nötig, weil der Zielwert bei
// Regenrückhalt und Bäumen von der Grundstücksgröße abhängt und deshalb bei jedem
// Bauvorhaben anders ist.
//
// "kostenJeEinheit" ist ein Preis je Einheit der jeweiligen Kategorie, also je m²
// bei den Flächen, je m³ beim Regenrückhalt und je Stück bei den Bäumen. Die App
// rechnet ihn auf die tatsächlichen Flächen des Bauvorhabens hoch.
//
// "foerderquote" ist der Anteil der Kosten in Prozent, den eine Förderung trägt.
const massnahmenKatalog = [
  {
    kennung: "hof-entsiegeln",
    name: "Hof entsiegeln",
    kategorie: "unversiegelt",
    hebtAufAnteilDesZiels: 1,
    kostenJeEinheit: 85,
    foerderquote: 40
  },
  {
    kennung: "rasenfugenpflaster",
    name: "Rasenfugenpflaster statt Asphalt",
    kategorie: "unversiegelt",
    hebtAufAnteilDesZiels: 0.6,
    kostenJeEinheit: 55,
    foerderquote: 30
  },
  {
    kennung: "extensives-gruendach",
    name: "Extensives Gründach",
    kategorie: "dachbegruenung",
    hebtAufAnteilDesZiels: 1,
    kostenJeEinheit: 95,
    foerderquote: 50
  },
  {
    kennung: "fassadenbegruenung-bodengebunden",
    name: "Bodengebundene Fassadenbegrünung",
    kategorie: "fassadenbegruenung",
    hebtAufAnteilDesZiels: 1,
    kostenJeEinheit: 180,
    foerderquote: 35
  },
  {
    kennung: "rankhilfen",
    name: "Rankhilfen an zwei Seiten",
    kategorie: "fassadenbegruenung",
    hebtAufAnteilDesZiels: 0.5,
    kostenJeEinheit: 95,
    foerderquote: 35
  },
  {
    kennung: "pergola-sonnensegel",
    name: "Pergola und Sonnensegel",
    kategorie: "verschattung",
    hebtAufAnteilDesZiels: 1,
    kostenJeEinheit: 140,
    foerderquote: 20
  },
  {
    kennung: "helle-beschichtung",
    name: "Helle Dach- und Fassadenbeschichtung",
    kategorie: "helleMaterialien",
    hebtAufAnteilDesZiels: 1,
    kostenJeEinheit: 22,
    foerderquote: 15
  },
  {
    kennung: "zisterne",
    name: "Zisterne mit Drosselabfluss",
    kategorie: "regenrueckhalt",
    hebtAufAnteilDesZiels: 1,
    kostenJeEinheit: 320,
    foerderquote: 30
  },
  {
    kennung: "rigole",
    name: "Rigole unter dem Hof",
    kategorie: "regenrueckhalt",
    hebtAufAnteilDesZiels: 0.5,
    kostenJeEinheit: 210,
    foerderquote: 30
  },
  {
    kennung: "baumreihe",
    name: "Baumreihe mit Großbäumen",
    kategorie: "baeume",
    hebtAufAnteilDesZiels: 1,
    kostenJeEinheit: 1200,
    foerderquote: 45
  }
];


// Die Arten von Hitzemeldungen, die eine Bürgerin auswählen kann. Eine Liste
// statt eines freien Textfelds, damit die Verwaltung später zählen kann, was am
// häufigsten gemeldet wird.
// Die Arten von Gebäuden. Bisher nur eine Angabe, die auf Kachel, Detailseite
// und Zertifikat erscheint. Sie geht noch nicht in die Rechnung ein.
//
// Naheliegend wäre, sie später einzubeziehen: ein Bürogebäude kann eine Fassade
// leichter begrünen als ein Wohnhaus mit Balkonen, ein Gewerbebau hat mehr
// Dachfläche und weniger Freifläche. Dafür müssten die Zielwerte je Gebäudeart
// verschieden sein, und das ist eine eigene Entscheidung.
const gebaeudearten = [
  { kennung: "wohngebaeude", name: "Wohngebäude" },
  { kennung: "buero",        name: "Bürogebäude" },
  { kennung: "gewerbe",      name: "Gewerbe und Industrie" },
  { kennung: "handel",       name: "Handel und Gastronomie" },
  { kennung: "oeffentlich",  name: "Öffentliches Gebäude" },
  { kennung: "gemischt",     name: "Gemischte Nutzung" }
];


// Die Arten von Hitzemeldungen. "symbol" zeigt auf ein Zeichen aus der
// Symbolsammlung oben in index.html.
const meldungsarten = [
  { kennung: "kein-schatten",      name: "Kein Schatten",        symbol: "symbol-sonne" },
  { kennung: "aufgeheizter-belag", name: "Aufgeheizter Belag",   symbol: "symbol-belag" },
  { kennung: "kein-trinkwasser",   name: "Kein Trinkwasser",     symbol: "symbol-tropfen" },
  { kennung: "keine-baeume",       name: "Zu wenig Bäume",       symbol: "symbol-blatt" },
  { kennung: "keine-bank",         name: "Keine Bank im Schatten", symbol: "symbol-bank" },
  { kennung: "wohnung-heiss",      name: "Wohnung heizt auf",    symbol: "symbol-wohnung" },
  { kennung: "versiegelter-hof",   name: "Versiegelter Hof",     symbol: "symbol-belag" },
  { kennung: "kein-kuehler-ort",   name: "Kein kühler Ort in der Nähe", symbol: "symbol-ort" }
];


// Beispielwerte für den Knopf "Beispiel einsetzen". In einer Vorführung will
// man nicht vor Publikum sechs Felder tippen. Die Adresse ist echt, den Bezirk
// dazu sucht die App selbst über adresse.js.
const beispielBauvorhaben = {
  name: "Wohnhaus Hermannstraße",
  adresse: "Hermannstraße 12, 12049 Berlin",
  gebaeudeart: "wohngebaeude",
  grundstuecksflaeche: 2400,
  dachflaeche: 1100,
  fassadenflaeche: 3100,
  freiflaeche: 950,
  // Ein typischer Berliner Wohnblock mit Innenhof: halb grün, halb gepflastert,
  // vier Bäume, Flachdach ohne Begrünung, keine Zisterne. Das ergibt etwa 25
  // Punkte und ist damit deutlich rot. In der Vorführung ist das gewollt: so
  // steht die Maßnahmenliste sofort da, und man sieht am Bogen, welche
  // Antworten das Ergebnis heben.
  antworten: {
    gestaltung: "gemischt",
    belag: "pflaster",
    innenhof: true,
    baeume: 4,
    kronengroesse: "mittel",
    verschattungZusatz: 10,
    dachform: "flach",
    dachbegruenung: 0,
    dachbegruenungArt: "extensiv",
    dachHell: false,
    retentionsdach: false,
    fassadenbegruenung: 0,
    fassadenbegruenungArt: "bodengebunden",
    fassadeHell: true,
    zisterne: 0,
    versickerung: false
  }
};
