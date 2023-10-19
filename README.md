# Photovoltaic Roadmap for German Municipalities

Simple webapp to show a roadmap for photovoltaic power of a municipality in Germany from 2020 till 2030.
It fetches the past and up-to-date data from Marktstammdatenregister by Bundesnetzagentur.

## Demo

It's deployed at https://pv-roadmap.netlify.app/

## Parameters

`municipality` defines the 'Gemeinde' filter of Marktstammdatenregister
`target` defines the power goal for 2030 in kW

### Examples

https://pv-roadmap.netlify.app/?municipality=Allensbach&target=13000

https://pv-roadmap.netlify.app/?municipality=Konstanz&target=50000