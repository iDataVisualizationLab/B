class EncodePlots {
    constructor() {
    }

    // encode net scatter plots
    // array: index -> index of plot, value -> information of plot: two variables, time point
    // variableFile: array of line = {code: ..., name: ...} in the variable file
    static NetScatterPlot() {
        netSP.encode.length = 0;
        let numVar = netSP.variableInfo.length;
        let numTime = netSP.timeInfo.length;
        let index = 0;
        let step = netSP.step;
        for (let t = step; t < numTime; t++) {     // get from second time point to the end
            for (let x = 0; x < numVar - 1; x++) {
                for (let y = x + 1; y < numVar; y++) {
                    netSP.encode[index] = [netSP.variableInfo[x][1],netSP.variableInfo[y][1],netSP.timeInfo[t]];
                    index += 1;
                }
            }
        }
    }
}