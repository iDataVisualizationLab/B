class DesignApplication {
    constructor() {
    }

    // Main view
    static MainView() {
        d3.select('body').append('div')
            .attr('id','mainDiv')
            .attr('class','row');
        d3.select('#mainDiv').append('div')
            .attr('id','leftSide')
            .attr('class','col-md-4');
        d3.select('#mainDiv').append('div')
            .attr('id','rightSide')
            .attr('class','col-md-8');
    }

    // Control panel
    static ControlPanel(parentDiv,ID) {
        d3.select('#'+parentDiv).append('div')
            .attr('id',ID);
        d3.select('#'+ID).append('div')
            .attr('id','Setting')
            .attr('class','collapsible-header');
        d3.select('#Setting').append('i')
            .attr('class','fas fa-cog');
            d3.select('#Setting').append('text')
                .text('Setting');
        // DesignApplication.CreateSlider(ID,'test',2,0,1);
    }

    // Create canvas
    static CreateCanvas(parentDiv,ID,canvasClass,width,height,color) {
        let canvas = document.getElementById(ID);
        if (canvas) canvas.remove();
        d3.select('#'+parentDiv).append('canvas')
            .attr('id',ID)
            .attr('class',canvasClass)
            .attr('width',width)
            .attr('height',height)
            .attr('background-color',color);
    }

    // Design HML view
    // headerInfo: object {font: 'Arial', size: number, position: {high: [x,y], median: [x,y], low: [x,y]},}
    // plotInfo: object {size: [width,height], position: [x,y], notations: {font, size, color}, }
    // blankSize: [blank in x, blank in y] -> distance between plots
    // nPlots: number of displayed plots per column
    // plots: object of {high: [index], median: [index], low: [index]}
    static HMLView(canvasID,headerInfo,plotInfo,blankSize,plots) {
        let canvas = document.getElementById(canvasID);
        let ctx = canvas.getContext('2d');
        // Check number of displayed plots
        let check = plots.high.length > 0 || plots.median.length > 0 || plots.low.length > 0;
        let arrN = [plots.high.length,plots.median.length,plots.low.length];
        if (check) {
            // Write headers
            ctx.font = headerInfo.size + 'px ' + headerInfo.font;
            ctx.fillText('Highest scores',headerInfo.position.high[0],headerInfo.position.high[1]);
            ctx.fillText('Median scores',headerInfo.position.median[0],headerInfo.position.median[1]);
            ctx.fillText('Lowest scores',headerInfo.position.low[0],headerInfo.position.low[1]);
            // Draw plots
            for (let c = 0; c < 3; c++) {
                for (let p = 0; p < arrN[c]; p++) {
                    // draw rectangle
                    let plotPosition = [];
                    plotPosition[0] = plotInfo.position[0] + 2*c*(plotInfo.size[0]+blankSize[0]);
                    plotPosition[1] = plotInfo.position[1] + p*(plotInfo.size[1]+blankSize[1]);
                    let index, data;
                    switch (c) {
                        case 0:
                            index = plots.high[p];
                            break;
                        case 1:
                            index = plots.median[p];
                            break;
                        case 2:
                            index = plots.low[p];
                            break;
                    }
                    DesignApplication.netScatterPlot(canvasID,plotPosition,plotInfo.size,netSP.plots[index].arrows,netSP.plots[index].points,index,true);
                    let radarPosition = [];
                    radarPosition[0] = plotPosition[0] + plotInfo.size[0] + blankSize[0] + plotInfo.size[0]/3;
                    radarPosition[1] = plotPosition[1] + plotInfo.size[1]/2;
                    DesignApplication.CircularBarChart(canvasID,radarPosition,plotInfo.size[0]/3,index,true);
                }
            }
            // draw original time series
            if (controlVariable.displaySeries) {
                let instance = controlVariable.interaction.instance;
                let variable1 = controlVariable.interaction.variable1;
                let variable2 = controlVariable.interaction.variable2;
                let time = controlVariable.interaction.time;
                let index = netSP.encode.findIndex(e=>{
                    let check1 = controlVariable.interaction.variable1 === e[0] && controlVariable.interaction.variable2 === e[1] && controlVariable.interaction.time === e[2];
                    let check2 = controlVariable.interaction.variable1 === e[1] && controlVariable.interaction.variable2 === e[0] && controlVariable.interaction.time === e[2];
                    return check1 || check2;
                });
                let outliers1 = [];
                if (netSP.plots[index].outliers['length'].length > 0) {
                    netSP.plots[index].outliers['length'].forEach(e=>outliers1.push(e));
                }
                let outliers2 = [];
                if (netSP.plots[index].outliers.angle.length > 0) {
                    netSP.plots[index].outliers.angle.forEach(e=>outliers2.push(e));
                }
                DesignApplication.timeSeries(canvasID,instance,variable1,[100,50],[800,200],time,outliers1,outliers2);
                DesignApplication.timeSeries(canvasID,instance,variable2,[100,300],[800,200],time,outliers1,outliers2);
            }
        } else {
            ctx.font = headerInfo.size + 'px ' + headerInfo.font;
            ctx.fillText('There is no plot after filtering.',headerInfo.position.high[0],headerInfo.position.high[1]);
        }
    }

    // Sliders
    static CreateSlider(parentDiv,ID,col,minValue,maxValue) {
        d3.select('#'+parentDiv).append('div')
            .attr('id',ID)
            // .attr('class','col-md-'+col);
        let slider = document.getElementById(ID);
        noUiSlider.create(slider,{
            start: [minValue,maxValue],
            connect: true,
            range: {
                'min': minValue,
                'max': maxValue,
            }
        });
    }

    // time series
    // pos: [x,y]
    // size: [x,y]
    static timeSeries (canvasID,instance,variable,pos,size,timeHighlight,outliers1,outliers2) {
        let canvas = document.getElementById(canvasID);
        let ctx = canvas.getContext('2d');
        ctx.font = '12px Arial';
        ctx.fillStyle = '#000000';
        // write variable name
        ctx.translate(pos[0],pos[1]+size[1]);
        ctx.rotate(-Math.PI/2);
        ctx.fillText(variable,size[1]/4,-5);
        ctx.rotate(Math.PI/2);
        ctx.translate(-pos[0],-pos[1]-size[1]);
        ctx.fillText('0',pos[0]-10,pos[1]+size[1]);
        ctx.fillText('1',pos[0]-10,pos[1]+13);
        // write instance name
        if (instance !== 'noOption') ctx.fillText(instance,pos[0],pos[1]-5);
        // write time
        for (let t = 0; t < 5; t++) {
            ctx.textAlign = 'center';
            ctx.fillText(netSP.timeInfo[Math.floor((netSP.timeInfo.length-1)*t/4)],pos[0]+5+(size[0]-10)*Math.floor((netSP.timeInfo.length-1)*t/4)/netSP.timeInfo.length,pos[1]+size[1]+15);
            ctx.textAlign = 'left';
        }
        ctx.closePath();
        // draw rectangle
        ctx.beginPath();
        ctx.fillStyle = 'rgb(255,255,255)';
        ctx.fillRect(pos[0],pos[1],size[0],size[1]);
        ctx.strokeStyle = 'rgb(0,0,0)';
        ctx.strokeRect(pos[0],pos[1],size[0],size[1]);
        ctx.closePath();
        // draw line
        netSP.instanceInfo.forEach(e_=>{
            let data = [];
            data = DataProcessing.ScaleTimeSeries(netSP.data[e_[1]][variable]);
            data.forEach((e,i)=>{
                if (i) {
                    if (typeof (e) === 'number' && typeof (data[i-1]) === 'number') {
                        let x0 = pos[0] + 5 + (i-1)*(size[0]-10)/netSP.timeInfo.length;
                        let x1 = pos[0] + 5 + i*(size[0]-10)/netSP.timeInfo.length;
                        let y0 = pos[1] + size[1] - 5 - data[i-1]*(size[1]-10);
                        let y1 = pos[1] + size[1] - 5 - e*(size[1]-10);
                        let check1 = outliers1.findIndex(e__=>e__===e[1]) !== -1;
                        let check2 = outliers2.findIndex(e__=>e__===e[1]) !== -1;
                        ctx.beginPath();
                        if (instance !== e_[1]) ctx.globalAlpha = 0.3;
                        else ctx.globalAlpha = 1;
                        ctx.moveTo(x0,y0);
                        ctx.lineTo(x1,y1);
                        if (check1)
                            ctx.strokeStyle = (netSP.timeInfo[i]===timeHighlight) ? 'rgb(255,255,0)' : 'rgb(255,0,0)';
                        else if (check2)
                            ctx.strokeStyle = (netSP.timeInfo[i]===timeHighlight) ? 'rgb(0,255,255)' : 'rgb(0,0,255)';
                        else
                            ctx.strokeStyle = (netSP.timeInfo[i]===timeHighlight) ? 'rgb(0,255,0)' : 'rgb(0,0,0)';
                        if (instance !== e_[1]) ctx.lineWidth = 1;
                        else ctx.lineWidth = 3;
                        ctx.stroke();
                        ctx.globalAlpha = 1;
                        ctx.lineWidth = 1;
                    }
                }
            });
        });
    }

    // draw net scatter plot
    // plotPosition, plotSize: array [x,y]
    // index of plot from netSP.plots[index]
    static netScatterPlot (canvasID,plotPosition,plotSize,data,points,index,notation) {
        let canvas = document.getElementById(canvasID);
        let ctx = canvas.getContext('2d');
        // draw rectangle
        ctx.beginPath();
        ctx.fillStyle = 'rgb(220,220,220)';
        ctx.fillRect(plotPosition[0],plotPosition[1],plotSize[0],plotSize[1]);
        ctx.strokeStyle = 'rgb(0,0,0)';
        ctx.strokeRect(plotPosition[0],plotPosition[1],plotSize[0],plotSize[1]);
        // draw information of the plot
        let xVar = netSP.encode[index][0];
        let yVar = netSP.encode[index][1];
        let time2 = netSP.encode[index][2];
        let tIndex2 = netSP.timeInfo.findIndex(e=>e===time2);
        let time1 = netSP.timeInfo[tIndex2-netSP.step];
        ctx.font = '10px Arial';
        ctx.fillStyle = 'rgb(0,0,0)';
        if (notation) {
            ctx.fillText(xVar,plotPosition[0],plotPosition[1]+plotSize[1]+12+5);
            ctx.translate(plotPosition[0],plotPosition[1]+plotSize[1]);
            ctx.rotate(-Math.PI/2);
            ctx.fillText(yVar,0,-5);
            ctx.rotate(Math.PI/2);
            ctx.translate(-plotPosition[0],-plotPosition[1]-plotSize[1]);
            ctx.fillText(time1.toString()+'-'+time2.toString(),plotPosition[0],plotPosition[1]-5);
            if (controlVariable.visualizing === 'LMH') {
                let score = netSP.plots[index].metrics[controlVariable.selectedMetric];
                score = Math.floor(score*100)/100;
                ctx.textAlign = 'right';
                ctx.fillText(controlVariable.selectedMetric+': '+score.toString(),plotPosition[0]+plotSize[0],plotPosition[1]-5);
                ctx.textAlign = 'left';
            }
        }
        // draw arrows
        data.forEach((e,i)=>{
            let iCheck1 = i.toString() === controlVariable.interaction.instance && xVar === controlVariable.interaction.variable1 && yVar === controlVariable.interaction.variable2 && time2 === controlVariable.interaction.time;
            let iCheck2 = i.toString() === controlVariable.interaction.instance && xVar === controlVariable.interaction.variable2 && yVar === controlVariable.interaction.variable1 && time2 === controlVariable.interaction.time;
            let iCheck = iCheck1 || iCheck2;
            let x0 = plotPosition[0] + 5 + (plotSize[0]-10)*e.start[0];      // padding = 5
            let y0 = plotPosition[1] + 5 + (plotSize[1]-10)*(1-e.start[1]);
            let x1 = plotPosition[0] + 5 + (plotSize[0]-10)*e.end[0];
            let y1 = plotPosition[1] + 5 + (plotSize[1]-10)*(1-e.end[1]);
            let L = Math.sqrt((x1-x0)*(x1-x0)+(y1-y0)*(y1-y0));
            if (x0 !== x1 || y0 !== y1) {
                let p = Geometry.LineEquation(x0,y0,x1,y1);
                let d = L/4 < 5 ? L/4 : 5;      // size of triangle in the arrow
                let x2 = (x0-x1 > 0) ? x1+Math.abs(p[1])*d/Math.sqrt(p[0]*p[0]+p[1]*p[1]) : x1-Math.abs(p[1])*d/Math.sqrt(p[0]*p[0]+p[1]*p[1]);
                let y2 = (y0-y1 > 0) ? y1+Math.abs(p[0])*d/Math.sqrt(p[0]*p[0]+p[1]*p[1]) : y1-Math.abs(p[0])*d/Math.sqrt(p[0]*p[0]+p[1]*p[1]);
                let x3 = x2 + (y1-y2)/Math.sqrt(3);
                let y3 = y2 - (x1-x2)/Math.sqrt(3);
                let x4 = x2 - (y1-y2)/Math.sqrt(3);
                let y4 = y2 + (x1-x2)/Math.sqrt(3);
                let isOutlierL = false;
                if (netSP.plots[index].outliers.length.length > 0) if (netSP.plots[index].outliers.length.findIndex(e_=>e_===i) !== -1) isOutlierL = true;
                let isOutlierA = false;
                if (netSP.plots[index].outliers.angle.length > 0) if (netSP.plots[index].outliers.angle.findIndex(e_=>e_===i) !== -1) isOutlierA = true;
                ctx.beginPath();
                ctx.moveTo(x0,y0);
                ctx.lineTo(x1,y1);
                if (iCheck) ctx.strokeStyle = 'rgb(255,0,0)';
                else if (isOutlierL) ctx.strokeStyle = 'rgb(0,255,0)';
                else if (isOutlierA) ctx.strokeStyle = 'rgb(0,0,255)';
                else ctx.strokeStyle = 'rgb(0,0,0)';
                ctx.stroke();
                ctx.closePath();
                ctx.beginPath();
                ctx.moveTo(x1,y1);
                ctx.lineTo(x3,y3);
                ctx.lineTo(x4,y4);
                ctx.lineTo(x1,y1);
                if (iCheck) ctx.fillStyle = 'rgb(255,0,0)';
                else if (isOutlierL) ctx.fillStyle = 'rgb(0,255,0)';
                else if (isOutlierA) ctx.fillStyle = 'rgb(0,0,255)';
                else ctx.fillStyle = 'rgb(0,0,0)';
                ctx.fill();
                ctx.closePath();
            }
        });
        // draw points
        if (points.length > 0) {
            points.forEach(e=>{
                let x = plotPosition[0] + 5 + (plotSize[0]-10)*e[0];
                let y = plotPosition[1] + 5 + (plotSize[1]-10)*(1-e[1]);
                ctx.beginPath();
                ctx.fillStyle = 'rgb(0,0,0)';
                ctx.arc(x,y,1,0,Math.PI*2);
                ctx.fill();
                ctx.closePath();
            });
        }
        ctx.closePath();
    }

    // draw radar chart
    // plotPosition: [x,y]
    static RadarChart(canvasID,plotPosition,radius,index,notation) {
        let canvas = document.getElementById(canvasID);
        let ctx = canvas.getContext('2d');
        ctx.beginPath();
        // draw circles at 0.2, 0.4, 0.6, 0.8, 1.0
        for (let i = 1; i < 6; i++) {
            ctx.beginPath();
            ctx.globalAlpha = 0.2;
            ctx.fillStyle = 'rgb(205,205,205)';
            ctx.strokeStyle = 'rgb(0,0,0)';
            ctx.lineWidth = 0.15;
            ctx.arc(plotPosition[0],plotPosition[1],i*0.2*radius,0,2*Math.PI);
            ctx.fill();
            ctx.stroke();
            ctx.globalAlpha = 1;
            ctx.lineWidth = 1;
            ctx.closePath();
        }
        // draw radar chart
        let alpha = Math.PI*2/netSP.metricName.length;
        netSP.metricName.forEach((e,i)=>{
            let r = radius*netSP.plots[index].metrics[e];
            let next = (i !== netSP.metricName.length-1) ? netSP.metricName[i+1] : netSP.metricName[0];
            let rN = radius*netSP.plots[index].metrics[next];
            ctx.beginPath();
            ctx.fillStyle = 'rgb(200,200,200)';
            ctx.moveTo(plotPosition[0],plotPosition[1]);
            ctx.lineTo(plotPosition[0]+r*Math.sin(i*alpha),plotPosition[1]-r*Math.cos(i*alpha));
            ctx.lineTo(plotPosition[0]+rN*Math.sin((i+1)*alpha),plotPosition[1]-rN*Math.cos((i+1)*alpha));
            ctx.lineTo(plotPosition[0],plotPosition[1]);
            ctx.fill();
            ctx.closePath();
        });
        // draw notations
        if (notation) {
            ctx.font = '9px Arial';
            netSP.metricName.forEach((e,i)=>{
                ctx.beginPath();
                ctx.globalAlpha = 1;
                ctx.fillStyle = 'rgb(0,0,0)';
                if (i < netSP.metricName.length/2) {
                    ctx.textAlign = 'left';
                } else ctx.textAlign = 'right';
                ctx.fillText(netSP.metricName[i],plotPosition[0]+(radius+5)*Math.sin(i*alpha),plotPosition[1]-(radius+5)*Math.cos(i*alpha));
                ctx.textAlign = 'left';
                ctx.closePath();
            });
        }
        ctx.closePath();
    }

    // draw circular bar chart
    static CircularBarChart(canvasID,plotPosition,radius,index,notation) {
        let canvas = document.getElementById(canvasID);
        let ctx = canvas.getContext('2d');
        let alpha = Math.PI*2/netSP.metricName.length;
        ctx.beginPath();
        // draw circles at 0.2, 0.4, 0.6, 0.8, 1.0
        for (let i = 1; i < 6; i++) {
            ctx.beginPath();
            ctx.globalAlpha = 0.1;
            ctx.strokeStyle = 'rgb(0,0,0)';
            ctx.fillStyle = 'rgb(205,205,205)';
            ctx.arc(plotPosition[0],plotPosition[1],i*0.2*radius,0,2*Math.PI);
            ctx.stroke();
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.closePath();
        }
        // draw radar chart
        netSP.metricName.forEach((e,i)=>{
            let r = radius*netSP.plots[index].metrics[e];
            ctx.beginPath();
            if (dataRadar2.length>0) {
                let cluster = dataRadar2[index].cluster;
                ctx.fillStyle = colorCluster(cluster_info[cluster].name);
                ctx.strokeStyle = colorCluster(cluster_info[cluster].name);
            } else {
                ctx.fillStyle = 'rgb(200,200,200)';
                ctx.strokeStyle = 'rgb(200,200,200)';
            }
            ctx.globalAlpha = 0.5;
            ctx.moveTo(plotPosition[0],plotPosition[1]);
            ctx.lineTo(plotPosition[0]+r*Math.sin(i*alpha-alpha/4),plotPosition[1]-r*Math.cos(i*alpha-alpha/4));
            ctx.lineTo(plotPosition[0]+r*Math.sin(i*alpha+alpha/4),plotPosition[1]-r*Math.cos(i*alpha+alpha/4));
            ctx.lineTo(plotPosition[0],plotPosition[1]);
            ctx.arc(plotPosition[0],plotPosition[1],r,i*alpha-alpha/4-Math.PI/2,i*alpha+alpha/4-Math.PI/2)
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.closePath();
            ctx.beginPath();
            ctx.strokeStyle = 'rgb(255,255,255)';
            ctx.moveTo(plotPosition[0],plotPosition[1]);
            ctx.lineTo(plotPosition[0]+radius*Math.sin(i*alpha),plotPosition[1]-radius*Math.cos(i*alpha));
            ctx.lineWidth = 0.15;
            ctx.stroke();
            ctx.lineWidth = 1;
            ctx.closePath();
        });
        // draw notations
        if (notation) {
            ctx.font = '9px Arial';
            netSP.metricName.forEach((e,i)=>{
                ctx.beginPath();
                ctx.globalAlpha = 1;
                ctx.fillStyle = 'rgb(0,0,0)';
                if (i < netSP.metricName.length/2) {
                    ctx.textAlign = 'left';
                } else ctx.textAlign = 'right';
                ctx.fillText(netSP.metricName[i],plotPosition[0]+(radius+5)*Math.sin(i*alpha),plotPosition[1]-(radius+5)*Math.cos(i*alpha));
                ctx.textAlign = 'left';
                ctx.closePath();
            });
        }
        ctx.closePath();
    }

    // draw quit sign
    // x in rectangle
    // position, size: [x,y]
    // xColor, bColor: 'rgb(*,*,*)'
    static QuitSign (canvasID,position,size,xColor,bColor) {
        let canvas = document.getElementById(canvasID);
        let ctx = canvas.getContext('2d');
        ctx.beginPath();
        // draw rectangle
        ctx.fillStyle = bColor;
        ctx.fillRect(position[0],position[1],size[0],size[1]);
        ctx.fill();
        // draw x
        ctx.lineWidth = 3;
        ctx.moveTo(position[0]+1,position[1]+1);
        ctx.lineTo(position[0]+size[0]-1,position[1]+size[1]-1);
        ctx.strokeStyle = xColor;
        ctx.fill();
        ctx.moveTo(position[0]+1,position[1]+size[1]-1);
        ctx.lineTo(position[0]+size[0]-1,position[1]+1);
        ctx.strokeStyle = xColor;
        ctx.stroke();
        ctx.lineWidth = 1;
        ctx.closePath();
    }

    // draw time series of metrics
    static drawMetricSeries(canvasID) {
        let canvas = document.getElementById(canvasID);
        let ctx = canvas.getContext('2d');
        let size = [1000,200];
        let blank = 50;
        let variable1 = controlVariable.interaction.variable1;
        let variable2 = controlVariable.interaction.variable2;
        if (variable1 !== 'noOption' && variable2 !== 'noOption') {
            netSP.metricName.forEach((e,i)=>{
                let pos = [50,100+i*(size[1]+blank)];
                ctx.beginPath();
                ctx.globalAlpha = 1;
                ctx.lineWidth = 1;
                ctx.font = '13px Arial';
                ctx.fillStyle = '#000000';
                // write variable name
                // ctx.translate(pos[0],pos[1]+size[1]);
                // ctx.rotate(-Math.PI/2);
                ctx.fillText(e,pos[0],pos[1]-5);
                ctx.fillText('0',pos[0]-10,pos[1]+size[1]);
                ctx.fillText('1',pos[0]-10,pos[1]+13);
                // ctx.rotate(Math.PI/2);
                // ctx.translate(-pos[0],-pos[1]-size[1]);
                // write time
                for (let t = 0; t < 5; t++) {
                    ctx.textAlign = 'center';
                    ctx.fillText(netSP.timeInfo[Math.floor((netSP.timeInfo.length-1)*t/4)],pos[0]+5+(size[0]-10)*Math.floor((netSP.timeInfo.length-1)*t/4)/netSP.timeInfo.length,pos[1]+size[1]+15);
                    ctx.textAlign = 'left';
                }
                // draw rectangle
                ctx.fillStyle = 'rgb(255,255,255)';
                ctx.fillRect(pos[0],pos[1],size[0],size[1]);
                ctx.strokeStyle = 'rgb(0,0,0)';
                ctx.strokeRect(pos[0],pos[1],size[0],size[1]);
                ctx.closePath();
                // draw time series
                netSP.timeInfo.forEach((e_,i_)=>{
                    if (i_>1) {
                        let index1 = netSP.encode.findIndex(e__=>{
                            let check1 = e__[0] === variable1 && e__[1] === variable2 && e__[2] === e_;
                            let check2 = e__[0] === variable2 && e__[1] === variable1 && e__[2] === e_;
                            return check1 || check2;
                        });
                        let index0 = netSP.encode.findIndex(e__=>{
                            let check1 = e__[0] === variable1 && e__[1] === variable2 && e__[2] === netSP.timeInfo[i_-1];
                            let check2 = e__[0] === variable2 && e__[1] === variable1 && e__[2] === netSP.timeInfo[i_-1];
                            return check1 || check2;
                        });
                        let x0 = pos[0] + 5 + (i_-1)*(size[0]-10)/netSP.timeInfo.length;
                        let x1 = pos[0] + 5 + i_*(size[0]-10)/netSP.timeInfo.length;
                        let y0 = pos[1] + size[1] - 5 - netSP.plots[index0].metrics[e]*(size[1]-10);
                        let y1 = pos[1] + size[1] - 5 - netSP.plots[index1].metrics[e]*(size[1]-10);
                        ctx.beginPath();
                        ctx.moveTo(x0,y0);
                        ctx.lineTo(x1,y1);
                        if (e_ === controlVariable.interaction.time) ctx.strokeStyle = 'rgb(255,0,0)';
                        else ctx.strokeStyle = 'rgb(0,0,0)';
                        ctx.stroke();
                        ctx.closePath();
                    }
                });
            });
        }
    }

}