// bewertung.js
//
// Die Punkterechnung des Klimapasses. Das ist das eigentliche Produkt.
//
// Diese Datei fasst die Seite nie an. Hier steht kein "document" und kein
// "getElementById". Sie bekommt Zahlen herein und gibt Zahlen zurück, sonst
// nichts. Nur deshalb lässt sie sich mit pruefe-bewertung.js ganz ohne Browser
// durchrechnen, und nur deshalb hält die Rechnung der Frage stand, ob die
// Zahlen stimmen.
//
// Auch der Maßnahmenkatalog wird als Aufrufwert übergeben statt hier ausgelesen.
// Dadurch hängt bewertung.js an keiner einzigen anderen Datei.
//
// Alle Gewichte, Zielwerte und Schwellen sind für die Demo gesetzt, nicht
// aus einer Verordnung hergeleitet.


// ---------------------------------------------------------------
// 1. Die sieben Kategorien
//
// "maximalPunkte" der sieben Zeilen ergibt zusammen genau 100.
// "einheit" sagt, worin der Eingabewert gemessen wird. Davon hängt später ab,
// wie aus einem Regler eine Menge und daraus ein Preis wird.
// "zielwert" ist der Wert für die volle Punktzahl. Steht dort null, hängt das
// Ziel von der Grundstücksgröße ab und wird in zielwertFuer() gerechnet.
// ---------------------------------------------------------------

const KATEGORIEN = [
  { kennung: "unversiegelt",       name: "Unversiegelt",      maximalPunkte: 20, einheit: "prozent",    zielwert: 50 },
  { kennung: "dachbegruenung",     name: "Dachbegrünung",     maximalPunkte: 20, einheit: "prozent",    zielwert: 70 },
  { kennung: "fassadenbegruenung", name: "Fassadenbegrünung", maximalPunkte: 15, einheit: "prozent",    zielwert: 40 },
  { kennung: "verschattung",       name: "Verschattung",      maximalPunkte: 10, einheit: "prozent",    zielwert: 60 },
  { kennung: "helleMaterialien",   name: "Helle Materialien", maximalPunkte: 10, einheit: "stufe",      zielwert: 2 },
  { kennung: "regenrueckhalt",     name: "Regenrückhalt",     maximalPunkte: 15, einheit: "kubikmeter", zielwert: null },
  { kennung: "baeume",             name: "Bäume",             maximalPunkte: 10, einheit: "stueck",     zielwert: null }
];


function findeKategorie(kategorieKennung) {
  return KATEGORIEN.find(function (kategorie) {
    return kategorie.kennung === kategorieKennung;
  });
}


// ---------------------------------------------------------------
// 2. Zielwerte und Bezugsflächen
// ---------------------------------------------------------------

// Der Wert, ab dem es die volle Punktzahl einer Kategorie gibt.
// Regenrückhalt und Bäume hängen an der Grundstücksgröße, alle anderen nicht.
function zielwertFuer(vorhaben, kategorie) {
  if (kategorie.kennung === "regenrueckhalt") {
    // 3 Kubikmeter je 100 Quadratmeter Grundstück.
    return Math.ceil(vorhaben.grundstuecksflaeche / 100 * 3);
  }
  if (kategorie.kennung === "baeume") {
    // 2 Bäume je 500 Quadratmeter Grundstück. Aufgerundet, weil man keine
    // 0,8 Bäume pflanzen kann.
    return Math.ceil(vorhaben.grundstuecksflaeche / 500 * 2);
  }
  return kategorie.zielwert;
}


// Die Fläche des Bauvorhabens, auf die sich eine Prozentangabe bezieht.
// Regenrückhalt und Bäume zählen nicht in Quadratmetern, deshalb 0.
function bezugsflaecheFuer(vorhaben, kategorieKennung) {
  if (kategorieKennung === "unversiegelt") {
    return vorhaben.grundstuecksflaeche;
  }
  if (kategorieKennung === "dachbegruenung") {
    return vorhaben.dachflaeche;
  }
  if (kategorieKennung === "fassadenbegruenung") {
    return vorhaben.fassadenflaeche;
  }
  if (kategorieKennung === "verschattung") {
    return vorhaben.freiflaeche;
  }
  if (kategorieKennung === "helleMaterialien") {
    // Helle Materialien betreffen Dach und Fassade zusammen.
    return vorhaben.dachflaeche + vorhaben.fassadenflaeche;
  }
  return 0;
}


// ---------------------------------------------------------------
// 3. Punkte, Schwelle, Ampel
// ---------------------------------------------------------------

