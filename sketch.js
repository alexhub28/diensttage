let table;
let years = [];
let days = [];

let hoverIndex = -1;

// Palette officielle
const COLOR_BAR = "#5A959D";    // Petrol
const COLOR_HOVER = "#CAE7EA";  // Mint
const COLOR_GRID = "#E0E0E0";   // Gris neutre
const COLOR_TEXT = "#111111";   // Noir institutionnel

// Fonction pour ajouter des apostrophes
function formatNumber(n) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "'");
}

function preload() {
  table = loadTable("BEZ_DT_geleistet_2025.csv", "csv", "header");
}

function setup() {
  createCanvas(1000, 550);
  textFont("Frutiger");

  for (let r = 0; r < table.getRowCount(); r++) {
    years.push(table.getNum(r, "Jahr"));
    days.push(table.getNum(r, "Diensttage"));
  }
}

function draw() {
  background(255);

  let left = 80;
  let right = 40;
  let top = 80;
  let bottom = 80;

  let w = width - left - right;
  let h = height - top - bottom;

  let maxVal = 2000000;

  // TITRE TRILINGUE
  textSize(22);
  textAlign(CENTER, CENTER);
  fill(COLOR_TEXT);
  text("Geleistete Diensttage / Jours de service effectués / Giorni prestati", width / 2, 30);

  // AXE Y + grille
  stroke(COLOR_TEXT);
  line(left, top, left, top + h);

  textSize(12);
  textAlign(RIGHT, CENTER);
  for (let i = 0; i <= 5; i++) {
    let val = (maxVal / 5) * i;
    let y = map(val, 0, maxVal, top + h, top);

    noStroke();
    fill(COLOR_TEXT);
    text(formatNumber(int(val)), left - 10, y);

    stroke(COLOR_GRID);
    line(left, y, left + w, y);
  }

  // AXE X
  stroke(COLOR_TEXT);
  line(left, top + h, left + w, top + h);

  // Largeur d’une barre
  let barW = w / years.length;

  hoverIndex = -1;

  // BARRES
  for (let i = 0; i < years.length; i++) {
    let x = left + i * barW;
    let y = map(days[i], 0, maxVal, top + h, top);
    let barH = top + h - y;

    let isHover =
      mouseX > x &&
      mouseX < x + barW * 0.8 &&
      mouseY > y &&
      mouseY < top + h;

    if (isHover) hoverIndex = i;

    fill(isHover ? COLOR_HOVER : COLOR_BAR);
    noStroke();
    rect(x, y, barW * 0.8, barH);

    fill(COLOR_TEXT);
    textAlign(CENTER, TOP);
    text(years[i], x + barW * 0.4, top + h + 5);
  }

  // TOOLTIP (simple, nombre seul avec apostrophes)
  if (hoverIndex !== -1) {
    let x = mouseX + 10;
    let y = mouseY - 10;

    let txt = formatNumber(days[hoverIndex]);

    let padding = 8;
    let boxW = textWidth(txt) + padding * 2;
    let boxH = 25;

    fill(255);
    stroke(COLOR_BAR);
    rect(x, y, boxW, boxH, 5);

    noStroke();
    fill(COLOR_BAR);
    textAlign(LEFT, TOP);
    text(txt, x + padding, y + padding);
  }
}
