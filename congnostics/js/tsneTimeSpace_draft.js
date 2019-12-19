let xscale, yscale;
d3.tsneTimeSpace = function () {
    let graphicopt = {
            margin: {top: 40, right: 40, bottom: 40, left: 40},
            width: 1500,
            height: 1000,
            scalezoom: 1,
            widthView: function () {
                return this.width * this.scalezoom
            },
            heightView: function () {
                return this.height * this.scalezoom
            },
            widthG: function () {
                return this.widthView() - this.margin.left - this.margin.right
            },
            heightG: function () {
                return this.heightView() - this.margin.top - this.margin.bottom
            },
            opt: {
                epsilon: 20, // epsilon is learning rate (10 = default)
                perplexity: 1000, // roughly how many neighbors each point influences (30 = default)
                dim: 2, // dimensionality of the embedding (2 = default)
            }
        },
        runopt = {},
        isBusy = false;
    let tsne,colorscale;
    let master={},solution,datain,maptimestep,filter_by_name=[],table_info;
    xscale=d3.scaleLinear(); yscale=d3.scaleLinear();
    // grahic
    let background_canvas,background_ctx,front_canvas,front_ctx,svg;
    background_canvas = document.getElementById("tsneScreen");
    background_canvas.width  = graphicopt.widthG();
    background_canvas.height = graphicopt.heightG();
    background_ctx = background_canvas.getContext('2d');
    front_canvas = document.getElementById("tsneScreen_fornt");
    front_canvas.width  =  graphicopt.widthG();
    front_canvas.height = graphicopt.heightG();
    front_ctx = front_canvas.getContext('2d');
    svg = d3.select('#tsneScreen_svg').attrs({width: graphicopt.widthG(),height:graphicopt.heightG()});
    table_info = d3.select('#tsneInformation table').styles({'width':'150px'});
    xscale.range([graphicopt.margin.left,background_canvas.width-graphicopt.margin.right]);
    yscale.range([graphicopt.margin.top,background_canvas.height-graphicopt.margin.bottom]);
    //----------------------color----------------------
    let colorCluster  = d3.scaleOrdinal().range(d3.schemeCategory10);
    master.init = function(arr,cluster) {
        datain = arr;
        // background_canvas = document.getElementById("tsneScreen");
        // background_canvas.width  = graphicopt.widthG();
        // background_canvas.height = graphicopt.heightG();
        // background_ctx = background_canvas.getContext('2d');
        // front_canvas = document.getElementById("tsneScreen_fornt");
        // front_canvas.width  =  graphicopt.widthG();
        // front_canvas.height = graphicopt.heightG();
        // front_ctx = front_canvas.getContext('2d');
        // svg = d3.select('#tsneScreen_svg').attrs({width: graphicopt.widthG(),height:graphicopt.heightG()});
        // table_info = d3.select('#tsneInformation table').styles({'width':'150px'});
        // xscale.range([graphicopt.margin.left,background_canvas.width-graphicopt.margin.right]);
        // yscale.range([graphicopt.margin.top,background_canvas.height-graphicopt.margin.bottom]);
        if (tsne)
            tsne.terminate();
        tsne = new Worker('js/tSNETimeSpaceworker.js');
        // tsne.postMessage({action:"initcanvas", canvas: offscreen, canvasopt: {width: graphicopt.widthG(), height: graphicopt.heightG()}}, [offscreen]);
        tsne.postMessage({action:"initcanvas", canvasopt: {width: graphicopt.widthG(), height: graphicopt.heightG()}});
        console.log(`----inint tsne with: `,graphicopt.opt)
        colorarr = colorscale.domain().map((d,i)=>({name:d, order: +d.split('_')[1], value: colorscale.range()[i]}))
        colorarr.sort((a,b)=>a.order-b.order);

        maptimestep = {};
        //
        // arr.forEach(function(d, i) {
        //     if (!maptimestep[d.name])
        //         maptimestep[d.name] = [];
        //     maptimestep[d.name].push({name:d.name,key:d.timestep,value:d});
        // })
        // for (let h in maptimestep)
        //     maptimestep[h].sort((a,b)=>a.t-b.t);
        //
        updateTableInformation({});
        arr.forEach((d,i)=>{
            if (!maptimestep[d.name])
                maptimestep[d.name]={};
            if (d.timestep>0)
                maptimestep[d.name][d.timestep-1] = i;
        });

        tsne.postMessage({action:"colorscale",value:colorarr});
        tsne.postMessage({action:"inittsne",value:graphicopt.opt});
        tsne.postMessage({action:"initDataRaw",value:arr,clusterarr:cluster});
        tsne.addEventListener('message',({data})=>{
            switch (data.action) {
                case "render":
                    isBusy = true;
                    xscale.domain(data.xscale.domain);
                    yscale.domain(data.yscale.domain);
                    solution = data.sol;
                    updateTableInformation(data);
                    render(solution);
                    break;
                case "stable":
                    isBusy = false;
                    tsne.terminate();
                default:
                    break;
            }
        });

        return master;
        // function render(solution){
        //     background_ctx.clearRect(0, 0, graphicopt.widthG(), graphicopt.heightG());
        //     if(filter_by_name&&filter_by_name.length)
        //         front_ctx.clearRect(0, 0, graphicopt.widthG(), graphicopt.heightG());
        //     let path = {};
        //     solution.forEach(function(d, i) {
        //         const target = arr[i];
        //         if (!path[target.name])
        //             path[target.name] = [];
        //         path[target.name].push({name:target.name,key:target.timestep,value:d});
        //         let fillColor = d3.color(colorarr[target.cluster].value);
        //         fillColor.opacity = 0.8;
        //         background_ctx.fillStyle = fillColor+'';
        //         background_ctx.fillRect(xscale(d[0])-2, yscale(d[1])-2, 4, 4);
        //         // draw connection
        //         if (maptimestep[target.name][target.timestep]!==undefined) {
        //             drawline(background_ctx,target, d);
        //         }
        //         hightlight_render_single(target, d);
        //     });
        //     solution.forEach(function(d, i) {
        //         const target = arr[i];
        //         leaderList.find(l=>{if(l === target.plot) {drawLeaderPlot(background_ctx,l,d); return true;} return false;});
        //     });
        //     let linepath = svg.selectAll('path').data(d3.values(path).map(d=>d.sort((a,b)=>a.t-b.t)));
        //     linepath
        //         .enter().append('path')
        //         .merge(linepath)
        //         .styles({'stroke-width':4,'stroke':'black','opacity':0  })
        //         .attr('d',d3.line().x(function(d) { return xscale(d.value[0]); })
        //             .y(function(d) { return yscale(d.value[1]); }))
        //         .on('mouseover',d=>{
        //             // console.log(d[0].name);
        //             d3.selectAll('.h'+d[0].name).dispatch('mouseover');
        //         }).on('mouseleave',d=>{
        //         d3.selectAll('.h'+d[0].name).dispatch('mouseleave');
        //     })
        //     // datapoint= bg.selectAll(".linkLinegg").interrupt().data(d => d.timeline.clusterarr.map((e,i) => {
        //     //     temp = _.cloneDeep(newdata.find(n => n.name === e.cluster));
        //     //     temp.name = e.cluster;
        //     //     temp.timestep = e.timestep;
        //     //     if(!i)
        //     //         temp.hide = true;
        //     //     return temp;
        //     // }),d=>d.name+d.timestep);
        // }
    };

    function render(solution){
        background_ctx.clearRect(0, 0, graphicopt.widthG(), graphicopt.heightG());
        if(filter_by_name&&filter_by_name.length)
            front_ctx.clearRect(0, 0, graphicopt.widthG(), graphicopt.heightG());
        let path = {};
        solution.forEach(function(d, i) {
            const target = datain[i];
            if (!path[target.name])
                path[target.name] = [];
            path[target.name].push({name:target.name,key:target.timestep,value:d});
            let fillColor = d3.color(colorarr[target.cluster].value);
            fillColor.opacity = 0.8;
            background_ctx.fillStyle = fillColor+'';
            background_ctx.fillRect(xscale(d[0])-2, yscale(d[1])-2, 4, 4);
            // draw connection
            // if (maptimestep[target.name][target.timestep]!==undefined) {
            //     drawline(background_ctx,target, d);
            // }
            hightlight_render_single(target, d);
        });
        solution.forEach(function(d, i) {
            const target = datain[i];
            leaderList.find(l=>{if(l === target.plot) {drawLeaderPlot(background_ctx,l,d); return true;} return false;});
        });
        let linepath = svg.selectAll('path').data(d3.values(path).map(d=>d.sort((a,b)=>a.t-b.t)));
        linepath
            .enter().append('path')
            .merge(linepath)
            .styles({'stroke-width':4,'stroke':'black','opacity':0  })
            .attr('d',d3.line().x(function(d) { return xscale(d.value[0]); })
                .y(function(d) { return yscale(d.value[1]); }))
            .on('mouseover',d=>{
                // console.log(d[0].name);
                d3.selectAll('.h'+d[0].name).dispatch('mouseover');
            }).on('mouseleave',d=>{
            d3.selectAll('.h'+d[0].name).dispatch('mouseleave');
        })
        // datapoint= bg.selectAll(".linkLinegg").interrupt().data(d => d.timeline.clusterarr.map((e,i) => {
        //     temp = _.cloneDeep(newdata.find(n => n.name === e.cluster));
        //     temp.name = e.cluster;
        //     temp.timestep = e.timestep;
        //     if(!i)
        //         temp.hide = true;
        //     return temp;
        // }),d=>d.name+d.timestep);
    }

    function drawline(ctx,target, d) {
        let nexttime = solution[maptimestep[target.name][target.timestep]];
        ctx.beginPath();
        ctx.moveTo(xscale(d[0]), yscale(d[1]));
        ctx.lineTo(xscale(nexttime[0]), yscale(nexttime[1]));
        ctx.strokeStyle = colorarr[target.cluster].value;
        ctx.stroke();
    }

    function hightlight_render_single(target, d) {
        if (filter_by_name.find(n => n === target.name))
            if (maptimestep[target.name][target.timestep] !== undefined) {
                drawline(front_ctx, target, d);
            }
    }

    master.hightlight = function(namearr){
        filter_by_name = namearr||[];
        if (filter_by_name.length) {
            front_ctx.clearRect(0, 0, graphicopt.widthG(), graphicopt.heightG());
            solution.forEach((d, i) => {
                const target = datain[i];
                hightlight_render_single(target, d);

            });
            d3.select(background_canvas).style('opacity', 0.1);
            d3.select(front_canvas).style('opacity', 1);
        }
    };
    master.unhightlight = function() {
        filter_by_name = [];
        d3.select(background_canvas).style('opacity',1);
        d3.select(front_canvas).style('opacity',0);
    };
    function updateTableInformation(output){
        let tableData = [
            [
                {text:"Setting",type:"title"},
            ],
            [
                {text:"Output",type:"title"},
                {id:"#Iterations",text:output.iteration?d3.format('.4')(output.iteration):'_'},
                {id:"cost",text:output.cost?d3.format('.2')(output.cost):'_'},
                {id:"delta cost",text:output.epsilon?d3.format('.2')(output.epsilon):'_'},
                {id:"time",text:output.time?(millisecondsToStr(output.time)):'_'},
            ]
        ];
        d3.entries(graphicopt.opt).forEach(d=>{
            tableData[0].push({id:d.key,text:d.value})
        });
        tableData[0].push({id:'#Radars',text:datain.length});


        let tbodys = table_info.selectAll('tbody').data(tableData);
        tbodys.selectAll('tr').data(d=>d) .selectAll('td').data(d=>d.type?[d]:[{text:d.id},{text:d.text}]);
        tbodys
            .enter().append('tbody')
            .selectAll('tr').data(d=>d)
            .enter().append('tr')
            .selectAll('td').data(d=>d.type?[d]:[{text:d.id},{text:d.text}])
            .enter().append('td')
            .attr('colspan',d=>d.type?"2":null)
            .style('text-align',(d,i)=>d.type?"center":(i?"right":"left"));
        table_info.selectAll('tbody').selectAll('tr').selectAll('td')
            .text(d=>d.text);


    }

    function createRadar(datapoint, bg, data, customopt) {
        let size_w = customopt?(customopt.size?customopt.size:graphicopt.radaropt.w):graphicopt.radaropt.w;
        let size_h = customopt?(customopt.size?customopt.size:graphicopt.radaropt.h):graphicopt.radaropt.h;
        let colorfill = (customopt&&customopt.colorfill)?0.5:false;
        let radar_opt = {
            w: size_w,
            h: size_h,
            schema: schema,
            margin: {left:0,right:0,top:0,bottom:0},
            levels: 6,
            mini:true,
            radiuschange: false,
            isNormalize: true,
            maxValue: 0.5,
            fillin: colorfill,
        };


        if (datapoint.empty()) {
            datapoint = bg
                .append("g")
                .datum(data)
                .attr("class", d => "tsneradar " + fixName2Class(d.name));

        }

        // replace thumnail with radar mini
        datapoint.each(function(d){
            d3.select(this).attr('transform',`translate(${-radar_opt.w/2},${-radar_opt.h/2})`)
            if (colorfill)
                radar_opt.color = function(){return colorscale(d.name)};
            RadarChart(this, [d], radar_opt,"");
        });
        return datapoint;
    }

    master.runopt = function (_) {
        //Put all of the options into a variable called runopt
        if (arguments.length) {
            for (let i in _) {
                if ('undefined' !== typeof _[i]) {
                    runopt[i] = _[i];
                }
            }
            return master;
        }else {
            return runopt;
        }

    };
    master.graphicopt = function (_) {
        //Put all of the options into a variable called graphicopt
        if (arguments.length) {
            for (let i in _) {
                if ('undefined' !== typeof _[i]) {
                    graphicopt[i] = _[i];
                }
            }
            if (graphicopt.radaropt)
                graphicopt.radaropt.schema = schema;
            return master;
        }else {
            return graphicopt;
        }

    };

    master.solution = function (_) {
        return solution;
    };

    master.render = function (_) {
        return render(_);
    };

    master.data = function (_) {
        return arguments.length ? (dataraw = _, handle_data(),master) : dataRaw;
    };

    master.color = function (_) {
        return arguments.length ? (colorscale = _, master) : colorscale;
    };

    master.schema = function (_) {
        return arguments.length ? (graphicopt.radaropt.schema = _,schema = _, master) : schema;
    };
    master.dispatch = function (_) {
        return arguments.length ? (returnEvent = _, master) : returnEvent;
    };

    return master;
}

