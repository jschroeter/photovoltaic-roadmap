export default defineCachedEventHandler(async () => {
  const numberOfYears = 11;
  const years = Array.from(Array(numberOfYears).keys()).map(value => 2020 + value);
  const currentYear = new Date().getFullYear();
  const requests = years.map(async (year) => {
    let data = null;
    if (year <= currentYear) {
      const date = `31.12.${year}`;
      data = await $fetch(
        'https://www.marktstammdatenregister.de/MaStR/Einheit/EinheitJson/GetSummenDerLeistungswerte',
        { query: { gridName: 'SEE', filter: `Inbetriebnahmedatum der Einheit~lt~'${date}'~and~Energieträger~eq~'2495'~and~Gemeinde~eq~'allensbach'` } }
      );
    }

    return {
      year,
      data
    }
  });

  return Promise.all(requests);
}, {
  maxAge: 60 * 60 // 1h
});
