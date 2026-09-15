// pruefe-bewertung.js
//
// Selbsttest für bewertung.js, ohne Browser und ohne Oberfläche.
//
// Starten:
//   cd ~/Documents/Hitze-Klimapass
//   /System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc pruefe-bewertung.js
//
// jsc ist die JavaScript-Maschine, die in macOS schon eingebaut ist. Es muss also
// nichts nachinstalliert werden. "load" liest eine Datei ein, als stünde ihr
// Inhalt hier. Dass daten.js nicht geladen wird, ist Absicht: bewertung.js muss
// ohne die Demo-Daten auskommen, sonst prüft der Test die Daten mit und nicht
// nur die Rechnung.

load("bewertung.js");


// ---------------------------------------------------------------
// 1. Ein Testbauvorhaben
//
// Die Zahlen sind glatt gewählt, damit man die erwarteten Ergebnisse im Kopf
// nachrechnen kann: Ziel Regenrückhalt 3000/100·3 = 90 m³, Ziel Bäume
// ein Baum je 100 m² Freifläche, also 1200/100 = 12 Stück.
// ---------------------------------------------------------------

function testVorhaben(eingabe) {
  return {
    name: "Testbau",
    grundstuecksflaeche: 3000,
    dachflaeche: 1000,
    fassadenflaeche: 2000,
    freiflaeche: 1200,
    eingabe: eingabe
  };
}


const ohneMassnahmen = {
  unversiegelt: 0,
  dachbegruenung: 0,
  fassadenbegruenung: 0,
  verschattung: 0,
  helleMaterialien: 0,
  regenrueckhalt: 0,
  baeume: 0
};

const alleZielwerteErreicht = {
  unversiegelt: 50,
  dachbegruenung: 70,
  fassadenbegruenung: 40,
  verschattung: 60,
  helleMaterialien: 2,
  regenrueckhalt: 90,
  baeume: 12
};


// ---------------------------------------------------------------
// 2. Ein kleiner Prüfhelfer
//
// Er zählt Fehler mit, statt beim ersten Fehlschlag abzubrechen. So sieht man
// in einem Durchlauf alle Probleme auf einmal.
// ---------------------------------------------------------------

let fehlerZahl = 0;

function pruefe(beschreibung, erwartet, bekommen) {
  if (erwartet === bekommen) {
    print("  ok    " + beschreibung + " = " + bekommen);
    return;
  }
  fehlerZahl = fehlerZahl + 1;
  print("  FEHLER " + beschreibung + ": erwartet " + erwartet + ", bekommen " + bekommen);
}


// ---------------------------------------------------------------
// 3. Die Prüfungen
// ---------------------------------------------------------------

print("");
print("Punktzahl");

const ohne = bewerte(testVorhaben(ohneMassnahmen));
pruefe("Bauvorhaben ohne jede Maßnahme", 0, ohne.gesamtPunkte);

const voll = bewerte(testVorhaben(alleZielwerteErreicht));
pruefe("Bauvorhaben auf allen Zielwerten", 100, voll.gesamtPunkte);

print("");
print("Pflichtschwelle");

pruefe("gilt für ganz Berlin", 60, schwelleFuer());

print("");
print("Ampel");

pruefe("genau auf der Schwelle", "gruen", ampelFuer(60, 60));
pruefe("einen Punkt darunter", "gelb", ampelFuer(59, 60));
pruefe("zehn Punkte darunter", "gelb", ampelFuer(50, 60));
pruefe("elf Punkte darunter", "rot", ampelFuer(49, 60));

print("");
print("Einzelne Kategorien");

// Die Hälfte des Zielwerts muss die halbe Punktzahl geben.
const halb = bewerte(testVorhaben({
  unversiegelt: 25,
  dachbegruenung: 35,
  fassadenbegruenung: 0,
  verschattung: 0,
  helleMaterialien: 1,
  regenrueckhalt: 0,
  baeume: 0
}));
pruefe("Unversiegelt bei 25 statt 50 Prozent", 10, halb.kategorien[0].erreichtePunkte);
pruefe("Dachbegrünung bei 35 statt 70 Prozent", 10, halb.kategorien[1].erreichtePunkte);
pruefe("Helle Materialien auf teilweise", 5, halb.kategorien[4].erreichtePunkte);

// Über dem Zielwert darf es keine Extrapunkte geben.
const uebererfuellt = bewerte(testVorhaben({
  unversiegelt: 100,
  dachbegruenung: 100,
  fassadenbegruenung: 100,
  verschattung: 100,
  helleMaterialien: 2,
  regenrueckhalt: 500,
  baeume: 99
}));
pruefe("weit über allen Zielwerten", 100, uebererfuellt.gesamtPunkte);

print("");
print("Summe der Balken");

