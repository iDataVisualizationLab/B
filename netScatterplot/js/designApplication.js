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
    static HMLView(canvasID,headerInfo,plotInfo,blankSize,nPlots,plots) {
        let canvas = document.getElementById(canvasID);
        let ctx = canvas.getContext('2d');
        // Write headers
        ctx.font = headerInfo.size + 'px ' + headerInfo.font;
        ctx.fillText('Highest scores',headerInfo.position.high[0],headerInfo.position.high[1]);
        ctx.fillText('Median scores',headerInfo.position.median[0],headerInfo.position.median[1]);
        ctx.fillText('Lowest scores',headerInfo.position.low[0],headerInfo.position.low[1]);
        // Draw plots
        for (let c = 0; c < 3; c++) {
            for (let p = 0; p < nPlots; p++) {
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
                let score = netSP.plots[index].metrics
                data = DataProcessing.NormalizationNetScatterPlot(netSP.plots[index].data,time);
                ctx.font = plotInfo.notations.size + 'px ' + plotInfo.notations.font;
                ctx.fillStyle = plotInfo.notations.color;
                ctx.fillText(xVar,plotPosition[0],plotPosition[1]+plotInfo.size[1]+plotInfo.notations.size+5);
                ctx.translate(plotPosition[0],plotPosition[1]+plotInfo.size[1]);
                ctx.rotate(-Math.PI/2);
                ctx.fillText(yVar,0,-5);
                ctx.rotate(Math.PI/2);
                ctx.translate(-plotPosition[0],-plotPosition[1]-plotInfo.size[1]);
                ctx.fillText(time,plotPosition[0],plotPosition[1]-5);
                data.forEach(e=>{
                    let x0 = plotPosition[0] + plotInfo.size[0]*e.x0;
                    let y0 = plotPosition[1] + plotInfo.size[1]*(1-e.y0);
                    let x1 = plotPosition[0] + plotInfo.size[0]*e.x1;
                    let y1 = plotPosition[1] + plotInfo.size[1]*(1-e.y1);
                    ctx.beginPath();
                    ctx.strokeStyle = 'rgb(255,0,0)';
                    ctx.fillStyle = 'rgb(255,0,0)';
                    ctx.arc(x0,y0,3,0,Math.PI*2);
                    ctx.stroke();
                    ctx.fill();
                    ctx.beginPath();
                    ctx.strokeStyle = 'rgb(0,0,255)';
                    ctx.fillStyle = 'rgb(0,0,255)';
                    ctx.arc(x1,y1,3,0,2*Math.PI);
                    ctx.stroke();
                    ctx.fill();
                    ctx.beginPath();
                    ctx.moveTo(x0,y0);
                    ctx.lineTo(x1,y1);
                    ctx.strokeStyle = 'rgb(0,0,0)';
                    ctx.stroke();
                    ctx.closePath();
                });
                ctx.closePath();
            }
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

}