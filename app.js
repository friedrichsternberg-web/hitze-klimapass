// app.js
//
// Der Umschalter zwischen den drei Rollen und die gesamte Oberfläche.
// Diese Datei ist die einzige, die die Seite anfasst. Die Daten kommen aus
// daten.js, gerechnet wird in bewertung.js. Beide müssen vorher geladen sein,
// die Reihenfolge steht in index.html.


// Legt den aktuellen Stand im Browser ab. Wird nach jeder Änderung gerufen,
// die bleiben soll: neues Bauvorhaben, verschobener Regler, neue Meldung.
// Läuft über speicher.js, damit der Zugriff aufs Gerät an einer Stelle bleibt.
function sichereStand() {
  speichere(bauvorhaben, meldungen);
}


// Das Bauvorhaben, das gerade in der Detailansicht offen ist. Solange die
// Kachelliste zu sehen ist, steht hier null.
let aktuellesVorhaben = null;


// ---------------------------------------------------------------
// 1. Der Rollenumschalter
// ---------------------------------------------------------------

// Zeigt den Bereich der gewählten Rolle und blendet die beiden anderen aus.
// Der Vergleich läuft über zwei Attribute im HTML: jeder Knopf trägt ein
// data-rolle, jeder Abschnitt ein data-bereich. Stimmen beide überein,
// gehören sie zusammen.
function zeigeRolle(gewaehlteRolle) {
  const alleKnoepfe = document.querySelectorAll(".umschalter-knopf");
  const alleBereiche = document.querySelectorAll(".bereich");

  alleKnoepfe.forEach(function (knopf) {
    const istGewaehlt = knopf.dataset.rolle === gewaehlteRolle;
    // classList.toggle mit zweitem Argument setzt die Klasse, wenn der Wert
    // wahr ist, und entfernt sie sonst. Das spart ein if mit zwei Zweigen.
    knopf.classList.toggle("aktiv", istGewaehlt);
    // aria-pressed sagt Vorlesesoftware, welcher Schalter gerade gedrückt ist.
    knopf.setAttribute("aria-pressed", istGewaehlt ? "true" : "false");
  });

  alleBereiche.forEach(function (bereich) {
    bereich.hidden = bereich.dataset.bereich !== gewaehlteRolle;
  });

  // Das Dashboard wird bei jedem Wechsel in die Verwaltung neu gerechnet.
  // Sonst zeigte es noch die Punktzahl von vorhin, während der Bauherr schon
  // andere Regler stehen hat.
  if (gewaehlteRolle === "verwaltung" && verwaltungAktiv) {
    zeichneVerwaltung();
  }
  if (gewaehlteRolle === "buerger") {
    zeichneBuergerdashboard();
  }
}


// Hängt an jeden Schalter einen Klick-Zuhörer.
//
// Steht verwaltungAktiv in daten.js auf false, wird der Schalter für die
// Verwaltung vorher ausgeblendet. Der Bereich und sein gesamter Code bleiben
// bestehen, sie sind nur nicht erreichbar. Ein true holt alles zurück.
function verbindeUmschalter() {
  // Der Knopf wird aus der Seite entfernt, nicht nur versteckt. Ein hidden
  // reicht hier nicht mehr, seit die Knöpfe ein eigenes display haben, und
  // genau das hatte den Knopf einmal wieder sichtbar gemacht.
  if (!verwaltungAktiv) {
    document.querySelector("[data-rolle='verwaltung']").remove();
  }

  document.querySelectorAll(".umschalter-knopf").forEach(function (knopf) {
    knopf.addEventListener("click", function () {
      zeigeRolle(knopf.dataset.rolle);
    });
  });
}


// Innerhalb der Bauherr-Rolle gibt es zwei Ansichten, die sich ablösen:
// die Kachelliste und die Detailansicht.
function zeigeAnsicht(gewaehlteAnsicht) {
  document.querySelectorAll(".ansicht").forEach(function (ansicht) {
    ansicht.hidden = ansicht.dataset.ansicht !== gewaehlteAnsicht;
  });
  // Ohne das landet man nach einem Wechsel mitten in der neuen Ansicht, weil
  // die Seite noch dort steht, wo man vorher gescrollt hatte.
  window.scrollTo(0, 0);
}


// ---------------------------------------------------------------
// 2. Kleine Helfer
// ---------------------------------------------------------------

// Sucht den Bezirk zu einer Kennung heraus. Findet sich keiner, kommt
// undefined zurück, darauf muss der Aufrufer gefasst sein.
function findeBezirk(bezirkKennung) {
  return bezirke.find(function (bezirk) {
    return bezirk.kennung === bezirkKennung;
  });
}


// Schreibt eine Zahl deutsch, also 3200 als "3.200". Das macht der Browser
// selbst, sobald man ihm mit "de-DE" sagt, welche Schreibweise gemeint ist.
function schreibeZahlDeutsch(zahl) {
  return zahl.toLocaleString("de-DE");
}


function schreibeEuro(betrag) {
  return schreibeZahlDeutsch(Math.round(betrag)) + " €";
}


// Die drei Stufen für helle Materialien. Sie stehen hier an einer Stelle, weil
// sowohl die Knöpfe im Formular als auch der Klimapass sie brauchen.
const STUFENNAMEN = ["nein", "teilweise", "ja"];


// Welches Zeichen aus der Symbolsammlung zu welcher Kategorie gehört. Steht
// hier und nicht in bewertung.js, weil ein Symbol Oberfläche ist und nicht
// Rechnung.
const KATEGORIESYMBOLE = {
  unversiegelt: "symbol-belag",
  dachbegruenung: "symbol-blatt",
  fassadenbegruenung: "symbol-blatt",
  verschattung: "symbol-sonne",
  helleMaterialien: "symbol-sonne",
  regenrueckhalt: "symbol-tropfen",
  baeume: "symbol-blatt"
};


// Beschriftet einen Eingabewert passend zu seiner Einheit.
function beschrifteWert(wert, einheit) {
  if (einheit === "prozent") {
    return wert + " %";
  }
  if (einheit === "kubikmeter") {
    return wert + " m³";
  }
  if (einheit === "stufe") {
    return STUFENNAMEN[wert];
  }
  if (wert === 1) {
    return "1 Baum";
  }
  return wert + " Bäume";
}


// Beschriftet eine Baumenge, also das, was eine Maßnahme tatsächlich herstellt.
function beschrifteMenge(menge, einheit) {
  const gerundet = Math.round(menge);

  if (einheit === "kubikmeter") {
    return schreibeZahlDeutsch(gerundet) + " m³";
  }
  if (einheit === "stueck") {
    return beschrifteWert(gerundet, "stueck");
  }
  return schreibeZahlDeutsch(gerundet) + " m²";
}


// Punktgewinne unter einem Punkt werden mit einer Nachkommastelle gezeigt,
// sonst stünde dort "+0" und die Maßnahme sähe wirkungslos aus.
function schreibePunkte(punkte) {
  if (punkte >= 1) {
    return String(Math.round(punkte));
  }
  return punkte.toFixed(1).replace(".", ",");
}


// Übersetzt die Ampel in den Namen der passenden Farbvariablen aus design.css.
function ampelFarbe(ampel) {
  if (ampel === "gruen") {
    return "var(--farbe-ampel-gruen)";
  }
  if (ampel === "gelb") {
    return "var(--farbe-ampel-gelb)";
  }
  return "var(--farbe-ampel-rot)";
}


// Kurzer Weg zur Rechnung. Seit die Schwelle für ganz Berlin gleich ist,
// braucht bewertung.js den Bezirk nicht mehr.
function bewerteVorhaben(vorhaben) {
  return bewerte(vorhaben);
}


// Der Ring um die Punktzahl. Gezeichnet wird ein Kreis, dessen Umrandung nur
// zum Teil sichtbar ist. "stroke-dasharray" sagt, wie lang der gezeichnete
// Abschnitt ist und wie lang die Lücke danach. Setzt man den Abschnitt auf den
// Anteil des Umfangs, entsteht ein Ring, der so weit gefüllt ist wie die
// Punktzahl reicht. Der Umfang eines Kreises ist zwei mal Pi mal Radius.
function zeichnePunktering(punkte, ampel, zusatzklasse) {
  const radius = 52;
  const umfang = 2 * Math.PI * radius;
  const gezeichnet = umfang * Math.min(punkte / 100, 1);

  return `
    <svg class="punktering ${zusatzklasse}" viewBox="0 0 120 120"
         style="--ampel-farbe: ${ampelFarbe(ampel)}" aria-hidden="true">
      <circle class="punktering-bahn" cx="60" cy="60" r="${radius}"></circle>
      <circle class="punktering-fuellung" cx="60" cy="60" r="${radius}"
              stroke-dasharray="${gezeichnet} ${umfang}"></circle>
      <text class="punktering-zahl" x="60" y="60" text-anchor="middle"
            dominant-baseline="central">${punkte}</text>
    </svg>
  `;
}