// Die sieben Balken müssen genau die große Zahl daneben ergeben, sonst rechnet
// die Vorführung vor Publikum falsch zusammen.
const beliebig = bewerte(testVorhaben({
  unversiegelt: 37,
  dachbegruenung: 41,
  fassadenbegruenung: 13,
  verschattung: 29,
  helleMaterialien: 1,
  regenrueckhalt: 53,
  baeume: 7
}));
const summeDerBalken = beliebig.kategorien.reduce(function (summe, kategorie) {
  return summe + kategorie.erreichtePunkte;
}, 0);
pruefe("Balken zusammengezählt", beliebig.gesamtPunkte, summeDerBalken);


print("");
print("Status für die Verwaltung");

pruefe("grün", "Freigegeben", statusFuer("gruen"));
pruefe("gelb", "Auflagen", statusFuer("gelb"));
pruefe("rot", "Abgelehnt", statusFuer("rot"));

print("");
print("Kennzahlen je Bezirk");

// Zwei Bauvorhaben im selben Bezirk: eins auf allen Zielwerten, eins ohne jede
// Maßnahme. Der Durchschnitt muss also 50 sein.
const testBezirk = { kennung: "testbezirk", name: "Testbezirk" };
const leererBezirk = { kennung: "leerer-bezirk", name: "Leerer Bezirk" };

const zweiVorhaben = [
  Object.assign(testVorhaben(alleZielwerteErreicht), { bezirkKennung: "testbezirk" }),
  Object.assign(testVorhaben(ohneMassnahmen), { bezirkKennung: "testbezirk" })
];
const zweiMeldungen = [
  { bezirkKennung: "testbezirk" },
  { bezirkKennung: "anderer-bezirk" }
];

const kennzahlen = kennzahlenFuerBezirk(testBezirk, zweiVorhaben, zweiMeldungen);
pruefe("Bauvorhaben im Bezirk", 2, kennzahlen.anzahlBauvorhaben);
pruefe("Durchschnitt aus 100 und 0", 50, kennzahlen.durchschnittPunkte);
pruefe("davon freigegeben", 1, kennzahlen.anzahlFreigegeben);
pruefe("Meldungen im Bezirk", 1, kennzahlen.anzahlMeldungen);
pruefe("Schwelle des Bezirkes", 60, kennzahlen.schwelle);

// Ein Bezirk ohne Bauvorhaben darf keinen Durchschnitt von 0 melden, sondern gar
// keinen. Sonst stünde im Dashboard eine Null, die niemand gebaut hat.
const leer = kennzahlenFuerBezirk(leererBezirk, zweiVorhaben, zweiMeldungen);
pruefe("Bezirk ohne Bauvorhaben, Anzahl", 0, leer.anzahlBauvorhaben);
pruefe("Bezirk ohne Bauvorhaben, Durchschnitt", null, leer.durchschnittPunkte);


print("");
print("Neues Bauvorhaben prüfen");

function entwurf(aenderungen) {
  const grund = {
    name: "Neubau",
    bezirkKennung: "testbezirk",
    gebaeudeart: "wohngebaeude",
    grundstuecksflaeche: 2000,
    dachflaeche: 800,
    fassadenflaeche: 2500,
    freiflaeche: 700
  };
  return Object.assign(grund, aenderungen);
}

pruefe("sauberer Entwurf", 0, pruefeBauvorhaben(entwurf({})).length);
pruefe("ohne Namen", 1, pruefeBauvorhaben(entwurf({ name: "" })).length);
pruefe("ohne Bezirk", 1, pruefeBauvorhaben(entwurf({ bezirkKennung: "" })).length);
pruefe("ohne Gebäudeart", 1, pruefeBauvorhaben(entwurf({ gebaeudeart: "" })).length);
pruefe("Freifläche null", 1, pruefeBauvorhaben(entwurf({ freiflaeche: 0 })).length);
pruefe("Dach und Freifläche zu groß", 1,
  pruefeBauvorhaben(entwurf({ dachflaeche: 1500, freiflaeche: 1000 })).length);
pruefe("Fassade größer als Grundstück ist erlaubt", 0,
  pruefeBauvorhaben(entwurf({ fassadenflaeche: 9000 })).length);


print("");
print("Meldestufe für die Karte");

pruefe("keine Meldung", 0, meldestufeFuer(0));
pruefe("eine Meldung", 1, meldestufeFuer(1));
pruefe("drei Meldungen", 2, meldestufeFuer(3));
pruefe("sieben Meldungen", 3, meldestufeFuer(7));
pruefe("zwanzig Meldungen", 4, meldestufeFuer(20));

print("");
print("Überblick für die Bürger-Ansicht");

const dreiBezirke = [testBezirk, leererBezirk];
const vieleMeldungen = [
  { bezirkKennung: "testbezirk" },
  { bezirkKennung: "testbezirk" },
  { bezirkKennung: "leerer-bezirk" }
];
const ueberblick = ueberblickFuerBuerger(dreiBezirke, zweiVorhaben, vieleMeldungen);
pruefe("Meldungen gesamt", 3, ueberblick.anzahlMeldungen);
pruefe("geprüfte Gebäude", 2, ueberblick.anzahlGeprueft);
pruefe("davon freigegeben", 1, ueberblick.anzahlFreigegeben);
pruefe("Bezirk mit den meisten Meldungen", "Testbezirk", ueberblick.spitzenreiter.bezirk.name);

