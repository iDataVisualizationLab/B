/*
INPUT:
Plots: array of plots
Each plot: array of visual metrics

OUTPUT:
parallel coordinates for all plots
other supporting visualizations
*/

function parallel_coordinates (Plots) {
    let N = metricName.length;
    let w = (PC.width-2*PC.padding)/(N+2);      // distance between two coordinates
    let h = (PC.height-2*PC.padding)/2;             // length of every coordinate
    // draw coordinates
    let y_top = PC.padding + 30;
    let y_bottom = y_top + h;
    for (let m = 0; m < metricName.length; m++) {
        let x = PC.padding + 2*w + m*w;
        d3.select('#PC_svg')
            .append('line')
            .attr('x1',x)
            .attr('y1',y_top)
            .attr('x2',x)
            .attr('y2',y_bottom)
            .style('stroke','rgba(0,0,0,1)')
            .style('stroke-width',2);
        d3.select('#PC_svg')
            .append('text')
            .attr('x',x)
            .attr('y',y_top-10)
            .text(metricName[m])
            .style('font','15px Times New Roman')
            .style('text-anchor','middle')
            .style('fill','rgba(0,0,0,1)')
            .style('stroke','none');
        for (let i = 0; i < 11; i++) {
            d3.select('#PC_svg')
                .append('line')
                .attr('x1',x)
                .attr('y1',y_bottom-0.1*h*i)
                .attr('x2',x-5)
                .attr('y2',y_bottom-0.1*h*i)
                .style('stroke','rgba(0,0,0,1)')
                .style('stroke-width',1);
            d3.select('#PC_svg')
                .append('text')
                .attr('x',x-8)
                .attr('y',y_bottom-0.1*h*i)
                .text(Math.floor(0.1*i*10)/10)
                .style('font','12px Times New Roman')
                .style('text-anchor','end')
                .style('fill','rgba(0,0,0,1)')
                .style('stroke','none');
        }
    }
    // draw instances
    for (let p = 0; p < Plots.length; p++) {
        // scores
        d3.select('#PC_svg')
            .append('path')
            .datum(Plots[p])
            .attr('fill','none')
            .attr('stroke','rgba(0,0,0,0.8)')
            .attr('stroke-width',1)
            .attr('d',d3.line()
                .x((e,m)=> PC.padding + 2*w + m*w)
                .y((e)=> y_bottom-h*e));
        // plots for evaluation
        let options = {
            svg: 'PC_svg',
            size: 100,
            x: PC.padding + w,
            y: y_bottom-h*Plots[p][2],
        }
        connected_scatter_plot(options,Plots[p].points);
        // arborescence_plot(options,Plots[p].tree,Plots[p].points);
    }

}