// ---------------------------------------------------------------
// 3. Ansicht Bauherr, Teil 1: die Kachelliste
// ---------------------------------------------------------------

function zeichneBauvorhaben() {
  const kachelfeld = document.getElementById("bauvorhabenListe");

  const alleKacheln = bauvorhaben.map(function (vorhaben) {
    const bezirk = findeBezirk(vorhaben.bezirkKennung);
    // Steht der Bezirk nicht in daten.js, soll die Kachel trotzdem erscheinen,
    // damit der Fehler sichtbar wird statt die ganze Liste leer zu lassen.
    const bezirksName = bezirk ? bezirk.name : "Bezirk unbekannt";
    const ergebnis = bewerteVorhaben(vorhaben);

    // Die Kachel ist ein echter Knopf. Dadurch ist sie ohne Zutun auch mit der
    // Tastatur erreichbar. In einem Knopf dürfen nur span stehen, keine
    // Überschriften, deshalb sind es hier durchgehend span.
    return `
      <button class="kachel" type="button" data-vorhaben="${vorhaben.kennung}"
              style="--ampel-farbe: ${ampelFarbe(ergebnis.ampel)}">
        <span class="kachel-name">${vorhaben.name}</span>
        <span class="kachel-bezirk">${vorhaben.adresse || bezirksName}</span>
        <span class="kachel-art">${nameDerGebaeudeart(vorhaben.gebaeudeart)}</span>
        <span class="kachel-skizze">${zeichneSkizze(vorhaben)}</span>
        <span class="kachel-fuss">
          ${zeichnePunktering(ergebnis.gesamtPunkte, ergebnis.ampel, "punktering-mini")}
          <span class="kachel-status">${statusFuer(ergebnis.ampel)}</span>
        </span>
      </button>
    `;
  });

  // Solange nichts angelegt ist, steht vor der Liste eine Illustration. Ohne sie
  // wäre der erste Eindruck der Seite eine gestrichelte Box auf leerer Fläche.
  const einstieg = bauvorhaben.length === 0
    ? `
      <div class="einstieg">
        <svg class="einstieg-bild" viewBox="0 0 320 120" aria-hidden="true">
          <use href="#grafik-stadt"></use>
        </svg>
        <p class="einstieg-satz">Jeder Neubau wird auf seine Wirkung gegen Hitze geprüft.</p>
      </div>
    `
    : "";

  // Zuletzt die Kachel zum Anlegen. Sie sieht anders aus und trägt statt einer
  // Kennung das Merkmal data-neu, daran erkennt der Klick-Zuhörer sie wieder.
  alleKacheln.push(`
    <button class="kachel kachel-neu" type="button" data-neu="ja">
      <span class="kachel-plus">+</span>
      <span class="kachel-einheit">Neues Bauvorhaben</span>
    </button>
  `);

  // join("") klebt die Kacheln ohne Trennzeichen aneinander. Erst dann geht
  // alles in einem Rutsch in die Seite, statt vier Mal einzeln.
  kachelfeld.innerHTML = einstieg + alleKacheln.join("");
}


// ---------------------------------------------------------------
// 4. Ansicht Bauherr, Teil 2: der Fragebogen
//
// Der Bauherr beantwortet Fragen zu Freifläche, Dach, Fassade und Regenwasser.
// Aus den Antworten macht bewertung.js die sieben Kategorienwerte. Der Bogen
// ist hier als Liste beschrieben, nicht als fertiges HTML: ein Abschnitt hat
// einen Titel und Fragen, eine Frage hat eine Kennung, einen Namen und eine
// Art. "sichtbar" ist eine Bedingung, die entscheidet, ob die Frage gerade
// gestellt wird. So taucht die Frage nach dem Belag nur auf, wenn die Fläche
// nicht ohnehin ganz grün ist.
// ---------------------------------------------------------------

const JA_NEIN = [
  { wert: true, name: "ja" },
  { wert: false, name: "nein" }
];

const FRAGEBOGEN = [
  {
    titel: "Freifläche",
    fragen: [
      { kennung: "gruenanteil", name: "Begrünt", art: "schieber",
        // Aus einem Regler kommen beide Zahlen: was nicht grün ist, ist befestigt.
        anzeige: function (wert) { return wert + " % grün, " + (100 - wert) + " % befestigt"; } },
      { kennung: "belag", name: "Bodenbelag", art: "auswahl",
        sichtbar: function (a) { return a.gruenanteil < 100; },
        optionen: [
          { wert: "asphalt", name: "Asphalt oder Beton" },
          { wert: "pflaster", name: "Pflaster" },
          { wert: "rasengitter", name: "Rasengitter" },
          { wert: "kies", name: "Kies" }
        ] },
      { kennung: "innenhof", name: "Innenhof", art: "jaNein",
        hinweis: function (a) { return a.innenhof ? "Bäume im Hof zählen anderthalbfach." : ""; } },
      { kennung: "baeume", name: "Bäume", art: "zahl",
        hinweis: function (a, vorhaben) {
          return "Ziel: " + zielwertFuer(vorhaben, findeKategorie("baeume"))
            + " bei " + schreibeZahlDeutsch(vorhaben.freiflaeche) + " m² Freifläche.";
        } },
      { kennung: "kronengroesse", name: "Kronengröße", art: "auswahl",
        sichtbar: function (a) { return a.baeume > 0; },
        optionen: [
          { wert: "klein", name: "klein" },
          { wert: "mittel", name: "mittel" },
          { wert: "gross", name: "groß" }
        ] },
      { kennung: "verschattungZusatz", name: "Schatten durch Segel, Pergola, Gebäude", art: "schieber" }
    ]
  },
  {
    titel: "Dach",
    fragen: [
      { kennung: "dachform", name: "Dachform", art: "auswahl", optionen: [
        { wert: "flach", name: "Flachdach" },
        { wert: "geneigt", name: "geneigt" }
      ] },
      { kennung: "dachbegruenung", name: "Begrünt", art: "schieber",
        hinweis: function (a) { return a.dachform === "geneigt" ? "Auf geneigtem Dach zählen höchstens 30 %." : ""; } },
      { kennung: "dachbegruenungArt", name: "Art der Begrünung", art: "auswahl",
        sichtbar: function (a) { return a.dachbegruenung > 0; },
        optionen: [
          { wert: "extensiv", name: "extensiv, dünne Schicht" },
          { wert: "intensiv", name: "intensiv, Stauden und Sträucher" }
        ] },
      { kennung: "dachHell", name: "Helle Oberfläche", art: "jaNein" },
      { kennung: "retentionsdach", name: "Retentionsdach, hält Regen zurück", art: "jaNein",
        sichtbar: function (a) { return a.dachform === "flach"; } }
    ]
  },
  {
    titel: "Fassade",
    fragen: [
      { kennung: "fassadenbegruenung", name: "Begrünt", art: "schieber" },
      { kennung: "fassadenbegruenungArt", name: "Art der Begrünung", art: "auswahl",
        sichtbar: function (a) { return a.fassadenbegruenung > 0; },
        optionen: [
          { wert: "bodengebunden", name: "Kletterpflanzen aus dem Boden" },
          { wert: "wandgebunden", name: "Wandsystem mit Substrat" }
        ] },
      { kennung: "fassadeHell", name: "Helle Fassade", art: "jaNein" }
    ]
  },
  {
    titel: "Regenwasser",
    fragen: [
      { kennung: "zisterne", name: "Zisterne in m³", art: "zahl" },
      { kennung: "versickerung", name: "Versickerung auf dem Grundstück", art: "jaNein" }
    ]
  }
];


// Holt die Antworten eines Bauvorhabens. Bauvorhaben, die vor dem Fragebogen
// angelegt wurden, haben noch keine und bekommen die leeren.
function antwortenVon(vorhaben) {
  if (!vorhaben.antworten) {
    vorhaben.antworten = leereAntworten();
  }
  return vorhaben.antworten;
}


// Rechnet die Antworten in die sieben Kategorienwerte um und legt sie am
// Bauvorhaben ab. Alles Weitere, Ergebnis, Kacheln, Zertifikat, liest von dort.
function aktualisiereEingabe(vorhaben) {
  vorhaben.eingabe = leiteEingabeAb(vorhaben, antwortenVon(vorhaben));
}


