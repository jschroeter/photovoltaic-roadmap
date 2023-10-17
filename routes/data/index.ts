export default defineCachedEventHandler(async () => {
  const numberOfYears = 11;
  const years = Array.from(Array(numberOfYears).keys()).map(value => 2020 + value);
  const currentDate = new Date();
  const requests = years.map(async (year) => {
    let data = null;
    let date = new Date(year, 11, 31);
    if (year <= currentDate.getFullYear()) {
      if (year === currentDate.getFullYear()) {
        date = currentDate;
      }
      
      data = await $fetch(
        'https://www.marktstammdatenregister.de/MaStR/Einheit/EinheitJson/GetSummenDerLeistungswerte',
        { query: { gridName: 'SEE', filter: `Inbetriebnahmedatum der Einheit~lt~'${date.toLocaleDateString('de-DE')}'~and~Energieträger~eq~'2495'~and~Gemeinde~eq~'allensbach'` } }
      );
    }

    return {
      date,
      data
    }
  });

  return Promise.all(requests);
}, {
  maxAge: 60 * 60 // 1h
});
