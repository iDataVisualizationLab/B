let netSP = {
    timeInfo: [],
    instanceInfo: [],
    variableInfo: [],
    data: {},
    plots: [],
    encode: [],
    filter: {
        'q90': [0,1],
        // 'Std length': [0,1],
        'IQR': [0,1],
        'Outlying length': [0,1],
        'Outlying angle': [0,1],
        'Pos correlation': [0,1],
        'Neg correlation': [0,1],
        'Intersection': [0,1],
        'Translation': [0,1],
        'Entropy': [0,1],
    },
    metricName: [
        'q90',
        // 'Std length',
        'IQR',
        'Outlying length',
        'Outlying angle',
        'Pos correlation',
        'Neg correlation',
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
    selectedData: 'employment',
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
};

let designVariable = {
    // dimension reduction
    dr: {
        // plot on the right side
        rd: {
            plot: {
                position: [window.innerWidth-600,50],
                size: [80,80],
            },
            quitSign: {
                position: [window.innerWidth-510,50],
                size: [10,10],
                mouseOver: [],
                mouseClick: [],
            }
        }
    }
}