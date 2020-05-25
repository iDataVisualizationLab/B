class EncodePlots {
    constructor() {
    }

    // encode net scatter plots
    // array: index -> index of plot, value -> information of plot: two variables, time point
    // variableFile: array of line = {code: ..., name: ...} in the variable file
    static NetScatterPlot(variableFile) {
        let numVar = variableFile.length;
        let numTime = netSP.timeInfo.length;
        let index = 0;
        let array = [];
        for (let t = 1; t < numTime; t++) {     // get from second time point to the end
            for (let x = 0; x < numVar - 1; x++) {
                for (let y = x + 1; y < numVar; y++) {
                    array[index] = [variableFile[x].name,variableFile[y].name,netSP.timeInfo[t]];
                    index += 1;
                }
            }
        }
        return array;
    }
}