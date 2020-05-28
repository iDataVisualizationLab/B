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
    ]
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
}

// let measureObj = selectedDisplay === "1D" ?
//     {
//         'Trend':0,
//         'Periodicity':1,
//         'Randomness':2,
//         'Mean':3,
//         'Dispersion':4,
//         'Outlying':5,
//         'Net mean':6,
//         'Net dispersion':7,
//         'Net Outlying':8,
//     } : {
//         'Outlying':0,
//         'Skinny':1,
//         'Skewed':2,
//         'Clumpy':1,
        // 'Sparse':4,
        // 'Striated':2,
        // 'Correlation':3,
        // "Intersections":4,
        // "Circular":5,
        // 'Trend':6,
        // 'Length':7
    // };