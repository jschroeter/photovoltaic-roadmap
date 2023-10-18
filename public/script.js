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

const powerInstalledNet = data.map(item => [item.date, item.data?.nettoleistungSumme]);

const onlyWithValue = powerInstalledNet.filter(item => Boolean(item[1]));
const averageInstallationRate = getAverageDiff(onlyWithValue.map(item => item[1]));
const indexOfLastYearWithValue = onlyWithValue.length - 1;
const lastUpdateDate = new Date(powerInstalledNet[indexOfLastYearWithValue][0]);
let prediction = powerInstalledNet[indexOfLastYearWithValue][1] + averageInstallationRate;


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
        formatter: (item) => (item.value[1] / 1000).toFixed(1),
        fontSize: 18,
        fontWeight: 'bold',
        textBorderWidth: 3
    },
    lineStyle: {
        width: 4
    },
    areaStyle: {
        opacity: 0.4
    }
};

const option = {
    title: {
        text: 'Photovoltaik in Allensbach bis 2030',
        padding: [5, 0, 0, 5],
        subtext: 'Stand: ' + lastUpdateDate.toLocaleDateString('de-DE'),
        subtextStyle: {
            fontSize: 15
        }
    },
    tooltip: {
        trigger: 'axis',
        valueFormatter: (value) => value ? (value / 1000).toFixed(1) + ' MWp' : '?',
    },
    legend: {
        icon: 'rect',
        data: ['Installierte Leistung', 'Ziel'],
        right: '10%',
        textStyle: {
            fontSize: 18
        },
        selectedMode: false
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
            type: 'time',
            boundaryGap: false,
            maxInterval: 3600 * 1000 * 24 * 28 * 12
        }
    ],
    yAxis: [
        {
            type: 'value',
            axisLabel: {
                formatter: (value) => (value / 1000).toFixed(0) + ' MWp',
            },
            max: 'dataMax'
        }
    ],
    series: [
        {
            ...seriesDefaults,
            name: 'Ziel',
            data: [
                [new Date(2020, 11, 31), 2102],
                [new Date(2021, 11, 31), 3280],
                [new Date(2022, 11, 31), 4360],
                [new Date(2023, 11, 31), 5440],
                [new Date(2024, 11, 31), 6520],
                [new Date(2025, 11, 31), 7600],
                [new Date(2026, 11, 31), 8680],
                [new Date(2027, 11, 31), 9760],
                [new Date(2028, 11, 31), 10840],
                [new Date(2029, 11, 31), 11920],
                [new Date(2030, 11, 31), 13000],
            ],
            color: '#6aa84f',
            lineStyle: {
                type: 'dashed',
                width: 4
            }
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
                    position: ['130%', '30%'],
                    fontSize: 18,
                    fontWeight: 'bold',
                    color: '#000',
                    textBorderColor: '#fff',
                    textBorderWidth: 3
                },
                data: [/*{
                    value: 'Prognose',
                    xAxis: new Date(2023, 11, 31),
                    yAxis: prediction
                }, */{
                    value: 'Prognose mit PV an B33',
                    xAxis: new Date(2024, 5, 31),
                    yAxis: 3600 + 300 + 200 + 1800
                }]
            },

        },
    ]
};

myChart.setOption(option);

window.onresize = function () {
    myChart.resize();
};