// speicher.js
//
// Die einzige Datei, die etwas dauerhaft ablegt. Dasselbe Prinzip wie bei
// adresse.js: was das Gerät anfasst, steht an einer Stelle.
//
// Benutzt wird localStorage, ein kleiner Ablagekasten, den jeder Browser
// mitbringt. Er gehört zu dieser einen Seite auf diesem einen Gerät, hält ohne
// Verfallsdatum und braucht keinen Server. Es geht nichts ins Internet, alles
// bleibt auf dem Rechner.
//
// Gespeichert wird als JSON. Das ist Text, der aussieht wie die Listen in
// daten.js. JSON.stringify macht aus einer Liste diesen Text, JSON.parse macht
// aus dem Text wieder eine Liste.


// Unter diesem Namen liegen die Daten im Ablagekasten.
//
// ACHTUNG, nicht umbenennen. Der Schlüssel ist die Adresse der Daten im
// Browser. Wer ihn ändert, macht alles unerreichbar, was vorher darunter
// gespeichert wurde. Es sieht dann so aus, als wären die Bauvorhaben gelöscht,
// tatsächlich liegen sie nur unter einem Namen, nach dem niemand mehr fragt.
const SPEICHERSCHLUESSEL = "hitze-klimapass";


// Legt Bauvorhaben und Meldungen ab.
//
// Das Ganze steht in einem try, weil localStorage fehlschlagen kann: in einem
// privaten Fenster, bei abgeschaltetem Speichern, oder wenn der Platz voll ist.
// Schlägt es fehl, läuft die App einfach ohne Speichern weiter. Ein Prototyp,
// der wegen einer Browsereinstellung nicht startet, wäre schlimmer als einer,
// der nach dem Neuladen leer ist.
function speichere(alleBauvorhaben, alleMeldungen) {
  try {
    const inhalt = JSON.stringify({
      bauvorhaben: alleBauvorhaben,
      meldungen: alleMeldungen
    });
    localStorage.setItem(SPEICHERSCHLUESSEL, inhalt);
    return true;
  } catch (fehler) {
    return false;
  }
}


// Holt zurück, was beim letzten Mal abgelegt wurde.
// Ist nichts da oder ist der Text beschädigt, kommen zwei leere Listen zurück.
// Der Aufrufer muss deshalb nie prüfen, ob überhaupt etwas gespeichert war.
function ladeGespeichertes() {
  const leer = { bauvorhaben: [], meldungen: [] };

  try {
    const inhalt = localStorage.getItem(SPEICHERSCHLUESSEL);
    if (!inhalt) {
      return leer;
    }

    const gelesen = JSON.parse(inhalt);

    // Array.isArray prüft, ob wirklich eine Liste zurückkommt. Ohne diese
    // Prüfung könnte eine alte oder von Hand veränderte Ablage die App zum
    // Absturz bringen, sobald jemand darüber laufen will.
    return {
      bauvorhaben: Array.isArray(gelesen.bauvorhaben) ? gelesen.bauvorhaben : [],
      meldungen: Array.isArray(gelesen.meldungen) ? gelesen.meldungen : []
    };
  } catch (fehler) {
    return leer;
  }
}


// Wirft alles weg. Das ist der Knopf vor einer Vorführung, damit die Demo
// sauber startet und nicht mit den Testeingaben von gestern.
function leereSpeicher() {
  try {
    localStorage.removeItem(SPEICHERSCHLUESSEL);
    return true;
  } catch (fehler) {
    return false;
  }
}
