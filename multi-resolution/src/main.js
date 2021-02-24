// ADD ATTRIBUTES TO ELEMENTS
// main interface
d3.select('#mainInterface')
    .style('width',width)
    .style('height',height);
// timeline
d3.select('#timeline')
    .style('width',width)
    .style('height',20)
    .append('rect')
    .attr('width',timeLineWidth+2*timelinePadding)
    .attr('height',20)
    .attr('x',0)
    .attr('y',0)
    .style('fill','rgba(200,200,200,0.8)')
    .style('stroke','none');
// interface
d3.select('#interface')
    .style('width',width)
    .style('height',height-20-10-10+50)        // 20: timeline height, 10: blank between timeline and the top, 10: blank between timeline and interface
// legend
d3.select('#legend')
    .style('width',50)
    .style('height',height);
d3.select('#legend')
    .append('text')
    .attr('x',0)
    .attr('y',0)
    .attr('transform','translate(25,100) rotate(-90)')
    .text('Resolution');

function main() {
    d3.json(fileName[selectedData])
        .then(file=>{
            // draw legend
            d3.selectAll('.legend').remove();
            d3.select('#legend')
                .append('rect')
                .attr('class','legend')
                .attr('x',30)
                .attr('y',10)
                .attr('width',10)
                .attr('height',chartHeight*ds.length+40)
                .style('fill','rgba(200,200,200,0.8)');
            for (let i = 0; i < ds.length; i++) {
                d3.select('#legend')
                    .append('rect')
                    .attr('class','legend')
                    .attr('x',25)
                    .attr('y',12+20+chartHeight*(i+1))
                    .attr('width',10)
                    .attr('height',3)
                    .style('fill','rgba(200,200,200,0.8)');
                d3.select('#interface')
                    .append('line')
                    .attr('class','legend')
                    .attr('x1',0)
                    .attr('y1',chartHeight*(i+1))
                    .attr('x2',width-50)
                    .attr('y2',chartHeight*(i+1))
                    .style('stroke','rgba(0,0,0,0.4)')
                    .style('stroke-width',0.5)
                    .style('stroke-dasharray','4');
                d3.select('#legend')
                    .append('text')
                    .attr('class','legend')
                    .attr('x',15)
                    .attr('y',15+20+chartHeight*(i+1))
                    .style('font','13px Time New Roman')
                    .style('text-anchor','end')
                    .text(ds[i]);
            }
            // write data to global variables
            writeData_NetScatter(file);
            // computation
            computations();
            // drop down menu
            metricDropDown();
            plotDropDown();
            // draw
            drawInterface(false);
        })
        .catch(error=>{
            console.log(error);
        });
}



main();
// add event listener to timeline
mouseMove('timeline');
mouseOut('timeline');
// brushing
mouseClick('timeline');