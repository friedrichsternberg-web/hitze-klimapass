// skizze.js
//
// Zeichnet aus den Antworten des Fragebogens eine Skizze des Bauvorhabens als
// SVG. Sie ist ein Schema und kein Bauplan: Die Breite des Gebäudes kommt aus
// dem Verhältnis von Dach- zu Freifläche, die Zahl der Geschosse aus dem
// Verhältnis von Fassade zu Dach, alles Übrige direkt aus den Antworten.
// Ändert sich eine Antwort, wird neu gezeichnet, und jede Antwort soll im Bild
// sichtbar etwas verändern.
//
// Diese Datei fasst die Seite nicht an, sie gibt nur Text zurück. app.js setzt
// den Text an die passende Stelle. Farben stehen in design.css und werden über
// Klassen zugewiesen, deshalb steht hier keine einzige Farbe.
//
// Das Zeichenfeld ist 360 breit und 230 hoch. Der Boden liegt bei 170,
// darunter ist Platz für Zisterne und Versickerung, darüber für die Sonne.

const SKIZZE_BREITE = 360;
const SKIZZE_HOEHE = 230;
const SKIZZE_BODEN = 170;
const SKIZZE_RAND = 20;
const SKIZZE_GESCHOSSHOEHE = 20;

// Wie groß eine Baumkrone gezeichnet wird, je Kronengröße.
const KRONENRADIUS = { klein: 7, mittel: 10, gross: 14 };

// Mehr Bäume als das passen nicht ins Bild, die Zahl steht dann daneben.
const HOECHSTENS_BAEUME = 9;


// Begrenzt eine Zahl auf einen Bereich. Kommt hier oft vor.
function begrenze(wert, kleinster, groesster) {
  return Math.min(groesster, Math.max(kleinster, wert));
}


// Die Maße des Gebäudes, aus den Flächen abgeleitet.
function skizzenmasse(vorhaben) {
  const dach = Math.max(1, vorhaben.dachflaeche);
  const frei = Math.max(0, vorhaben.freiflaeche);
  const gesamt = SKIZZE_BREITE - 2 * SKIZZE_RAND;

  const dachanteil = begrenze(dach / (dach + frei), 0.2, 0.7);
  const gebaeudeBreite = Math.round(gesamt * dachanteil);
  const freiBreite = gesamt - gebaeudeBreite;

  // Der Umfang eines quadratischen Gebäudes mit dieser Dachfläche, daraus die
  // Geschosse bei 3,2 Metern Höhe je Geschoss.
  const umfang = 4 * Math.sqrt(dach);
  const geschosse = begrenze(Math.round(vorhaben.fassadenflaeche / (umfang * 3.2)), 1, 6);

  // Das Gebäude steht etwas rechts der Mitte, links ist mehr Freifläche.
  const linksFrei = Math.round(freiBreite * 0.55);
  const gebaeudeX = SKIZZE_RAND + linksFrei;
  const hofBreite = Math.round(begrenze(gebaeudeBreite * 0.4, 34, 80));

  return {
    gebaeudeX: gebaeudeX,
    gebaeudeBreite: gebaeudeBreite,
    gebaeudeHoehe: geschosse * SKIZZE_GESCHOSSHOEHE + 8,
    geschosse: geschosse,
    linksFrei: linksFrei,
    rechtsFrei: freiBreite - linksFrei,
    rechtsX: gebaeudeX + gebaeudeBreite,
    hofBreite: hofBreite,
    hofX: gebaeudeX + Math.round((gebaeudeBreite - hofBreite) / 2)
  };
}


// ---------------------------------------------------------------
// Himmel, Boden, Hitze
// ---------------------------------------------------------------

// Die Sonne oben links. Sie steht immer da, es geht ja um Hitze.
function zeichneSonne() {
  let strahlen = "";
  for (let winkel = 0; winkel < 360; winkel = winkel + 45) {
    const bogen = winkel * Math.PI / 180;
    const x1 = 40 + Math.cos(bogen) * 16, y1 = 34 + Math.sin(bogen) * 16;
    const x2 = 40 + Math.cos(bogen) * 22, y2 = 34 + Math.sin(bogen) * 22;
    strahlen = strahlen + `<path class="skizze-strahl" d="M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}"></path>`;
  }
  return `<circle class="skizze-sonne" cx="40" cy="34" r="11"></circle>${strahlen}`;
}


