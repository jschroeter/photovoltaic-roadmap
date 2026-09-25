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

const urlParams = new URLSearchParams(window.location.search);
if (!urlParams.get('municipality')) {
    urlParams.set('municipality', 'Allensbach')
}
const municipality = urlParams.get('municipality');
const targetValue = urlParams.get('target') || 13000;
const targetYear = 2030;

const data = await fetchJson('/data?' + urlParams);

const powerInstalledNet = data.map(item => [item.date, item.data.nettoleistungSumme]);
const lastUpdateDate = new Date(data[data.length - 1].date);

// label only the year ends and the latest value, monthly values are shown in the tooltip
function isLabeledPoint(date) {
    return new Date(date).getMonth() === 11 || new Date(date).getTime() === lastUpdateDate.getTime();
}

function buildTargetSeriesData() {
    const startYear = new Date(data[0].date).getFullYear();
    const startValue = data[0].data.nettoleistungSumme;
    const stepToTarget = (targetValue - startValue) / (targetYear - startYear);

    return Array.from(Array(targetYear - startYear + 1).keys()).map(index => [
        new Date(startYear + index, 11, 31).getTime(),
        startValue + index * stepToTarget
    ]);
}

const targetSeriesData = buildTargetSeriesData();

function findYearEndValue(series, date) {
    const year = new Date(date).getFullYear();
    const point = series.find(item => new Date(item[0]).getMonth() === 11 && new Date(item[0]).getFullYear() === year);
    return point?.[1];
}

// at each year end the label of the higher value goes above, the lower one below, so they don't overlap
function withLabelPositions(series, otherSeries) {
    return series.map(([date, value]) => {
        const otherValue = findYearEndValue(otherSeries, date);
        const position = otherValue !== undefined && new Date(date).getMonth() === 11 && value < otherValue ? 'bottom' : 'top';
        return { value: [date, value], label: { position } };
    });
}

function buildMarkerPoints() {
    if (municipality !== 'Allensbach') return;

    const b33Date = new Date(2024, 4, 31);
    const point = powerInstalledNet.find(item => new Date(item[0]) >= b33Date);
    if (!point) return;

    return [{
        value: 'Inbetriebnahme PV an B33',
        xAxis: new Date(point[0]),
        yAxis: point[1]
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
        valueFormatter: (value) => value ? (value / 1000).toFixed(2) + ' MWp' : '?',
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
            data: withLabelPositions(targetSeriesData, powerInstalledNet),
            color: '#6aa84f',
            lineStyle: {
                type: 'dashed',
                width: 4
            }
        },
        {
            ...seriesDefaults,
            name: 'Installierte Leistung',
            data: withLabelPositions(powerInstalledNet, targetSeriesData),
            showAllSymbol: true,
            symbolSize: (value) => isLabeledPoint(value[0]) ? 4 : 0,
            label: {
                ...seriesDefaults.label,
                formatter: (item) => isLabeledPoint(item.value[0]) ? seriesDefaults.label.formatter(item) : ''
            },
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