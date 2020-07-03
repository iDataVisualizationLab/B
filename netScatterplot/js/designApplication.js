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
                    plotPosition[0] = plotInfo.position[0] + c*(plotInfo.size[0]+blankSize[0]);
                    plotPosition[1] = plotInfo.position[1] + p*(plotInfo.size[1]+blankSize[1]);
                    ctx.beginPath();
                    ctx.fillStyle = 'rgb(220,220,220)';
                    ctx.fillRect(plotPosition[0],plotPosition[1],plotInfo.size[0],plotInfo.size[1]);
                    ctx.strokeStyle = 'rgb(0,0,0)';
                    ctx.strokeRect(plotPosition[0],plotPosition[1],plotInfo.size[0],plotInfo.size[1]);
                    // draw information of the plot
                    let xVar, yVar, time, index, data;
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
                    xVar = netSP.encode[index][0];
                    yVar = netSP.encode[index][1];
                    time = netSP.encode[index][2];
                    let score = netSP.plots[index].metrics[controlVariable.selectedMetric];
                    score = Math.floor(score*100)/100;
                    let outliers1 = [];
                    outliers1 = netSP.plots[index].outliers.length;
                    let outliers2 = [];
                    outliers2 = netSP.plots[index].outliers.angle;
                    data = DataProcessing.ScaleNetScatterPlot(netSP.plots[index].data);
                    ctx.font = plotInfo.notations.size + 'px ' + plotInfo.notations.font;
                    ctx.fillStyle = plotInfo.notations.color;
                    ctx.fillText(xVar,plotPosition[0],plotPosition[1]+plotInfo.size[1]+plotInfo.notations.size+5);
                    ctx.translate(plotPosition[0],plotPosition[1]+plotInfo.size[1]);
                    ctx.rotate(-Math.PI/2);
                    ctx.fillText(yVar,0,-5);
                    ctx.rotate(Math.PI/2);
                    ctx.translate(-plotPosition[0],-plotPosition[1]-plotInfo.size[1]);
                    ctx.fillText(time,plotPosition[0],plotPosition[1]-5);
                    ctx.textAlign = 'right';
                    ctx.fillText(score.toString(),plotPosition[0]+plotInfo.size[0],plotPosition[1]-5);
                    ctx.textAlign = 'left';
                    data.forEach(e=>{
                        let x0 = plotPosition[0] + plotInfo.size[0]*e.x0;
                        let y0 = plotPosition[1] + plotInfo.size[1]*(1-e.y0);
                        let x1 = plotPosition[0] + plotInfo.size[0]*e.x1;
                        let y1 = plotPosition[1] + plotInfo.size[1]*(1-e.y1);
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
                            let isOutlier1 = outliers1.findIndex(e_=>e_===e.name) !== -1;
                            let isOutlier2 = outliers2.findIndex(e_=>e_===e.name) !== -1;
                            ctx.beginPath();
                            ctx.globalAlpha = 0.3;
                            ctx.moveTo(x0,y0);
                            ctx.lineTo(x1,y1);
                            if (isOutlier1) ctx.strokeStyle = 'rgb(255,0,0)';
                            else if (isOutlier2) ctx.strokeStyle = 'rgb(0,0,255)';
                            else ctx.strokeStyle = 'rgb(0,0,0)';
                            ctx.stroke();
                            ctx.globalAlpha = 1;
                            ctx.closePath();
                            ctx.beginPath();
                            ctx.globalAlpha = 0.3;
                            ctx.moveTo(x1,y1);
                            ctx.lineTo(x3,y3);
                            ctx.lineTo(x4,y4);
                            ctx.lineTo(x1,y1);
                            if (isOutlier1) ctx.fillStyle = 'rgb(255,0,0)';
                            else if (isOutlier2) ctx.fillStyle = 'rgb(0,0,255)';
                            else ctx.fillStyle = 'rgb(0,0,0)';
                            ctx.fill();
                            ctx.globalAlpha = 1;
                            ctx.closePath();
                        }
                    });
                    ctx.closePath();
                    // highlight the chosen instance
                    if (controlVariable.interaction.instance !== 'noOption') {
                        let check1 = xVar === controlVariable.interaction.variable1 && yVar === controlVariable.interaction.variable2 && time === controlVariable.interaction.time;
                        let check2 = xVar === controlVariable.interaction.variable2 && yVar === controlVariable.interaction.variable1 && time === controlVariable.interaction.time;
                        let check = check1 || check2;
                        if (check) {
                            netSP.plots[index].data.forEach(e=>{
                                if (e.name === controlVariable.interaction.instance) {
                                    let x0 = plotPosition[0] + plotInfo.size[0]*e.x0;
                                    let y0 = plotPosition[1] + plotInfo.size[1]*(1-e.y0);
                                    let x1 = plotPosition[0] + plotInfo.size[0]*e.x1;
                                    let y1 = plotPosition[1] + plotInfo.size[1]*(1-e.y1);
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
                                        let isOutlier1 = outliers1.findIndex(e_=>e_===e.name) !== -1;
                                        let isOutlier2 = outliers2.findIndex(e_=>e_===e.name) !== -1;
                                        ctx.beginPath();
                                        ctx.moveTo(x0,y0);
                                        ctx.lineTo(x1,y1);
                                        if (isOutlier1) ctx.strokeStyle = 'rgb(255,0,0)';
                                        else if (isOutlier2) ctx.strokeStyle = 'rgb(0,0,255)';
                                        else ctx.strokeStyle = 'rgb(0,0,0)';
                                        ctx.lineWidth = 3;
                                        ctx.stroke();
                                        ctx.closePath();
                                        ctx.beginPath();
                                        ctx.moveTo(x1,y1);
                                        ctx.lineTo(x3,y3);
                                        ctx.lineTo(x4,y4);
                                        ctx.lineTo(x1,y1);
                                        if (isOutlier1) ctx.fillStyle = 'rgb(255,0,0)';
                                        else if (isOutlier2) ctx.fillStyle = 'rgb(0,0,255)';
                                        else ctx.fillStyle = 'rgb(0,0,0)';
                                        ctx.fill();
                                        ctx.closePath();
                                        ctx.lineWidth = 1;
                                    }
                                }
                            });
                        }
                    }
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
        ctx.fillText(variable,0,-5);
        ctx.rotate(Math.PI/2);
        ctx.translate(-pos[0],-pos[1]-size[1]);
        // write instance name
        ctx.fillText(instance,pos[0],pos[1]-5);
        // write time
        ctx.fillText(netSP.timeInfo[0],pos[0],pos[1]+size[1]+15);
        ctx.fillText(netSP.timeInfo[netSP.timeInfo.length-1],pos[0]+size[0],pos[1]+size[1]+15);
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
                        if (instance !== e_[1]) ctx.globalAlpha = 0.1;
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
        })
    }

}