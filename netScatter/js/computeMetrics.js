class ComputeMetrics {
    constructor() {
    }

    // Mean
    // plotData is array of data point
    // each data point is an object {name: ... , value: ...}
    static MeanValue (plotData) {
        let meanValue = 0;
        for (let i = 0; i < plotData.length; i++) {
            meanValue += plotData[i].value/plotData.length;
        }
        return meanValue;
    }

    // Standard deviation
    // plotData is array of data point
    // each data point is an object {name: ..., value: ...}
    static StandardDeviation (plotData) {
        let sd = 0;
        let meanValue = 0;
        for (let i = 0; i < plotData.length; i++) {
            meanValue += plotData[i].value/plotData.length;
        }
        for (let i = 0; i < plotData.length; i++) {
            sd += Math.pow(plotData[i].value-meanValue,2)/plotData.length;
        }
        sd = Math.sqrt(sd);
        return sd;
    }

    // compute quartiles
    // plotData is array of data point
    // each data point is an object {name: ..., value: ...}
    static Skewed (plotData) {
        let arr = plotData.map(e=>e);
        let array = arr.filter(e=>typeof (e) === 'number');
        array.sort((a,b)=>a-b);
        let q90 = array[Math.floor(array.length*0.9)];
        let q50 = array[Math.floor(array.length*0.5)];
        let q10 = array[Math.floor(array.length*0.1)];
        return (q90-q50)/(q90-q10);
    }

    // compute IQR
    // plotData is array of data point
    // each data point is an object {name: ..., value: ...}
    static ComputeIQR (plotData) {
        let arr = plotData.map(e=>e.value);
        let array = arr.filter(e=>typeof (e) === 'number');
        array.sort((a,b)=>a-b);
        return array[Math.floor(0.75*array.length)]-array[Math.floor(0.25*array.length)];
    }

    // Outlying for a list of numbers
    // Use box-plot rule to determine outliers
    // score = absolute deviation from q2 for outliers/ absolute deviation from q2 for all
    // plotData is array of data point => odd
    // each data point is an object {name: ..., value: ...} => odd
    // plotData: array of quantities => [x1,x2,...] => new => for bin, not each data points
    // isUpperOnly = true: only use upper limit of box-plot rule
    // isUpperOnly = false: use both limits of box-plot rule
    static Outlying (plotData,isUpperOnly) {
        let outlying = {
          score: 0,
          outliers: [],     // index of outliers in the netSP.plots[#].array
        };
        if (plotData.length > 0) {
            // let array = plotData.map(e=>e.value).sort((a,b)=>a-b);
            let array = plotData.filter(e=>typeof(e)==='number').sort((a,b)=>a-b);
            let L = array.length;
            let q1 = array[Math.floor(L*0.25)];
            let q2 = array[Math.floor(L*0.5)];
            let q3 = array[Math.floor(L*0.75)];
            let upperLimit = q3+1.5*(q3-q1);
            let lowerLimit = q1-1.5*(q3-q1);
            let totalAD, outlierAD;
            if (isUpperOnly) {
                totalAD = 0;
                outlierAD = 0;
                plotData.forEach((e,i)=>{
                    if (typeof (e) === 'number') {
                        // totalAD += Math.abs(e.value-q2);
                        totalAD += Math.abs(e-q2);
                        // if (e.value > upperLimit) {
                        if (e > upperLimit) {
                            // outlierAD += Math.abs(e.value-q2);
                            outlierAD += Math.abs(e-q2);
                            outlying.outliers.push(i);
                        }
                    }
                });
            } else {
                totalAD = 0;
                outlierAD = 0;
                plotData.forEach((e,i)=>{
                    if (typeof (e) === 'number') {
                        // totalAD += Math.abs(e.value-q2);
                        totalAD += Math.abs(e-q2);
                        // if (e.value > upperLimit || e.value < lowerLimit) {
                        if (e > upperLimit || e < lowerLimit) {
                            // outlierAD += Math.abs(e.value-q2);
                            outlierAD += Math.abs(e-q2);
                            outlying.outliers.push(i);
                        }
                    }
                });
            }
            outlying.score = (totalAD !== 0) ? outlierAD/totalAD : 0;
        }
        return outlying;
    }

    // Crossing score
    // plotData is an array of data points
    // Each element is an object: {name, x0, y0, x1, y1}
    // static Intersection (plotData) {
    //     let score = 0;
    //     let count = 0;
    //     for (let i = 0; i < plotData.length - 1; i++) {
    //         for (let j = i + 1; j < plotData.length; j++) {
    //             count += Geometry.CheckLineSegmentCrossing(plotData[i].x0,plotData[i].y0,plotData[i].x1,plotData[i].y1,plotData[j].x0,plotData[j].y0,plotData[j].x1,plotData[j].y1) ? 1 : 0;
    //         }
    //     }
    //     score = 1 - Math.exp(-count/plotData.length);
    ////    score = count/(plotData.length*(plotData.length-1)/2);
        // return score;
    // }

    // Intersection score for bins
    // binData: [{start: [x,y], end: [x,y]}, ...]
    static Intersection (binData) {
        let count = 0;
        if (binData.length>0) {
            for (let i = 0; i < binData.length - 1; i++) {
                for (let j = i + 1; j < binData.length; j++) {
                    let x1 = binData[i].start[0], y1 = binData[i].start[1], x2 = binData[i].end[0], y2 = binData[i].end[1];
                    let x3 = binData[j].start[0], y3 = binData[j].start[1], x4 = binData[j].end[0], y4 = binData[j].end[1];
                    let check1 = x1 !== x2 || y1 !== y2;
                    let check2 = x3 !== x4 || y3 !== y4;
                    let check = check1 && check2;
                    if (check)  count += Geometry.CheckLineSegmentCrossing(x1,y1,x2,y2,x3,y3,x4,y4);
                }
            }
        }
        return 1 - Math.exp(-count/binData.length);
    }

    // Translation score
    // plotData is an array of data points
    // Each element is an object: {name, x0, y0, x1, y1}
    // static Translation (plotData,index) {
    //     let score;
    //     // Find and delete outliers
    //     let outliers = [];
    //     let group = plotData.map(e=>{
    //         return {name: e.name, x: e.x0, y: e.y0}
    //     });
    //     outliers = Graph.Outliers(group);
    //     // compute translation
    //     let CoM1 = [0,0], CoM2 = [0,0];
    //     for (let i = 0; i < plotData.length; i++) {
    //         // if (outliers1.length === 0) {
    //             CoM1[0] += plotData[i].x0/plotData.length;
    //             CoM1[1] += plotData[i].y0/plotData.length;
    //         // } else {
    //         //     let check = outliers1.findIndex(e=>e===plotData[i].name) === -1;
    //         //     if (check) {
    //         //         CoM1[0] += plotData[i].x0/plotData.length;
    //         //         CoM1[1] += plotData[i].y0/plotData.length;
    //         //     }
    //         // }
    //         // if (outliers2.length === 0) {
    //             CoM2[0] += plotData[i].x1/plotData.length;
    //             CoM2[1] += plotData[i].y1/plotData.length;
    //         // } else {
    //         //     let check = outliers2.findIndex(e=>e===plotData[i].name) === -1;
    //         //     if (check) {
    //         //         CoM2[0] += plotData[i].x1/plotData.length;
    //         //         CoM2[1] += plotData[i].y1/plotData.length;
    //         //     }
    //         // }
    //     }
    //     let translation = Math.sqrt((CoM2[0]-CoM1[0])*(CoM2[0]-CoM1[0])+(CoM2[1]-CoM1[1])*(CoM2[1]-CoM1[1]));
    //     // compute radius
    //     let radius = 0;
    //     for (let i = 0; i < plotData.length; i++) {
    //         if (outliers.length === 0) {
    //             let d = Math.sqrt((plotData[i].x0-CoM1[0])*(plotData[i].x0-CoM1[0])+(plotData[i].y0-CoM1[1])*(plotData[i].y0-CoM1[1]));
    //             radius = (radius < d) ? d : radius;
    //         } else {
    //             let check = outliers.findIndex(e=>e===plotData[i].name) === -1;
    //             if (check) {
    //                 let d = Math.sqrt((plotData[i].x0-CoM1[0])*(plotData[i].x0-CoM1[0])+(plotData[i].y0-CoM1[1])*(plotData[i].y0-CoM1[1]));
    //                 radius = (radius < d) ? d : radius;
    //             }
    //         }
    //     }
    //     // compute score
    //     score = (radius > 0) ? translation/radius : 0;
    //     return score <= 1 ? score : 1;
    //     // return Math.sqrt((CoM2[0]-CoM1[0])*(CoM2[0]-CoM1[0])+(CoM2[1]-CoM1[1])*(CoM2[1]-CoM1[1]));
    // }

    // Translation score for bins
    // binData: [{start: [x,y], end: [x,y]},...]
    static Translation (binData,points) {
        let score;
        if (binData.length > 0) {
            // Find and delete outliers
            let group1 = binData.map((e,i)=>{return {name:'a'+i.toString(), x:e.start[0], y:e.start[1]}});
            let group = [];
            group1.forEach(e=>{
                let check = true;
                if (group.length > 0) {
                    check = group.findIndex(e_=>e_.x === e.x && e_.y === e.y) === -1;
                }
                if (check) {
                    group.push({name: e.name, x: e.x, y: e.y});
                }
            });
            points.forEach((e,i)=>{
                group.push({name: 'p'+i.toString(), x:e[0], y: e[1]});
            });
            let outliers = Graph.Outliers(group);
            // compute translation
            let CoM1 = [0,0], CoM2 = [0,0];
            let N = binData.length + points.length;
            for (let i = 0; i < binData.length; i++) {
                CoM1[0] += binData[i].start[0]/N;
                CoM1[1] += binData[i].start[1]/N;
                CoM2[0] += binData[i].end[0]/N;
                CoM2[1] += binData[i].end[1]/N;
            }
            for (let i = 0; i < points.length; i++) {
                CoM1[0] += points[i][0]/N;
                CoM1[1] += points[i][1]/N;
                CoM2[0] += points[i][0]/N;
                CoM2[1] += points[i][1]/N;
            }
            let translation = Math.sqrt((CoM2[0]-CoM1[0])*(CoM2[0]-CoM1[0])+(CoM2[1]-CoM1[1])*(CoM2[1]-CoM1[1]));
            // compute radius
            let radius = 0;
            for (let i = 0; i < binData.length; i++) {
                if (outliers.length === 0) {
                    let d = Math.sqrt((binData[i].start[0]-CoM1[0])*(binData[i].start[0]-CoM1[0])+(binData[i].start[1]-CoM1[1])*(binData[i].start[1]-CoM1[1]));
                    radius = (radius < d) ? d : radius;
                } else {
                    let check = outliers.findIndex(e=>e===i) === -1;
                    if (check) {
                        let d = Math.sqrt((binData[i].start[0]-CoM1[0])*(binData[i].start[0]-CoM1[0])+(binData[i].start[1]-CoM1[1])*(binData[i].start[1]-CoM1[1]));
                        radius = (radius < d) ? d : radius;
                    }
                }
            }
            for (let i = 0; i < points.length; i++) {
                if (outliers.length === 0) {
                    let d = Math.sqrt((points[i][0]-CoM1[0])*(points[i][0]-CoM1[0])+(points[i][1]-CoM1[1])*(points[i][1]-CoM1[1]));
                    radius = (radius < d) ? d : radius;
                } else {
                    let check = outliers.findIndex(e=>e===i) === -1;
                    if (check) {
                        let d = Math.sqrt((points[i][0]-CoM1[0])*(points[i][0]-CoM1[0])+(points[i][1]-CoM1[1])*(points[i][1]-CoM1[1]));
                        radius = (radius < d) ? d : radius;
                    }
                }
            }
            // compute score
            score = (radius > 0) ? translation/radius : 0;
        } else score = 0;
        return score <= 1 ? score : 1;
    }

    // Complexity of directions
    // need collection of angles
    // angleData is array of
    // objects in format: {name, value} => odd
    // format: [x1,x2,...] => new for bins
    // value: angle from -pi to pi
    static Complexity (angleData) {
        let score = 0;
        if (angleData.length > 0) {
            let quadRant = [0,0,0,0];
            angleData.forEach(e=>{
                if (typeof (e) === 'number') {
                    // if (e.value <= Math.PI && e.value > Math.PI/2) {
                    if (e <= Math.PI && e > Math.PI/2) {
                        quadRant[1] += 1;
                        // } else if (e.value <= Math.PI/2 && e.value > 0) {
                    } else if (e <= Math.PI/2 && e > 0) {
                        quadRant[0] += 1;
                        // } else if (e.value <= 0 && e.value > -Math.PI/2) {
                    } else if (e <= 0 && e > -Math.PI/2) {
                        quadRant[3] += 1;
                        // } else if (e.value <= -Math.PI/2 && e.value >= -Math.PI) {
                    } else if (e <= -Math.PI/2 && e >= -Math.PI) {
                        quadRant[2] += 1;
                    }
                }
            });
            let sum = quadRant[0] + quadRant[1] + quadRant[2] + quadRant[3];
            if (sum !== 0) {
                quadRant.forEach(e=>{
                    score += (e!==0) ? -(e/sum)*Math.log2(e/sum) : 0;
                });
                score /= 2;
            }
        }
        return score;
    }

    // Compute positive correlation
    // angleData is array of => odd
    // objects in format: {name, value} => odd
    // angleData is array of angle [x1,x2,...]
    // value: angle from -pi to pi
    static PositiveCorrelation (angleData) {
        let score = 0;
        let N = angleData.length;
        if (N) {
            angleData.forEach(e=>{
                if (typeof (e) === 'number') {
                    // let check1 = e.value >= 0 && e.value <= Math.PI/2;
                    let check1 = e >= 0 && e <= Math.PI/2;
                    // let check2 = e.value >= -Math.PI && e.value <= -Math.PI/2;
                    let check2 = e >= -Math.PI && e <= -Math.PI/2;
                    let check = check1 || check2;
                    score += check ? 1 : 0;
                }
            });
            score /= N;
            score = 2*(score-0.5);
        }
        return score > 0 ? score : 0;
    }

    // Compute nagative correlation
    // angleData is array of
    // objects in format: {name, value} => odd
    // format: [x1,x2,...]
    // value: angle from -pi to pi
    static NegativeCorrelation (angleData) {
        let score = 0;
        let N = angleData.length;
        if (N) {
            angleData.forEach(e=>{
                if (typeof (e) === 'number') {
                    // let check1 = e.value <= Math.PI && e.value >= Math.PI/2;
                    let check1 = e <= Math.PI && e >= Math.PI/2;
                    // let check2 = e.value >= -Math.PI/2 && e.value <= 0;
                    let check2 = e >= -Math.PI/2 && e <= 0;
                    let check = check1 || check2;
                    score += check ? 1 : 0;
                }
            });
            score /= N;
            score = 2*(score-0.5);
        }
        return score > 0? score: 0;
    }

}