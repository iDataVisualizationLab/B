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
        let step = netSP.step;
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
                    let x0 = dataRef[i][xVar][timeIndex-step];
                    let y0 = dataRef[i][yVar][timeIndex-step];
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
    static D3HexBinMapping(plotIndex,nBin) {
        let hexBins = d3.hexbin();
        let radius = 1/((nBin-1)*Math.sqrt(3));
        hexBins.extent([[0,0],[1,1]]);
        hexBins.radius(radius);
        let data = DataProcessing.ScaleNetScatterPlot(netSP.plots[plotIndex].data);
        let sArr = data.map(e_=>[e_.x0,e_.y0]);
        sArr.forEach((e_,i_)=>{e_.index=i_});
        let sBins = hexBins(sArr);
        let eArr = data.map(e_=>[e_.x1,e_.y1]);
        eArr.forEach((e_,i_)=>{e_.index=i_});
        let eBins = hexBins(eArr);
        let sCenters = [];
        let sPoints = new Map();
        sBins.forEach((e_,i_)=>{
            sCenters[i_] = [e_.x,e_.y];
            e_.forEach(e__=>{
                sPoints.set(e__.index,i_);
            });
        });
        let eCenters = [];
        let ePoints = new Map();
        eBins.forEach((e_,i_)=>{
            eCenters[i_] = [e_.x,e_.y];
            e_.forEach(e__=>{
                ePoints.set(e__.index,i_);
            });
        });
        let binArrow = [];
        data.forEach((e_,i_)=>{
            let bin1 = sPoints.get(i_);
            let bin2 = ePoints.get(i_);
            binArrow.push([bin1,bin2]);
        });
        let myMap = new Map();
        let arrow = [];
        let count = 0;
        binArrow.forEach((e_,i_)=>{
            let key = e_[0].toString()+'-'+e_[1].toString();
            if (!myMap.has(key)) {
                myMap.set(key,count);
                arrow[count] = e_;
                arrow[count].instance = [i_];
                count = count + 1;
            } else {
                arrow[myMap.get(key)].instance.push(i_);
            }
        });
        arrow.forEach(e_=>{
            if (sCenters[e_[0]][0] !== eCenters[e_[1]][0] || sCenters[e_[0]][1] !== eCenters[e_[1]][1]) {
                netSP.plots[plotIndex].arrows.push({start:sCenters[e_[0]],end:eCenters[e_[1]],instance:e_.instance.map(e__=>e__)});
            } else {
                netSP.plots[plotIndex].points.push(sCenters[e_[0]]);
            }
        });
    }

    // Leader bins
    static LeaderBinMapping (plotIndex,threshold) {
        let L = [];
        let data = DataProcessing.ScaleNetScatterPlot(netSP.plots[plotIndex].data);
        let currentLeader = [];
        data.forEach((e_,i_)=>{
            let theLeader = DataProcessing.FindLeader(data,L,i_,threshold);
            if (theLeader === 'leader') {
                L.push([i_]);
                currentLeader[i_] = 'leader';
            } else {
                L[theLeader].push(i_);
                currentLeader[i_] = theLeader;
            }
        });
        data.forEach((e_,i_)=>{
            if (currentLeader[i_] !== 'leader') {
                let theLeader = DataProcessing.FindLeader(data,L,i_,threshold);
                if (theLeader !== currentLeader[i_]) {
                    let index = L[currentLeader[i_]].findIndex(e__=>e__===i_);
                    L[currentLeader[i_]].splice(index,1);
                    L[theLeader].push(i_);
                }
            }
        });
        L.forEach(e_=>{
            netSP.plots[plotIndex].arrows.push({start:[data[e_[0]].x0,data[e_[0]].y0],end:[data[e_[0]].x1,data[e_[0]].y1],instance:e_.map(e__=>e__)});
        });
    }

    // Find nearest leader
    static FindLeader(data,Leader,arrow,threshold) {
        let length = Leader.length;
        let minDis = Infinity;
        let theLeader = 'leader';
        for (let i = 0; i < length; i++) {
            let d1 = data[Leader[i][0]].x0 - data[arrow].x0;
            let d2 = data[Leader[i][0]].y0 - data[arrow].y0;
            let d3 = data[Leader[i][0]].x1 - data[arrow].x1;
            let d4 = data[Leader[i][0]].y1 - data[arrow].y1;
            let d = Math.sqrt(d1*d1+d2*d2+d3*d3+d4*d4);
            if (d <= threshold) {
                if (d < minDis) {
                    theLeader = i;
                }
            }
        }
        return theLeader;
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

    // Adaptive binning
    static AdaptiveBinning() {
        let startBinSize = 40;
        let minNum = netSP.minNumberArrows;
        let maxNum = netSP.maxNumberArrows;
        let startThreshold = 0.0296;

        if (netSP.instanceInfo.length <= minNum) {      // no greater 50 instances => no binning
            netSP.plots.forEach(e=>{
                e.arrows = [];
                e.points = [];
                let data = DataProcessing.ScaleNetScatterPlot(e.data);
                data.forEach((e_,i_)=> {
                    e.arrows[i_] = {start:[e_.x0,e_.y0],end:[e_.x1,e_.y1],instance:[i_]};
                });
            });
        } else {    // greater than 50 instances => need binning
            if (netSP.binType === 'hexagon') {
                netSP.plots.forEach((e,i)=>{
                    e.arrows = [];
                    e.points = [];
                    let nBin = startBinSize;
                    let count = 0;
                    DataProcessing.D3HexBinMapping(i,nBin);
                    while ((e.arrows.length < minNum || e.arrows.length > maxNum) && count < 10) {
                        if (e.arrows.length > maxNum) {
                            nBin = Math.round(nBin/2);
                            e.arrows = [];
                            e.points = [];
                            DataProcessing.D3HexBinMapping(i,nBin);
                        } else {
                            nBin = Math.round(nBin*1.5);
                            e.arrows = [];
                            e.points = [];
                            DataProcessing.D3HexBinMapping(i,nBin);
                        }
                        count = count + 1;
                    }
                });
            } else if (netSP.binType === 'leader') {
                netSP.plots.forEach((e,i)=>{
                    let threshold = startThreshold;
                    let count = 0;
                    DataProcessing.LeaderBinMapping(i,threshold);
                    while ((e.arrows.length < minNum || e.arrows.length > maxNum) && count < 10) {
                        if (e.arrows.length > maxNum) {
                            threshold = threshold*1.5;
                            e.arrows = [];
                            e.points = [];
                            DataProcessing.LeaderBinMapping(i,threshold);
                        } else {
                            threshold = threshold/2;
                            e.arrows = [];
                            e.points = [];
                            DataProcessing.LeaderBinMapping(i,threshold);
                        }
                        count = count + 1;
                    }
                });
            } else if (netSP.binType === 'noBin') {
                netSP.plots.forEach(e=>{
                    e.arrows = [];
                    e.points = [];
                    let data = DataProcessing.ScaleNetScatterPlot(e.data);
                    data.forEach((e_,i_)=> {
                        e.arrows[i_] = {start:[e_.x0,e_.y0],end:[e_.x1,e_.y1]};
                    });
                });
            }
        }
    }

}