function handle_data_tsne(tsnedata) { //output will be array with name, cluster, timestep
    // console.log(tsnedata);
    let dataIn = tsnedata;

    // d3.values(tsnedata).forEach(axis_arr => {
    //     let lastcluster;
    //     let lastdataarr;
    //     let count = 0;
    //     sampleS.timespan.forEach((t, i) => {
    //         let index = axis_arr[i].cluster;
    //         // timeline precalculate
    //         if (!(lastcluster !== undefined && index === lastcluster) || runopt.suddenGroup&& calculateMSE_num(lastdataarr,axis_arr[i])>cluster_info[axis_arr[i].cluster].mse*runopt.suddenGroup) {
    //             lastcluster = index;
    //             lastdataarr = axis_arr[i];
    //             axis_arr[i].timestep = count; // TODO temperal timestep
    //             count++;
    //             dataIn.push(axis_arr[i])
    //         }
    //         return index;
    //         // return cluster_info.findIndex(c=>distance(c.__metrics.normalize,axis_arr)<=c.radius);
    //     })
    // });

    TsneTSopt.opt = {
        epsilon: 20, // epsilon is learning rate (10 = default)
        perplexity: Math.round(dataIn.length / cluster_info.length), // roughly how many neighbors each point influences (30 = default)
        dim: 2, // dimensionality of the embedding (2 = default)
    };
    tsnedTS.graphicopt(TsneTSopt).color(colorCluster).init(dataIn, cluster_info.map(c => c.__metrics.normalize));
}
function calculateMSE_num(a,b){
    return ss.sum(a.map((d,i)=>(d-b[i])*(d-b[i])));
}

