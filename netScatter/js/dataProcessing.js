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

    // Map data points to bin center and write to netSP.plots in a correct format for net scatter plot
    // format: netSP.plots[p].data = array of data points, each point is an object {name, bin_x0, bin_y0, bin_x1, bin_y1}
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

    // Bin mapping function
    // change position of each point in every net scatter plot to position of the bin contains it
    // input: NetSP.plot.data => output: NetSP.plot.data
    // Method: in research note
    // return bin center for each point => did not reduce duplicated bins => need update!
    static HexBinMapping() {
        let w = 1/(netSP.nBin-1);
        let h = 2*w/Math.sqrt(3);
        netSP.plots.forEach(e=>{
            let data = DataProcessing.ScaleNetScatterPlot(e.data);
            data.forEach((e_,i_)=>{
                for (let i = 0; i < 2; i++) {
                    let xP = (i===0) ? e_.x0 : e_.x1;
                    let yP = (i===0) ? e_.y0 : e_.y1;
                    let iA = Math.floor(xP/w);
                    let jA = Math.floor(yP*4/(3*h));
                    let iB = iA;
                    let jB = jA + 1;
                    let iC = iA + 1;
                    let jC = jA + (1-Math.pow(-1,jA))/2;
                    let xA = iA*w+0.25*w*(1-Math.pow(-1,jA));
                    let yA = jA*0.75*h;
                    let xB = iB*w+0.25*w*(1-Math.pow(-1,jB));
                    let yB = jB*0.75*h;
                    let xC = iC*w+0.25*w*(1-Math.pow(-1,jC));
                    let yC = jC*0.75*h;
                    let PA = Math.sqrt(Math.pow(xP-xA,2)+Math.pow(yP-yA,2));
                    let PB = Math.sqrt(Math.pow(xP-xB,2)+Math.pow(yP-yB,2));
                    let PC = Math.sqrt(Math.pow(xP-xC,2)+Math.pow(yP-yC,2));
                    if (yB <= 1) {
                        if (PA <= PB) {
                            if (PA <= PC) {
                                if (i===0) {
                                    e.data[i_].x0 = xA;
                                    e.data[i_].y0 = yA;
                                } else {
                                    e.data[i_].x1 = xA;
                                    e.data[i_].y1 = yA;
                                }
                            } else {
                                if (i===0) {
                                    e.data[i_].x0 = xC;
                                    e.data[i_].y0 = yC;
                                } else {
                                    e.data[i_].x1 = xC;
                                    e.data[i_].y1 = yC;
                                }
                            }
                        } else {
                            if (jA%2===0) {
                                if (PC <= PB) {
                                    if (i===0) {
                                        e.data[i_].x0 = xC;
                                        e.data[i_].y0 = yC;
                                    } else {
                                        e.data[i_].x1 = xC;
                                        e.data[i_].y1 = yC;
                                    }
                                } else {
                                    if (i===0) {
                                        e.data[i_].x0 = xB;
                                        e.data[i_].y0 = yB;
                                    } else {
                                        e.data[i_].x1 = xB;
                                        e.data[i_].y1 = yB;
                                    }
                                }
                            } else {
                                if (PB <= PC) {
                                    if (i===0) {
                                        e.data[i_].x0 = xB;
                                        e.data[i_].y0 = yB;
                                    } else {
                                        e.data[i_].x1 = xB;
                                        e.data[i_].y1 = yB;
                                    }
                                } else {
                                    if (i===0) {
                                        e.data[i_].x0 = xC;
                                        e.data[i_].y0 = yC;
                                    } else {
                                        e.data[i_].x1 = xC;
                                        e.data[i_].y1 = yC;
                                    }
                                }
                            }
                        }
                    } else {
                        if (jA%2===0) {
                            if (PA <= PC) {
                                if (i===0) {
                                    e.data[i_].x0 = xA;
                                    e.data[i_].y0 = yA;
                                } else {
                                    e.data[i_].x1 = xA;
                                    e.data[i_].y1 = yA;
                                }
                            } else {
                                if (i===0) {
                                    e.data[i_].x0 = xC;
                                    e.data[i_].y0 = yC;
                                } else {
                                    e.data[i_].x1 = xC;
                                    e.data[i_].y1 = yC;
                                }
                            }
                        } else {
                            if (i===0) {
                                e.data[i_].x0 = xA;
                                e.data[i_].y0 = yA;
                            } else {
                                e.data[i_].x1 = xA;
                                e.data[i_].y1 = yA;
                            }
                        }
                    }

                }
            });
        });
    }

    // Hexagon bin from d3
    // return list of bin centers' coordinates in NetSP.plot[index].bins
    static D3HexBinMapping() {
        let hexBins = d3.hexbin();
        let radius = 1/((netSP.nBin-1)*Math.sqrt(3));
        hexBins.extent([[0,0],[1,1]]);
        hexBins.radius(radius);
        netSP.plots.forEach(e=>{
            let data = DataProcessing.ScaleNetScatterPlot(e.data);
            let myMap = new Map();
            data.forEach(e_=>{
                let sb = hexBins([[e_.x0,e_.y0]]);
                let sc = [sb[0].x,sb[0].y];
                let eb = hexBins([[e_.x1,e_.y1]]);
                let ec = [eb[0].x,eb[0].y];
                if (sc[0]!==ec[0]||sc[1]!==ec[1]) {
                    if (!myMap.has(sc)) {
                        myMap.set(sc,[ec]);
                        e.arrows.push({start: sc, end: ec});
                    } else {
                        let arr = myMap.get(sc);
                        let check = arr.findIndex(e__=>e__[0]===ec[0]&&e__[1]===ec[1]) === -1;
                        if (check) {
                            arr.push(ec);
                            e.arrows.push({start: sc, end: [ec]});
                            myMap.delete(sc);
                            myMap.set(sc,arr);
                        }
                    }
                } else {
                    e.points.push(sc);
                }
            });
        });
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

    // min-max normalization for length
    // plotData is array of every instance data in the plot
    // each element/instance is an object: {name, x0: value at t0, y0: value at t0, x1: value at t1, y1: value at t1}
    // static NormalizationArrows (plotData) {
    //     let edge = ComputeQuantities.EdgeLength(plotData);
    //     let max =
    // }

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