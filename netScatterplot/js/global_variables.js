let netSP = {
    timeInfo: [],
    instanceInfo: [],
    variableInfo: [],
    plots: [],
    encode: [],
    filter: {
        mean_length: [0,1],
        mean_angle: [-Math.PI,Math.PI],
        sd_length: [0,1],
        sd_angle: [0,2*Math.PI],
        outlying_length: [0,1],
        outlying_angle: [0,1],
    }
};

let codeManager = {
    isComputing: true,
    needRepeat: {},
};