let netSP = {
    timeInfo: [],
    instanceInfo: [],
    variableInfo: [],
    plots: [],
    encode: [],
    filter: {
        // 'Mean length': [0,1],
        // 'Mean angle': [-Math.PI,Math.PI],
        // 'Standard deviation length': [0,1],
        // 'Standard deviation angle': [0,2*Math.PI],
        'Outlying length': [0,1],
        'Outlying angle': [0,1],
        'Intersection': [0,1],
        'Translation': [-1,1],
        'Complexity': [0,1],
    },
    metricName: [
        // 'Mean length',
        // 'Mean angle',
        // 'Standard deviation length',
        // 'Standard deviation angle',
        'Outlying length',
        'Outlying angle',
        'Intersection',
        'Translation',
        'Complexity',
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
    selectedData: 'employment',
    visualizing: 'LMH',
    interaction: {
        instance: 'noOption',
        variable: 'noOption',
    },
    displayType: 'series',
    scalingType: 'z-score',     //'z-score' or 'multiplier'
};