# Bike Share Snapshot

This project is a minimal Node.js server that renders a live snapshot of favorite Toronto Bike Share stations. It pulls real-time station status and metadata from the official GBFS feeds and presents them in a single-page view grouped by context (home, pool, work, etc.).

## Getting Started

```sh
npm install
node server.js
```

or 

```sh
docker build -t bike-share-snapshot .
docker run -p 3000:3000 bike-share-snapshot
```

Then open `http://localhost:3000`

## Customizing Stations

Edit the `SPOTS` in `spots.js` to change which stations are tracked or how they are grouped. Each entry supports `fullName`, `shortName`, `section`, and `isPrimary` fields.