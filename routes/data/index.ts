export default defineCachedEventHandler(async (event) => {
  const numberOfYears = 11;
  const years = Array.from(Array(numberOfYears).keys()).map(value => 2020 + value);
  const currentDate = new Date();
  const municipality = new URL('http://' + event.path).searchParams.get('municipality');

  const requests = years.map(async (year) => {
    let data = null;
    let date = new Date(year, 11, 31);
    if (year <= currentDate.getFullYear()) {
      if (year === currentDate.getFullYear()) {
        date = currentDate;
      }
      
      data = await $fetch(
        'https://www.marktstammdatenregister.de/MaStR/Einheit/EinheitJson/GetSummenDerLeistungswerte',
        { query: { gridName: 'SEE', filter: `Inbetriebnahmedatum der Einheit~lt~'${date.toLocaleDateString('de-DE')}'~and~Energieträger~eq~'2495'~and~Gemeinde~eq~'${municipality}'` } }
      );
    }

    return {
      date,
      data
    }
  });

  return Promise.all(requests);
}, {
  maxAge: 0 //60 * 60 // 1h
});