//draw leader plots
function drawLeaderPlot(ctx_,plot_,plotPosition_) {
    var ctx = ctx_;
    var plot = plot_;
    var plotPosition = plotPosition_;
    var plotIndex = plot.split("-"); // [sample,#plot]
    var plotSize = 100;
    var color = [];
    ctx.fillStyle = "rgb(255,255,255)";
    ctx.translate(-plotSize/2,-plotSize/2);
    ctx.fill();
    ctx.fillRect(xscale(plotPosition[0]), yscale(plotPosition[1]), plotSize, plotSize);
    timedata.forEach(function (time, step) {
        if (step) {
            if(data[+plotIndex[0]][measures[0][+plotIndex[0]][+plotIndex[1]][0]][step]>=0 && data[+plotIndex[0]][measures[0][+plotIndex[0]][+plotIndex[1]][0]][step-1]>=0 && data[+plotIndex[0]][measures[0][+plotIndex[0]][+plotIndex[1]][1]][step]>=0 && data[+plotIndex[0]][measures[0][+plotIndex[0]][+plotIndex[1]][1]][step-1]>=0) {
                var x1 = xscale(plotPosition[0])+0.05*plotSize+0.9*plotSize*data[+plotIndex[0]][measures[0][+plotIndex[0]][+plotIndex[1]][0]][step-1];
                var x2 = xscale(plotPosition[0])+0.05*plotSize+0.9*plotSize*data[+plotIndex[0]][measures[0][+plotIndex[0]][+plotIndex[1]][0]][step];
                var y1 = yscale(plotPosition[1])+0.05*plotSize+0.9*plotSize*(1-data[+plotIndex[0]][measures[0][+plotIndex[0]][+plotIndex[1]][1]][step-1]);
                var y2 = yscale(plotPosition[1])+0.05*plotSize+0.9*plotSize*(1-data[+plotIndex[0]][measures[0][+plotIndex[0]][+plotIndex[1]][1]][step]);
                color[0] = (step < timedata.length/2) ? 0 : (step-timedata.length/2)*255/(timedata.length/2);
                color[1] = 0;
                color[2] = (step < timedata.length/2) ? 255-255*step/(timedata.length/2) : 0;
                ctx.beginPath();
                ctx.moveTo(x1,y1);
                ctx.lineTo(x2, y2);
                ctx.strokeStyle = `rgb(${color[0]},${color[1]},${color[2]})`;
                ctx.stroke();
            }
        }
    });
    ctx.translate(plotSize/2,plotSize/2);

}