// Ohne Meldung darf kein Bezirk als Spitzenreiter gelten. Sonst stünde dort
// ein Name, obwohl niemand etwas gemeldet hat.
const ohneMeldung = ueberblickFuerBuerger(dreiBezirke, zweiVorhaben, []);
pruefe("kein Spitzenreiter ohne Meldung", null, ohneMeldung.spitzenreiter);


print("");
print("Vom Fragebogen zu den Kategorien");

const bau = testVorhaben({});

// Die schlechteste Ausstattung muss überall null ergeben.
const schlecht = leiteEingabeAb(bau, leereAntworten());
pruefe("alles befestigt, keine Bäume: unversiegelt", 0, schlecht.unversiegelt);
pruefe("alles befestigt, keine Bäume: Verschattung", 0, schlecht.verschattung);
pruefe("alles befestigt, keine Bäume: helle Materialien", 0, schlecht.helleMaterialien);
pruefe("alles befestigt, keine Bäume: Regenrückhalt", 0, schlecht.regenrueckhalt);
pruefe("alles befestigt, keine Bäume: Gesamtpunkte", 0,
  bewerte(Object.assign({}, bau, { eingabe: schlecht })).gesamtPunkte);

// Volle Ausstattung: 1200 m² grüne Freifläche von 3000 m² Grundstück sind
// 40 % unversiegelt, mehr geht auf diesem Grundstück nicht.
const beste = Object.assign(leereAntworten(), {
  gruenanteil: 100, belag: "kies", innenhof: true, baeume: 12,
  kronengroesse: "gross", dachbegruenung: 100, dachbegruenungArt: "intensiv",
  dachHell: true, retentionsdach: true, fassadenbegruenung: 100,
  fassadenbegruenungArt: "wandgebunden", fassadeHell: true, zisterne: 100,
  versickerung: true
});
const gut = leiteEingabeAb(bau, beste);
pruefe("ganz grüne Freifläche: unversiegelt in Prozent des Grundstücks", 40, gut.unversiegelt);

// Halb grün, halb Asphalt: 600 m² von 3000 m² Grundstück sind 20 %.
const halbGruen = leiteEingabeAb(bau, Object.assign(leereAntworten(), { gruenanteil: 50 }));
pruefe("halb grün, Rest Asphalt", 20, halbGruen.unversiegelt);
pruefe("Verschattung gedeckelt bei 100", 100, gut.verschattung);
pruefe("Dach, Fassade, Belag hell: Stufe 2", 2, gut.helleMaterialien);
pruefe("zwölf Bäume im Innenhof zählen wie achtzehn", 18, gut.baeume);
pruefe("Zisterne plus Retentionsdach plus Versickerung", 100 + 30 + 24, gut.regenrueckhalt);

// Der Innenhof macht den Unterschied bei gleicher Baumzahl.
const ohneHof = leiteEingabeAb(bau, Object.assign(leereAntworten(), { baeume: 4, kronengroesse: "mittel" }));
const mitHof = leiteEingabeAb(bau, Object.assign(leereAntworten(), { baeume: 4, kronengroesse: "mittel", innenhof: true }));
pruefe("vier Bäume ohne Hof", 4, ohneHof.baeume);
pruefe("vier Bäume mit Hof", 6, mitHof.baeume);
pruefe("Schatten von vier mittleren Bäumen auf 1200 m²", 12, ohneHof.verschattung);
pruefe("derselbe Schatten im Innenhof", 18, mitHof.verschattung);

// Geneigtes Dach: mehr als 30 Prozent Begrünung zählen nicht.
const steil = leiteEingabeAb(bau, Object.assign(leereAntworten(), { dachform: "geneigt", dachbegruenung: 80 }));
pruefe("geneigtes Dach deckelt die Begrünung", 30, steil.dachbegruenung);

// Rasengitter statt Asphalt macht aus einer befestigten Fläche eine halb
// durchlässige. 1200 m² Freifläche mal 0,5 sind 600 m², also 20 % vom Grundstück.
const gitter = leiteEingabeAb(bau, Object.assign(leereAntworten(), { belag: "rasengitter" }));
pruefe("Rasengitter auf befestigter Fläche", 20, gitter.unversiegelt);

// Das Baumziel richtet sich nach der Freifläche, nicht nach dem Grundstück.
pruefe("Baumziel bei 1200 m² Freifläche", 12, zielwertFuer(bau, findeKategorie("baeume")));
pruefe("Baumziel bei winziger Freifläche mindestens eins", 1,
  zielwertFuer(Object.assign({}, bau, { freiflaeche: 40 }), findeKategorie("baeume")));


// ---------------------------------------------------------------
// 4. Ergebnis
// ---------------------------------------------------------------

print("");
if (fehlerZahl === 0) {
  print("Alles in Ordnung.");
} else {
  print(fehlerZahl + " Fehler.");
}
print("");