// Flimmernde Luft über einer heißen Fläche: drei Wellen nebeneinander.
// Erscheint über dunklem Asphalt und über einem dunklen, unbegrünten Dach und
// verschwindet, sobald die Fläche hell oder grün ist. Das ist die sichtbarste
// Antwort auf "helle Materialien".
function zeichneHitzeflimmern(x, breite, y) {
  if (breite < 24) {
    return "";
  }
  let teile = "";
  for (let wx = x + 8; wx + 14 < x + breite; wx = wx + 22) {
    teile = teile + `<path class="skizze-hitze" d="M${wx} ${y}q3 -5 6 0t6 0"></path>
                     <path class="skizze-hitze" d="M${wx + 2} ${y - 8}q3 -5 6 0t6 0"></path>`;
  }
  return teile;
}


// Das Muster eines befestigten Bodens: Pflaster mit versetzten Fugen,
// Rasengitter mit Kammern und Gras darin, Kies mit Körnern, Asphalt glatt.
function zeichneBelagmuster(x, breite, belag) {
  if (breite < 6) {
    return "";
  }
  let teile = "";
  if (belag === "pflaster") {
    for (let fx = x + 6; fx < x + breite; fx = fx + 12) {
      teile = teile + `<path class="skizze-fuge" d="M${fx} ${SKIZZE_BODEN}v5M${fx + 6} ${SKIZZE_BODEN + 5}v5"></path>`;
    }
    teile = teile + `<path class="skizze-fuge" d="M${x} ${SKIZZE_BODEN + 5}h${breite}"></path>`;
  } else if (belag === "rasengitter") {
    for (let fx = x + 2; fx + 6 < x + breite; fx = fx + 8) {
      teile = teile + `<rect class="skizze-gruen" x="${fx}" y="${SKIZZE_BODEN + 2}" width="4" height="6" rx="1"></rect>`;
    }
  } else if (belag === "kies") {
    for (let fx = x + 3; fx < x + breite - 2; fx = fx + 6) {
      const versatz = (fx % 12 === 3) ? 2 : 6;
      teile = teile + `<circle class="skizze-korn" cx="${fx}" cy="${SKIZZE_BODEN + versatz}" r="1.4"></circle>`;
    }
  }
  return teile;
}


// Gras auf dem grünen Boden: kleine Büschel.
function zeichneGras(x, breite) {
  let teile = "";
  for (let gx = x + 4; gx + 4 < x + breite; gx = gx + 9) {
    teile = teile + `<path class="skizze-gras" d="M${gx} ${SKIZZE_BODEN + 1}l2 -6l2 6M${gx + 2} ${SKIZZE_BODEN - 5}v-3"></path>`;
  }
  return teile;
}


// Der Boden: befestigt in der Farbe des Belags mit seinem Muster, darüber der
// grüne Anteil mit Gras. Die Freifläche liegt links und rechts vom Gebäude,
// der grüne Teil wird von links aufgefüllt.
function zeichneSkizzenboden(masse, antworten) {
  const belag = antworten.belag || "asphalt";
  const gruen = begrenze(antworten.gruenanteil, 0, 100) / 100;
  const gruenBreite = Math.round((masse.linksFrei + masse.rechtsFrei) * gruen);
  const gruenLinks = Math.min(gruenBreite, masse.linksFrei);
  const gruenRechts = gruenBreite - gruenLinks;

  const felder = [
    { x: SKIZZE_RAND, breite: masse.linksFrei, gruen: gruenLinks },
    { x: masse.rechtsX, breite: masse.rechtsFrei, gruen: gruenRechts }
  ];

  let teile = "";
  felder.forEach(function (feld) {
    if (feld.breite <= 0) {
      return;
    }
    teile = teile + `<rect class="skizze-befestigt skizze-belag-${belag}" x="${feld.x}" y="${SKIZZE_BODEN}" width="${feld.breite}" height="10"></rect>`;
    const befestigtX = feld.x + feld.gruen;
    teile = teile + zeichneBelagmuster(befestigtX, feld.breite - feld.gruen, belag);
    if (belag === "asphalt") {
      teile = teile + zeichneHitzeflimmern(befestigtX, feld.breite - feld.gruen, SKIZZE_BODEN - 6);
    }
    if (feld.gruen > 0) {
      teile = teile + `<rect class="skizze-gruen" x="${feld.x}" y="${SKIZZE_BODEN}" width="${feld.gruen}" height="10" rx="2"></rect>`
        + zeichneGras(feld.x, feld.gruen);
    }
  });

  return teile + `<path class="skizze-bodenlinie" d="M${SKIZZE_RAND} ${SKIZZE_BODEN}h${SKIZZE_BREITE - 2 * SKIZZE_RAND}"></path>`;
}


