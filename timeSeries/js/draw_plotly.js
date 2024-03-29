class Draw_plotly {
    constructor (div_id) {
        this.id = div_id;
    }

    // draw shared axes plots for experiment
    drawExperiment () {
        experiment.highLoop.forEach((element,index)=>{
            let instance = element[0];
            let x_var = element[1][0];
            let y_var = element[1][1];
            // prepare fragments of doubly series = loops + no loop to highlight loops
            // let sub_x = [], sub_y = [];
            // let loop_x = [], loop_y = [];
            // element[1][2].forEach((element_,index_)=>{
            //     if (index_) {
            //         sub_x.push(experiment.dataSmooth[instance][x_var].slice(element[1][2][index_-1][0]+element[1][2][index_-1][1]+1,element_[0]+1));
            //         sub_y.push(experiment.dataSmooth[instance][y_var].slice(element[1][2][index_-1][0]+element[1][2][index_-1][1]+1,element_[0]+1));
            //     } else {
            //         sub_x.push(experiment.dataSmooth[instance][x_var].slice(0,element_[0]+1));
            //         sub_y.push(experiment.dataSmooth[instance][y_var].slice(0,element_[0]+1));
            //     }
            //     loop_x.push(experiment.dataSmooth[instance][x_var].slice(element_[0],element_[0]+element_[1]+2));
            //     loop_y.push(experiment.dataSmooth[instance][y_var].slice(element_[0],element_[0]+element_[1]+2));
            // });
            // sub_x.push(experiment.dataSmooth[instance][x_var].slice(element[1][2][element[1][2].length-1][0]+element[1][2][element[1][2].length-1][1]+1));
            // sub_y.push(experiment.dataSmooth[instance][y_var].slice(element[1][2][element[1][2].length-1][0]+element[1][2][element[1][2].length-1][1]+1));
            // prepare parameters for plotly
            let n_loop = element[1][2].length;
            let n_timePoint = experiment.timeInfo.length;
            let myColor = experiment.timeInfo.map((element_,index_)=>'rgb(${255*index_/n_timePoint},${0},${0})');
            let trace = [], trace1 = [], trace2_x = [], trace2_y = [];
            for (let i = 0; i < 2*n_loop+1; i++) {
                trace[i] = {
                    type: 'scatter',
                    mode: 'lines+markers',
                    name: '',
                    showlegend: false,
                    // xaxis: 'x',
                    // yaxis: 'y',
                };
                trace1[i] = {
                    type: 'scatter',
                    mode: 'lines+markers',
                    name: '',
                    showlegend: false,
                    // xaxis: 'x',
                    // yaxis: 'y',
                };
                trace2_x[i] = {
                    type: 'scatter',
                    mode: 'lines',
                    // x: experiment.timeInfo,
                    // y: experiment.data[instance][x_var],
                    name: '',
                    showlegend:false,
                    hoverinfo: 'x+y',
                    yaxis: 'y',
                };
                trace2_y[i] = {
                    type: 'scatter',
                    mode: 'lines',
                    // x: experiment.timeInfo,
                    // y: experiment.data[instance][y_var],
                    name: '',
                    showlegend:false,
                    hoverinfo: 'x+y',
                    yaxis: 'y2',
                };
                if (i%2===0) {
                    // trace[i].x = sub_x[i/2];
                    // trace[i].y = sub_y[i/2];
                    trace[i].line = {
                        color: '#000000',
                    };
                    trace1[i].line = {
                        color: '#000000',
                    };
                    trace2_x[i].line = {color:'#a6cee3'};
                    trace2_y[i].line = {color:'#cab2d6'};
                    if (i===0) {
                        trace[i].x = experiment.dataSmoothRaw[instance][x_var].slice(0,element[1][2][0][0]+1);
                        trace[i].y = experiment.dataSmoothRaw[instance][y_var].slice(0,element[1][2][0][0]+1);
                        trace1[i].x = experiment.dataRaw[instance][x_var].slice(0,element[1][2][0][0]+1);
                        trace1[i].y = experiment.dataRaw[instance][y_var].slice(0,element[1][2][0][0]+1);
                        trace2_x[i].x = experiment.timeInfo.slice(0,element[1][2][0][0]+1);
                        trace2_x[i].y = experiment.dataRaw[instance][x_var].slice(0,element[1][2][0][0]+1);
                        trace2_y[i].x = experiment.timeInfo.slice(0,element[1][2][0][0]+1);
                        trace2_y[i].y = experiment.dataRaw[instance][y_var].slice(0,element[1][2][0][0]+1);
                    } else if (i===2*n_loop) {
                        trace[i].x = experiment.dataSmoothRaw[instance][x_var].slice(element[1][2][i/2-1][1]+1);
                        trace[i].y = experiment.dataSmoothRaw[instance][y_var].slice(element[1][2][i/2-1][1]+1);
                        trace1[i].x = experiment.dataRaw[instance][x_var].slice(element[1][2][i/2-1][1]+1);
                        trace1[i].y = experiment.dataRaw[instance][y_var].slice(element[1][2][i/2-1][1]+1);
                        trace2_x[i].x = experiment.timeInfo.slice(element[1][2][i/2-1][1]+1);
                        trace2_x[i].y = experiment.dataRaw[instance][x_var].slice(element[1][2][i/2-1][1]+1);
                        trace2_y[i].x = experiment.timeInfo.slice(element[1][2][i/2-1][1]+1);
                        trace2_y[i].y = experiment.dataRaw[instance][y_var].slice(element[1][2][i/2-1][1]+1);
                    } else {
                        trace[i].x = experiment.dataRaw[instance][x_var].slice(element[1][2][i/2-1][1]+1,element[1][2][i/2][0]+1);
                        trace[i].y = experiment.dataRaw[instance][y_var].slice(element[1][2][i/2-1][1]+1,element[1][2][i/2][0]+1);
                        trace1[i].x = experiment.dataRaw[instance][x_var].slice(element[1][2][i/2-1][1]+1,element[1][2][i/2][0]+1);
                        trace1[i].y = experiment.dataRaw[instance][y_var].slice(element[1][2][i/2-1][1]+1,element[1][2][i/2][0]+1);
                        trace2_x[i].x = experiment.timeInfo.slice(element[1][2][i/2-1][1]+1,element[1][2][i/2][0]+1);
                        trace2_x[i].y = experiment.dataRaw[instance][x_var].slice(element[1][2][i/2-1][1]+1,element[1][2][i/2][0]+1);
                        trace2_y[i].x = experiment.timeInfo.slice(element[1][2][i/2-1][1]+1,element[1][2][i/2][0]+1);
                        trace2_y[i].y = experiment.dataRaw[instance][y_var].slice(element[1][2][i/2-1][1]+1,element[1][2][i/2][0]+1);
                    }
                } else {
                    // trace[i].x = loop_x[(i-1)/2];
                    // trace[i].y = loop_y[(i-1)/2];
                    trace[i].line = {
                        color: experiment.colorList[(i-1)/2],
                    };
                    trace1[i].line = {
                        color: experiment.colorList[(i-1)/2],
                    };
                    trace2_x[i].line = {color:experiment.colorList[(i-1)/2]};
                    trace2_y[i].line = {color:experiment.colorList[(i-1)/2]};
                    trace[i].x = experiment.dataRaw[instance][x_var].slice(element[1][2][(i-1)/2][0],element[1][2][(i-1)/2][1]+3);
                    trace[i].y = experiment.dataRaw[instance][y_var].slice(element[1][2][(i-1)/2][0],element[1][2][(i-1)/2][1]+3);
                    trace1[i].x = experiment.dataRaw[instance][x_var].slice(element[1][2][(i-1)/2][0],element[1][2][(i-1)/2][1]+3);
                    trace1[i].y = experiment.dataRaw[instance][y_var].slice(element[1][2][(i-1)/2][0],element[1][2][(i-1)/2][1]+3);
                    trace2_x[i].x = experiment.timeInfo.slice(element[1][2][(i-1)/2][0],element[1][2][(i-1)/2][1]+3);
                    trace2_x[i].y = experiment.dataRaw[instance][x_var].slice(element[1][2][(i-1)/2][0],element[1][2][(i-1)/2][1]+3);
                    trace2_y[i].x = experiment.timeInfo.slice(element[1][2][(i-1)/2][0],element[1][2][(i-1)/2][1]+3);
                    trace2_y[i].y = experiment.dataRaw[instance][y_var].slice(element[1][2][(i-1)/2][0],element[1][2][(i-1)/2][1]+3);
                }
            }
            let trace2 = [];
            trace2_x.forEach(element_=>trace2.push(element_));
            trace2_y.forEach(element_=>trace2.push(element_));
            let layout = {
                title: instance,
                xaxis: {
                    title: x_var,
                    titlefont: {
                        color: '#a6cee3',
                        size: 12,
                        family: 'Arial, sans-serif',
                    },
                    tickfont: {color:'#a6cee3'},
                },
                yaxis: {
                    title: y_var,
                    titlefont: {
                        color: '#cab2d6',
                        size: 12,
                        family: 'Arial, sans-serif',
                    },
                    tickfont: {color:'#cab2d6'},
                },
                height: experiment.window_size[0]*0.3,
                width: experiment.window_size[0]*0.3,
            };
            let layout1 = {
                title: instance,
                width: experiment.window_size[0]*0.3,
                height: experiment.window_size[0]*0.2,
                yaxis: {
                    title: x_var,
                    titlefont: {
                        color:'#a6cee3',
                        size: 12,
                        family: 'Arial, sans-serif',
                    },
                    tickfont: {color:'#a6cee3'},
                    // overlaying: 'y3',
                    // side: 'left',
                },
                yaxis2: {
                    title: y_var,
                    titlefont: {
                        color:'#cab2d6',
                        family: 'Arial, sans-serif',
                        size: 12,
                    },
                    tickfont: {color:'#cab2d6'},
                    overlaying: 'y',
                    side: 'right',
                }
            };
            Plotly.newPlot(this.id+index.toString()+'_2',trace,layout);
            Plotly.newPlot(this.id+index.toString()+'_1',trace1,layout);
            Plotly.newPlot(this.id+index.toString()+'_0',trace2,layout1);
            for (let i = 0; i < n_loop; i++) {
                d3.select('#'+'myDiv'+index.toString()+'_3')
                    .append('p')
                    .text('Loop length: '+(element[1][2][i][1]-element[1][2][i][0]))
                    .attr('style','text-align:right; color:'+experiment.colorList[2*i+1]);
                d3.select('#'+'myDiv'+index.toString()+'_3')
                    .append('p')
                    .text('Product: '+Math.floor(element[1][2][i][2]*100)/100)
                    .attr('style','text-align:right; color:'+experiment.colorList[2*i+1]);
                d3.select('#'+'myDiv'+index.toString()+'_3')
                    .append('p')
                    .text('Convex score: '+Math.floor(element[1][2][i][3]*100)/100)
                    .attr('style','text-align:right; color:'+experiment.colorList[2*i+1]);
                d3.select('#'+'myDiv'+index.toString()+'_3')
                    .append('p')
                    .text('Ratio: '+Math.floor(element[1][2][i][4]*100)/100)
                    .attr('style','text-align:right; color:'+experiment.colorList[2*i+1]);
                d3.select('#'+'myDiv'+index.toString()+'_3')
                    .append('p')
                    .text('Square area: '+Math.floor(element[1][2][i][6]*100)/100)
                    .attr('style','text-align:right; color:'+experiment.colorList[2*i+1]);
                d3.select('#'+'myDiv'+index.toString()+'_3')
                    .append('p')
                    .text('My area: '+Math.floor(element[1][2][i][5]*100)/100)
                    .attr('style','text-align:right; color:'+experiment.colorList[2*i+1]);
                d3.select('#'+'myDiv'+index.toString()+'_3')
                    .append('p')
                    .text('Concave area: '+Math.floor(element[1][2][i][7]*100)/100)
                    .attr('style','text-align:right; color:'+experiment.colorList[2*i+1]);
                d3.select('#'+'myDiv'+index.toString()+'_3')
                    .append('p')
                    .text('Convex area: '+Math.floor(element[1][2][i][8]*100)/100)
                    .attr('style','text-align:right; color:'+experiment.colorList[2*i+1]);
            }
        });
    }

}