// Linear bis zum Zielwert, darüber gibt es keine Extrapunkte. Wer das Ziel
// zur Hälfte erreicht, bekommt die halbe Punktzahl.
function punkteFuerKategorie(wert, zielwert, maximalPunkte) {
  if (zielwert <= 0) {
    // Ohne Ziel gibt es nichts zu erreichen, also die volle Punktzahl.
    return maximalPunkte;
  }
  const anteil = Math.min(Math.max(wert / zielwert, 0), 1);
  return anteil * maximalPunkte;
}


// Die Pflichtschwelle. Ein Neubau muss mindestens so viele Punkte erreichen,
// um freigegeben zu werden.
//
// Bis zum 13.09.2026 hing sie am Bezirk und stieg mit dessen Hitzebelastung.
// Diese Belastung war geschätzt und ist raus, damit auf der Seite nichts mehr
// steht, was nach Messwert aussieht und keiner ist. Ohne sie gibt es keinen
// Grund, die Anforderung je Bezirk zu staffeln, deshalb gilt für ganz Berlin
// dieselbe Zahl.
//
// Sobald echte Klimadaten vorliegen, etwa aus dem Umweltatlas des Senats, kann
// die Staffelung zurückkommen. Die Rechnung dafür stand schon und lautete
// 50 + 5 × (Belastung − 1).
const PFLICHTSCHWELLE = 60;


function schwelleFuer() {
  return PFLICHTSCHWELLE;
}


function ampelFuer(gesamtPunkte, schwelle) {
  if (gesamtPunkte >= schwelle) {
    return "gruen";
  }
  if (gesamtPunkte >= schwelle - 10) {
    return "gelb";
  }
  return "rot";
}


// ---------------------------------------------------------------
// 4. Die Gesamtbewertung
//
// Jede Kategorie wird einzeln auf eine ganze Zahl gerundet und erst danach
// summiert. Das ist Absicht: die sieben Balken in der Oberfläche ergeben
// dadurch genau die große Zahl daneben. Würde man erst summieren und dann
// runden, stünde in der Vorführung irgendwann 13 + 6 = 20 auf dem Schirm.
// ---------------------------------------------------------------

function bewerte(vorhaben) {
  const bewerteteKategorien = KATEGORIEN.map(function (kategorie) {
    const wert = vorhaben.eingabe[kategorie.kennung];
    const zielwert = zielwertFuer(vorhaben, kategorie);
    const rohePunkte = punkteFuerKategorie(wert, zielwert, kategorie.maximalPunkte);

    return {
      kennung: kategorie.kennung,
      name: kategorie.name,
      einheit: kategorie.einheit,
      wert: wert,
      zielwert: zielwert,
      maximalPunkte: kategorie.maximalPunkte,
      erreichtePunkte: Math.round(rohePunkte)
    };
  });

  const gesamtPunkte = bewerteteKategorien.reduce(function (summe, kategorie) {
    return summe + kategorie.erreichtePunkte;
  }, 0);

  const schwelle = schwelleFuer();

  return {
    kategorien: bewerteteKategorien,
    gesamtPunkte: gesamtPunkte,
    schwelle: schwelle,
    fehlendePunkte: Math.max(schwelle - gesamtPunkte, 0),
    ampel: ampelFuer(gesamtPunkte, schwelle)
  };
}


// ---------------------------------------------------------------
// 5. Maßnahmen
// ---------------------------------------------------------------

// Wie viel gebaut werden muss, um einen Wert von "vonWert" auf "aufWert" zu
// heben. Das Ergebnis ist eine Menge in der Einheit der Kategorie, also
// Quadratmeter, Kubikmeter oder Stück.
function mengeFuerSprung(vorhaben, kategorie, vonWert, aufWert) {
  const sprung = Math.max(aufWert - vonWert, 0);

  if (kategorie.einheit === "prozent") {
    return bezugsflaecheFuer(vorhaben, kategorie.kennung) * sprung / 100;
  }
  if (kategorie.einheit === "stufe") {
    // Von "nein" bis "ja" sind es zwei Stufen. Eine ganze Stufe entspricht
    // damit der halben betroffenen Fläche.
    return bezugsflaecheFuer(vorhaben, kategorie.kennung) * sprung / 2;
  }
  // Kubikmeter und Stück brauchen keine Umrechnung.
  return sprung;
}