// ---------------------------------------------------------------
// Das Gebäude
// ---------------------------------------------------------------

// Fenster eines Geschosses je nach Gebäudeart. Wohnen kleine Fenster mit
// Fensterbank und Balkonen, Büro breite Glasbänder mit Sprossen, öffentlich
// hohe Fenster. Die Zahl ergibt sich aus der Breite.
function zeichneFensterreihe(x, breite, y, gebaeudeart, geschoss) {
  const breit = gebaeudeart === "buero" || gebaeudeart === "oeffentlich";
  const fensterBreite = breit ? 12 : 7;
  const fensterHoehe = breit ? 10 : 9;
  const abstand = breit ? 16 : 14;
  let teile = "";

  for (let fx = x + 6; fx + fensterBreite < x + breite - 4; fx = fx + abstand) {
    teile = teile + `<rect class="skizze-fenster" x="${fx}" y="${y}" width="${fensterBreite}" height="${fensterHoehe}" rx="1"></rect>`;
    if (breit) {
      teile = teile + `<path class="skizze-sprosse" d="M${fx + fensterBreite / 2} ${y}v${fensterHoehe}"></path>`;
    } else {
      teile = teile + `<path class="skizze-sims" d="M${fx - 1} ${y + fensterHoehe}h${fensterBreite + 2}"></path>`;
    }
    // Wohnhäuser bekommen an jedem zweiten Fenster einen Balkon.
    if (gebaeudeart === "wohngebaeude" && geschoss > 0 && ((fx - x) / abstand) % 2 === 1) {
      teile = teile + `<rect class="skizze-balkon" x="${fx - 3}" y="${y + fensterHoehe}" width="${fensterBreite + 6}" height="3"></rect>
                       <path class="skizze-gelaender" d="M${fx - 3} ${y + fensterHoehe - 4}h${fensterBreite + 6}M${fx} ${y + fensterHoehe - 4}v4M${fx + fensterBreite} ${y + fensterHoehe - 4}v4"></path>`;
    }
  }
  return teile;
}


// Das Erdgeschoss, das sich je Gebäudeart am stärksten unterscheidet:
// Schaufenster mit gestreifter Markise, Säulenreihe, Tor, oder Fenster mit Tür.
function zeichneErdgeschoss(x, breite, y, gebaeudeart) {
  const mitte = x + breite / 2;

  if (gebaeudeart === "handel" || gebaeudeart === "gemischt") {
    let streifen = "";
    for (let sx = x + 3; sx < x + breite - 3; sx = sx + 8) {
      streifen = streifen + `<rect class="skizze-markise" x="${sx}" y="${y - 4}" width="4" height="4"></rect>`;
    }
    return `<rect class="skizze-glas" x="${x + 4}" y="${y}" width="${breite - 8}" height="12" rx="1"></rect>
            <rect class="skizze-markisenkante" x="${x + 3}" y="${y - 4}" width="${breite - 6}" height="4"></rect>${streifen}
            <rect class="skizze-tuer" x="${mitte - 4}" y="${y + 2}" width="8" height="10"></rect>`;
  }
  if (gebaeudeart === "oeffentlich") {
    let saeulen = "";
    for (let sx = x + 7; sx < x + breite - 6; sx = sx + 13) {
      saeulen = saeulen + `<rect class="skizze-saeule" x="${sx}" y="${y - 3}" width="4" height="16"></rect>`;
    }
    return `<rect class="skizze-tuer" x="${mitte - 6}" y="${y}" width="12" height="13"></rect>${saeulen}
            <path class="skizze-sims" d="M${x + 3} ${y - 3}h${breite - 6}"></path>`;
  }
  if (gebaeudeart === "gewerbe") {
    return `<rect class="skizze-tor" x="${mitte - 12}" y="${y - 3}" width="24" height="16" rx="1"></rect>
            <path class="skizze-torlinie" d="M${mitte - 12} ${y + 2}h24M${mitte - 12} ${y + 7}h24"></path>`;
  }
  return zeichneFensterreihe(x, breite, y, gebaeudeart, 0)
    + `<rect class="skizze-tuer" x="${mitte - 4}" y="${y}" width="8" height="13" rx="1"></rect>`;
}


