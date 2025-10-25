// Compact Toronto Bike Share Widget
// Built for Scriptable
// Find other stations by querying the API endpoint: "https://tor.publicbikesystem.net/ube/gbfs/v1/en/station_information"

const SECTIONS = [
  { name: "🏠 Home", stations: [{ name: "Central Tech  (Harbord St)", short: "Home" }] },
  { name: "🏊 Pool", stations: [{ name: "Spadina Ave / Harbord St - SMART", short: "Pool" }] },
  { name: "💼 Work", stations: [{ name: "Front St W / Bay St (North Side)", short: "Work" }] },
];

// --- Fetch helper ---
async function getJSON(url) {
  const req = new Request(url);
  req.headers = { "user-agent": "ScriptableWidget" };
  return await req.loadJSON();
}

async function getBikeData() {
  const info = await getJSON("https://tor.publicbikesystem.net/ube/gbfs/v1/en/station_information");
  const status = await getJSON("https://tor.publicbikesystem.net/ube/gbfs/v1/en/station_status");

  const infoMap = new Map(info.data.stations.map(s => [s.name, s.station_id]));
  const statusMap = new Map(status.data.stations.map(s => [s.station_id, s]));

  return SECTIONS.map(section => ({
    section: section.name,
    stations: section.stations.map(st => {
      const id = infoMap.get(st.name);
      const s = id ? statusMap.get(id) : null;
      return {
        short: st.short,
        bikes: s?.num_bikes_available_types?.mechanical ?? s?.num_bikes_available ?? 0,
        ebikes: s?.num_bikes_available_types?.ebike ?? 0,
        docks: s?.num_docks_available ?? 0,
      };
    }),
  }));
}

async function createWidget() {
  const sections = await getBikeData();

  const w = new ListWidget();
  w.backgroundColor = new Color("#111111");
  w.setPadding(6, 10, 6, 10);
  // Ask Scriptable to refresh this widget roughly every minute.
  w.refreshAfterDate = new Date(Date.now() + 60 * 1000);

  const title = w.addText("🚲 Toronto Bikes");
  title.font = Font.semiboldSystemFont(12);
  title.textColor = Color.white();
  w.addSpacer(3);

  for (const sec of sections) {
    for (const s of sec.stations) {
      const line = w.addText(
        `${s.short.padEnd(5)} 🚲${String(s.bikes).padEnd(2)} 🅿️${String(s.docks).padEnd(2)} ⚡${String(s.ebikes).padEnd(2)}`
      );
      line.font = Font.systemFont(11);
      line.textColor = Color.lightGray();
    }
    w.addSpacer(2);
  }

  const t = w.addText(new Date().toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit" }));
  t.font = Font.footnote();
  t.textColor = new Color("#888");
  return w;
}

const widget = await createWidget();
if (config.runsInWidget) Script.setWidget(widget);
else widget.presentSmall();
Script.complete();
