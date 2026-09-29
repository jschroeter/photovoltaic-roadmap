// GetSummenDerLeistungswerte no longer includes anonymized units (i.e. almost all
// privately owned rooftop systems), so the sums are calculated from the unit list instead.
const UNITS_URL = 'https://www.marktstammdatenregister.de/MaStR/Einheit/EinheitJson/GetErweiterteOeffentlicheEinheitStromerzeugung';
const PAGE_SIZE = 20000;
const ENERGY_SOURCE_SOLAR = '2495';
const ENERGY_SOURCE_STORAGE = '2496';
const STORAGE_TECHNOLOGY_BATTERY = 524;

interface Unit {
  InbetriebnahmeDatum: string | null;
  EndgueltigeStilllegungDatum: string | null;
  Nettonennleistung: number | null;
  Bruttoleistung: number | null;
  NutzbareSpeicherkapazitaet?: number | null;
  Stromspeichertechnologie?: number | null;
}

// MaStR dates look like "/Date(1716422400000)/"
function parseMastrDate(value: string | null): number | null {
  const match = value?.match(/\d+/);
  return match ? Number(match[0]) : null;
}

async function fetchUnits(municipality: string, energySource: string) {
  const units: Unit[] = [];
  for (let page = 1; ; page++) {
    const response = await $fetch<{ Data: Unit[], Total: number }>(UNITS_URL, {
      query: {
        gridName: 'SEE',
        page,
        pageSize: PAGE_SIZE,
        filter: `Energieträger~eq~'${energySource}'~and~Gemeinde~eq~'${municipality}'`
      }
    });
    units.push(...response.Data);
    if (response.Data.length < PAGE_SIZE || units.length >= response.Total) {
      return units;
    }
  }
}

export default defineCachedEventHandler(async (event) => {
  const currentDate = new Date();
  const municipality = new URL('http://' + event.path).searchParams.get('municipality');

  const [solarUnits, storageUnits] = await Promise.all([
    fetchUnits(municipality, ENERGY_SOURCE_SOLAR),
    fetchUnits(municipality, ENERGY_SOURCE_STORAGE)
  ]);

  const toPeriod = (unit: Unit) => ({
    start: parseMastrDate(unit.InbetriebnahmeDatum),
    end: parseMastrDate(unit.EndgueltigeStilllegungDatum)
  });

  const units = solarUnits.map(unit => ({
    ...toPeriod(unit),
    net: unit.Nettonennleistung ?? 0,
    gross: unit.Bruttoleistung ?? 0
  }));

  // storage units also include e.g. pumped hydro, only batteries are of interest here
  const batteries = storageUnits
    .filter(unit => unit.Stromspeichertechnologie === STORAGE_TECHNOLOGY_BATTERY)
    .map(unit => ({
      ...toPeriod(unit),
      capacity: unit.NutzbareSpeicherkapazitaet ?? 0
    }));

  const isActive = (unit: { start: number | null, end: number | null }, cutoff: number) =>
    unit.start !== null && unit.start < cutoff && (unit.end === null || unit.end >= cutoff);

  // one entry per month end from December 2020 until today
  const result = [];
  for (let month = 11; ; month++) {
    let date = new Date(2020, month + 1, 0);
    // include units commissioned on the last day of the month
    let cutoff = new Date(2020, month + 1, 1).getTime();
    if (date >= currentDate) {
      date = currentDate;
      cutoff = currentDate.getTime();
    }

    // commissioned before the cutoff, minus permanently decommissioned units
    const active = units.filter(unit => isActive(unit, cutoff));
    const activeBatteries = batteries.filter(unit => isActive(unit, cutoff));
    result.push({
      date,
      data: {
        bruttoleistungSumme: active.reduce((sum, unit) => sum + unit.gross, 0),
        nettoleistungSumme: active.reduce((sum, unit) => sum + unit.net, 0),
        // usable storage capacity in kWh
        batteriekapazitaetSumme: activeBatteries.reduce((sum, unit) => sum + unit.capacity, 0)
      }
    });

    if (date === currentDate) {
      return result;
    }
  }
}, {

  getKey(event) {
    const municipality = new URL('http://' + event.path).searchParams.get('municipality');
    return 'monthly-battery-' + new Date().toDateString() + municipality
  },
  maxAge: 60 * 60 * 24 // 1d
});
