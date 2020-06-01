let netSP = {
    timeInfo: [],
    instanceInfo: [],
    variableInfo: [],
    plots: [],
    encode: [],
    filter: {
        'Mean length': [0,1],
        'Mean angle': [-Math.PI,Math.PI],
        'Standard deviation length': [0,1],
        'Standard deviation angle': [0,2*Math.PI],
        'Outlying length': [0,1],
        'Outlying angle': [0,1],
    },
    metricName: [
        'Mean length',
        'Mean angle',
        'Standard deviation length',
        'Standard deviation angle',
        'Outlying length',
        'Outlying angle',
    ],
};

let codeManager = {
    isComputing: true,
    needRepeat: {},
    needComputation: true,
    needUpdate: false,
};

let controlVariable = {
    selectedMetric: 'Mean length',
    selectedData: 'employment',
    visualizing: 'LMH',
    interaction: {
        instance: 'noOption',
        variable: 'noOption',
    },
    displayType: 'series',
};