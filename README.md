# Toronto Bike Share Status

## Screenshots
### Website
<img src="website.png" alt="Mobile website view" width="340">

### Widget
<img src="widget.jpg" alt="Mobile widget view" width="320">

## About

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

## Using the Scriptable Widget
- Install the free [Scriptable](https://scriptable.app/) app on your iOS device.
- Create a new script, paste in the contents of `compact-widget.js`.
- Adjust the `SECTIONS` array near the top of the script if you want to rename sections or target different stations (the station names must match Bike Share Toronto’s official feed).
- Add a Small Scriptable widget to your Home Screen, choose the script you just created.
- The widget is set to refresh every minute by the actual refresh cadance is dictated by iOS.

## Customizing Stations

Edit the `stations` in `stations.js` to change which stations are tracked or how they are grouped. Each entry supports `fullName`, `shortName`, `section`, and `isPrimary` fields.

Contributions are welcome!
