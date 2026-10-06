// Uptown grocery access map. Data comes from the "Export for the website" cell in the notebook.

const MODES = ["walk", "bus", "bike"];
const DESCRIBE = { walk: "10-min walk", bus: "10-min bus + walk", bike: "5-min bike ride" };
const STORE_COLOR = "#d95f02";

const map = L.map("map", { zoomSnap: 0.25, scrollWheelZoom: false });
L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
  { maxZoom: 16, attribution: "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ" }
).addTo(map);
map.on("focus", () => map.scrollWheelZoom.enable());   // don't hijack page scroll until the map is clicked
map.on("blur", () => map.scrollWheelZoom.disable());

// One pane per mode so layers keep the same stacking order however they're toggled
// (biggest area at the bottom, walk on top).
["bike", "bus", "walk"].forEach((mode, i) => {
  map.createPane(mode).style.zIndex = 410 + i;
});
map.createPane("boundary").style.zIndex = 420;
map.createPane("stores").style.zIndex = 630;   // above Leaflet's marker pane

const getJSON = (name) => fetch(`data/${name}`).then((r) => r.json());
const layers = {};

Promise.all([
  getJSON("stats.json"),
  getJSON("boundary.geojson"),
  getJSON("stores.geojson"),
  ...MODES.map((m) => getJSON(`${m}.geojson`)),
]).then(([stats, boundary, stores, ...sheds]) => {
  document.getElementById("residents").textContent = stats.residents.toLocaleString();

  MODES.forEach((mode, i) => {
    const s = stats.modes[mode];
    layers[mode] = L.geoJSON(sheds[i], {
      pane: mode,
      style: { color: s.color, weight: 1.5, fillColor: s.color, fillOpacity: 0.28 },
    }).bindTooltip(`Within a ${DESCRIBE[mode]} of groceries`, { sticky: true });

    const button = document.querySelector(`.mode[data-mode="${mode}"]`);
    button.querySelector(".pct").textContent = `${Math.round(s.pct_people * 100)}%`;
    button.title = `${s.residents_within.toLocaleString()} of ${stats.residents.toLocaleString()} residents`;
    button.addEventListener("click", () => toggle(mode, button));
    if (button.getAttribute("aria-pressed") === "true") layers[mode].addTo(map);
  });

  const outline = L.geoJSON(boundary, {
    pane: "boundary",
    interactive: false,
    style: { color: "#1f2328", weight: 2.5, dashArray: "6 6", fill: false },
  }).addTo(map);

  L.geoJSON(stores, {
    pointToLayer: (f, latlng) =>
      L.circleMarker(latlng, {
        pane: "stores", radius: 7, color: "#fff", weight: 2, fillColor: STORE_COLOR, fillOpacity: 1,
      }).bindTooltip(f.properties.name, { direction: "top", offset: [0, -6] }),
  }).addTo(map);

  map.fitBounds(outline.getBounds(), { padding: [16, 16] });
});

function toggle(mode, button) {
  const on = button.getAttribute("aria-pressed") !== "true";
  button.setAttribute("aria-pressed", on);
  on ? layers[mode].addTo(map) : layers[mode].remove();
}

// Refit when the layout changes (e.g. rotating a phone)
window.addEventListener("resize", () => map.invalidateSize());

// The write-up under the map: docs/about.md, rendered as HTML
fetch("about.md")
  .then((r) => r.text())
  .then((md) => {
    const about = document.getElementById("about");
    about.innerHTML = marked.parse(md);
    wrapSections(about);
  });

// Wrap each "## Heading" and everything under it in <section id="heading-slug">,
// so style.css can lay sections out (e.g. Datasets beside Assumptions) without markup in about.md.
function wrapSections(root) {
  [...root.querySelectorAll(":scope > h2")].forEach((h2) => {
    const section = document.createElement("section");
    section.id = h2.textContent.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    h2.before(section);
    let next = h2;
    while (next && !(next !== h2 && next.tagName === "H2")) {
      const after = next.nextElementSibling;
      section.append(next);
      next = after;
    }
  });

  // Datasets sits in a block beside Assumptions
  const datasets = root.querySelector("#datasets");
  const assumptions = root.querySelector("#assumptions");
  if (datasets && assumptions) {
    const row = document.createElement("div");
    row.className = "side-by-side";
    datasets.before(row);
    row.append(datasets, assumptions);
  }
}