// Eine Reihe Wahlknöpfe. Für ja/nein und für Listen dieselbe Form, nur die
// Optionen unterscheiden sich. Der Wert wandert als Text ins Attribut und wird
// beim Klick wieder in seine Art zurückverwandelt, siehe uebernimmAntwort.
function zeichneWahlknoepfe(frage, wert) {
  const optionen = frage.art === "jaNein" ? JA_NEIN : frage.optionen;

  return `<div class="frage-antwort">` + optionen.map(function (option) {
    const istAktiv = option.wert === wert;
    return `
      <button class="wahl-knopf${istAktiv ? " aktiv" : ""}" type="button"
              data-frage="${frage.kennung}" data-wert="${option.wert}"
              aria-pressed="${istAktiv}">${option.name}</button>
    `;
  }).join("") + `</div>`;
}


// Die Zahl neben einem Regler. Meist nur Prozent, manche Fragen bringen eine
// eigene Beschriftung mit, etwa "60 % grün, 40 % befestigt".
function beschrifteRegler(frage, wert) {
  if (frage.anzeige) {
    return frage.anzeige(wert);
  }
  return wert + " %";
}


function zeichneFrage(frage, vorhaben) {
  const antworten = antwortenVon(vorhaben);
  if (frage.sichtbar && !frage.sichtbar(antworten)) {
    return "";
  }

  const wert = antworten[frage.kennung];
  const hinweis = frage.hinweis ? frage.hinweis(antworten, vorhaben) : "";
  let wertanzeige = "";
  let steuerung = "";

  if (frage.art === "schieber") {
    wertanzeige = `<output class="frage-wert" id="wert-${frage.kennung}">${beschrifteRegler(frage, wert)}</output>`;
    steuerung = `<input class="frage-schieber" type="range" data-frage="${frage.kennung}"
                        min="0" max="100" step="5" value="${wert}">`;
  } else if (frage.art === "zahl") {
    steuerung = `<input class="frage-zahl" type="number" data-frage="${frage.kennung}"
                        min="0" step="1" value="${wert}">`;
  } else {
    steuerung = zeichneWahlknoepfe(frage, wert);
  }

  return `
    <div class="frage">
      <p class="frage-name">${frage.name}</p>
      ${wertanzeige}
      ${steuerung}
      ${hinweis ? `<p class="frage-hinweis">${hinweis}</p>` : ""}
    </div>
  `;
}


function zeichneEingabe(vorhaben) {
  const abschnitte = FRAGEBOGEN.map(function (abschnitt) {
    const fragen = abschnitt.fragen.map(function (frage) {
      return zeichneFrage(frage, vorhaben);
    });
    return `
      <section class="abschnitt">
        <h3 class="abschnitt-titel">${abschnitt.titel}</h3>
        ${fragen.join("")}
      </section>
    `;
  });

  document.getElementById("eingabefeld").innerHTML = abschnitte.join("");
}


// Sucht die Beschreibung einer Frage anhand ihrer Kennung.
function findeFrage(kennung) {
  for (const abschnitt of FRAGEBOGEN) {
    const treffer = abschnitt.fragen.find(function (frage) {
      return frage.kennung === kennung;
    });
    if (treffer) {
      return treffer;
    }
  }
  return null;
}


// Ein Wert aus einem Attribut ist immer Text. Hier wird er in das
// zurückverwandelt, was die Frage meint: eine Zahl, ein ja/nein oder ein Wort.
function uebernimmAntwort(kennung, rohwert) {
  const frage = findeFrage(kennung);
  const antworten = antwortenVon(aktuellesVorhaben);

  if (frage.art === "jaNein") {
    antworten[kennung] = rohwert === "true";
  } else if (frage.art === "schieber" || frage.art === "zahl") {
    antworten[kennung] = Math.max(0, Number(rohwert) || 0);
  } else {
    antworten[kennung] = rohwert;
  }

  aktualisiereEingabe(aktuellesVorhaben);

  // Wer nach dem Antrag noch etwas ändert, muss neu beantragen. Sonst stünde
  // auf dem Zertifikat ein Prüfdatum für Angaben, die es so nie gab.
  if (aktuellesVorhaben.antragDatum) {
    delete aktuellesVorhaben.antragDatum;
    aktualisiereAntragKnopf();
  }
}


// ---------------------------------------------------------------
// 5. Ansicht Bauherr, Teil 3: das Ergebnis
// ---------------------------------------------------------------

// Die sieben Kategorien als Balken. Die Breite der Füllung ist der Anteil der
// erreichten an den möglichen Punkten.
function zeichneBalken(ergebnis) {
  const zeilen = ergebnis.kategorien.map(function (kategorie) {
    const anteil = kategorie.erreichtePunkte / kategorie.maximalPunkte * 100;

    return `
      <li class="balken">
        <span class="balken-name">${kategorie.name}</span>
        <span class="balken-bahn"><span class="balken-fuellung" style="width: ${anteil}%"></span></span>
        <span class="balken-punkte">${kategorie.erreichtePunkte} / ${kategorie.maximalPunkte}</span>
      </li>
    `;
  });

  return `<ul class="balkenliste">${zeilen.join("")}</ul>`;
}


function zeichneMassnahme(eintrag) {
  return `
    <li class="massnahme">
      <span class="massnahme-name">${eintrag.massnahme.name}</span>
      <span class="massnahme-gewinn">+${schreibePunkte(eintrag.punktgewinn)}</span>
      <span class="massnahme-zahlen">${beschrifteMenge(eintrag.menge, eintrag.einheit)}, ${schreibeEuro(eintrag.kosten)}, davon ${schreibeEuro(eintrag.foerderung)} Förderung</span>
    </li>
  `;
}


// Der untere Teil des Ergebnisses. Ist die Pflicht erfüllt, steht dort ein
// Wort und nichts weiter.
function zeichneLuecke(vorhaben, ergebnis) {
  if (ergebnis.fehlendePunkte === 0) {
    return `<p class="erfuellt">Pflicht erfüllt</p>`;
  }

  const vorschlaege = schlageMassnahmenVor(vorhaben, massnahmenKatalog, ergebnis.fehlendePunkte);
  const zeilen = vorschlaege.map(zeichneMassnahme);

  return `
    <p class="luecke">Es fehlen ${ergebnis.fehlendePunkte} Punkte</p>
    <ul class="massnahmenliste">${zeilen.join("")}</ul>
  `;
}


function zeichneErgebnis(vorhaben) {
  const ergebnis = bewerteVorhaben(vorhaben);
  document.getElementById("skizzenfeld").innerHTML = zeichneSkizze(vorhaben);

  document.getElementById("ergebnisfeld").innerHTML = `
    <div class="ergebnis-kopf" style="--ampel-farbe: ${ampelFarbe(ergebnis.ampel)}">
      ${zeichnePunktering(ergebnis.gesamtPunkte, ergebnis.ampel, "punktering-mittel")}
      <div class="ergebnis-text">
        <span class="ergebnis-status">${statusFuer(ergebnis.ampel)}</span>
        <span class="ergebnis-schwelle">${ergebnis.gesamtPunkte} von 100, Pflicht ab ${ergebnis.schwelle}</span>
      </div>
    </div>
    ${zeichneBalken(ergebnis)}
    ${zeichneLuecke(vorhaben, ergebnis)}
  `;
}


// ---------------------------------------------------------------
// 6. Detailansicht öffnen und bedienen
// ---------------------------------------------------------------

function oeffneDetail(vorhabenKennung) {
  aktuellesVorhaben = bauvorhaben.find(function (vorhaben) {
    return vorhaben.kennung === vorhabenKennung;
  });
  if (!aktuellesVorhaben) {
    return;
  }

  const bezirk = findeBezirk(aktuellesVorhaben.bezirkKennung);
  document.getElementById("detailName").textContent = aktuellesVorhaben.name;
  const bezirksangabe = bezirk ? bezirk.name : "Bezirk unbekannt";
  const artname = nameDerGebaeudeart(aktuellesVorhaben.gebaeudeart);
  const lagename = nameDerLage(aktuellesVorhaben.lage);
  document.getElementById("detailBezirk").textContent =
    (aktuellesVorhaben.adresse ? aktuellesVorhaben.adresse + ", " : "")
    + bezirksangabe + (artname ? ", " + artname : "")
    + (lagename ? ", " + lagename : "");

  aktualisiereEingabe(aktuellesVorhaben);
  zeichneEingabe(aktuellesVorhaben);
  zeichneErgebnis(aktuellesVorhaben);
  aktualisiereAntragKnopf();
  zeigeAnsicht("detail");
}


