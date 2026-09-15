// adresse.js
//
// Die einzige Datei, die das Internet anfasst. Sie schickt eine eingetippte
// Adresse an Nominatim und bekommt zurück, in welchem Berliner Bezirk sie liegt.
//
// Alles Netz an einer Stelle zu bündeln ist dieselbe Idee wie bei bewertung.js:
// wer wissen will, was dieses Projekt nach draußen sendet, muss genau eine
// Datei lesen. app.js ruft hier an und bekommt ein fertiges Ergebnis.
//
// WAS NACH DRAUSSEN GEHT: die eingetippte Adresse, im Klartext, an den Server
// von OpenStreetMap. Das ist keine Kleinigkeit und gehört in der Präsentation
// erwähnt, wenn die Frage nach Datenschutz kommt. Für ein echtes Produkt wäre
// der richtige Weg der Geodienst des Landes Berlin.
//
// Nominatim ist der Adresssuchdienst von OpenStreetMap. Er ist kostenlos und
// verlangt keine Anmeldung, bittet aber um höchstens eine Anfrage je Sekunde.
// Deshalb wird hier nur auf Knopfdruck gesucht und nicht bei jedem Tastendruck.


// Die Adresse des Dienstes. Steht hier oben, damit man sie an einer Stelle
// austauschen kann, falls später der Berliner Geodienst genommen wird.
const NOMINATIM_ADRESSE = "https://nominatim.openstreetmap.org/search";


// Baut die vollständige Abfrageadresse.
// "format=jsonv2" bestimmt die Form der Antwort, "addressdetails=1" liefert die
// Adresse zerlegt in ihre Bestandteile, und darin steckt das Feld mit dem
// Bezirk. "countrycodes=de" und der angehängte Ort grenzen die Suche ein,
// sonst findet "Hauptstraße 1" irgendetwas in ganz Deutschland.
function baueAbfrage(eingetippteAdresse) {
  const merkmale = new URLSearchParams({
    q: eingetippteAdresse + ", Berlin",
    format: "jsonv2",
    addressdetails: "1",
    countrycodes: "de",
    limit: "1"
  });
  return NOMINATIM_ADRESSE + "?" + merkmale.toString();
}


// Holt den Bezirksnamen aus der zerlegten Adresse.
// Nominatim legt ihn je nach Adresse in ein anderes Feld, deshalb werden
// mehrere der Reihe nach probiert. "borough" ist bei Berliner Adressen das
// zuverlässigste und steht deshalb vorn.
function lieseBezirksnamen(zerlegteAdresse) {
  const moeglicheFelder = ["borough", "city_district", "suburb", "district"];

  for (const feld of moeglicheFelder) {
    if (zerlegteAdresse[feld]) {
      return zerlegteAdresse[feld];
    }
  }
  return null;
}


// Sucht zu einem Bezirksnamen aus der Antwort den passenden Eintrag in der
// Liste aus daten.js. Verglichen wird kleingeschrieben, damit "Neukölln" und
// "neukölln" dasselbe finden.
function findeBezirkNachNamen(bezirksname, alleBezirke) {
  if (!bezirksname) {
    return null;
  }
  const gesucht = bezirksname.toLowerCase();

  const treffer = alleBezirke.find(function (bezirk) {
    return bezirk.name.toLowerCase() === gesucht;
  });

  return treffer || null;
}


// Der eigentliche Aufruf.
//
// "async" heißt: diese Funktion braucht Zeit und gibt ein Versprechen zurück.
// Der Browser läuft währenddessen weiter, die Seite friert nicht ein. "await"
// hält an dieser einen Zeile an, bis die Antwort da ist.
//
// Zurück kommt immer ein Objekt mit dem Feld "erfolg". Das ist Absicht: der
// Aufrufer muss nie zwischen Rückgabewert und Fehlerfall unterscheiden, er
// schaut nur in dieses eine Feld.
async function sucheBezirkZuAdresse(eingetippteAdresse, alleBezirke) {
  const sauber = eingetippteAdresse.trim();

  if (!sauber) {
    return { erfolg: false, grund: "Bitte eine Adresse eintragen." };
  }

  let antwort;
  try {
    antwort = await fetch(baueAbfrage(sauber), {
      headers: { "Accept-Language": "de" }
    });
  } catch (fehler) {
    // Hier landet man ohne Internet. Der Browser wirft dann einen Fehler,
    // statt eine Antwort zu liefern.
    return { erfolg: false, grund: "Keine Verbindung zum Adressdienst." };
  }

  if (!antwort.ok) {
    return { erfolg: false, grund: "Der Adressdienst antwortet gerade nicht." };
  }

  const treffer = await antwort.json();

  if (treffer.length === 0) {
    return { erfolg: false, grund: "Diese Adresse wurde in Berlin nicht gefunden." };
  }

  const gefunden = treffer[0];
  const bezirksname = lieseBezirksnamen(gefunden.address || {});
  const bezirk = findeBezirkNachNamen(bezirksname, alleBezirke);

  if (!bezirk) {
    return {
      erfolg: false,
      grund: "Die Adresse liegt offenbar nicht in einem Berliner Bezirk."
    };
  }

  return {
    erfolg: true,
    bezirk: bezirk,
    // Was der Dienst tatsächlich gefunden hat. Das wird in der Oberfläche
    // angezeigt, damit man merkt, wenn er etwas anderes verstanden hat als
    // gemeint war. Bei einer Straße ohne Hausnummer trifft er gelegentlich
    // den falschen Abschnitt.
    gefundeneAdresse: gefunden.display_name
  };
}