// Ranken an der Fassade. Kletterpflanzen aus dem Boden wachsen als Welle mit
// Blättern an der Kante hoch. Ein Wandsystem ist ein dichtes Feld aus Blättern.
function zeichneRanken(x, breite, hoehe, antworten) {
  const anteil = begrenze(antworten.fassadenbegruenung, 0, 100) / 100;
  if (anteil <= 0) {
    return "";
  }
  const bewuchs = hoehe * anteil;
  const oben = SKIZZE_BODEN - bewuchs;
  let teile = "";

  if (antworten.fassadenbegruenungArt === "wandgebunden") {
    const kanten = [x + 2, x + breite - 16];
    if (breite > 96) {
      kanten.push(x + breite / 2 - 7);
    }
    kanten.forEach(function (kx) {
      teile = teile + `<rect class="skizze-wandgruen" x="${kx}" y="${oben}" width="14" height="${bewuchs}" rx="2"></rect>`;
      for (let by = SKIZZE_BODEN - 4; by > oben + 2; by = by - 6) {
        teile = teile + `<circle class="skizze-blatt" cx="${kx + 4}" cy="${by}" r="2"></circle>
                         <circle class="skizze-blatt dunkel" cx="${kx + 10}" cy="${by - 3}" r="2"></circle>`;
      }
    });
    return teile;
  }

  [x + 4, x + breite - 4].forEach(function (kx, seite) {
    const richtung = seite === 0 ? 1 : -1;
    let pfad = `M${kx} ${SKIZZE_BODEN}`;
    for (let py = SKIZZE_BODEN; py > oben; py = py - 10) {
      pfad = pfad + `q${3 * richtung} -5 0 -10`;
    }
    teile = teile + `<path class="skizze-ranke" d="${pfad}"></path>`;
    for (let by = SKIZZE_BODEN - 6; by > oben; by = by - 8) {
      const seitlich = ((SKIZZE_BODEN - by) / 8) % 2 === 0 ? 4 : -3;
      teile = teile + `<ellipse class="skizze-blatt" cx="${kx + seitlich * richtung}" cy="${by}" rx="3.5" ry="2.2" transform="rotate(${-30 * richtung} ${kx + seitlich * richtung} ${by})"></ellipse>`;
    }
  });
  return teile;
}


// Die Begrünung auf dem Dach. Extensiv ist ein flacher Teppich mit kleinen
// Polstern, intensiv sind Sträucher mit runden Kronen.
function zeichneDachgruen(x, breite, oben, antworten) {
  const anteil = begrenze(antworten.dachbegruenung, 0, 100) / 100;
  if (anteil <= 0) {
    return "";
  }
  const intensiv = antworten.dachbegruenungArt === "intensiv";
  const gruenBreite = breite * anteil;
  let teile = `<rect class="skizze-gruen" x="${x}" y="${oben - 5}" width="${gruenBreite}" height="5" rx="2"></rect>`;

  if (intensiv) {
    for (let bx = x + 6; bx + 4 < x + gruenBreite; bx = bx + 11) {
      teile = teile + `<circle class="skizze-blatt dunkel" cx="${bx}" cy="${oben - 9}" r="4.5"></circle>
                       <circle class="skizze-blatt" cx="${bx + 4}" cy="${oben - 7}" r="3"></circle>`;
    }
  } else {
    for (let bx = x + 4; bx + 3 < x + gruenBreite; bx = bx + 7) {
      teile = teile + `<path class="skizze-polster" d="M${bx} ${oben - 5}q2 -4 4 0"></path>`;
    }
  }
  return teile;
}


