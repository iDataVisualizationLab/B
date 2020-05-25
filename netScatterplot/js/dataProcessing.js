class DataProcessing {
    constructor() {
    }

    // normalization type 1
    // get percentage of data for each instance
    // i.e. the sum of values of all variables of every instance is 1 at a time point
    static NormalizationType1 (dataRef) {
        // format of data: object
        // data -> instance -> variable -> time series
        for (let i in dataRef) {
            for (let t = 0; t < netSP.timeInfo.length; t++) {
                let sum = 0;
                for (let v in dataRef[i]) {
                    if (dataRef[i][v].length > 0 && typeof(dataRef[i][v][t]) === 'number') sum += dataRef[i][v][t];
                }
                for (let v in dataRef[i]) {
                    if (dataRef[i][v].length > 0 && typeof(dataRef[i][v][t]) === 'number') dataRef[i][v][t] /= sum;
                }
            }
        }
    }

    // store data points to netSP.plots in a correct format for net scatter plot
    // format: netSP.plots[p].data = array of data points, each point is an object {name, x0, y0, x1, y1}
    // dataRef: reference to data in format: data -> instance -> variable -> time series
    // dataRef: result of ReadFile class
    static NetScatterPlot (dataRef) {
        let numPlot = netSP.encode.length;
        for (let p = 0; p < numPlot; p++) {
            netSP.plots[p].data = [];
            let xVar = netSP.encode[p][0];
            let yVar = netSP.encode[p][1];
            let time = netSP.encode[p][2];
            let timeIndex = netSP.timeInfo.findIndex(e=>e===time);
            for (let i in dataRef) {
                if (dataRef[i][xVar].length > 0 && dataRef[i][yVar].length > 0) {
                    let x1 = dataRef[i][xVar][timeIndex];
                    let y1 = dataRef[i][yVar][timeIndex];
                    let x0 = dataRef[i][xVar][timeIndex-1];
                    let y0 = dataRef[i][yVar][timeIndex-1];
                    let check = typeof(x0) === 'number' && typeof(y0) === 'number' && typeof(x1) === 'number' && typeof(y1) === 'number';
                    if (check) netSP.plots[p].data.push({
                        name: i,
                        x0: x0,
                        y0: y0,
                        x1: x1,
                        y1: y1,
                    });
                }
            }
        }
    }

    // Normalization values in every net scatter plot
    // plotData is array of every instance data in the plot
    // each element/instance is an object: {name, x0: value at t0, y0: value at t0, x1: value at t1, y1: value at t1}
    static NormalizationNetScatterPlot (plotData) {
        let myData = plotData.map(e=>{
            return {
                name: e.name,
                x0: e.x0,
                y0: e.y0,
                x1: e.x1,
                y1: e.y1,
            }
        });
        let data = plotData.map(e=>[e.x0,e.y0,e.x1,e.y1]).flat();
        let maxValue = Math.max(...data);
        let minValue = Math.min(...data);
        let range = maxValue - minValue;
        myData.forEach(e=>{
            e.x0 = range !== 0 ? (e.x0-minValue)/range : 0.5;
            e.y0 = range !== 0 ? (e.y0-minValue)/range : 0.5;
            e.x1 = range !== 0 ? (e.x1-minValue)/range : 0.5;
            e.y1 = range !== 0 ? (e.y1-minValue)/range : 0.5;
        });
        return myData;
    }


}