// Ein einziger Zuhörer auf dem ganzen Kachelfeld statt einem je Kachel.
// Das heißt Delegation: der Klick steigt von der Kachel nach oben, und closest
// sucht von dort aus wieder die Kachel, auf der er begonnen hat. Der Vorteil
// ist, dass die Kacheln beliebig oft neu gezeichnet werden dürfen, ohne dass
// jemand die Zuhörer neu anhängen muss.
function verbindeKachelliste() {
  document.getElementById("bauvorhabenListe").addEventListener("click", function (ereignis) {
    const kachel = ereignis.target.closest(".kachel");
    if (!kachel) {
      return;
    }
    if (kachel.dataset.neu) {
      oeffneNeuformular();
      return;
    }
    oeffneDetail(kachel.dataset.vorhaben);
  });
}


function verbindeDetail() {
  const eingabefeld = document.getElementById("eingabefeld");

  // Beim Ziehen eines Reglers oder Tippen in ein Zahlenfeld: Antwort
  // übernehmen, Beschriftung nachziehen, Ergebnis neu rechnen. Der Bogen selbst
  // wird dabei NICHT neu gezeichnet, sonst verschwände der Regler unter dem
  // Finger.
  eingabefeld.addEventListener("input", function (ereignis) {
    const kennung = ereignis.target.dataset.frage;
    if (!kennung) {
      return;
    }
    uebernimmAntwort(kennung, ereignis.target.value);
    const wertanzeige = document.getElementById("wert-" + kennung);
    if (wertanzeige) {
      wertanzeige.textContent = beschrifteRegler(findeFrage(kennung), antwortenVon(aktuellesVorhaben)[kennung]);
    }
    zeichneErgebnis(aktuellesVorhaben);
    sichereStand();
  });

  // Ist das Ziehen oder Tippen abgeschlossen, wird der Bogen neu gezeichnet.
  // Erst jetzt, weil davon abhängen kann, welche Folgefragen erscheinen: die
  // Kronengröße etwa erst, wenn es überhaupt Bäume gibt.
  eingabefeld.addEventListener("change", function (ereignis) {
    if (ereignis.target.dataset.frage) {
      zeichneEingabe(aktuellesVorhaben);
    }
  });

  // Ein Klick auf einen Wahlknopf ist abgeschlossen, hier darf sofort alles
  // neu gezeichnet werden.
  eingabefeld.addEventListener("click", function (ereignis) {
    const knopf = ereignis.target.closest(".wahl-knopf");
    if (!knopf || !knopf.dataset.frage) {
      return;
    }
    uebernimmAntwort(knopf.dataset.frage, knopf.dataset.wert);
    zeichneEingabe(aktuellesVorhaben);
    zeichneErgebnis(aktuellesVorhaben);
    sichereStand();
  });

  // Zurück zur Liste. Es gibt zwei solche Knöpfe, einen in der Detailansicht
  // und einen im Anlegen-Formular, deshalb läuft das über ein gemeinsames
  // Merkmal statt über eine Kennung. Die Kacheln werden dabei neu gezeichnet,
  // damit eine geänderte Punktzahl dort sofort steht.
  document.querySelectorAll("[data-zurueck]").forEach(function (knopf) {
    knopf.addEventListener("click", function () {
      // Aus dem Klimapass geht es zurück in die Eingabe, von überall sonst
      // in die Kachelliste. Das Ziel steht im Knopf selbst.
      if (knopf.dataset.zurueck === "detail") {
        zeigeAnsicht("detail");
        return;
      }
      aktuellesVorhaben = null;
      zeichneBauvorhaben();
      zeigeAnsicht("liste");
    });
  });
}


// ---------------------------------------------------------------
// 7. Ansicht Verwaltung: das Dashboard
//
// Alle drei Listen lesen dieselben Daten wie die Bauherr-Ansicht. Es gibt
// keine zweite Fassung der Zahlen, die auseinanderlaufen könnte. Schiebt der
// Bauherr einen Regler und wechselt danach hierher, steht die neue Punktzahl
// sofort im Dashboard.
// ---------------------------------------------------------------

// Schreibt ein Datum aus der Form 2026-08-14 als 14.08.2026.
// Der Umweg über split vermeidet die Date-Umrechnung, die je nach Zeitzone
// einen Tag daneben liegen kann.
function schreibeDatumDeutsch(datum) {
  const teile = datum.split("-");
  return teile[2] + "." + teile[1] + "." + teile[0];
}


// "1 Meldungen" liest sich falsch. Einzahl und Mehrzahl an einer Stelle.
function beschrifteMeldungen(anzahl) {
  if (anzahl === 1) {
    return "1 Meldung";
  }
  return anzahl + " Meldungen";
}


function zeichneStatusliste() {
  const liste = document.getElementById("statusListe");

  const alleZeilen = bauvorhaben.map(function (vorhaben) {
    const bezirk = findeBezirk(vorhaben.bezirkKennung);
    const bezirksName = bezirk ? bezirk.name : "Bezirk unbekannt";
    const ergebnis = bewerteVorhaben(vorhaben);

    return `
      <li class="statuszeile" style="--ampel-farbe: ${ampelFarbe(ergebnis.ampel)}">
        <span class="statuszeile-name">${vorhaben.name}</span>
        <span class="statuszeile-bezirk">${vorhaben.adresse ? vorhaben.adresse + ", " : ""}${bezirksName}, Pflicht ab ${ergebnis.schwelle}</span>
        <span class="statuszeile-punkte">${ergebnis.gesamtPunkte}</span>
        <span class="statuszeile-status">${statusFuer(ergebnis.ampel)}</span>
      </li>
    `;
  });

  liste.innerHTML = alleZeilen.join("");
}


function zeichneBezirke() {
  const liste = document.getElementById("bezirksListe");

  const alleZeilen = bezirke.map(function (bezirk) {
    // Die Farbe der Stufenmarke wird als Variable direkt an das Element
    // geschrieben. design.css liest sie dort als var(--stufe-farbe) aus.
    const kennzahlen = kennzahlenFuerBezirk(bezirk, bauvorhaben, meldungen);
    const stufenFarbe = `--stufe-farbe: var(--farbe-melde-${meldestufeFuer(kennzahlen.anzahlMeldungen)})`;

    // Wo nicht gebaut wird, gibt es keinen Durchschnitt. Dort steht ein
    // Strich statt einer Null, die niemand erreicht hat.
    const schnitt = kennzahlen.durchschnittPunkte === null
      ? "kein Bauvorhaben"
      : kennzahlen.anzahlBauvorhaben + " Bauvorhaben, Ø " + kennzahlen.durchschnittPunkte + " Punkte";

    return `
      <li class="bezirkszeile">
        <span class="bezirkszeile-name">${bezirk.name}</span>
        <span class="bezirkszeile-zahlen">${schnitt}, Pflicht ab ${kennzahlen.schwelle}, ${beschrifteMeldungen(kennzahlen.anzahlMeldungen)}</span>
        <span class="bezirkszeile-stufe" style="${stufenFarbe}">${kennzahlen.anzahlMeldungen}</span>
      </li>
    `;
  });

  liste.innerHTML = alleZeilen.join("");
}


function zeichneMeldungen() {
  const liste = document.getElementById("meldungsListe");

  // Die neueste Meldung zuerst. slice() macht vorher eine Kopie, damit sort()
  // nicht die Liste in daten.js selbst umsortiert.
  const neuesteZuerst = meldungen.slice().sort(function (einer, anderer) {
    return anderer.datum.localeCompare(einer.datum);
  });

  const alleZeilen = neuesteZuerst.map(function (meldung) {
    const bezirk = findeBezirk(meldung.bezirkKennung);
    const bezirksName = bezirk ? bezirk.name : "Bezirk unbekannt";

    return `
      <li class="meldung">
        <span class="meldung-ort">${meldung.ort}</span>
        <span class="meldung-art">
          <svg class="symbol" aria-hidden="true"><use href="#${meldung.symbol || "symbol-meldung"}"></use></svg>
          ${meldung.art}
        </span>
        <span class="meldung-bezirk">${bezirksName}, ${schreibeDatumDeutsch(meldung.datum)}</span>
      </li>
    `;
  });

  liste.innerHTML = alleZeilen.join("");
}


function zeichneVerwaltung() {
  zeichneStatusliste();
  zeichneBezirke();
  zeichneMeldungen();
}


// ---------------------------------------------------------------
// 8. Ansicht Bauherr, Teil 4: der Klimapass zum Ausdrucken
//
// Der Pass ist die Zusammenfassung eines Bauvorhabens auf einem Blatt: was
// eingereicht wurde, was dabei herauskommt, und was gegebenenfalls fehlt.
// Am Bildschirm steht er als eigene Ansicht, auf Papier bleibt allein er übrig.
// ---------------------------------------------------------------

