/*
INPUT:
options for drawing the connected scatter plot
points: in temporal order

OUTPUT:
connected scatter plot
*/

function connected_scatter_plot (options,points) {
    let svg = options.svg;
    d3.select('#'+svg)
        .append('rect')
        .attr('x',options.x)
        .attr('y',options.y)
        .attr('width',options.size)
        .attr('height',options.size)
        .style('fill','white')
        .style('stroke','rgba(0,0,0,1)');
    for (let t = 0; t < points.length; t++) {
        let x = options.x + options.size*points[t][0];
        let y = options.y + options.size*(1-points[t][1]);
        let color = (t < points.length/2) ? 'rgb('+255*(1-2*t/points.length).toString()+',0,0)' : 'rgb(0,0,'+2*255*(t-points.length/2)/points.length.toString()+')';
        d3.select('#'+svg)
            .append('circle')
            .attr('cx',x)
            .attr('cy',y)
            .attr('r',1)
            .style('fill',color)
            .style('stroke','none');
        if (t > 0) {
            let x0 = options.x + options.size*points[t-1][0];
            let y0 = options.y + options.size*(1-points[t-1][1]);
            d3.select('#PC_svg')
                .append('line')
                .attr('x1',x0)
                .attr('y1',y0)
                .attr('x2',x)
                .attr('y2',y)
                .style('fill','none')
                .style('stroke',color);
        }
    }
}