// Rechnet eine einzelne Maßnahme für ein bestimmtes Bauvorhaben durch.
// Bringt sie nichts, weil das Bauvorhaben schon weiter ist, kommt null zurück.
function bewerteMassnahme(vorhaben, massnahme) {
  const kategorie = findeKategorie(massnahme.kategorie);
  const zielwert = zielwertFuer(vorhaben, kategorie);
  const istWert = vorhaben.eingabe[kategorie.kennung];
  const neuerWert = zielwert * massnahme.hebtAufAnteilDesZiels;

  const punkteVorher = punkteFuerKategorie(istWert, zielwert, kategorie.maximalPunkte);
  const punkteNachher = punkteFuerKategorie(neuerWert, zielwert, kategorie.maximalPunkte);
  const punktgewinn = punkteNachher - punkteVorher;

  if (punktgewinn <= 0) {
    return null;
  }

  const menge = mengeFuerSprung(vorhaben, kategorie, istWert, neuerWert);
  const kosten = menge * massnahme.kostenJeEinheit;
  const foerderung = kosten * massnahme.foerderquote / 100;
  const eigenanteil = kosten - foerderung;

  return {
    massnahme: massnahme,
    kategorieName: kategorie.name,
    einheit: kategorie.einheit,
    menge: menge,
    punktgewinn: punktgewinn,
    kosten: kosten,
    foerderung: foerderung,
    eigenanteil: eigenanteil,
    // Sortiergröße. Gerechnet wird mit dem Eigenanteil, weil das der Betrag
    // ist, den der Bauherr am Ende tatsächlich bezahlt.
    kostenJePunkt: eigenanteil / punktgewinn
  };
}


// Sucht aus dem Katalog die Maßnahmen heraus, die die Lücke zur Pflichtschwelle
// schließen. Günstigste je Punkt zuerst, so lange bis die fehlenden Punkte
// beisammen sind.
function schlageMassnahmenVor(vorhaben, katalog, fehlendePunkte) {
  const wirksame = katalog
    .map(function (massnahme) {
      return bewerteMassnahme(vorhaben, massnahme);
    })
    .filter(function (eintrag) {
      return eintrag !== null;
    });

  wirksame.sort(function (einer, anderer) {
    if (einer.kostenJePunkt !== anderer.kostenJePunkt) {
      return einer.kostenJePunkt - anderer.kostenJePunkt;
    }
    // Bei gleichem Preis je Punkt gewinnt die Maßnahme mit mehr Punkten.
    // Sonst würde eine halbe Maßnahme die ganze aus derselben Kategorie
    // verdrängen, obwohl beide gleich wirtschaftlich sind.
    return anderer.punktgewinn - einer.punktgewinn;
  });

  const vorschlag = [];
  const schonBenutzteKategorien = [];
  let gesammeltePunkte = 0;

  wirksame.forEach(function (eintrag) {
    if (gesammeltePunkte >= fehlendePunkte) {
      return;
    }
    // Je Kategorie höchstens eine Maßnahme. Zwei Vorschläge derselben Kategorie
    // würden sich dieselbe Fläche teilen, und der Punktgewinn wäre doppelt
    // gezählt.
    if (schonBenutzteKategorien.indexOf(eintrag.massnahme.kategorie) !== -1) {
      return;
    }
    schonBenutzteKategorien.push(eintrag.massnahme.kategorie);
    vorschlag.push(eintrag);
    gesammeltePunkte = gesammeltePunkte + eintrag.punktgewinn;
  });

  return vorschlag;
}


// ---------------------------------------------------------------
// 6. Kennzahlen für das Verwaltungs-Dashboard
//
// Auch das ist reines Rechnen und steht deshalb hier und nicht in app.js.
// Die Listen kommen als Aufrufwerte herein, damit diese Datei weiterhin an
// keiner anderen hängt.
// ---------------------------------------------------------------

// Der Status, den die Verwaltung neben einem Bauvorhaben sieht. Er ist nichts
// Eigenes, sondern nur die Ampel in der Sprache einer Behörde.
function statusFuer(ampel) {
  if (ampel === "gruen") {
    return "Freigegeben";
  }
  if (ampel === "gelb") {
    return "Auflagen";
  }
  return "Abgelehnt";
}


// Zählt zusammen, wie ein Bezirk dasteht. "durchschnittPunkte" ist null, wenn
// dort gar nicht gebaut wird. Null heißt hier ausdrücklich "es gibt keinen
// Wert" und nicht "der Wert ist 0", das sind zwei verschiedene Aussagen.
function kennzahlenFuerBezirk(bezirk, alleBauvorhaben, alleMeldungen) {
  const vorhabenImBezirk = alleBauvorhaben.filter(function (vorhaben) {
    return vorhaben.bezirkKennung === bezirk.kennung;
  });

  const ergebnisse = vorhabenImBezirk.map(function (vorhaben) {
    return bewerte(vorhaben);
  });

  const punktesumme = ergebnisse.reduce(function (summe, ergebnis) {
    return summe + ergebnis.gesamtPunkte;
  }, 0);

  const meldungenImBezirk = alleMeldungen.filter(function (meldung) {
    return meldung.bezirkKennung === bezirk.kennung;
  });

  const freigegebene = ergebnisse.filter(function (ergebnis) {
    return ergebnis.ampel === "gruen";
  });

  return {
    schwelle: schwelleFuer(),
    anzahlBauvorhaben: vorhabenImBezirk.length,
    anzahlFreigegeben: freigegebene.length,
    anzahlMeldungen: meldungenImBezirk.length,
    durchschnittPunkte: vorhabenImBezirk.length === 0
      ? null
      : Math.round(punktesumme / vorhabenImBezirk.length)
  };
}