// Die sieben Kategorien als Tabelle: was eingereicht wurde, was gefordert ist,
// wie viele Punkte daraus werden.
function zeichnePasstabelle(ergebnis) {
  const zeilen = ergebnis.kategorien.map(function (kategorie) {
    const anteil = kategorie.erreichtePunkte / kategorie.maximalPunkte * 100;
    const symbol = KATEGORIESYMBOLE[kategorie.kennung] || "symbol-blatt";

    return `
      <tr class="pass-zeile">
        <td class="pass-feld pass-feld-name">
          <svg class="symbol" aria-hidden="true"><use href="#${symbol}"></use></svg>
          ${kategorie.name}
        </td>
        <td class="pass-feld">${beschrifteWert(kategorie.wert, kategorie.einheit)}</td>
        <td class="pass-feld">${beschrifteWert(kategorie.zielwert, kategorie.einheit)}</td>
        <td class="pass-feld">
          <span class="pass-balken"><span class="pass-balken-fuellung" style="width: ${anteil}%"></span></span>
        </td>
        <td class="pass-feld">${kategorie.erreichtePunkte} / ${kategorie.maximalPunkte}</td>
      </tr>
    `;
  });

  // Die Tabelle steckt in einem eigenen Kasten, der seitlich scrollen darf.
  // Fünf Spalten passen auf einem Handy nicht nebeneinander, und ein
  // abgeschnittener Wert wäre schlimmer als ein Schubser zur Seite.
  return `
    <div class="pass-tabellenkasten">
    <table class="pass-tabelle">
      <thead>
        <tr class="pass-zeile">
          <th class="pass-kopffeld">Kategorie</th>
          <th class="pass-kopffeld">Eingereicht</th>
          <th class="pass-kopffeld">Gefordert</th>
          <th class="pass-kopffeld"></th>
          <th class="pass-kopffeld">Punkte</th>
        </tr>
      </thead>
      <tbody>${zeilen.join("")}</tbody>
    </table>
    </div>
  `;
}


// Die Auflagen. Ist die Pflicht erfüllt, steht hier nichts weiter als ein Satz.
function zeichnePassauflagen(vorhaben, ergebnis) {
  if (ergebnis.fehlendePunkte === 0) {
    return `
      <p class="pass-satz pass-erfuellt">
        <svg class="symbol" aria-hidden="true"><use href="#symbol-blatt"></use></svg>
        Die Pflichtschwelle ist erreicht. Keine Auflagen.
      </p>
    `;
  }

  const vorschlaege = schlageMassnahmenVor(vorhaben, massnahmenKatalog, ergebnis.fehlendePunkte);
  const zeilen = vorschlaege.map(function (eintrag) {
    return `
      <li class="pass-auflage">
        ${eintrag.massnahme.name}, ${beschrifteMenge(eintrag.menge, eintrag.einheit)},
        ${schreibeEuro(eintrag.kosten)}, davon ${schreibeEuro(eintrag.foerderung)} Förderung,
        bringt ${schreibePunkte(eintrag.punktgewinn)} Punkte
      </li>
    `;
  });

  return `
    <p class="pass-satz">Es fehlen ${ergebnis.fehlendePunkte} Punkte. Vorgeschlagene Auflagen:</p>
    <ul class="pass-auflagen">${zeilen.join("")}</ul>
  `;
}


function zeichnePass(vorhaben) {
  const bezirk = findeBezirk(vorhaben.bezirkKennung);
  const ergebnis = bewerteVorhaben(vorhaben);

  document.getElementById("pass").innerHTML = `
    <div class="pass-kopf">
      <svg class="pass-marke-zeichen" aria-hidden="true"><use href="#symbol-marke"></use></svg>
      <div class="pass-kopftext">
        <p class="pass-marke">Berliner Hitze-Klimapass</p>
        <p class="pass-art">Zertifikat</p>
      </div>
    </div>

    <h3 class="pass-name">${vorhaben.name}</h3>
    <p class="pass-bezirk">
      <svg class="symbol" aria-hidden="true"><use href="#symbol-ort"></use></svg>
      ${vorhaben.adresse || ""}${bezirk ? ", " + bezirk.name : ""}
    </p>
    <p class="pass-art-gebaeude">${nameDerGebaeudeart(vorhaben.gebaeudeart)}${vorhaben.geschosse ? ", " + vorhaben.geschosse + " Geschosse" : ""}${vorhaben.lage ? ", " + nameDerLage(vorhaben.lage) : ""}</p>

    <div class="pass-urteil" style="--ampel-farbe: ${ampelFarbe(ergebnis.ampel)}">
      ${zeichnePunktering(ergebnis.gesamtPunkte, ergebnis.ampel, "punktering-gross")}
      <div class="pass-urteiltext">
        <p class="pass-status">${statusFuer(ergebnis.ampel)}</p>
        <p class="pass-schwelle">${ergebnis.gesamtPunkte} von 100 Punkten, Pflicht ab ${ergebnis.schwelle}</p>
        <p class="pass-flaechen">
          Grundstück ${schreibeZahlDeutsch(vorhaben.grundstuecksflaeche)} m²,
          Dach ${schreibeZahlDeutsch(vorhaben.dachflaeche)} m²,
          Fassade ${schreibeZahlDeutsch(vorhaben.fassadenflaeche)} m²,
          Freifläche ${schreibeZahlDeutsch(vorhaben.freiflaeche)} m²
        </p>
      </div>
    </div>

    <div class="pass-skizze">${zeichneSkizze(vorhaben)}</div>

    ${zeichnePasstabelle(ergebnis)}
    ${zeichnePassauflagen(vorhaben, ergebnis)}

    <svg class="pass-skyline" aria-hidden="true"><use href="#grafik-skyline"></use></svg>

    <p class="pass-fuss">
      ${vorhaben.antragDatum ? "Antrag eingereicht am " + schreibeDatumDeutsch(vorhaben.antragDatum) + ", Angaben geprüft. " : ""}
      Ausgestellt am ${schreibeDatumDeutsch(heute())}.
      Prototyp, keine amtliche Anwendung. Gewichte, Kosten und Förderquoten
      sind gesetzte Annahmen.
    </p>
  `;
}


// Die Beschriftung des Knopfes hängt daran, ob schon ein Antrag vorliegt.
function aktualisiereAntragKnopf() {
  const knopf = document.getElementById("passKnopf");
  const liegtVor = aktuellesVorhaben && aktuellesVorhaben.antragDatum;
  knopf.innerHTML = `<svg class="symbol" aria-hidden="true"><use href="#symbol-geprueft"></use></svg>`
    + (liegtVor ? "Zertifikat ansehen" : "Antrag abgeben");
  knopf.classList.toggle("knopf-laut", !liegtVor);
  knopf.classList.toggle("knopf-leise", !!liegtVor);
}


// Die simulierte Prüfung. Drei Schritte werden nacheinander abgehakt, dann
// öffnet sich das Zertifikat. Es ist eine Vorführung des Weges, den ein
// echter Antrag nähme, gerechnet ist zu diesem Zeitpunkt längst alles.
function fuehrePruefungDurch(vorhaben) {
  const schleier = document.getElementById("pruefung");
  const schritte = schleier.querySelectorAll(".pruefung-schritt");
  schritte.forEach(function (schritt) {
    schritt.classList.remove("erledigt");
  });
  schleier.classList.add("offen");

  const takt = 650;
  schritte.forEach(function (schritt, nummer) {
    setTimeout(function () {
      schritt.classList.add("erledigt");
    }, takt * (nummer + 1));
  });

  setTimeout(function () {
    schleier.classList.remove("offen");
    vorhaben.antragDatum = heute();
    sichereStand();
    aktualisiereAntragKnopf();
    zeichnePass(vorhaben);
    zeigeAnsicht("pass");
  }, takt * (schritte.length + 1));
}


function verbindePass() {
  document.getElementById("passKnopf").addEventListener("click", function () {
    if (!aktuellesVorhaben) {
      return;
    }
    if (aktuellesVorhaben.antragDatum) {
      zeichnePass(aktuellesVorhaben);
      zeigeAnsicht("pass");
      return;
    }
    fuehrePruefungDurch(aktuellesVorhaben);
  });

  document.getElementById("druckenKnopf").addEventListener("click", function () {
    window.print();
  });
}


// ---------------------------------------------------------------
// 9. Ansicht Bauherr, Teil 5: ein neues Bauvorhaben anlegen
// ---------------------------------------------------------------

