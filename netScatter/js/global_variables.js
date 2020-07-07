let netSP = {
    timeInfo: [],
    instanceInfo: [],
    variableInfo: [],
    data: {},
    plots: [],
    encode: [],
    filter: {
        'Mean length': [0,Infinity],
        'Mean angle': [-Math.PI,Math.PI],
        'Standard deviation length': [0,Infinity],
        'Standard deviation angle': [0,2*Math.PI],
        'Outlying length': [0,1],
        'Outlying angle': [0,1],
        'Intersection': [0,1],
        'Translation': [0,Infinity],
        'Entropy': [0,1],
    },
    metricName: [
        'Mean length',
        'Mean angle',
        'Standard deviation length',
        'Standard deviation angle',
        'Outlying length',
        'Outlying angle',
        'Intersection',
        'Translation',
        'Entropy',
    ],
};

let codeManager = {
    isComputing: true,
    needRepeat: {},
    needComputation: true,
    needUpdate: false,
    check: true,
};

let controlVariable = {
    selectedMetric: 'Translation',
    selectedData: 'HPCC',
    visualizing: 'LMH',
    interaction: {
        instance: 'noOption',
        variable1: 'noOption',
        variable2: 'noOption',
        time: 'noOption',
    },
    displayType: 'series',
    scalingType: 'z-score',     //'z-score' or 'multiplier'
    displaySeries: false,
};