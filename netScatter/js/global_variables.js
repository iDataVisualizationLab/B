let netSP = {
    timeInfo: [],
    instanceInfo: [],
    variableInfo: [],
    data: {},
    plots: [],
    encode: [],
    filter: {
        // 'q90': [0,1],
        // 'Skewed length': [0,1],
        // 'Skewed angle': [0,1],
        // 'Std length': [0,1],
        // 'IQR': [0,1],
        'Outlying vector': [0,1],
        'Outlying length': [0,1],
        'Outlying angle': [0,1],
        'Correlation': [0,1],
        // 'Neg correlation': [0,1],
        'Entropy': [0,1],
        'Intersection': [0,1],
        'Translation': [0,1],
        'Homogeneous': [0,1],
    },
    metricName: [
        // 'q90',
        // 'Skewed length',
        // 'Skewed angle',
        // 'Std length',
        // 'IQR',
        'Outlying vector',
        'Outlying length',
        'Outlying angle',
        'Correlation',
        // 'Neg correlation',
        'Entropy',
        'Intersection',
        'Translation',
        'Homogeneous',
    ],
    binType: 'leader',
    minNumberArrows: 50,
    maxNumberArrows: 150,
    step: 1,
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
    selectedData: 'Life_expectancy',
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
    mouseOver: {
        check: false,
        index: -1,
    },
    mouseClick: {
        index: [],
    },
    metricSeries: false,
    // normalization: 'individual',
    normalization: 'similarUnit',
};

let designVariable = {
    // dimension reduction
    dr: {
        // plot on the right side
        rd: {
            plot: {
                position: [window.innerWidth-700,50],
                size: [80,80],
            },
            quitSign: {
                position: [window.innerWidth-610,50],
                size: [10,10],
                mouseOver: [],
                mouseClick: [],
            }
        }
    }
}

let timeMeasure = [0,0,0,0,0,0,0,0];

let paper = {
    data: [],
}