const http = require('http');
const fs = require('fs');
const path = require('path');

const STYLES_PATH = path.join(__dirname, 'styles.css');

const SPOTS = require('./spots');

async function serveStaticFile(res, filePath, contentType = 'application/octet-stream') {
    try {
        const data = await fs.promises.readFile(filePath);
        res.writeHead(200, {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=60'
        });
        res.end(data);
    } catch (error) {
        console.error(`Error serving ${filePath}:`, error);
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found');
    }
}

async function getBikeStationStatus() {
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch('https://tor.publicbikesystem.net/ube/gbfs/v1/en/station_status', {
      method: 'GET',
      headers: {
        'accept': '*/*',
        'accept-language': 'en-US,en;q=0.9',
        'origin': 'https://bikesharetoronto.com',
        'priority': 'u=1, i',
        'referer': 'https://bikesharetoronto.com/',
        'sec-ch-ua': '"Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'cross-site',
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching bike station status:', error);
    throw error;
  }
}

async function getBikeStationInformation() {
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch('https://tor.publicbikesystem.net/ube/gbfs/v1/en/station_information', {
      method: 'GET',
      headers: {
        'accept': '*/*',
        'accept-language': 'en-US,en;q=0.9',
        'origin': 'https://bikesharetoronto.com',
        'priority': 'u=1, i',
        'referer': 'https://bikesharetoronto.com/',
        'sec-ch-ua': '"Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'cross-site',
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching bike station information:', error);
    throw error;
  }
}

async function getStationIdsByNames(stationNames) {
  try {
    const stationInfo = await getBikeStationInformation();
    
    const nameToIdMap = new Map();
    stationInfo.data.stations.forEach(station => {
      nameToIdMap.set(station.name, station.station_id);
    });
    
    const result = stationNames.map(spot => {
      const stationId = nameToIdMap.get(spot.fullName);
      return {
        name: spot.fullName,
        shortName: spot.shortName,
        station_id: stationId || null,
        section: spot.section,
        isPrimary: spot.isPrimary
      };
    });
    
    return result;
  } catch (error) {
    console.error('Error getting station IDs by names:', error);
    throw error;
  }
}

async function getStationInfo(stationIds) {
    const ids = [];
    stationIds.forEach(element => {
        if (!ids.includes(element.station_id)) {
            ids.push(element.station_id);
        }
    });

    try {
        const stationStatus = await getBikeStationStatus();
        const ret = [];

        stationStatus.data.stations.forEach(station => {
            if (ids.includes(station.station_id)) {
                const stationData = stationIds.find(s => s.station_id === station.station_id);
                ret.push({
                    name: stationData?.name || 'Unknown',
                    shortName: stationData?.shortName || 'Unknown',
                    station_id: station.station_id,
                    num_bikes_available: station.num_bikes_available_types?.mechanical || 0,
                    num_ebikes_available: station.num_bikes_available_types?.ebike || 0,
                    num_docks_available: station.num_docks_available,
                    last_reported: station.last_reported,
                    status: station.status,
                    section: stationData?.section || 'Other',
                    isPrimary: stationData?.isPrimary || false
                });
            }
        });
        
        return ret;
    } catch (error) {
        console.error('Error getting station information:', error);
        throw error;
    }
}

function formatTimeAgo(lastReported) {
    const now = Math.floor(Date.now() / 1000);
    const diffSeconds = now - lastReported;
    
    if (diffSeconds < 60) {
        return `< 1m`;
    } else if (diffSeconds < 3600) {
        const minutes = Math.floor(diffSeconds / 60);
        return `${minutes}m`;
    } else {
        const hours = Math.floor(diffSeconds / 3600);
        return `${hours}h`;
    }
}

function generateHTML(stations) {
    if (!Array.isArray(stations) || stations.length === 0) {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🚲 Toronto Bike Share Status</title>
    <link rel="stylesheet" href="/styles.css">
</head>
<body class="empty-page">
    <div class="empty">
        <h1>No station data</h1>
        <p>We could not find any station information right now. Please try refreshing in a moment.</p>
    </div>
</body>
</html>
        `;
    }

    const sections = {};
    let lastReported = 0;

    stations.forEach(station => {
        if (station.last_reported) {
            lastReported = Math.max(lastReported, station.last_reported);
        }

        if (!sections[station.section]) {
            sections[station.section] = { primary: [], secondary: [] };
        }

        if (station.isPrimary) {
            sections[station.section].primary.push(station);
        } else {
            sections[station.section].secondary.push(station);
        }
    });

    const preferredOrder = ['🏠 Home', '🏊 Pool', '💼 Work'];
    const sectionNames = [
        ...preferredOrder,
        ...Object.keys(sections).filter(section => !preferredOrder.includes(section))
    ];

    const renderStationRow = (station, isPrimary) => {
        const bikes = Number(station.num_bikes_available) || 0;
        const ebikes = Number(station.num_ebikes_available) || 0;
        const docks = Number(station.num_docks_available) || 0;
        const lastTime = station.last_reported ? formatTimeAgo(station.last_reported) : 'N/A';

        return `
            <li class="station ${isPrimary ? 'primary' : ''}">
                <div class="station-name">
                    <span>${station.shortName || station.name || 'Station'}</span>
                    ${isPrimary ? '<span class="tag">Primary</span>' : ''}
                </div>
                <div class="station-metrics">
                    <span class="metric bikes ${bikes === 0 ? 'empty' : ''}">
                        🚲 ${bikes}
                    </span>
                    <span class="metric ebikes ${ebikes === 0 ? 'empty' : ''}">
                        ⚡ ${ebikes}
                    </span>
                    <span class="metric docks ${docks === 0 ? 'empty' : ''}">
                        🅿️ ${docks}
                    </span>
                    <span class="metric meta">⏱ ${lastTime}</span>
                </div>
            </li>
        `;
    };

    const sectionsHTML = sectionNames
        .filter(section => sections[section])
        .map(section => {
            const { primary, secondary } = sections[section];
            const primaryRows = primary.map(station => renderStationRow(station, true)).join('');
            const secondaryRows = secondary.map(station => renderStationRow(station, false)).join('');
            const secondaryBlock = secondary.length
                ? `
                    <details class="secondary-group">
                        <summary>Backup stations (${secondary.length})</summary>
                        <ul class="station-list secondary">
                            ${secondaryRows}
                        </ul>
                    </details>
                `
                : '';

            return `
                <section class="section">
                    <h2>${section}</h2>
                    <ul class="station-list">
                        ${primaryRows}
                    </ul>
                    ${secondaryBlock}
                </section>
            `;
        })
        .join('');

    const relativeLastUpdated = lastReported ? formatTimeAgo(lastReported) : 'N/A';
    const absoluteLastUpdated = lastReported
        ? new Date(lastReported * 1000).toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' })
        : '—';
    const isLive = lastReported && Math.floor(Date.now() / 1000) - lastReported <= 600;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🚲 Toronto Bike Share Status</title>
    <link rel="stylesheet" href="/styles.css">
</head>
<body>
    <div class="page">
        <h1>Bike Share Status</h1>
        <p class="updated">
            <strong>${isLive ? 'Live' : 'Stale'} feed</strong> • ${relativeLastUpdated === 'N/A' ? 'No update time' : `Updated ${relativeLastUpdated} ago`} • ${absoluteLastUpdated}
        </p>
        ${sectionsHTML}
    </div>
    <a href="/" class="refresh-btn" title="Refresh">↻</a>
    <script>
        setTimeout(() => window.location.reload(), 120000);
    </script>
</body>
</html>
    `;
}

const server = http.createServer(async (req, res) => {
    const requestPath = req.url.split('?')[0];

    if (requestPath === '/styles.css') {
        await serveStaticFile(res, STYLES_PATH, 'text/css; charset=utf-8');
    } else if (requestPath === '/') {
        try {
            const results = await getStationIdsByNames(SPOTS);
            const stationInfo = await getStationInfo(results);
            
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(generateHTML(stationInfo));
        } catch (error) {
            console.error('Error:', error);
            res.writeHead(500, { 'Content-Type': 'text/html' });
            res.end(`<h1>Error</h1><p>${error.message}</p>`);
        }
    } else {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>');
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});
