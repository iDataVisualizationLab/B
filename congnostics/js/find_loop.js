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
    myData.smooth(30);
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
    experiment.highLoop.forEach((element,index)=>{
        let id = 'myDiv'+index+'_2';
        let instance = element[0];
        let x_var = element[1][0];
        let y_var = element[1][1];
        // generate data for plotly
        let sub_x = [], sub_y = [];
        let loop_x = [], loop_y = [];
        element[1][2].forEach((element_,index_)=>{
            if (index_) {
                sub_x.push(experiment.dataSmooth[instance][x_var].slice(element[1][2][index_-1][0]+element[1][2][index_-1][1]+1,element_[0]+1));
                sub_y.push(experiment.dataSmooth[instance][y_var].slice(element[1][2][index_-1][0]+element[1][2][index_-1][1]+1,element_[0]+1));
            } else {
                sub_x.push(experiment.dataSmooth[instance][x_var].slice(0,element_[0]+1));
                sub_y.push(experiment.dataSmooth[instance][y_var].slice(0,element_[0]+1));
            }
            loop_x.push(experiment.dataSmooth[instance][x_var].slice(element_[0],element_[0]+element_[1]+2));
            loop_y.push(experiment.dataSmooth[instance][y_var].slice(element_[0],element_[0]+element_[1]+2));
        });
        sub_x.push(experiment.dataSmooth[instance][x_var].slice(element[1][2][element[1][2].length-1][0]+element[1][2][element[1][2].length-1][1]+1));
        sub_y.push(experiment.dataSmooth[instance][y_var].slice(element[1][2][element[1][2].length-1][0]+element[1][2][element[1][2].length-1][1]+1));
        let n_loop = element[1][2].length;
        let trace = [], colorWay = [];
        // let notations = [];
        for (let i = 0; i < n_loop*2+1; i++) {
            trace[i] = {
                mode: 'lines',
                showlegend: false,
                hoverinfo: 'x+y',
                name: '',
            };
            if (i%2===0) {
                trace[i].x = sub_x[i/2];
                trace[i].y = sub_y[i/2];
                // trace[i].line = {
                //     color:
                // };
                colorWay[i] = '#000000';
            } else {
                trace[i].x = loop_x[(i-1)/2];
                trace[i].y = loop_y[(i-1)/2];
                trace[i].hovertemplate = 'Loop length: ' + element[1][2][(i-1)/2][1];
                colorWay[i] = experiment.colorList[i];
                // write info:
                d3.select('#'+'myDiv'+index.toString()+'_0')
                    .append('p')
                    .text('Loop length: '+element[1][2][(i-1)/2][1])
                    .attr('style','color:'+experiment.colorList[i]);
                // notations[(i-1)/2] = {
                //     x: experiment.dataSmooth[instance][x_var][element[1][2][(i-1)/2][0]],
                //     y: experiment.dataSmooth[instance][y_var][element[1][2][(i-1)/2][0]],
                //     xref: 'x',
                //     yref: 'y',
                //     text: 'Loop length: '+element[1][2][(i-1)/2][1],
                //     showarrow: true,
                //     arrowhead: 5,
                //     ax: 0,
                //     ay: -30,
                // };
            }
        }
        let layout = {
            title: instance,
            xaxis: {
                title: {
                    text: x_var,
                }
            },
            yaxis: {
                title: {
                    text: y_var
                },
            },
            height: 400,
            width: 400,
            colorway: colorWay,
            // annotations: notations,
        };
        Plotly.newPlot(id,trace,layout);
    });
    experiment.highLoop.forEach((element,index)=>{
        let id = 'myDiv'+index+'_1';
        let instance = element[0];
        let x_var = element[1][0];
        let y_var = element[1][1];
        // generate data for plotly
        let sub_x = [], sub_y = [];
        let loop_x = [], loop_y = [];
        element[1][2].forEach((element_,index_)=>{
            if (index_) {
                sub_x.push(experiment.data[instance][x_var].slice(element[1][2][index_-1][0]+element[1][2][index_-1][1]+1,element_[0]+1));
                sub_y.push(experiment.data[instance][y_var].slice(element[1][2][index_-1][0]+element[1][2][index_-1][1]+1,element_[0]+1));
            } else {
                sub_x.push(experiment.data[instance][x_var].slice(0,element_[0]+1));
                sub_y.push(experiment.data[instance][y_var].slice(0,element_[0]+1));
            }
            loop_x.push(experiment.data[instance][x_var].slice(element_[0],element_[0]+element_[1]+2));
            loop_y.push(experiment.data[instance][y_var].slice(element_[0],element_[0]+element_[1]+2));
        });
        sub_x.push(experiment.data[instance][x_var].slice(element[1][2][element[1][2].length-1][0]+element[1][2][element[1][2].length-1][1]+1));
        sub_y.push(experiment.data[instance][y_var].slice(element[1][2][element[1][2].length-1][0]+element[1][2][element[1][2].length-1][1]+1));
        let n_loop = element[1][2].length;
        let trace = [], colorWay = [];
        // let notations = [];
        for (let i = 0; i < n_loop*2+1; i++) {
            trace[i] = {
                mode: 'lines',
                showlegend: false,
                hoverinfo: 'x+y',
                name: '',
            };
            if (i%2===0) {
                trace[i].x = sub_x[i/2];
                trace[i].y = sub_y[i/2];
                // trace[i].line = {
                //     color:
                // };
                colorWay[i] = '#000000';
            } else {
                trace[i].x = loop_x[(i-1)/2];
                trace[i].y = loop_y[(i-1)/2];
                trace[i].hovertemplate = 'Loop length: ' + element[1][2][(i-1)/2][1];
                colorWay[i] = experiment.colorList[i];
                // notations[(i-1)/2] = {
                //     x: experiment.dataSmooth[instance][x_var][element[1][2][(i-1)/2][0]],
                //     y: experiment.dataSmooth[instance][y_var][element[1][2][(i-1)/2][0]],
                //     xref: 'x',
                //     yref: 'y',
                //     text: 'Loop length: '+element[1][2][(i-1)/2][1],
                //     showarrow: true,
                //     arrowhead: 5,
                //     ax: 0,
                //     ay: -30,
                // };
            }
        }
        let layout = {
            title: instance,
            xaxis: {
                title: {
                    text: x_var,
                }
            },
            yaxis: {
                title: {
                    text: y_var
                },
            },
            height: 400,
            width: 400,
            colorway: colorWay,
            // annotations: notations,
        };
        Plotly.newPlot(id,trace,layout);
    });
});