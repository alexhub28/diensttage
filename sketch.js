function setup() {
  noCanvas();
  drawChart();
  window.addEventListener("resize", drawChart);
}

// 🎨 Couleur officielle "jours de service" (DT / Diensttage) — à réutiliser
// systématiquement dans tous les graphiques qui traitent de cette variable.
// Dégradé d'intensité (comme Anzahl Kurse) : plus foncé pour les valeurs élevées.
const COLOR_DT = "#5A959D";  // accent1 — petrol, intensité max
const LIGHT_DT = "#E1ECED";  // petrol très clair — intensité min

// Largeur minimale d'une barre (+ son espacement) : en dessous, le
// graphique devient scrollable plutôt que d'écraser les barres.
const MIN_STEP = 30;

// --- Formatage suisse : 1'891'738 ---
function formatSwiss(n) {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "'");
}

function drawChart() {

  d3.select("#chart").selectAll("*").remove();

  const containerWidth = document.getElementById("chart").clientWidth;
  const isMobile = containerWidth < 600;

  d3.csv("BEZ_DT_geleistet_2025.csv").then(raw => {

    const data = raw
      .map(d => ({ year: d["Jahr"], value: +d["Diensttage"] }))
      .sort((a, b) => a.year - b.year);

    const margin = {
      top: 20,
      right: isMobile ? 10 : 20,
      bottom: 30,
      left: isMobile ? 10 : 20
    };

    // Largeur du graphique : au moins celle du conteneur, mais jamais en
    // dessous du seuil qui garantirait des barres trop fines pour être lisibles.
    const minInnerWidth = data.length * MIN_STEP;
    const containerInnerWidth = containerWidth - margin.left - margin.right;
    const innerWidth = Math.max(containerInnerWidth, minInnerWidth);
    const width = innerWidth + margin.left + margin.right;

    const innerHeight = isMobile ? 320 : 440;
    const height = margin.top + innerHeight + margin.bottom;

    const svg = d3.select("#chart")
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const maxVal = d3.max(data, d => d.value);
    const minVal = d3.min(data, d => d.value);

    const x = d3.scaleBand()
      .domain(data.map(d => d.year))
      .range([0, innerWidth])
      .padding(0.25);

    const y = d3.scaleLinear()
      .domain([0, maxVal * 1.1])
      .range([innerHeight, 0]);

    // Échelle de couleur en racine carrée : l'écart 1996–2025 est énorme
    // (facteur ~164), une échelle linéaire écraserait presque toutes les
    // teintes vers le clair sauf les toutes dernières années.
    const colorScale = d3.scaleSqrt().domain([minVal, maxVal]).range([0, 1]);
    const barColor = d => d3.interpolate(LIGHT_DT, COLOR_DT)(colorScale(d.value));

    // --- Barres avec animation d'apparition ---
    const bars = g.selectAll("rect.bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", d => x(d.year))
      .attr("width", x.bandwidth())
      .attr("y", innerHeight)
      .attr("height", 0)
      .attr("fill", barColor);

    bars.transition()
      .delay((d, i) => i * 20)
      .duration(700)
      .ease(d3.easeCubicOut)
      .attr("y", d => y(d.value))
      .attr("height", d => innerHeight - y(d.value));

    // --- Valeur au survol uniquement (30 barres : trop dense pour tout afficher) ---
    // Bulle flottante plutôt que texte ancré à la barre : les barres sont
    // trop étroites (~22px) pour contenir un nombre à 7 chiffres sans déborder.
    const tooltip = svg.append("g").style("opacity", 0).style("pointer-events", "none");
    const tooltipRect = tooltip.append("rect")
      .attr("fill", "white")
      .attr("stroke", COLOR_DT)
      .attr("stroke-width", 1.5)
      .attr("rx", 5);
    const tooltipText = tooltip.append("text")
      .style("font-family", "Arial")
      .style("font-size", "14.5px")
      .style("font-weight", "bold")
      .style("fill", "#111");

    function showTooltip(event, d) {
      const [mx, my] = d3.pointer(event, svg.node());
      tooltipText.text(`${d.year} – ${formatSwiss(d.value)}`);

      const bbox = tooltipText.node().getBBox();
      const padX = 10, padY = 7;
      const boxW = bbox.width + padX * 2;
      const boxH = bbox.height + padY * 2;

      let tx = mx + 16;
      let ty = my - boxH - 14;
      if (tx + boxW > width) tx = mx - boxW - 16;
      if (ty < 0) ty = my + 16;

      tooltip.attr("transform", `translate(${tx}, ${ty})`);
      tooltipRect.attr("width", boxW).attr("height", boxH);
      tooltipText.attr("x", padX).attr("y", padY + bbox.height * 0.78);
      tooltip.style("opacity", 1);
    }

    // --- Années sous les barres : une sur cinq pour rester lisible ---
    g.selectAll("text.label")
      .data(data.filter(d => d.year % 5 === 0))
      .enter()
      .append("text")
      .attr("class", "label")
      .attr("x", d => x(d.year) + x.bandwidth() / 2)
      .attr("y", innerHeight + 20)
      .attr("text-anchor", "middle")
      .style("font-family", "Arial")
      .style("font-size", isMobile ? "11.5px" : "13.5px")
      .style("fill", "#111")
      .text(d => d.year);

    // --- Survol par colonne : met en évidence + affiche la bulle ---
    function highlight(year) {
      g.selectAll(".bar").transition().duration(150)
        .style("opacity", d => (year === null || d.year === year) ? 1 : 0.35);
    }

    g.selectAll("rect.hit")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "hit")
      .attr("x", d => x(d.year) - (x.step() - x.bandwidth()) / 2)
      .attr("y", 0)
      .attr("width", x.step())
      .attr("height", innerHeight + margin.bottom)
      .attr("fill", "transparent")
      .style("cursor", "pointer")
      .on("mouseover", (event, d) => { highlight(d.year); showTooltip(event, d); })
      .on("mousemove", (event, d) => showTooltip(event, d))
      .on("mouseout", () => { highlight(null); tooltip.style("opacity", 0); });
  });
}
