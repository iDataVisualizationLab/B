/*
UN-NAME VARIABLES
*/
let metricName = [
    'outlying',
    'clumpy',
    'striated',
]

/*
WINDOW SIZE
*/
let wHeight = window.innerHeight;
let wWidth = window.innerWidth;

/*
DESIGN PARALLEL COORDINATES
*/
let pc_padding = 50;
d3.select('#PC_svg')
    .attr('height',wHeight-2*pc_padding)
    .attr('width',wWidth-2*pc_padding);
let PC = {
    height: +document.getElementById('PC_svg').getAttribute('height'),
    width: +document.getElementById('PC_svg').getAttribute('width'),
    padding: 20,
}