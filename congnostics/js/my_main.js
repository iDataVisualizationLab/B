Promise.all([
    d3.csv("data/employment.txt"),
    d3.tsv('data/statecode.txt'),
    d3.tsv('data/Industrycode.txt'),
]).then(function (files) {
    // design HTML
    let designHTML = new DesignHTML('myDiv',10);
    designHTML.designPlotlyExperiment();
    // main code
    let myData = new Data_processing(files);
    myData.read();
    myData.smooth(experiment.sliding);
    let compute = new Visual_feature_2D(true);
    compute.Loop();
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
    let myDraw = new Draw_plotly('myDiv');
    myDraw.drawExperiment();
});