// Der Bezirk, den die Adresssuche für das neue Bauvorhaben gefunden hat.
// Ohne Suche steht hier null, und das Anlegen wird beanstandet.
let gefundenerBezirkFuerNeubau = null;

// Antworten, die das Beispiel mitbringt. Bei einem leeren Formular null.
let antwortenFuerNeubau = null;


// Fragt adresse.js nach dem Bezirk und schreibt das Ergebnis in die Oberfläche.
// Beide Formulare, das für Bauvorhaben und das für Meldungen, benutzen diese
// eine Funktion. Sie bekommt gesagt, welche Felder sie füllen soll, und was
// mit dem Treffer geschehen soll.
async function sucheUndZeige(adressfeldKennung, fundstelleKennung, beiTreffer) {
  const adresse = document.getElementById(adressfeldKennung).value;
  const fundstelle = document.getElementById(fundstelleKennung);

  fundstelle.textContent = "Wird gesucht …";
  fundstelle.classList.remove("fehlgeschlagen");

  const ergebnis = await sucheBezirkZuAdresse(adresse, bezirke);

  if (!ergebnis.erfolg) {
    fundstelle.textContent = ergebnis.grund;
    fundstelle.classList.add("fehlgeschlagen");
    beiTreffer(null);
    return;
  }

  // Die gefundene Adresse wird mit angezeigt. Ohne das merkt man nicht, wenn
  // der Dienst eine andere Stelle verstanden hat als gemeint war.
  fundstelle.innerHTML = '<svg class="symbol" aria-hidden="true"><use href="#symbol-ort"></use></svg>'
    + ergebnis.bezirk.name + ". Gefunden: " + ergebnis.gefundeneAdresse;
  beiTreffer(ergebnis.bezirk);
}


// Liest die Felder aus und macht daraus einen Entwurf.
// Der Bezirk kommt nicht aus einem Feld, sondern aus der Adresssuche. Wurde
// noch nicht gesucht, bleibt er leer und bewertung.js beanstandet das.
// Number("") ergibt 0, ein leeres Zahlenfeld fällt dadurch von allein durch
// dieselbe Prüfung.
// Füllt die Auswahl der Gebäudearten aus daten.js. Kommt eine Art dazu,
// steht sie dadurch von allein im Formular.
function fuelleArtAuswahl() {
  document.getElementById("neuArt").innerHTML = gebaeudearten.map(function (art) {
    return `<option value="${art.kennung}">${art.name}</option>`;
  }).join("");
}


function fuelleLageAuswahl() {
  document.getElementById("neuLage").innerHTML = lagen.map(function (lage) {
    return `<option value="${lage.kennung}">${lage.name}</option>`;
  }).join("");
}


function nameDerLage(kennung) {
  const lage = lagen.find(function (eintrag) {
    return eintrag.kennung === kennung;
  });
  return lage ? lage.name : "";
}


function findeGebaeudeart(kennung) {
  return gebaeudearten.find(function (art) {
    return art.kennung === kennung;
  });
}


function nameDerGebaeudeart(kennung) {
  const art = findeGebaeudeart(kennung);
  return art ? art.name : "";
}


function liesEntwurf() {
  return {
    name: document.getElementById("neuName").value.trim(),
    adresse: document.getElementById("neuAdresse").value.trim(),
    gebaeudeart: document.getElementById("neuArt").value,
    lage: document.getElementById("neuLage").value,
    geschosse: Number(document.getElementById("neuGeschosse").value),
    bezirkKennung: gefundenerBezirkFuerNeubau ? gefundenerBezirkFuerNeubau.kennung : "",
    grundstuecksflaeche: Number(document.getElementById("neuGrundstueck").value),
    dachflaeche: Number(document.getElementById("neuDach").value),
    fassadenflaeche: Number(document.getElementById("neuFassade").value),
    freiflaeche: Number(document.getElementById("neuFrei").value)
  };
}


function schreibeEntwurf(entwurf) {
  document.getElementById("neuName").value = entwurf.name;
  document.getElementById("neuAdresse").value = entwurf.adresse;
  document.getElementById("neuArt").value = entwurf.gebaeudeart || gebaeudearten[0].kennung;
  document.getElementById("neuLage").value = entwurf.lage || "stadtquartier";
  document.getElementById("neuGeschosse").value = entwurf.geschosse;
  document.getElementById("neuGrundstueck").value = entwurf.grundstuecksflaeche;
  document.getElementById("neuDach").value = entwurf.dachflaeche;
  document.getElementById("neuFassade").value = entwurf.fassadenflaeche;
  document.getElementById("neuFrei").value = entwurf.freiflaeche;
}


function zeigeBeanstandungen(beanstandungen) {
  document.getElementById("beanstandungen").innerHTML = beanstandungen
    .map(function (text) {
      return `<li class="beanstandung">${text}</li>`;
    })
    .join("");
}


function oeffneNeuformular() {
  // Leere Felder, damit beim zweiten Anlegen nicht die Eingabe vom ersten Mal
  // dasteht. Auch der gefundene Bezirk wird zurückgesetzt, sonst würde das
  // nächste Bauvorhaben stillschweigend im vorigen Bezirk landen.
  schreibeEntwurf({
    name: "",
    adresse: "",
    gebaeudeart: gebaeudearten[0].kennung,
    lage: "stadtquartier",
    geschosse: "",
    grundstuecksflaeche: "",
    dachflaeche: "",
    fassadenflaeche: "",
    freiflaeche: ""
  });
  gefundenerBezirkFuerNeubau = null;
  antwortenFuerNeubau = null;
  document.getElementById("neuFundstelle").textContent = "";
  zeigeBeanstandungen([]);
  zeigeAnsicht("neu");
}


// Legt das Bauvorhaben an, sofern die Prüfung aus bewertung.js nichts findet.
// Alle sieben Kühlwerte starten bei null. Das neue Vorhaben ist dadurch rot,
// und die Maßnahmenliste steht sofort da. Genau das soll man sehen.
function legeBauvorhabenAn() {
  const entwurf = liesEntwurf();
  const beanstandungen = pruefeBauvorhaben(entwurf);
  zeigeBeanstandungen(beanstandungen);

  if (beanstandungen.length > 0) {
    return;
  }

  entwurf.kennung = "eigenes-" + Date.now();
  // Ein neues Vorhaben startet mit den leeren Antworten, es sei denn, das
  // Beispiel wurde eingesetzt und bringt seine eigenen mit.
  entwurf.antworten = antwortenFuerNeubau || leereAntworten();
  antwortenFuerNeubau = null;
  aktualisiereEingabe(entwurf);

  bauvorhaben.push(entwurf);
  sichereStand();
  zeichneBauvorhaben();
  oeffneDetail(entwurf.kennung);
}


function verbindeNeuformular() {
  document.getElementById("neuSuchenKnopf").addEventListener("click", function () {
    sucheUndZeige("neuAdresse", "neuFundstelle", function (bezirk) {
      gefundenerBezirkFuerNeubau = bezirk;
    });
  });

  document.getElementById("beispielKnopf").addEventListener("click", function () {
    // Object.assign kopiert die Beispielwerte, statt das Beispiel selbst
    // weiterzureichen. Sonst würde ein zweites Anlegen die Vorlage in daten.js
    // überschreiben.
    schreibeEntwurf(Object.assign({}, beispielBauvorhaben));
    antwortenFuerNeubau = Object.assign({}, beispielBauvorhaben.antworten);
    zeigeBeanstandungen([]);
    // Die Adresse des Beispiels wird gleich mitgesucht, sonst müsste man nach
    // dem Einsetzen noch von Hand auf "Bezirk suchen" klicken.
    sucheUndZeige("neuAdresse", "neuFundstelle", function (bezirk) {
      gefundenerBezirkFuerNeubau = bezirk;
    });
  });

  document.getElementById("anlegenKnopf").addEventListener("click", legeBauvorhabenAn);
}


// ---------------------------------------------------------------
// 10. Ansicht Bürger:in, Teil 1: die Karte
//
// Die Umrisse stehen als SVG in index.html. Hier kommen nur Farbe, Name und
// Hitzezahl dazu. Ein Bezirksname steht dadurch weiterhin nur in daten.js.
// ---------------------------------------------------------------

// Der Bezirk, der gerade auf der Karte ausgewählt ist. Ohne Auswahl null.
let gewaehlterBezirk = null;


// Bricht einen Bezirksnamen für die Karte auf zwei Zeilen um, und zwar am
// Bindestrich. Aus "Charlottenburg-Wilmersdorf" wird "Charlottenburg-" und
// "Wilmersdorf". Namen ohne Bindestrich bleiben einzeilig, die zweite Zeile
// ist dann leer. So braucht es kein zusätzliches Feld in daten.js.
function brichNamenUm(name) {
  const strich = name.indexOf("-");
  if (strich === -1) {
    return [name, ""];
  }
  return [name.slice(0, strich + 1), name.slice(strich + 1)];
}