// Ein Gebäudeflügel: Wand, Fenster, Dach, Begrünung, Hitze über dunklem Dach.
// Der Innenhof besteht aus zwei solchen Flügeln mit Lücke dazwischen.
function zeichneSkizzenfluegel(x, breite, masse, antworten, gebaeudeart) {
  const oben = SKIZZE_BODEN - masse.gebaeudeHoehe;
  const wandklasse = antworten.fassadeHell ? "skizze-wand hell" : "skizze-wand";
  const dachklasse = antworten.dachHell ? "skizze-dach hell" : "skizze-dach";
  let teile = `<rect class="${wandklasse}" x="${x}" y="${oben}" width="${breite}" height="${masse.gebaeudeHoehe}"></rect>`;

  for (let geschoss = 0; geschoss < masse.geschosse; geschoss = geschoss + 1) {
    const y = SKIZZE_BODEN - (geschoss + 1) * SKIZZE_GESCHOSSHOEHE + 6;
    teile = teile + (geschoss === 0
      ? zeichneErdgeschoss(x, breite, y, gebaeudeart)
      : zeichneFensterreihe(x, breite, y, gebaeudeart, geschoss));
  }

  if (antworten.dachform === "geneigt") {
    const first = oben - 24;
    teile = teile + `<polygon class="${dachklasse}" points="${x - 4},${oben} ${x + breite / 2},${first} ${x + breite + 4},${oben}"></polygon>
                     <path class="skizze-first" d="M${x - 4} ${oben}L${x + breite / 2} ${first}L${x + breite + 4} ${oben}"></path>`;
    // Auf dem geneigten Dach zählt höchstens ein knappes Drittel, gezeichnet
    // wird der begrünte Teil als Keil an der linken Traufe, mit Polstern.
    const anteil = Math.min(begrenze(antworten.dachbegruenung, 0, 100) / 100, 0.3) / 0.3;
    if (anteil > 0) {
      const spitzeX = x - 4 + (breite / 2 + 4) * anteil;
      const spitzeY = oben - 24 * anteil;
      teile = teile + `<polygon class="skizze-gruen" points="${x - 4},${oben} ${spitzeX},${spitzeY} ${spitzeX},${oben}"></polygon>`;
      for (let t = 0.15; t < anteil; t = t + 0.2) {
        teile = teile + `<circle class="skizze-blatt" cx="${x - 4 + (breite / 2 + 4) * t}" cy="${oben - 24 * t - 2}" r="2.2"></circle>`;
      }
    } else if (!antworten.dachHell) {
      teile = teile + zeichneHitzeflimmern(x, breite, first - 6);
    }
  } else {
    teile = teile + `<rect class="${dachklasse}" x="${x - 4}" y="${oben - 6}" width="${breite + 8}" height="6" rx="1"></rect>`;
    if (antworten.retentionsdach) {
      teile = teile + `<rect class="skizze-wasser" x="${x - 4}" y="${oben - 3}" width="${breite + 8}" height="3"></rect>
                       <path class="skizze-rohr" d="M${x + breite + 4} ${oben - 2}h4v6"></path>`;
    }
    if (gebaeudeart === "gewerbe") {
      for (let sx = x + 8; sx + 8 < x + breite; sx = sx + 18) {
        teile = teile + `<rect class="skizze-fenster" x="${sx}" y="${oben - 10}" width="8" height="4"></rect>`;
      }
    }
    teile = teile + zeichneDachgruen(x - 4, breite + 8, oben - 6, antworten);
    if (!antworten.dachHell && antworten.dachbegruenung < 50) {
      teile = teile + zeichneHitzeflimmern(x + (breite + 8) * begrenze(antworten.dachbegruenung, 0, 100) / 100, breite * (1 - begrenze(antworten.dachbegruenung, 0, 100) / 100), oben - 14);
    }
  }

  return teile + zeichneRanken(x, breite, masse.gebaeudeHoehe, antworten);
}


