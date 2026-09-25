// GetSummenDerLeistungswerte no longer includes anonymized units (i.e. almost all
// privately owned rooftop systems), so the sums are calculated from the unit list instead.
const UNITS_URL = 'https://www.marktstammdatenregister.de/MaStR/Einheit/EinheitJson/GetErweiterteOeffentlicheEinheitStromerzeugung';
const PAGE_SIZE = 20000;

interface Unit {
  InbetriebnahmeDatum: string | null;
  EndgueltigeStilllegungDatum: string | null;
  Nettonennleistung: number | null;
  Bruttoleistung: number | null;
}

// MaStR dates look like "/Date(1716422400000)/"
function parseMastrDate(value: string | null): number | null {
  const match = value?.match(/\d+/);
  return match ? Number(match[0]) : null;
}

async function fetchUnits(municipality: string) {
  const units: Unit[] = [];
  for (let page = 1; ; page++) {
    const response = await $fetch<{ Data: Unit[], Total: number }>(UNITS_URL, {
      query: {
        gridName: 'SEE',
        page,
        pageSize: PAGE_SIZE,
        filter: `Energieträger~eq~'2495'~and~Gemeinde~eq~'${municipality}'`
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

  const units = (await fetchUnits(municipality)).map(unit => ({
    start: parseMastrDate(unit.InbetriebnahmeDatum),
    end: parseMastrDate(unit.EndgueltigeStilllegungDatum),
    net: unit.Nettonennleistung ?? 0,
    gross: unit.Bruttoleistung ?? 0
  }));

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
    const active = units.filter(unit => unit.start !== null && unit.start < cutoff && (unit.end === null || unit.end >= cutoff));
    result.push({
      date,
      data: {
        bruttoleistungSumme: active.reduce((sum, unit) => sum + unit.gross, 0),
        nettoleistungSumme: active.reduce((sum, unit) => sum + unit.net, 0)
      }
    });

    if (date === currentDate) {
      return result;
    }
  }
}, {

  getKey(event) {
    const municipality = new URL('http://' + event.path).searchParams.get('municipality');
    return 'monthly-' + new Date().toDateString() + municipality
  },
  maxAge: 60 * 60 * 24 // 1d
});
