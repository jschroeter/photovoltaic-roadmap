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

const urlParams = new URLSearchParams(window.location.search);
if (!urlParams.get('municipality')) {
    urlParams.set('municipality', 'Allensbach')
}
const municipality = urlParams.get('municipality');
const targetValue = urlParams.get('target') || 13000;
const targetYear = 2030;

const data = await fetchJson('/data?' + urlParams);

const powerInstalledNet = data.map(item => [item.date, item.data?.nettoleistungSumme]);

const onlyWithValue = powerInstalledNet.filter(item => Boolean(item[1]));
const averageInstallationRate = getAverageDiff(onlyWithValue.map(item => item[1]));
const indexOfLastYearWithValue = onlyWithValue.length - 1;
const lastUpdateDate = new Date(powerInstalledNet[indexOfLastYearWithValue][0]);
let prediction = powerInstalledNet[indexOfLastYearWithValue][1] + averageInstallationRate;

function buildTargetSeriesData() {
    let currentValue = data[0].data.nettoleistungSumme;
    const stepToTarget = (targetValue - currentValue) / (data.length - 1);
    const targetData = data.map((item, index) => {
        if (index > 0) {
            currentValue += stepToTarget;
        }
        return [
            new Date(item.date).setMonth(11, 31),
            currentValue
        ]
    });

    return targetData;
}

function buildMarkerPoints() {
    if (municipality !== 'Allensbach') return;

    return [{
        value: 'Prognose mit PV an B33',
        xAxis: new Date(2024, 5, 31),
        yAxis: 3600 + 300 + 200 + 1800
    }];
}


// based on prepared DOM, initialize echarts instance
const myChart = echarts.init(document.getElementById('chart'), null, {
    //renderer: 'svg'
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
        text: `Photovoltaik in ${municipality} bis 2030`,
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
            splitNumber: 11,
            axisLabel: {
                fontSize: 18
            }
        }
    ],
    yAxis: [
        {
            type: 'value',
            axisLabel: {
                formatter: (value) => (value / 1000).toFixed(0) + ' MWp',
                fontSize: 18
            },
            max: 'dataMax'
        }
    ],
    series: [
        {
            ...seriesDefaults,
            name: 'Ziel',
            data: buildTargetSeriesData(),
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
                data: buildMarkerPoints()
            },

        },
    ]
};

myChart.setOption(option);

window.onresize = function () {
    myChart.resize();
};