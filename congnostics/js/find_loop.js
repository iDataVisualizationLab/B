let experiment ={
    data: {},
    dataRaw: {},
    timeInfo: [],
    instanceInfo: [],
    variableInfo: [],
    sliding: 30,
    loop: {},
    highLoop: [],
};
Promise.all([
    d3.csv("data/employment.txt"),
    d3.tsv('data/statecode.txt'),
    d3.tsv('data/Industrycode.txt'),
]).then(function (files) {
    let n_timeSeries = files[0].length;
    let n_timePoint = files[0].columns.length-1;
    experiment.timeInfo = [];
    experiment.instanceInfo = [];
    experiment.variableInfo = [];
    experiment.timeInfo = files[0].columns.filter((element,index)=>index!==0);
    experiment.instanceInfo = files[1].map(element=>element.name);
    experiment.variableInfo = files[2].map(element=>element.name);
    let n_instances = files[1].length;
    let n_variable = files[2].length;
    let mapSeries = [];
    for (let i = 0; i < n_timeSeries; i++) {
        let sampleCode = files[0][i]['Series ID'].substr(3,2);
        let n_variable = files[0][i]['Series ID'].substr(10,8);
        mapSeries[i] = [sampleCode,n_variable,i];
    }
    for (let i = 0; i < n_instances; i++) {
        experiment.data[files[1][i].name] = {};
        experiment.dataRaw[files[1][i].name] = {};
        for (let j = 0; j < n_variable; j++) {
            let sampleCode = files[1][i].code;
            let n_variable = files[2][j].code;
            let rowMatrix = mapSeries.find(element=>element[0]===sampleCode&&element[1]===n_variable);
            if (rowMatrix) {
                let row = rowMatrix[2];
                let timeSeries = [];
                for (let t = 0; t < n_timePoint; t++) {
                    timeSeries[t] = isNaN(parseFloat(files[0][row][experiment.timeInfo[t]])) ? Infinity : parseFloat(files[0][row][experiment.timeInfo[t]]);
                }
                experiment.dataRaw[files[1][i].name][files[2][j].name] = timeSeries;
                let maxValue = Math.max(...timeSeries.filter(element=>element!==Infinity));
                let minValue = Math.min(...timeSeries.filter(element=>element!==Infinity));
                let rangeValue = maxValue - minValue;
                experiment.data[files[1][i].name][files[2][j].name] = timeSeries.map(element=>{
                    if (maxValue !== Infinity && minValue !== Infinity) return (element-minValue)/rangeValue;
                    else return Infinity;
                });
            }
        }
    }
    Loop();
    let loopArr = [];
    for (let plot in experiment.loop) {
        experiment.loop[plot].forEach(element=>{
            loopArr.push([plot,element[0],element[1],element[2].length]);
        })
    }
    loopArr.sort((a,b)=>b[3]-a[3]);
    for (let i = 0; i < 10; i++) {
        experiment.highLoop.push([loopArr[i][0],experiment.loop[loopArr[i][0]].find(element=>element[0]===loopArr[i][1]&&element[1]===loopArr[i][2])]);
    }
    experiment.highLoop.forEach((element,index)=>{
        let id = 'myDiv'+index;
        let instance = element[0];
        let x_var = element[1][0];
        let y_var = element[1][1];
        let trace = {
            x: experiment.dataRaw[instance][x_var],
            y: experiment.dataRaw[instance][y_var],
            mode: 'lines'
        };
        let layout = {
            title: instance+', '+x_var+', '+y_var,
            heigh: 600,
            width: 600,
        };
        Plotly.newPlot(id,[trace],layout);
    });
});

function Loop() {
    let n_instances = experiment.instanceInfo.length;
    let n_variable = experiment.variableInfo.length;
    let n_timePoint = experiment.timeInfo.length;
    let dataSmooth = {};
    for (let i = 0; i < n_instances; i++) {
        let instance = experiment.instanceInfo[i];
        experiment.loop[instance] = [];
        for (let v = 0; v < n_variable; v++) {
            let variable = experiment.variableInfo[v];
            if (experiment.data[instance][variable]) {
                dataSmooth[variable] = [];
                for (let t = 0; t < n_timePoint-experiment.sliding; t++) {
                    dataSmooth[variable][t] = 0;
                    for (let s = 0; s < experiment.sliding; s++) {
                        dataSmooth[variable][t] += experiment.data[instance][variable][t+s];
                    }
                    dataSmooth[variable][t] /= experiment.sliding;
                }
            }
        }
        for (let x = 0; x < n_variable - 1; x++) {
            let x_var = experiment.variableInfo[x];
            if (dataSmooth[x_var]) {
                for (let y = x+1; y < n_variable; y++) {
                    let y_var = experiment.variableInfo[y];
                    if (dataSmooth[y_var]) {
                        let loopLength = [];
                        let loopNum = 0;
                        for (let t = 0; t < n_timePoint - experiment.sliding - 2; t++) {
                            let x1 = dataSmooth[x_var][t], y1 = dataSmooth[y_var][t];
                            let x2 = dataSmooth[x_var][t+1], y2 = dataSmooth[y_var][t+1];
                           for (let tt = t+2; tt < n_timePoint - experiment.sliding; tt++) {
                               let x3 = dataSmooth[x_var][tt], y3 = dataSmooth[y_var][tt];
                               let x4 = dataSmooth[x_var][tt+1], y4 = dataSmooth[y_var][tt+1];
                               if ( checkIntersection(x1,y1,x2,y2,x3,y3,x4,y4)) {
                                   loopLength[loopNum] = tt-t;
                                   loopNum += 1;
                               }
                           }
                        }
                        experiment.loop[instance].push([x_var,y_var,loopLength]);
                    }
                }
            }
        }
    }
}

function checkIntersection(x1_, y1_, x2_, y2_, x3_, y3_, x4_, y4_) {
    let v1x = x2_ - x1_;
    let v1y = y2_ - y1_;
    let v2x = x4_ - x3_;
    let v2y = y4_ - y3_;
    let v23x = x3_ - x2_;
    let v23y = y3_ - y2_;
    let v24x = x4_ - x2_;
    let v24y = y4_ - y2_;
    let v41x = x1_ - x4_;
    let v41y = y1_ - y4_;
    let checkV1 = (v1x * v23y - v1y * v23x) * (v1x * v24y - v1y * v24x);
    let checkV2 = (v2x * v41y - v2y * v41x) * (v2y * v24x - v2x * v24y);
    return (checkV1 < 0) && (checkV2 < 0);
}