function zeichneKarte() {
  document.querySelectorAll(".bezirksflaeche").forEach(function (flaeche) {
    const bezirk = findeBezirk(flaeche.dataset.bezirk);
    if (!bezirk) {
      return;
    }

    // Die Füllfarbe richtet sich danach, wie viele Meldungen aus dem Bezirk
    // eingegangen sind. Ohne Meldung bleibt er neutral. Damit zeigt die Karte
    // nur noch, was Menschen tatsächlich gemeldet haben.
    const anzahl = meldungen.filter(function (meldung) {
      return meldung.bezirkKennung === bezirk.kennung;
    }).length;
    flaeche.style.setProperty("--stufe-farbe", `var(--farbe-melde-${meldestufeFuer(anzahl)})`);
    flaeche.classList.toggle("ohne-meldung", anzahl === 0);
    flaeche.classList.toggle("gewaehlt", gewaehlterBezirk === bezirk.kennung);

    const zeilen = brichNamenUm(bezirk.name);
    const namensfelder = flaeche.querySelectorAll(".bezirksflaeche-name");
    namensfelder[0].textContent = zeilen[0];
    namensfelder[1].textContent = zeilen[1];
    flaeche.querySelector(".bezirksflaeche-stufe").textContent = anzahl > 0 ? anzahl : "";
  });
}


function waehleBezirk(bezirkKennung) {
  gewaehlterBezirk = bezirkKennung;
  zeichneKarte();

  const bezirk = findeBezirk(bezirkKennung);
  document.getElementById("meldeBezirk").textContent = bezirk ? bezirk.name : "";
  document.getElementById("meldeAntwort").textContent = "";
}


// Die Karte bleibt anklickbar, auch wenn der Bezirk normalerweise aus der
// Adresse kommt. Für eine Vorführung ist das praktisch: man tippt einen Bezirk
// an, ohne eine Adresse zu kennen.
function verbindeKarte() {
  document.querySelector(".karte").addEventListener("click", function (ereignis) {
    // closest arbeitet auch in einem SVG. Geklickt wird auf den Umriss oder auf
    // die Beschriftung, gemeint ist beide Male die Gruppe darum.
    const flaeche = ereignis.target.closest(".bezirksflaeche");
    if (!flaeche) {
      return;
    }
    waehleBezirk(flaeche.dataset.bezirk);
    document.getElementById("meldeFundstelle").textContent = "";
  });
}


// ---------------------------------------------------------------
// 11. Ansicht Bürger:in, Teil 2: die Hitzemeldung
// ---------------------------------------------------------------

// Die gewählte Meldungsart. Die erste ist beim Laden vorausgewählt, damit eine
// Meldung im einfachsten Fall nur zwei Handgriffe braucht.
let gewaehlteArt = meldungsarten[0];


function zeichneArtwahl() {
  document.getElementById("artWahl").innerHTML = meldungsarten
    .map(function (art) {
      const istAktiv = art.kennung === gewaehlteArt.kennung;
      return `
        <button class="wahl-knopf${istAktiv ? " aktiv" : ""}" type="button"
                data-art="${art.kennung}" aria-pressed="${istAktiv}">
          <svg class="symbol" aria-hidden="true"><use href="#${art.symbol}"></use></svg>
          ${art.name}
        </button>
      `;
    })
    .join("");
}


function findeMeldungsart(kennung) {
  return meldungsarten.find(function (art) {
    return art.kennung === kennung;
  });
}


// Das heutige Datum als 2026-09-12. toISOString rechnet in Weltzeit um, deshalb
// werden Jahr, Monat und Tag hier einzeln aus der örtlichen Zeit geholt.
function heute() {
  const jetzt = new Date();
  const monat = String(jetzt.getMonth() + 1).padStart(2, "0");
  const tag = String(jetzt.getDate()).padStart(2, "0");
  return jetzt.getFullYear() + "-" + monat + "-" + tag;
}


function meldeHitze() {
  const antwort = document.getElementById("meldeAntwort");
  const ortFeld = document.getElementById("meldeOrt");
  const textFeld = document.getElementById("meldeText");
  const ort = ortFeld.value.trim();

  if (!ort) {
    antwort.textContent = "Bitte eine Adresse eintragen.";
    return;
  }
  if (!gewaehlterBezirk) {
    antwort.textContent = "Erst auf \"Bezirk suchen\" klicken.";
    return;
  }

  // Vorn anhängen, damit die neueste Meldung oben steht. Das Dashboard sortiert
  // ohnehin selbst nach Datum, aber mehrere Meldungen von heute behalten so
  // ihre Reihenfolge.
  meldungen.unshift({
    kennung: "meldung-" + Date.now(),
    bezirkKennung: gewaehlterBezirk,
    ort: ort,
    art: gewaehlteArt.name,
    artKennung: gewaehlteArt.kennung,
    symbol: gewaehlteArt.symbol,
    // Die Beschreibung ist freiwillig. Ist sie leer, bleibt das Feld leer und
    // die Meldung zeigt später einfach keine zusätzliche Zeile.
    beschreibung: textFeld.value.trim(),
    datum: heute()
  });

  sichereStand();
  ortFeld.value = "";
  textFeld.value = "";
  gewaehlterBezirk = null;
  zeichneKarte();
  document.getElementById("meldeBezirk").textContent = "";
  document.getElementById("meldeFundstelle").textContent = "";
  antwort.textContent = "Danke. Deine Meldung ist eingegangen.";
  zeichneBuergerdashboard();
}


function verbindeMeldeformular() {
  document.getElementById("meldeSuchenKnopf").addEventListener("click", function () {
    sucheUndZeige("meldeOrt", "meldeFundstelle", function (bezirk) {
      // waehleBezirk hebt den Bezirk auch auf der Karte hervor. Man sieht also
      // sofort, wo die eigene Adresse liegt und wie heiß es dort ist.
      waehleBezirk(bezirk ? bezirk.kennung : null);
    });
  });

  document.getElementById("artWahl").addEventListener("click", function (ereignis) {
    const knopf = ereignis.target.closest(".wahl-knopf");
    if (!knopf) {
      return;
    }
    gewaehlteArt = findeMeldungsart(knopf.dataset.art);
    zeichneArtwahl();
  });

  document.getElementById("meldenKnopf").addEventListener("click", meldeHitze);

  // Enter im Adressfeld sucht den Bezirk. Gemeldet wird erst mit dem Knopf
  // darunter, weil man zwischen Suche und Meldung noch die Art auswählt.
  document.getElementById("meldeOrt").addEventListener("keydown", function (ereignis) {
    if (ereignis.key === "Enter") {
      document.getElementById("meldeSuchenKnopf").click();
    }
  });
}


// ---------------------------------------------------------------
// 12. Das Bürger-Dashboard
//
// Es liest dieselben Daten wie die Bauherr-Ansicht. Neu ist nur der Blickwinkel:
// die Bürgerin sieht, was gemeldet wurde und wie die geprüften Gebäude im
// eigenen Bezirk abgeschnitten haben.
// ---------------------------------------------------------------

// Eine Kennzahl-Kachel mit Symbol, großer Zahl und Bezeichnung.
function zeichneKennzahl(symbol, zahl, bezeichnung) {
  return `
    <div class="kennzahl">
      <svg class="kennzahl-symbol" aria-hidden="true"><use href="#${symbol}"></use></svg>
      <span class="kennzahl-zahl">${zahl}</span>
      <span class="kennzahl-wort">${bezeichnung}</span>
    </div>
  `;
}


function zeichneKennzahlreihe() {
  const ueberblick = ueberblickFuerBuerger(bezirke, bauvorhaben, meldungen);

  // Ohne Meldung gibt es keinen Spitzenreiter. Dort steht dann ein Strich
  // statt eines Bezirksnamens, den niemand gemeldet hat.
  const spitze = ueberblick.spitzenreiter
    ? ueberblick.spitzenreiter.bezirk.name
    : "—";

  document.getElementById("kennzahlreihe").innerHTML =
    zeichneKennzahl("symbol-meldung", ueberblick.anzahlMeldungen, "Meldungen")
    + zeichneKennzahl("symbol-geprueft", ueberblick.anzahlGeprueft, "geprüfte Gebäude")
    + zeichneKennzahl("symbol-blatt", ueberblick.anzahlFreigegeben, "davon freigegeben")
    + zeichneKennzahl("symbol-thermometer", spitze, "meiste Meldungen");
}


