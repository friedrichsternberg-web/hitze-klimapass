// skizze.js
//
// Zeichnet aus den Antworten des Fragebogens eine einfache Skizze des
// Bauvorhabens als SVG. Sie ist ein Schema und kein Bauplan: Die Breite des
// Gebäudes kommt aus dem Verhältnis von Dach- zu Freifläche, die Zahl der
// Geschosse aus dem Verhältnis von Fassade zu Dach, alles Übrige direkt aus
// den Antworten. Ändert sich eine Antwort, wird neu gezeichnet.
//
// Diese Datei fasst die Seite nicht an, sie gibt nur Text zurück. app.js setzt
// den Text an die passende Stelle. Farben stehen in design.css und werden über
// Klassen zugewiesen, deshalb steht hier keine einzige Farbe.
//
// Das Zeichenfeld ist 320 breit und 200 hoch. Der Boden liegt bei 150, darunter
// ist Platz für Zisterne und Versickerung.

const SKIZZE_BREITE = 320;
const SKIZZE_BODEN = 150;
const SKIZZE_RAND = 20;
const SKIZZE_GESCHOSSHOEHE = 18;

// Wie groß eine Baumkrone gezeichnet wird, je Kronengröße.
const KRONENRADIUS = { klein: 6, mittel: 9, gross: 13 };

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
  const geschosse = begrenze(Math.round(vorhaben.fassadenflaeche / (umfang * 3.2)), 1, 7);

  // Das Gebäude steht etwas rechts der Mitte, links ist mehr Freifläche.
  const linksFrei = Math.round(freiBreite * 0.6);
  const gebaeudeX = SKIZZE_RAND + linksFrei;

  return {
    gebaeudeX: gebaeudeX,
    gebaeudeBreite: gebaeudeBreite,
    gebaeudeHoehe: geschosse * SKIZZE_GESCHOSSHOEHE + 6,
    geschosse: geschosse,
    linksFrei: linksFrei,
    rechtsFrei: freiBreite - linksFrei,
    rechtsX: gebaeudeX + gebaeudeBreite
  };
}


// Der Boden: befestigt in der Farbe des Belags, darüber der grüne Anteil.
// Die Freifläche liegt links und rechts vom Gebäude, der grüne Teil wird von
// links aufgefüllt.
function zeichneSkizzenboden(masse, antworten) {
  const belag = antworten.belag || "asphalt";
  const gruen = begrenze(antworten.gruenanteil, 0, 100) / 100;
  const gruenBreite = Math.round((masse.linksFrei + masse.rechtsFrei) * gruen);
  const gruenLinks = Math.min(gruenBreite, masse.linksFrei);
  const gruenRechts = gruenBreite - gruenLinks;

  let teile = `
    <rect class="skizze-befestigt skizze-belag-${belag}" x="${SKIZZE_RAND}" y="${SKIZZE_BODEN}"
          width="${masse.linksFrei}" height="8"></rect>
    <rect class="skizze-befestigt skizze-belag-${belag}" x="${masse.rechtsX}" y="${SKIZZE_BODEN}"
          width="${masse.rechtsFrei}" height="8"></rect>
  `;

  // Pflaster bekommt Fugen, Rasengitter und Kies bekommen Punkte.
  if (belag !== "asphalt") {
    for (let x = SKIZZE_RAND + 5; x < SKIZZE_BREITE - SKIZZE_RAND; x = x + 10) {
      const imGebaeude = x > masse.gebaeudeX && x < masse.rechtsX;
      if (!imGebaeude) {
        teile = teile + `<circle class="skizze-belagpunkt" cx="${x}" cy="${SKIZZE_BODEN + 4}" r="1.2"></circle>`;
      }
    }
  }

  if (gruenLinks > 0) {
    teile = teile + `<rect class="skizze-gruen" x="${SKIZZE_RAND}" y="${SKIZZE_BODEN}" width="${gruenLinks}" height="8" rx="2"></rect>`;
  }
  if (gruenRechts > 0) {
    teile = teile + `<rect class="skizze-gruen" x="${masse.rechtsX}" y="${SKIZZE_BODEN}" width="${gruenRechts}" height="8" rx="2"></rect>`;
  }

  return teile + `<path class="skizze-bodenlinie" d="M${SKIZZE_RAND} ${SKIZZE_BODEN}h${SKIZZE_BREITE - 2 * SKIZZE_RAND}"></path>`;
}