// Das ganze Gebäude: ein Block, oder bei einem Innenhof zwei Flügel mit einem
// niedrigeren Rückgebäude dazwischen, dessen Hof grün ist.
function zeichneSkizzengebaeude(masse, antworten, gebaeudeart) {
  if (!antworten.innenhof) {
    return zeichneSkizzenfluegel(masse.gebaeudeX, masse.gebaeudeBreite, masse, antworten, gebaeudeart);
  }
  const fluegelBreite = masse.hofX - masse.gebaeudeX;
  const rueckHoehe = Math.round(masse.gebaeudeHoehe * 0.5);
  let fenster = "";
  for (let fx = masse.hofX + 6; fx + 6 < masse.hofX + masse.hofBreite - 4; fx = fx + 13) {
    fenster = fenster + `<rect class="skizze-fenster hinten" x="${fx}" y="${SKIZZE_BODEN - rueckHoehe + 6}" width="6" height="7" rx="1"></rect>`;
  }

  return `
    <rect class="skizze-wand hinten" x="${masse.hofX}" y="${SKIZZE_BODEN - rueckHoehe}" width="${masse.hofBreite}" height="${rueckHoehe}"></rect>
    ${fenster}
    <rect class="skizze-gruen" x="${masse.hofX}" y="${SKIZZE_BODEN}" width="${masse.hofBreite}" height="10" rx="2"></rect>
    ${zeichneGras(masse.hofX, masse.hofBreite)}
    ${zeichneSkizzenfluegel(masse.gebaeudeX, fluegelBreite, masse, antworten, gebaeudeart)}
    ${zeichneSkizzenfluegel(masse.hofX + masse.hofBreite, fluegelBreite, masse, antworten, gebaeudeart)}
  `;
}


// ---------------------------------------------------------------
// Bäume, Schatten, Zubehör
// ---------------------------------------------------------------

// Ein Baum: Stamm mit Ast, Krone aus drei Kreisen, Schattenfleck am Boden.
// Der Schatten wächst mit der Krone und im Innenhof noch einmal, weil dort
// die Bäume anderthalbfach zählen.
function zeichneBaum(x, radius, imHof) {
  const kroneY = SKIZZE_BODEN - 12 - radius;
  const schattenBreite = radius * (imHof ? 2.2 : 1.6);
  return `
    <ellipse class="skizze-schatten" cx="${x + 4}" cy="${SKIZZE_BODEN + 4}" rx="${schattenBreite}" ry="3"></ellipse>
    <rect class="skizze-stamm" x="${x - 1.5}" y="${SKIZZE_BODEN - 13}" width="3" height="13"></rect>
    <path class="skizze-ast" d="M${x} ${SKIZZE_BODEN - 8}l${radius * 0.5} -4"></path>
    <g class="skizze-krone">
      <circle class="skizze-blatt dunkel" cx="${x - radius * 0.45}" cy="${kroneY + radius * 0.3}" r="${radius * 0.7}"></circle>
      <circle class="skizze-blatt dunkel" cx="${x + radius * 0.5}" cy="${kroneY + radius * 0.25}" r="${radius * 0.7}"></circle>
      <circle class="skizze-blatt" cx="${x}" cy="${kroneY}" r="${radius}"></circle>
      <circle class="skizze-blatt licht" cx="${x - radius * 0.3}" cy="${kroneY - radius * 0.3}" r="${radius * 0.4}"></circle>
    </g>
  `;
}


// Die Bäume: zuerst in den Hof, dann links, dann rechts, so lange Platz ist.
function zeichneSkizzenbaeume(masse, antworten) {
  const anzahl = Math.min(HOECHSTENS_BAEUME, Math.max(0, Math.round(antworten.baeume)));
  const radius = KRONENRADIUS[antworten.kronengroesse] || 10;
  const schritt = radius * 2 + 5;
  const plaetze = [];

  if (antworten.innenhof) {
    for (let x = masse.hofX + radius + 3; x < masse.hofX + masse.hofBreite - radius - 1; x = x + schritt) {
      plaetze.push({ x: x, imHof: true });
    }
  }
  for (let x = SKIZZE_RAND + radius + 3; x < masse.gebaeudeX - radius - 3; x = x + schritt) {
    plaetze.push({ x: x, imHof: false });
  }
  for (let x = masse.rechtsX + radius + 3; x < SKIZZE_BREITE - SKIZZE_RAND - radius; x = x + schritt) {
    plaetze.push({ x: x, imHof: false });
  }

  let teile = plaetze.slice(0, anzahl).map(function (platz) {
    return zeichneBaum(platz.x, radius, platz.imHof);
  }).join("");

  // Passen nicht alle ins Bild, steht die Zahl daneben.
  if (antworten.baeume > plaetze.length) {
    teile = teile + `<text class="skizze-text" x="${SKIZZE_BREITE - SKIZZE_RAND}" y="${SKIZZE_BODEN - 4}" text-anchor="end">${antworten.baeume} Bäume</text>`;
  }
  return teile;
}