// ---------------------------------------------------------------
// 8. Kennzahlen für die Bürger-Ansicht
// ---------------------------------------------------------------

// Wie viele Meldungen ein Bezirk hat, umgerechnet auf eine Stufe von 0 bis 4.
// Die Karte färbt sich danach ein. Die Grenzen sind bewusst niedrig, weil in
// einer Vorführung nur ein paar Meldungen zusammenkommen.
function meldestufeFuer(anzahlMeldungen) {
  if (anzahlMeldungen === 0) {
    return 0;
  }
  if (anzahlMeldungen <= 2) {
    return 1;
  }
  if (anzahlMeldungen <= 5) {
    return 2;
  }
  if (anzahlMeldungen <= 9) {
    return 3;
  }
  return 4;
}


// Die Zahlen für die Kacheln oben im Bürger-Dashboard.
function ueberblickFuerBuerger(alleBezirke, alleBauvorhaben, alleMeldungen) {
  const geprueft = alleBauvorhaben.length;
  const freigegeben = alleBauvorhaben.filter(function (vorhaben) {
    return bewerte(vorhaben).ampel === "gruen";
  }).length;

  // Der Bezirk mit den meisten Meldungen. Gibt es keine Meldung, bleibt es
  // null und die Oberfläche zeigt einen Strich.
  let spitzenreiter = null;
  alleBezirke.forEach(function (bezirk) {
    const anzahl = alleMeldungen.filter(function (meldung) {
      return meldung.bezirkKennung === bezirk.kennung;
    }).length;

    if (anzahl > 0 && (!spitzenreiter || anzahl > spitzenreiter.anzahl)) {
      spitzenreiter = { bezirk: bezirk, anzahl: anzahl };
    }
  });

  return {
    anzahlMeldungen: alleMeldungen.length,
    anzahlGeprueft: geprueft,
    anzahlFreigegeben: freigegeben,
    spitzenreiter: spitzenreiter
  };
}


// ---------------------------------------------------------------
// 7. Ein neues Bauvorhaben prüfen
//
// Gibt eine Liste von Beanstandungen zurück. Ist sie leer, ist der Entwurf in
// Ordnung. Auch das ist reines Prüfen ohne Oberfläche und damit testbar.
// ---------------------------------------------------------------

function pruefeBauvorhaben(entwurf) {
  const beanstandungen = [];

  if (!entwurf.name) {
    beanstandungen.push("Der Name fehlt.");
  }
  if (!entwurf.bezirkKennung) {
    beanstandungen.push("Der Bezirk fehlt.");
  }
  if (!entwurf.gebaeudeart) {
    beanstandungen.push("Die Art des Gebäudes fehlt.");
  }

  // Alle vier Flächen müssen größer als null sein, und zwar auch die Freifläche.
  // Bei einer Freifläche von null hätte die Kategorie Verschattung keine
  // Bezugsfläche mehr. Eine Maßnahme würde dann null Quadratmeter verschatten,
  // null Euro kosten und trotzdem zehn Punkte bringen. Die Rechnung wäre an
  // dieser Stelle geschenkt, und das fällt in einer Vorführung auf.
  const flaechen = [
    { feld: "grundstuecksflaeche", name: "Die Grundstücksfläche" },
    { feld: "dachflaeche", name: "Die Dachfläche" },
    { feld: "fassadenflaeche", name: "Die Fassadenfläche" },
    { feld: "freiflaeche", name: "Die Freifläche" }
  ];

  flaechen.forEach(function (eintrag) {
    if (!(entwurf[eintrag.feld] > 0)) {
      beanstandungen.push(eintrag.name + " muss größer als null sein.");
    }
  });

  // Dach und Freifläche liegen beide auf dem Grundstück und können zusammen
  // nicht größer sein als es. Die Fassade zählt hier nicht mit, ein Haus mit
  // mehreren Geschossen hat mehr Fassade als Grundstück.
  const aufDemGrundstueck = entwurf.dachflaeche + entwurf.freiflaeche;
  if (aufDemGrundstueck > entwurf.grundstuecksflaeche) {
    beanstandungen.push("Dach und Freifläche sind zusammen größer als das Grundstück.");
  }

  return beanstandungen;
}