// Fenster und Tür je nach Gebäudeart. Jede Art hat ihr eigenes Muster, damit
// man sie auf einen Blick unterscheidet: Wohnhaus kleine Fenster, Büro breite
// Glasbänder, Gewerbe große Tore, Handel ein Schaufenster im Erdgeschoss,
// öffentliches Gebäude Säulen am Eingang, gemischt Laden unten und Wohnen oben.
function zeichneSkizzenfenster(x, breite, hoehe, geschosse, gebaeudeart) {
  const unten = SKIZZE_BODEN;
  let teile = "";

  for (let geschoss = 0; geschoss < geschosse; geschoss = geschoss + 1) {
    const y = unten - (geschoss + 1) * SKIZZE_GESCHOSSHOEHE + 5;
    const istErdgeschoss = geschoss === 0;

    if (istErdgeschoss && (gebaeudeart === "handel" || gebaeudeart === "gemischt")) {
      teile = teile + `<rect class="skizze-glas" x="${x + 4}" y="${y}" width="${breite - 8}" height="10" rx="1"></rect>
                       <path class="skizze-markise" d="M${x + 2} ${y - 2}h${breite - 4}"></path>`;
      continue;
    }
    if (istErdgeschoss && gebaeudeart === "oeffentlich") {
      for (let sx = x + 6; sx < x + breite - 4; sx = sx + 12) {
        teile = teile + `<rect class="skizze-saeule" x="${sx}" y="${y - 2}" width="3" height="14"></rect>`;
      }
      continue;
    }
    if (istErdgeschoss && gebaeudeart === "gewerbe") {
      teile = teile + `<rect class="skizze-tor" x="${x + breite / 2 - 10}" y="${y - 2}" width="20" height="14" rx="1"></rect>`;
      continue;
    }

    const breit = gebaeudeart === "buero" || gebaeudeart === "oeffentlich";
    const fensterBreite = breit ? 11 : 6;
    const abstand = breit ? 15 : 13;
    for (let fx = x + 5; fx + fensterBreite < x + breite - 3; fx = fx + abstand) {
      teile = teile + `<rect class="skizze-fenster" x="${fx}" y="${y}" width="${fensterBreite}" height="8" rx="1"></rect>`;
    }
  }

  return teile;
}


