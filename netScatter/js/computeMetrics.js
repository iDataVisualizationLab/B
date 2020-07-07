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

    // Outlying for a list of numbers
    // Use box-plot rule to determine outliers
    // score = absolute deviation from q2 for outliers/ absolute deviation from q2 for all
    // plotData is array of data point
    // each data point is an object {name: ..., value: ...}
    // isUpperOnly = true: only use upper limit of box-plot rule
    // isUpperOnly = false: use both limits of box-plot rule
    static Outlying (plotData,isUpperOnly) {
        let outlying = {
          score: 0,
          outliers: [],
        };
        if (plotData.length > 0) {
            let array = plotData.map(e=>e.value).sort((a,b)=>a-b);
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
                plotData.forEach(e=>{
                    totalAD += Math.abs(e.value-q2);
                    if (e.value > upperLimit) {
                        outlierAD += Math.abs(e.value-q2);
                        outlying.outliers.push(e.name);
                    }
                });
            } else {
                totalAD = 0;
                outlierAD = 0;
                plotData.forEach(e=>{
                    totalAD += Math.abs(e.value-q2);
                    if (e.value > upperLimit || e.value < lowerLimit) {
                        outlierAD += Math.abs(e.value-q2);
                        outlying.outliers.push(e.name);
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
    static Intersection (plotData) {
        let score = 0;
        let count = 0;
        for (let i = 0; i < plotData.length - 1; i++) {
            for (let j = i + 1; j < plotData.length; j++) {
                count += Geometry.CheckLineSegmentCrossing(plotData[i].x0,plotData[i].y0,plotData[i].x1,plotData[i].y1,plotData[j].x0,plotData[j].y0,plotData[j].x1,plotData[j].y1) ? 1 : 0;
            }
        }
        score = 1 - Math.exp(-count/plotData.length);
        return score;
    }

    // Translation score
    // plotData is an array of data points
    // Each element is an object: {name, x0, y0, x1, y1}
    static Translation (plotData) {
        let score;
        // Find and delete outliers
        // let outliers1 = [], outliers2 = [];
        // let group1 = plotData.map(e=>{
        //     return {name: e.name, x: e.x0, y: e.y0}
        // });
        // outliers1 = Graph.Outliers(group1);
        // let group2 = plotData.map(e=>{
        //     return {name: e.name, x: e.x1, y: e.y1}
        // });
        // outliers2 = Graph.Outliers(group2);
        // compute translation
        let CoM1 = [0,0], CoM2 = [0,0];
        for (let i = 0; i < plotData.length; i++) {
            // if (outliers1.length === 0) {
                CoM1[0] += plotData[i].x0/plotData.length;
                CoM1[1] += plotData[i].y0/plotData.length;
            // } else {
            //     let check = outliers1.findIndex(e=>e===plotData[i].name) === -1;
            //     if (check) {
            //         CoM1[0] += plotData[i].x0/plotData.length;
            //         CoM1[1] += plotData[i].y0/plotData.length;
            //     }
            // }
            // if (outliers2.length === 0) {
                CoM2[0] += plotData[i].x1/plotData.length;
                CoM2[1] += plotData[i].y1/plotData.length;
            // } else {
            //     let check = outliers2.findIndex(e=>e===plotData[i].name) === -1;
            //     if (check) {
            //         CoM2[0] += plotData[i].x1/plotData.length;
            //         CoM2[1] += plotData[i].y1/plotData.length;
            //     }
            // }
        }
        // let translation = Math.sqrt((CoM2[0]-CoM1[0])*(CoM2[0]-CoM1[0])+(CoM2[1]-CoM1[1])*(CoM2[1]-CoM1[1]));
        // compute radius
        // let radius = 0;
        // for (let i = 0; i < plotData.length; i++) {
        //     if (outliers1.length === 0) {
        //         let d = Math.sqrt((plotData[i].x0-CoM1[0])*(plotData[i].x0-CoM1[0])+(plotData[i].y0-CoM1[1])*(plotData[i].y0-CoM1[1]));
        //         radius = (radius < d) ? d : radius;
        //     } else {
        //         let check = outliers1.findIndex(e=>e===plotData[i].name) === -1;
        //         if (check) {
        //             let d = Math.sqrt((plotData[i].x0-CoM1[0])*(plotData[i].x0-CoM1[0])+(plotData[i].y0-CoM1[1])*(plotData[i].y0-CoM1[1]));
        //             radius = (radius < d) ? d : radius;
        //         }
        //     }
        // }
        // compute score
        // score = (radius > 0) ? translation/radius : 0;
        // return score;
        return Math.sqrt((CoM2[0]-CoM1[0])*(CoM2[0]-CoM1[0])+(CoM2[1]-CoM1[1])*(CoM2[1]-CoM1[1]));
    }

    // Complexity of directions
    // need collection of angles
    // angleData is array of
    // objects in format: {name, value}
    // value: angle from -pi to pi
    static Complexity (angleData) {
        let score = 0;
        let quadRant = [0,0,0,0];
        angleData.forEach(e=>{
            if (e.value <= Math.PI && e.value > Math.PI/2) {
                quadRant[1] += 1;
            } else if (e.value <= Math.PI/2 && e.value > 0) {
                quadRant[0] += 1;
            } else if (e.value <= 0 && e.value > -Math.PI/2) {
                quadRant[3] += 1;
            } else if (e.value <= -Math.PI/2 && e.value >= -Math.PI) {
                quadRant[2] += 1;
            }
        });
        let sum = quadRant[0] + quadRant[1] + quadRant[2] + quadRant[3];
        if (sum !== 0) {
            quadRant.forEach(e=>{
                score += (e!==0) ? -(e/sum)*Math.log2(e/sum) : 0;
            });
            score /= 2;
        }
        return score;
    }
}