// Pergola mit Sonnensegel und dem Schatten, den beide auf den Boden werfen.
// Die Breite des Schattens folgt dem Regler.
function zeichnePergola(masse, antworten) {
  const anteil = begrenze(antworten.verschattungZusatz, 0, 100) / 100;
  if (anteil <= 0) {
    return "";
  }
  const links = masse.rechtsFrei >= 30 ? masse.rechtsX + 6 : SKIZZE_RAND + 4;
  const platz = masse.rechtsFrei >= 30 ? masse.rechtsFrei - 12 : masse.linksFrei - 8;
  if (platz < 24) {
    return "";
  }
  const breite = Math.max(22, platz * anteil);
  const oben = SKIZZE_BODEN - 34;
  let latten = "";
  for (let lx = links + 3; lx < links + breite - 2; lx = lx + 6) {
    latten = latten + `<path class="skizze-latte" d="M${lx} ${oben}v4"></path>`;
  }
  return `
    <rect class="skizze-schatten" x="${links}" y="${SKIZZE_BODEN + 1}" width="${breite}" height="6" rx="3"></rect>
    <path class="skizze-mast" d="M${links + 2} ${oben}V${SKIZZE_BODEN}M${links + breite - 2} ${oben}V${SKIZZE_BODEN}"></path>
    <rect class="skizze-balken" x="${links}" y="${oben - 2}" width="${breite}" height="3"></rect>${latten}
    <polygon class="skizze-segel" points="${links + 2},${oben - 4} ${links + breite - 2},${oben - 12} ${links + breite * 0.55},${oben - 26}"></polygon>
  `;
}


// Zisterne mit Fallrohr, Versickerungsmulde mit Pfeilen nach unten.
function zeichneWasser(masse, antworten) {
  let teile = "";

  if (antworten.zisterne > 0) {
    const breite = begrenze(18 + antworten.zisterne / 4, 18, 56);
    const x = masse.rechtsX + Math.max(6, masse.rechtsFrei / 2 - breite / 2);
    const oben = SKIZZE_BODEN - masse.gebaeudeHoehe - 6;
    teile = teile + `
      <path class="skizze-rohr" d="M${masse.rechtsX + 3} ${oben}V${SKIZZE_BODEN + 14}H${x}"></path>
      <rect class="skizze-tank" x="${x}" y="${SKIZZE_BODEN + 16}" width="${breite}" height="16" rx="5"></rect>
      <rect class="skizze-wasser" x="${x + 2}" y="${SKIZZE_BODEN + 22}" width="${breite - 4}" height="8" rx="3"></rect>
    `;
  }

  if (antworten.versickerung && masse.linksFrei > 34) {
    const x = SKIZZE_RAND + masse.linksFrei / 2;
    teile = teile + `
      <path class="skizze-mulde" d="M${x - 16} ${SKIZZE_BODEN + 10}q16 14 32 0"></path>
      <path class="skizze-sicker" d="M${x - 8} ${SKIZZE_BODEN + 22}v8M${x} ${SKIZZE_BODEN + 24}v8M${x + 8} ${SKIZZE_BODEN + 22}v8"></path>
      <path class="skizze-sicker" d="M${x - 10} ${SKIZZE_BODEN + 28}l2 3l2 -3M${x - 2} ${SKIZZE_BODEN + 30}l2 3l2 -3M${x + 6} ${SKIZZE_BODEN + 28}l2 3l2 -3"></path>
    `;
  }
  return teile;
}


// Setzt alles zusammen. Gibt das fertige SVG als Text zurück.
function zeichneSkizze(vorhaben) {
  const antworten = vorhaben.antworten || leereAntworten();
  const masse = skizzenmasse(vorhaben);

  return `
    <svg class="skizze" viewBox="0 0 ${SKIZZE_BREITE} ${SKIZZE_HOEHE}" role="img"
         aria-label="Schematische Skizze des Bauvorhabens">
      ${zeichneSonne()}
      ${zeichneSkizzenboden(masse, antworten)}
      ${zeichneWasser(masse, antworten)}
      ${zeichneSkizzengebaeude(masse, antworten, vorhaben.gebaeudeart)}
      ${zeichnePergola(masse, antworten)}
      ${zeichneSkizzenbaeume(masse, antworten)}
    </svg>
  `;
}
