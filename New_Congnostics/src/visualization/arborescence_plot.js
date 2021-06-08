/*
INPUT:
options for drawing the arborescence plot
tree
points

OUTPUT:
arborescence plot
*/

function arborescence_plot (options,tree,points) {
    let svg = options.svg;
    d3.select('#'+svg)
        .append('rect')
        .attr('x',options.x)
        .attr('y',options.y)
        .attr('width',options.size)
        .attr('height',options.size)
        .style('fill','white')
        .style('stroke','black');
    for (let i = 0; i < tree.length; i++) {
        let x0 = options.x + options.size*points[tree[i].parent][0];
        let y0 = options.y + options.size*(1-points[tree[i].parent][1]);
        let x1 = options.x + options.size*points[tree[i].child][0];
        let y1 = options.y + options.size*(1-points[tree[i].child][1]);
        let color0 = (tree[i].parent < points.length/2) ? 'rgb('+255*(1-2*tree[i].parent/points.length).toString()+',0,0)' : 'rgb(0,0,'+2*255*(tree[i].parent-points.length/2)/points.length.toString()+')';
        let color1 = (tree[i].child < points.length/2) ? 'rgb('+255*(1-2*tree[i].child/points.length).toString()+',0,0)' : 'rgb(0,0,'+2*255*(tree[i].child-points.length/2)/points.length.toString()+')';
        let L = Math.sqrt((x1-x0)*(x1-x0)+(y1-y0)*(y1-y0));
        let d = L/3 < 8 ? L/3 : 8;      // size of triangle in the arrow
        let dd = d/Math.sqrt(3);
        let hID = i+'-header';
        let myURL = 'url(#'+hID+')';
        d3.select('#PC_svg')
            .append('defs')
            .append('marker')
            .attr('id',hID)
            .attr('viewBox', [0, 0, d, 2*dd])
            .attr('refX', d)
            .attr('refY', dd)
            .attr('markerWidth', d)
            .attr('markerHeight', d)
            .attr('orient', 'auto-start-reverse')
            .append('path')
            .attr('d', d3.line()([[0,0],[0,2*dd],[d,dd]]))
            .attr('stroke', 'none')
            .attr('fill',color1);
        d3.select('#PC_svg')
            .append('line')
            .attr('x1',x0)
            .attr('y1',y0)
            .attr('x2',x1)
            .attr('y2',y1)
            .attr('marker-end',myURL)
            .style('fill','none')
            .style('stroke-width',1)
            .style('stroke',color0);
        d3.select('#PC_svg')
            .append('circle')
            .attr('cx',x0)
            .attr('cy',y0)
            .attr('r',3)
            .style('fill',color0)
            .style('stroke','none');
        d3.select('#PC_svg')
            .append('circle')
            .attr('cx',x1)
            .attr('cy',y1)
            .attr('r',3)
            .style('fill',color1)
            .style('stroke','none');
    }
}