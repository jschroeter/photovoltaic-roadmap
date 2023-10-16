async function fetchJson(url) {
    const data = await fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error("HTTP error " + response.status);
            }
            return response.json();
        })
    return data;
}

const getAverageDiff = ([x, ...xs]) => {
    // https://stackoverflow.com/a/40247111
    const add = (x, y) => x + y
    const sum = xs => xs.reduce(add, 0)
    const average = xs => xs[0] === undefined ? NaN : sum(xs) / xs.length

    return average(xs.reduce(([acc, last], x) => [[...acc, x - last], x], [[], x])[0]);
}

const data = await fetchJson('/data');

const xAxis = data.map(item => item.year);
const powerInstalledNet = data.map(item => item.data?.nettoleistungSumme);

const averageInstallationRate = getAverageDiff(powerInstalledNet.filter(Boolean));
const indexOfLastYearWithValue = powerInstalledNet.filter(Boolean).length - 1;
let prediction = powerInstalledNet[indexOfLastYearWithValue] + averageInstallationRate;



// based on prepared DOM, initialize echarts instance
const myChart = echarts.init(document.getElementById('chart'), null, {
    renderer: 'svg'
});

const seriesDefaults = {
    type: 'line',
    animation: false,
    label: {
        show: true,
        position: 'top',
        formatter: (item) => item.value ? (item.value / 1000).toFixed(1) : '-',
        fontSize: 16,
        fontWeight: 700
    },
    areaStyle: {}
};

const option = {
    title: {
        text: 'Photovoltaik in Allensbach'
    },
    tooltip: {
        trigger: 'axis',
        valueFormatter: (value) => value ? (value / 1000).toFixed(1) + ' MWp' : '?',
        axisPointer: {
            type: 'cross',
            label: {
                backgroundColor: '#6a7985'
            }
        }
    },
    legend: {
        data: ['', '']
    },
    toolbox: {
        feature: {
            saveAsImage: {}
        }
    },
    grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
    },
    xAxis: [
        {
            type: 'category',
            boundaryGap: false,
            data: xAxis
        }
    ],
    yAxis: [
        {
            type: 'value',
            axisLabel: {
                formatter: (value) => (value / 1000).toFixed(0) + ' MWp',
            }
        }
    ],
    series: [
        {
            ...seriesDefaults,
            name: 'Ziel',
            data: [2102, 3300, 4400, 5400, 6500, 7600, 8700, 9800, 10800, 11900, 13000],
            color: 'green'
        },
        {
            ...seriesDefaults,
            name: 'Installierte Leistung',
            data: powerInstalledNet,
            markPoint: {
                symbol: 'circle',
                symbolSize: 30,
                itemStyle: {
                    color: 'transparent',
                    borderColor: 'red',
                    borderWidth: 4
                },
                label: {
                    fontWeight: 'bold',
                    color: '#fff'
                },
                data: [{
                    name: 'Prognose',
                    value: 'Prognose',
                    xAxis: indexOfLastYearWithValue,
                    yAxis: prediction
                }, {
                    name: 'Prognose mit PV an B33',
                    value: 'Prognose mit PV an B33',
                    xAxis: '2024',
                    yAxis: prediction + (750 * 2)
                }]
            },

        },
    ]
};

myChart.setOption(option);

window.onresize = function () {
    myChart.resize();
};