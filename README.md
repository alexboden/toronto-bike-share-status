# Bike Share Status

A minimal Node.js server that renders a live snapshot your favourite Toronto Bike Share stations for easy viewing.

There is also a standalone script, `compact-widget.js`, that can be embedded as an iOS widget. You can run JavaScript code in a widget using [Scriptable](https://scriptable.app/).

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

## Screenshots
### Website
<img src="website.png" alt="Mobile website view" width="340">

### Widget
<img src="widget.jpg" alt="Mobile widget view" width="320">



## Customizing Stations

Edit the `SPOTS` in `spots.js` to change which stations are tracked or how they are grouped. Each entry supports `fullName`, `shortName`, `section`, and `isPrimary` fields.

Contributions are welcome!
