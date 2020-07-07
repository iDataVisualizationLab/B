class DataProcessing {
    constructor() {
    }

    // get percentage of data for each instance
    // i.e. the sum of values of all variables of every instance is 1 at a time point
    static Percentages (dataRef) {
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
    static ScaleNetScatterPlot (plotData) {
        let myData = plotData.map(e=>{
            return {
                name: e.name,
                x0: e.x0,
                y0: e.y0,
                x1: e.x1,
                y1: e.y1,
            }
        });
        let dataX = [], dataY = [];
        dataX = plotData.map(e=>[e.x0,e.x1]).flat();
        let maxValueX = Math.max(...dataX);
        let minValueX = Math.min(...dataX);
        let rangeX = maxValueX - minValueX;
        dataY = plotData.map(e=>[e.y0,e.y1]).flat();
        let maxValueY = Math.max(...dataY);
        let minValueY = Math.min(...dataY);
        let rangeY = maxValueY - minValueY;
        myData.forEach(e=>{
            // if (rangeX >= rangeY) {
            //     e.x0 = rangeX !== 0 ? (e.x0-minValueX)/rangeX : 0.5;
            //     e.y0 = rangeX !== 0 ? e.y0/rangeX+(rangeX-rangeY-2*minValueY)/(2*rangeX) : 0.5;
            //     e.x1 = rangeX !== 0 ? (e.x1-minValueX)/rangeX : 0.5;
            //     e.y1 = rangeX !== 0 ? e.y1/rangeX+(rangeX-rangeY-2*minValueY)/(2*rangeX) : 0.5;
            // } else {
            //     e.x0 = rangeY !== 0 ? e.x0/rangeY+(rangeY-rangeX-2*minValueX)/(2*rangeY) : 0.5;
            //     e.y0 = rangeY !== 0 ? (e.y0-minValueY)/rangeY : 0.5;
            //     e.x1 = rangeY !== 0 ? e.x1/rangeY+(rangeY-rangeX-2*minValueX)/(2*rangeY) : 0.5;
            //     e.y1 = rangeY !== 0 ? (e.y1-minValueY)/rangeY : 0.5;
            // }
            e.x0 = rangeX !== 0 ? (e.x0-minValueX)/rangeX : 0.5;
            e.y0 = rangeY !== 0 ? (e.y0-minValueY)/rangeY : 0.5;
            e.x1 = rangeX !== 0 ? (e.x1-minValueX)/rangeX : 0.5;
            e.y1 = rangeY !== 0 ? (e.y1-minValueY)/rangeY : 0.5;
        });
        return myData;
    }

    // Get z-score of data
    // z-score of variables for an instance at a time point
    // format of dataRef: object
    // data -> instance -> variable -> time series
    static GetZScore (dataRef) {
        for (let i in dataRef) {
            for (let t = 0; t < netSP.timeInfo.length; t++) {
                let mean = 0;
                let sd = 0;
                let count = 0;
                for (let v in dataRef[i]) {
                    if (dataRef[i][v].length > 0 && typeof(dataRef[i][v][t]) === 'number') {
                        mean += dataRef[i][v][t];
                        count += 1;
                    }
                }
                mean /= count;
                for (let v in dataRef[i]) {
                    if (dataRef[i][v].length > 0 && typeof (dataRef[i][v][t]) === 'number')
                        sd += (dataRef[i][v][t]-mean)*(dataRef[i][v][t]-mean);
                }
                sd /= count;
                sd = Math.sqrt(sd);
                for (let v in dataRef[i]) {
                    if (dataRef[i][v].length > 0 && typeof(dataRef[i][v][t]) === 'number')
                        dataRef[i][v][t] = (dataRef[i][v][t]-mean)/sd;
                }
            }
        }
    }

    // Get z-score series


    // Get relative change
    // Standardize the initial value of all time series to 1
    // format of dataRef: object of instance -> variable -> time series
    static GetRelativeChange (dataRef) {
        for (let i in dataRef) {
            for (let v in dataRef[i]) {
                let minV = Math.min(...dataRef[i][v].filter(e=>typeof (e)==='number'));
                let maxV = Math.max(...dataRef[i][v].filter(e=>typeof (e)==='number'));
                let rangeV = maxV - minV;
                for (let t = 0; t < netSP.timeInfo.length; t++) {
                    dataRef[i][v][t] = (rangeV !== 0) ? (dataRef[i][v][t]-minV)/rangeV : 0.5;
                }
            }
        }
    }

    // Normalization the net scatter plot
    // Get the mean labor force of each state => become 1
    // Get new values of #employees of each sector at every time point
    // format of dataRef: object of instance -> variable -> time series
    static NormalizationNetScatterPlot (dataRef) {
        // Get mean of labor force
        for (let i in dataRef) {
            let meanLF = 0;
            for (let t = 0; t < netSP.timeInfo.length; t++) {
                let LF = 0;
                for (let v in dataRef[i]) {
                    if (typeof (dataRef[i][v][t]) === 'number')
                        LF += dataRef[i][v][t];
                }
                meanLF += LF/netSP.timeInfo.length;
            }
            for (let v in dataRef[i]) {
                for (let t = 0; t < netSP.timeInfo.length; t++) {
                    if (typeof (dataRef[i][v][t]) === 'number') {
                        dataRef[i][v][t] /= meanLF;
                    }
                }
            }
        }
    }

    // scale time series
    // dataRef: array of time series in sequence
    static ScaleTimeSeries (dataRef) {
        let data = [];
        let maxV = Math.max(...dataRef.filter(e=>typeof (e)==='number'));
        let minV = Math.min(...dataRef.filter(e=>typeof (e)==='number'));
        dataRef.forEach((e,i)=>{
            data[i] = (typeof (e) === 'number' && maxV !== minV) ? (e-minV)/(maxV-minV) : 'No value';
        });
        return data;
    }

    // z-normalization for 1 variable over time and instances
    // dataRef: object of instance -> variable -> time series
    static Z_Normalization2D (dataRef) {
        let data = {};
        for (let i in dataRef) {
            let count = 0;
            for (let v in dataRef[i]) {
                if (count === 0) {
                    data[v] = {};
                    data[v].data = [];
                    data[v].mean = 0;
                    data[v].sd = 0;
                }
                dataRef[i][v].forEach(e=>{
                    if (typeof (e) === 'number') data[v].data.push(e);
                });
            }
            count += 1;
        }
        for (let v in data) {
            let mean = 0;
            let sd = 0;
            data[v].data.forEach(e=>mean=mean+e);
            mean /= data[v].data.length;
            data[v].data.forEach(e=>sd=sd+Math.pow(e-mean,2));
            sd /= data[v].data.length;
            sd = Math.sqrt(sd);
            data[v].mean = mean;
            data[v].sd = sd;
        }
        for (let i in dataRef) {
            for (let v in dataRef[i]) {
                dataRef[i][v].forEach((e,index)=>{
                    if (typeof (e) === 'number') dataRef[i][v][index] = (e-data[v].mean)/data[v].sd;
                })
            }
        }
    }

}