// Ein Gebäudeflügel: Wand, Dach, Begrünung. Der Innenhof besteht aus zwei
// solchen Flügeln mit Lücke dazwischen.
function zeichneSkizzenfluegel(x, breite, masse, antworten, gebaeudeart) {
  const oben = SKIZZE_BODEN - masse.gebaeudeHoehe;
  const wandklasse = antworten.fassadeHell ? "skizze-wand hell" : "skizze-wand";
  const dachklasse = antworten.dachHell ? "skizze-dach hell" : "skizze-dach";
  const gruenDach = begrenze(antworten.dachbegruenung, 0, 100) / 100;
  const gruenFassade = begrenze(antworten.fassadenbegruenung, 0, 100) / 100;

  let teile = `<rect class="${wandklasse}" x="${x}" y="${oben}" width="${breite}" height="${masse.gebaeudeHoehe}"></rect>`;
  teile = teile + zeichneSkizzenfenster(x, breite, masse.gebaeudeHoehe, masse.geschosse, gebaeudeart);

  if (antworten.dachform === "geneigt") {
    const first = oben - 22;
    teile = teile + `<polygon class="${dachklasse}" points="${x - 3},${oben} ${x + breite / 2},${first} ${x + breite + 3},${oben}"></polygon>`;
    // Auf dem geneigten Dach zählt höchstens ein knappes Drittel, gezeichnet
    // wird der begrünte Teil als Keil an der linken Traufe.
    const anteil = Math.min(gruenDach, 0.3) / 0.3;
    if (anteil > 0) {
      const spitzeX = x - 3 + (breite / 2 + 3) * anteil;
      const spitzeY = oben - 22 * anteil;
      teile = teile + `<polygon class="skizze-gruen" points="${x - 3},${oben} ${spitzeX},${spitzeY} ${spitzeX},${oben}"></polygon>`;
    }
  } else {
    teile = teile + `<rect class="${dachklasse}" x="${x - 3}" y="${oben - 6}" width="${breite + 6}" height="6" rx="1"></rect>`;
    if (antworten.retentionsdach) {
      teile = teile + `<rect class="skizze-wasser" x="${x - 3}" y="${oben - 3}" width="${breite + 6}" height="3"></rect>`;
    }
    if (gruenDach > 0) {
      teile = teile + `<rect class="skizze-gruen" x="${x - 3}" y="${oben - 10}" width="${(breite + 6) * gruenDach}" height="5" rx="2"></rect>`;
    }
  }

  // Fassadenbegrünung klettert von unten an beiden Kanten hoch.
  if (gruenFassade > 0) {
    const hoehe = masse.gebaeudeHoehe * gruenFassade;
    for (const kante of [x + 1, x + breite - 9]) {
      teile = teile + `<rect class="skizze-gruen" x="${kante}" y="${SKIZZE_BODEN - hoehe}" width="8" height="${hoehe}" rx="4"></rect>`;
    }
  }

  return teile;
}


// Das ganze Gebäude: ein Block, oder bei einem Innenhof zwei Flügel mit einem
// niedrigeren Rückgebäude dazwischen.
function zeichneSkizzengebaeude(masse, antworten, gebaeudeart) {
  if (!antworten.innenhof) {
    return zeichneSkizzenfluegel(masse.gebaeudeX, masse.gebaeudeBreite, masse, antworten, gebaeudeart);
  }

  const hofBreite = Math.round(begrenze(masse.gebaeudeBreite * 0.4, 30, 70));
  const fluegelBreite = Math.round((masse.gebaeudeBreite - hofBreite) / 2);
  const hofX = masse.gebaeudeX + fluegelBreite;
  const rueckHoehe = Math.round(masse.gebaeudeHoehe * 0.45);

  return `
    <rect class="skizze-wand hinten" x="${hofX}" y="${SKIZZE_BODEN - rueckHoehe}" width="${hofBreite}" height="${rueckHoehe}"></rect>
    <rect class="skizze-gruen" x="${hofX}" y="${SKIZZE_BODEN}" width="${hofBreite}" height="8" rx="2"></rect>
    ${zeichneSkizzenfluegel(masse.gebaeudeX, fluegelBreite, masse, antworten, gebaeudeart)}
    ${zeichneSkizzenfluegel(hofX + hofBreite, fluegelBreite, masse, antworten, gebaeudeart)}
  `;
}