// Die zehn neuesten Meldungen. Mehr braucht in einer Vorführung niemand zu
// sehen, und die Liste bleibt überschaubar.
function zeichneBuergerMeldungen() {
  const liste = document.getElementById("buergerMeldungen");

  if (meldungen.length === 0) {
    liste.innerHTML = `
      <li class="einstieg">
        <svg class="einstieg-bild" viewBox="0 0 320 120" aria-hidden="true">
          <use href="#grafik-melden"></use>
        </svg>
        <p class="einstieg-satz">Noch keine Meldung.</p>
      </li>
    `;
    return;
  }

  const neuesteZuerst = meldungen.slice().sort(function (einer, anderer) {
    return anderer.datum.localeCompare(einer.datum);
  });

  liste.innerHTML = neuesteZuerst.slice(0, 10).map(function (meldung) {
    const bezirk = findeBezirk(meldung.bezirkKennung);

    return `
      <li class="meldung">
        <span class="meldung-ort">${meldung.ort}</span>
        <span class="meldung-art">
          <svg class="symbol" aria-hidden="true"><use href="#${meldung.symbol || "symbol-meldung"}"></use></svg>
          ${meldung.art}
        </span>
        <span class="meldung-bezirk">${bezirk ? bezirk.name : "Bezirk unbekannt"}, ${schreibeDatumDeutsch(meldung.datum)}</span>
        ${meldung.beschreibung ? `<span class="meldung-beschreibung">${meldung.beschreibung}</span>` : ""}
      </li>
    `;
  }).join("");
}


// Die geprüften Gebäude, wie eine Bürgerin sie sieht: Name, Adresse, Ergebnis.
// Anklicken kann man sie hier nicht, es ist eine Auskunft und keine Eingabe.
function zeichneGepruefteGebaeude() {
  const feld = document.getElementById("gepruefteGebaeude");

  if (bauvorhaben.length === 0) {
    feld.innerHTML = `
      <div class="einstieg">
        <svg class="einstieg-bild" viewBox="0 0 320 120" aria-hidden="true">
          <use href="#grafik-stadt"></use>
        </svg>
        <p class="einstieg-satz">Noch kein Gebäude geprüft.</p>
      </div>
    `;
    return;
  }

  feld.innerHTML = bauvorhaben.map(function (vorhaben) {
    const bezirk = findeBezirk(vorhaben.bezirkKennung);
    const ergebnis = bewerteVorhaben(vorhaben);

    return `
      <article class="kachel kachel-auskunft" style="--ampel-farbe: ${ampelFarbe(ergebnis.ampel)}">
        <span class="kachel-name">${vorhaben.name}</span>
        <span class="kachel-bezirk">${vorhaben.adresse || (bezirk ? bezirk.name : "")}</span>
        <span class="kachel-art">${nameDerGebaeudeart(vorhaben.gebaeudeart)}</span>
        <span class="kachel-skizze">${zeichneSkizze(vorhaben)}</span>
        <span class="kachel-fuss">
          ${zeichnePunktering(ergebnis.gesamtPunkte, ergebnis.ampel, "punktering-mini")}
          <span class="kachel-status">${statusFuer(ergebnis.ampel)}</span>
        </span>
      </article>
    `;
  }).join("");
}


function zeichneBuergerdashboard() {
  zeichneKennzahlreihe();
  zeichneKarte();
  zeichneBuergerMeldungen();
  zeichneGepruefteGebaeude();
}


// ---------------------------------------------------------------
// 13. Der Konzept-Bereich
//
// Der Text steht in index.html. Hier kommen nur die Zahlen dazu, und zwar
// aus bewertung.js und daten.js. Ändert sich dort ein Gewicht oder eine
// Schwelle, stimmt das Konzept von allein wieder.
// ---------------------------------------------------------------

function zeichneKonzept() {
  document.getElementById("konzeptKategorien").innerHTML = KATEGORIEN.map(function (kategorie) {
    const symbol = KATEGORIESYMBOLE[kategorie.kennung] || "symbol-blatt";
    return `
      <li class="kategorie">
        <svg class="symbol" aria-hidden="true"><use href="#${symbol}"></use></svg>
        <span class="kategorie-name">${kategorie.name}</span>
        <span class="kategorie-punkte">${kategorie.maximalPunkte}</span>
      </li>
    `;
  }).join("");

  document.getElementById("konzeptSchwellen").innerHTML = lagen.map(function (lage) {
    return `
      <div class="schwelle">
        <span class="schwelle-zahl">${schwelleFuer(lage.kennung)}</span>
        <span class="schwelle-name">${lage.name}</span>
      </div>
    `;
  }).join("");

  document.getElementById("konzeptEhrlich").textContent =
    "Echt sind die zwölf Bezirke und die Adressen. Gesetzte Annahmen sind die Gewichte, "
    + "die Schwellen und die " + massnahmenKatalog.length + " Maßnahmen im Katalog mit ihren "
    + "Kosten. Für ein Produkt kämen die Zahlen aus der Stadtklimaanalyse des Senats.";
}


// ---------------------------------------------------------------
// 14. Start
// ---------------------------------------------------------------

// Holt zurück, was beim letzten Besuch gespeichert wurde.
//
// Die Listen in daten.js sind mit const angelegt und können deshalb nicht
// ersetzt werden. Sie werden stattdessen gefüllt. Das ist auch das bessere
// Vorgehen: alle Stellen, die sie schon halten, zeigen weiter auf dieselbe
// Liste und sehen den neuen Inhalt sofort.
function ladeStand() {
  const gespeichert = ladeGespeichertes();
  gespeichert.bauvorhaben.forEach(function (vorhaben) {
    // Bauvorhaben aus der Zeit vor dem Fragebogen haben nur die sieben
    // Reglerwerte. Sie bekommen leere Antworten und werden neu gerechnet.
    if (!vorhaben.lage) {
      vorhaben.lage = "stadtquartier";
    }
    aktualisiereEingabe(vorhaben);
    bauvorhaben.push(vorhaben);
  });
  gespeichert.meldungen.forEach(function (meldung) {
    meldungen.push(meldung);
  });
}


// Löscht das geöffnete Bauvorhaben nach Rückfrage. Die Liste wird an Ort und
// Stelle verändert (splice), nicht ersetzt, weil sie in daten.js mit const
// angelegt ist und alle Stellen weiter auf dieselbe Liste zeigen sollen.
function verbindeLoeschen() {
  document.getElementById("loeschenKnopf").addEventListener("click", function () {
    if (!aktuellesVorhaben) {
      return;
    }
    if (!window.confirm("„" + aktuellesVorhaben.name + "“ wirklich löschen?")) {
      return;
    }
    const stelle = bauvorhaben.indexOf(aktuellesVorhaben);
    if (stelle !== -1) {
      bauvorhaben.splice(stelle, 1);
    }
    aktuellesVorhaben = null;
    sichereStand();
    zeichneBauvorhaben();
    zeigeAnsicht("liste");
  });
}


function verbindeZuruecksetzen() {
  document.getElementById("zuruecksetzenKnopf").addEventListener("click", function () {
    // Gefragt wird ausdrücklich, weil der Klick alles verwirft und sich nicht
    // rückgängig machen lässt.
    if (!window.confirm("Alle Bauvorhaben und Meldungen löschen?")) {
      return;
    }
    leereSpeicher();
    // Die Listen werden geleert statt ersetzt, aus demselben Grund wie oben.
    bauvorhaben.length = 0;
    meldungen.length = 0;
    aktuellesVorhaben = null;
    gewaehlterBezirk = null;
    zeichneBauvorhaben();
    zeichneBuergerdashboard();
    zeigeAnsicht("liste");
    zeigeRolle("bauherr");
  });
}


function starte() {
  ladeStand();
  zeichneBauvorhaben();
  if (verwaltungAktiv) {
    zeichneVerwaltung();
  }
  verbindeUmschalter();
  verbindeKachelliste();
  verbindeDetail();
  fuelleArtAuswahl();
  fuelleLageAuswahl();
  verbindeNeuformular();
  verbindePass();
  zeichneKarte();
  verbindeKarte();
  zeichneArtwahl();
  verbindeMeldeformular();
  zeichneBuergerdashboard();
  verbindeZuruecksetzen();
  verbindeLoeschen();
  zeichneKonzept();
  // Bauherr ist beim Laden aktiv, weil das der zahlende Kunde ist und die
  // Ansicht, die in der Vorführung zuerst gezeigt wird.
  zeigeRolle("bauherr");
  zeigeAnsicht("liste");
}

starte();
