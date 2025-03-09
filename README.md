# Photovoltaic Roadmap for German Municipalities

Simple webapp which shows a roadmap for photovoltaic power of any municipality in Germany from 2020 till 2030.

Open to be used by anyone, just provide the name of the municipality and the target for 2030 via URL parameters:

- `municipality` defines the 'Gemeinde' filter of Marktstammdatenregister
- `target` defines the power goal for 2030 in kW

e.g.:
- https://pv-roadmap.netlify.app/?municipality=Allensbach&target=13000
- https://pv-roadmap.netlify.app/?municipality=Konstanz&target=50000

It fetches the past and up-to-date data from [Marktstammdatenregister](https://www.marktstammdatenregister.de/MaStR) by Bundesnetzagentur.

## Demo

[![Preview of the app](preview.avif)](https://pv-roadmap.netlify.app/)

It's deployed at https://pv-roadmap.netlify.app/

## IFrame embedding

The roadmap can also be embedded into websites as IFrame, e.g.:

```
<iframe src="https://pv-roadmap.netlify.app/?municipality=Allensbach&target=13000" style="width: 100%; aspect-ratio: 16 / 9;" sandbox="allow-scripts allow-downloads"></iframe>
```