// Die Bäume. Zuerst in den Hof, dann links, dann rechts, so lange Platz ist.
function zeichneSkizzenbaeume(masse, antworten) {
  const anzahl = Math.min(HOECHSTENS_BAEUME, Math.max(0, Math.round(antworten.baeume)));
  const radius = KRONENRADIUS[antworten.kronengroesse] || 9;
  const plaetze = [];

  if (antworten.innenhof) {
    const hofBreite = Math.round(begrenze(masse.gebaeudeBreite * 0.4, 30, 70));
    const hofX = masse.gebaeudeX + Math.round((masse.gebaeudeBreite - hofBreite) / 2);
    for (let x = hofX + radius + 2; x < hofX + hofBreite - radius; x = x + radius * 2 + 4) {
      plaetze.push(x);
    }
  }
  for (let x = SKIZZE_RAND + radius + 2; x < masse.gebaeudeX - radius - 2; x = x + radius * 2 + 4) {
    plaetze.push(x);
  }
  for (let x = masse.rechtsX + radius + 2; x < SKIZZE_BREITE - SKIZZE_RAND - radius; x = x + radius * 2 + 4) {
    plaetze.push(x);
  }

  let teile = "";
  plaetze.slice(0, anzahl).forEach(function (x) {
    const kroneY = SKIZZE_BODEN - 10 - radius;
    teile = teile + `
      <rect class="skizze-stamm" x="${x - 1.5}" y="${SKIZZE_BODEN - 12}" width="3" height="12"></rect>
      <circle class="skizze-krone" cx="${x}" cy="${kroneY}" r="${radius}"></circle>
    `;
  });

  // Passen nicht alle ins Bild, steht die Zahl daneben.
  if (antworten.baeume > plaetze.length) {
    teile = teile + `<text class="skizze-text" x="${SKIZZE_BREITE - SKIZZE_RAND}" y="${SKIZZE_BODEN - 4}" text-anchor="end">${antworten.baeume} Bäume</text>`;
  }
  return teile;
}


// Sonnensegel, Zisterne und Versickerung.
function zeichneSkizzenzubehoer(masse, antworten) {
  let teile = "";

  if (antworten.verschattungZusatz > 0 && masse.rechtsFrei > 24) {
    const groesse = 12 + begrenze(antworten.verschattungZusatz, 0, 100) / 100 * 18;
    const x = masse.rechtsX + masse.rechtsFrei / 2;
    const y = SKIZZE_BODEN - 30;
    teile = teile + `<polygon class="skizze-segel" points="${x - groesse},${y} ${x + groesse},${y - 6} ${x + 4},${y + 12}"></polygon>
                     <path class="skizze-mast" d="M${x + 4} ${y + 12}V${SKIZZE_BODEN}"></path>`;
  }

  if (antworten.zisterne > 0) {
    const breite = begrenze(16 + antworten.zisterne / 4, 16, 50);
    const x = masse.rechtsX + Math.max(4, masse.rechtsFrei / 2 - breite / 2);
    teile = teile + `<rect class="skizze-wasser" x="${x}" y="${SKIZZE_BODEN + 16}" width="${breite}" height="14" rx="4"></rect>
                     <path class="skizze-rohr" d="M${masse.rechtsX} ${SKIZZE_BODEN + 8}v10h${x - masse.rechtsX}"></path>`;
  }

  if (antworten.versickerung && masse.linksFrei > 30) {
    const x = SKIZZE_RAND + masse.linksFrei / 2;
    teile = teile + `<path class="skizze-mulde" d="M${x - 14} ${SKIZZE_BODEN + 8}q14 12 28 0"></path>
                     <path class="skizze-sicker" d="M${x - 6} ${SKIZZE_BODEN + 18}v6M${x} ${SKIZZE_BODEN + 20}v6M${x + 6} ${SKIZZE_BODEN + 18}v6"></path>`;
  }

  return teile;
}


// Setzt alles zusammen. Gibt das fertige SVG als Text zurück.
function zeichneSkizze(vorhaben) {
  const antworten = vorhaben.antworten || leereAntworten();
  const masse = skizzenmasse(vorhaben);

  return `
    <svg class="skizze" viewBox="0 0 ${SKIZZE_BREITE} 200" role="img"
         aria-label="Schematische Skizze des Bauvorhabens">
      ${zeichneSkizzenboden(masse, antworten)}
      ${zeichneSkizzengebaeude(masse, antworten, vorhaben.gebaeudeart)}
      ${zeichneSkizzenbaeume(masse, antworten)}
      ${zeichneSkizzenzubehoer(masse, antworten)}
    </svg>
  `;
}
