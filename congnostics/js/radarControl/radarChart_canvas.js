/////////////////////////////////////////////////////////
/////////////// The Radar Chart Function ////////////////
/////////////// Written by Nadieh Bremer ////////////////
////////////////// VisualCinnamon.com ///////////////////
/////////// Inspired by the code of alangrafu ///////////
/////////////////////////////////////////////////////////
    
function RadarChart_canvas(id, data, options, name) {
    this.smooth = this.smooth===undefined?0.5:this.smooth;
    var cfg = {
        w: 600,                //Width of the circle
        h: 600,                //Height of the circle
        margin: {top: 10, right: 55, bottom: 0, left: 55}, //The margins of the SVG
        levels: 3,             //How many levels or inner circles should there be drawn
        maxValue: 0,           //What is the value that the biggest circle will represent
        labelFactor: 1.1,     //How much farther than the radius of the outer circle should the labels be placed
        wrapWidth: 60,         //The number of pixels after which a label needs to be given a new line
        opacityArea: 0.35,     //The opacity of the area of the blob
        dotRadius: 3,          //The size of the colored circles of each blog
        opacityCircles: 0.1,   //The opacity of the circles of each blob
        strokeWidth: 0.5,        //The width of the stroke around each blob
        roundStrokes: true,   //If true the area and stroke will follow a round path (cardinal-closed)
        radiuschange: true,
        markedLegend:undefined,
        showText: true,
        bin: false,
        gradient: false,
        isNormalize: true,
        showHelperPoint: true,
        arrColor: ["#110066", "#4400ff", "#00cccc", "#00dd00", "#ffcc44", "#ff0000", "#660000"],
        legend: [],
        mini:false,
        fillin:false,
        ringColor: undefined,
        pathColor: undefined,
        ringStroke_width: 0.5,
        schema: undefined,
        pos:{x:0,y:0},
        events:{
            axis: {
                mouseover: function(){},
                mouseleave: function(){},
                click: function(){},
                },
        },
        color: function () {
            return 'rgb(167, 167, 167)'
        }
        //d3.scaleOrdinal(d3.schemeCategory10) //Color function
    };
    //Put all of the options into a variable called cfg
    if ('undefined' !== typeof options) {
        for (var i in options) {
            if ('undefined' !== typeof options[i]) {
                cfg[i] = options[i];
            }
        }//for i
    }//if

    var maxValue,minValue,range,arrThresholds,colorTemperature,opaTemperature,allAxis,rScale,scaleMarkedLegend;
    range = thresholds[0];
    // NEW SETTING
    //If the supplied maxValue is smaller than the actual one, replace by the max in the data
    // maxValue = Math.max(cfg.maxValue, d3.max(data, function (i) {
    //     return d3.max(i.map(function (o) {
    //         return o.value;
    //     }))
    // }));

    if (cfg.isNormalize){
        minValue = 0;
        maxValue = 1;
        range = [minValue,maxValue];
    } else {
        maxValue = Math.max(cfg.maxValue, d3.max(data, function (i) {
            return d3.max(i.map(function (o) {
                return o.value;
            }))
        }));
        minValue = Math.min(cfg.minValue, d3.min(data, function (i) {
            return d3.min(i.map(function (o) {
                return o.value;
            }))
        }));
        range = [minValue,maxValue]
    }
    if (cfg.markedLegend) scaleMarkedLegend = d3.scaleLinear().domain(range).range(cfg.markedLegend);

    let colorLength = cfg.arrColor.length-1;
    var dif = 1 / (cfg.levels-2);
    var right = 1 + dif;
    cfg.arrThresholds = [-dif];
    for (var i=0;i<colorLength-1;i++)
        cfg.arrThresholds.push(i*dif);
    cfg.arrThresholds.push(right);
    colorTemperature = d3.scaleLinear()
        .domain(cfg.arrThresholds)
        .range(cfg.arrColor)
        .interpolate(d3.interpolateHcl); //interpolateHsl interpolateHcl interpolateRgb



    if (cfg.schema){
        range = [0,1];
        allAxis = cfg.schema.filter(d=>d.enable);
    }else{
        //Names of each axis
        angleSlice = cfg.angleSlice;
        allAxis = (data[0].map(function (i, j) {
                return {text: i.axis, angle: angleSlice[j]};
            }));
    }
    let deltaAng = Math.PI/10;
    // Re-adjust angles
    minValue = range[0]-dif*(range[1]-range[0]);
    maxValue = range[1]+dif*(range[1]-range[0]);

    let  radius = Math.min(cfg.w / 2, cfg.h / 2);    //Radius of the outermost circle
    Format = d3.format('');               //Percentage formatting

    data = data.map(ditem=>{
        if (ditem.bin)
            ditem.bin.val = ditem.bin.val.map(v=>v.filter((d,i)=>allAxis.find(e=>e.text===ditem[i].axis)));

        const ditem_filtered = ditem.filter(d=>allAxis.find(e=>e.text===d.axis));
        let temp = _.sortBy(ditem_filtered,d=>allAxis.find(e=>e.text===d.axis).angle);
        temp.type = ditem.type;
        temp.name = ditem.name;
        temp.bin = ditem.bin; return temp;});
    //Scale for the radius
    rScale = d3.scaleLinear()
        .range([0, radius])
        .domain([minValue, maxValue]);


    /////////////////////////////////////////////////////////
    //////////// Create the container SVG and g /////////////
    /////////////////////////////////////////////////////////

    //Remove whatever chart with the same id/class was present before
    var first = false;


    //Initiate the radar chart SVG or update it

    var svg = d3.select(id).node();


    var g = svg.getContext("2d");
    g.translate(cfg.pos.x,cfg.pos.y);

    function toDegrees(rad) {
        let deg = rad * (180/Math.PI)%360;
        return deg;
    }
    function toRadian(deg) {
        return deg * (Math.PI/180);
    }

    const angle_scale = d3.scaleLinear().domain(allAxis.map(d=>d.angle).sort((a,b)=>a-b)).range(d3.range(0,allAxis.length));


    /////////////////////////////////////////////////////////
    ///////////// Draw the radar chart blobs ////////////////
    /////////////////////////////////////////////////////////

    //The radial line function
    let radarLine,keyLine='value';
        radarLine  = d3.radialLine()
        // .interpolate("linear-closed")
            .curve(d3.curveCatmullRom.alpha(this.smooth))
            .radius(function (d) {
                return rScale(d[keyLine] === undefined ? d : d[keyLine]);
            })
            .angle(function (d, i) {
                return getAngle(d, i);
            }).context(g);


        if(cfg.roundStrokes) {
            this.smooth = this.smooth||0;
            radarLine.curve(d3.curveCardinalClosed.tension(this.smooth));

        }

    //Create a wrapper for the blobs

    //function update
    let d = data[0];i = 0;
    g.beginPath();
    radarLine(data[0]);
    // g.lineWidth = cfg.strokeWidth;
    // g.strokeStyle = cfg.color(i,d);
    g.strokeStyle = 'rgb(200,200,200)';
    // g.fillStyle = cfg.fillin?cfg.color(i,d):"none";
    g.fillStyle = 'rgb(200,200,200)';
    g.fill();
    g.stroke();





    g.translate(-cfg.pos.x,-cfg.pos.y);
    /////////////////////////////////////////////////////////
    //////// Append invisible circles for tooltip ///////////
    /////////////////////////////////////////////////////////
    
    //Wrapper for the invisible circles on top

    function getAngle(d,i){
        return (allAxis.find(a=>a.text===d.axis)||allAxis[i]).angle;
    }
    function getAngleStart(d,i){
        return (allAxis.find(a=>a.text===d.axis)||allAxis[i]).angle - deltaAng;
    }
    function getAngleEnd(d,i){
        return (allAxis.find(a=>a.text===d.axis)||allAxis[i]).angle + deltaAng;
    }

    //Text indicating at what % each level is

    return svg;
    
}//RadarChart
