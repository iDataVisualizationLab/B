d3.umapTimeSpace = function () {
    let leaderDraw = leaderList.map(d=>d);
    let storeDraw = [];
    let graphicopt = {
            margin: {top: myHeight*0.2, right: (myWidth-500)*0.3+60, bottom: myHeight*0.1, left: (myWidth-500)*0.1},
            width: myWidth-500,
            height: myHeight,
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
                nEpochs: 1000, // The number of epochs to optimize embeddings via SGD (computed automatically = default)
                nNeighbors: 15, // The number of nearest neighbors to construct the fuzzy manifold (15 = default)
                nComponents: 2, // The number of components (dimensions) to project the data to (2 = default)
                minDist: 0.1, // The effective minimum distance between embedded points, used with spread to control the clumped/dispersed nature of the embedding (0.1 = default)
            },radaropt : {
                // summary:{quantile:true},
                mini:true,
                levels:6,
                gradient:true,
                w:40,
                h:40,
                showText:false,
                margin: {top: 0, right: 0, bottom: 0, left: 0},
            },
            linkConnect: true,
        },
        controlPanel = {
            minDist:{text:"Minimum distance", range:[0,1], type:"slider", variable: 'minDist',width:'100px',step:0.1},
            nNeighbors:{text:"#Neighbors", range:[1,200], type:"slider", variable: 'nNeighbors',width:'100px'},
            // linkConnect: {text: "Draw link", type: "checkbox", variable: 'linkConnect', width: '100px',callback:()=>render(!isBusy)},
        },
        formatTable = {
            'time': function(d){return millisecondsToStr(d)},
            'totalTime': function(d){return millisecondsToStr(d)},
            'iteration': function(d){return d},
            'stopCondition': function(d) {return '1e'+Math.round(d)}
        },tableWidth = 200
        ,
        runopt = {},
        isBusy = false;
    let tsne,colorscale;
    let master={},solution,datain=[],filter_by_name=[],table_info,path,cluster=[];
    xscale=d3.scaleLinear();yscale=d3.scaleLinear();
    // grahic
    let background_canvas,background_ctx,front_canvas,front_ctx,svg;
    //----------------------color----------------------
    // let createRadar = _.partialRight(createRadar_func,graphicopt.radaropt,colorscale);

    function renderSvgRadar() {
        let datapoint = svg.selectAll(".linkLinegg").interrupt().data(d => datain.map(e => e.__metrics), d => d.name + d.timestep);
        datapoint.exit().remove();
        let datapoint_n = datapoint.enter().append('g')
            .attr('class', 'linkLinegg timeline');
        // datapoint_n.each(function (d, i) {
            // createRadar(d3.select(this).select('.linkLineg'), d3.select(this), d, {colorfill: true}).classed('hide', d.hide);// hide 1st radar
        // });

        datapoint_n.merge(datapoint).attr('transform', function (d) {
            return `translate(${xscale(d.position[0])},${yscale(d.position[1])})`
        })
            .on('mouseover', d => {
                master.hightlight([d.name_or])
                svg.selectAll('.linkLinegg').filter(e => d.name_or !== e.name_or).classed('hide', true)
                // d3.selectAll('.h'+d[0].name).dispatch('mouseover');
            }).on('mouseleave', d => {
            master.unhightlight(d.name_or);
            svg.selectAll('.linkLinegg.hide').classed('hide', false)
            // d3.selectAll('.h'+d[0].name).dispatch('mouseleave');
        })
    }

    function start() {
        dimensionReductionData = [];
        svg.selectAll('*').remove();
        if (tsne)
            tsne.terminate();
        tsne = new Worker('js/umapworker.js');
        // tsne.postMessage({action:"initcanvas", canvas: offscreen, canvasopt: {width: graphicopt.widthG(), height: graphicopt.heightG()}}, [offscreen]);
        tsne.postMessage({action: "initcanvas", canvasopt: {width: graphicopt.widthG(), height: graphicopt.heightG()}});
        console.log(`----inint tsne with: `, graphicopt.opt);
        colorarr = colorscale.domain().map((d, i) => ({name: d, order: +d.split('_')[1], value: colorscale.range()[i]}));
        colorarr.sort((a, b) => a.order - b.order);

        tsne.postMessage({action: "colorscale", value: colorarr});
        tsne.postMessage({action: "initDataRaw", value: datain, opt:graphicopt.opt, clusterarr: cluster});
        tsne.addEventListener('message', ({data}) => {
            if(data.sol) dimensionReductionData = data.sol.map(d=>[d[0],d[1]]);
            switch (data.action) {
                case "render":
                    d3.select('.cover').classed('hidden', true);
                    isBusy = true;
                    xscale.domain(data.xscale.domain);
                    yscale.domain(data.yscale.domain);
                    solution = data.sol;
                    updateTableOutput(data.value);
                    render();
                    break;
                case "stable":
                    isBusy = false;
                    render(true);
                    tsne.terminate();
                    break;
                default:
                    break;
            }
        });
    }



    master.init = function(arr,clusterin) {
        datain = arr;
        cluster = clusterin;
        handle_data(datain);
        updateTableInput();
        updateTableOption();
        xscale.range([graphicopt.margin.left,graphicopt.width-graphicopt.margin.right]);
        yscale.range([graphicopt.margin.top,graphicopt.height-graphicopt.margin.bottom]);

        background_canvas = document.getElementById("tsneScreen");
        background_canvas.width  = graphicopt.width;
        background_canvas.height = graphicopt.height;
        background_ctx = background_canvas.getContext('2d');
        front_canvas = document.getElementById("tsneScreen_fornt");
        front_canvas.width  =  graphicopt.width;
        front_canvas.height = graphicopt.height;
        front_ctx = front_canvas.getContext('2d');
        svg = d3.select('#tsneScreen_svg').attrs({width: graphicopt.width,height:graphicopt.height});

        start();

        return master;
    };

    function render (isradar){
        if(solution) {
            // createRadar = _.partialRight(createRadar_func, graphicopt.radaropt, colorscale)
            background_ctx.clearRect(0, 0, graphicopt.width, graphicopt.height);
            if (filter_by_name && filter_by_name.length)
                front_ctx.clearRect(0, 0, graphicopt.width, graphicopt.height);
            path = {};

            // interaction condition
            let interaction1 = controlVariable.interaction.time !== 'noOption';
            let interaction2 = controlVariable.interaction.variable1 !== 'noOption' && controlVariable.interaction.variable2 !== 'noOption';
            let listPlots = [];     // store index of plot that need to be drawn on the right side

            // point size
            let pointSize = 3;

            // Draw points
            solution.forEach(function (d, i) {
                const target = datain[i];
                target.__metrics.position = d;
                if (!path[target.name])
                    path[target.name] = [];
                path[target.name].push({name: target.name, key: target.timestep, value: d, cluster: target.cluster});

                // zoom
                // let dataDR = transformDR.apply([xscale(d[0]),yscale(d[1])]);

                // parameters of net scatterplot
                let variableX = netSP.encode[i][0];
                let variableY = netSP.encode[i][1];
                let time = netSP.encode[i][2];

                // interaction condition
                let checkV1 = variableX === controlVariable.interaction.variable1 && variableY === controlVariable.interaction.variable2;
                let checkV2 = variableX === controlVariable.interaction.variable2 && variableY === controlVariable.interaction.variable1;
                let checkI2 = checkV1 || checkV2;
                let checkI1 = time === controlVariable.interaction.time;

                // color control - opacity
                let fillColor = d3.color(colorarr[target.cluster].value);
                if (interaction1 && interaction2) {
                    fillColor.opacity = (checkI1 && checkI2) ? 1 : 0.8;
                } else if (interaction1) {
                    fillColor.opacity = checkI1 ? 1 : 0.8;
                } else if (interaction2) {
                    fillColor.opacity = checkI2 ? 1 : 0.8;
                } else fillColor.opacity = 0.8;

                // mouse over - highlight
                if (controlVariable.mouseOver.check) {
                    if (i === controlVariable.mouseOver.index) {
                        pointSize = 5;
                        fillColor.opacity = 1;
                    } else {
                        pointSize = 3;
                        fillColor.opacity = 0.8;
                    }
                }

                // begin draw point
                background_ctx.beginPath();
                background_ctx.fillStyle = fillColor + '';
                background_ctx.arc(xscale(d[0]), yscale(d[1]), pointSize,0,2*Math.PI);
                background_ctx.fill();
                // let li = (leaderDraw.length>0) ? leaderDraw.findIndex(dd=>dd===target.plot) : -1;
                // if (li !== -1) {storeDraw[bCountUmap] = [background_ctx,target,[d[0],d[1]]]; bCountUmap+=1;}

                // draw net scatter plot of chosen in Interaction tab
                // draw at position of the points
                if (interaction1 && interaction2) {
                    if (checkI1 && checkI2) {
                        listPlots.push(i);
                    }
                } else if (interaction1) {
                   if (checkI1) {
                       listPlots.push(i);
                   }
                } else if (interaction2) {
                    if (checkI2) {
                        listPlots.push(i);
                    }
                }

                // add list of clicked points to listPlots
                if (controlVariable.mouseClick.index.length>0) {
                    listPlots = [];
                    for (let i = 0; i < controlVariable.mouseClick.index.length; i++) {
                        listPlots[i] = controlVariable.mouseClick.index[controlVariable.mouseClick.index.length-1-i];
                    }
                }
            });

            // draw net scatter plots on the right side
            if (listPlots.length > 0) {
                let nPage = Math.ceil(listPlots.length/maxPerPage);
                let sIndex = controlVariable.mouseClick.index.length>0 ? 0 : (currentPage-1)*maxPerPage;
                listPlots.forEach((e,i)=>{
                    DesignApplication.netScatterPlot('tsneScreen',[xscale(solution[e][0]), yscale(solution[e][1])],[30,30],netSP.plots[e].arrows,netSP.plots[e].points,e,false);
                    if (i >= sIndex && i < sIndex + maxPerPage) {
                        DesignApplication.netScatterPlot('tsneScreen',[designVariable.dr.rd.plot.position[0],designVariable.dr.rd.plot.position[1]+i*130],designVariable.dr.rd.plot.size,netSP.plots[e].arrows,netSP.plots[e].points,e,true);
                        DesignApplication.CircularBarChart('tsneScreen',[myWidth-550,90+i*130],40,e,false);
                        if (designVariable.dr.rd.quitSign.mouseOver[i])
                            DesignApplication.QuitSign('tsneScreen',[designVariable.dr.rd.quitSign.position[0],designVariable.dr.rd.quitSign.position[1]+i*130],designVariable.dr.rd.quitSign.size,'rgb(255,255,255)','rgb(255,0,0)');
                        else
                            DesignApplication.QuitSign('tsneScreen',[designVariable.dr.rd.quitSign.position[0],designVariable.dr.rd.quitSign.position[1]+i*130],designVariable.dr.rd.quitSign.size,'rgb(255,255,255)','rgb(0,0,0)');
                    }
                });
            }
        }
    }

    function handle_data(data){
        data.forEach(d=>{
            d.__metrics = d.map((m,i)=>{
                return {axis: serviceFullList[i].text, value: m}
            });
            d.__metrics.name = d.clusterName;
            d.__metrics.name_or = d.name;
            d.__metrics.timestep = d.timestep;
        })
    }

    master.stop = function(){
        if (tsne) {
            tsne.terminate();
            // renderSvgRadar()
        }
    };



    function positionLink_canvas(path,ctx) { //path 4 element
        // return p = new Path2D(positionLink(a,b));
        ctx.beginPath();
        return d3.line()
            .x(function(d) { return xscale(d[0]); })
            .y(function(d) { return yscale(d[1]); })
            .curve(d3.curveCardinalOpen)
            .context(ctx)(path);
    }

    function drawline(ctx,path,cluster) {
        positionLink_canvas(path,ctx);

        // ctx.beginPath();
        // ctx.moveTo(xscale(d[0]), yscale(d[1]));
        // ctx.lineTo(xscale(nexttime[0]), yscale(nexttime[1]));
        ctx.strokeStyle = colorarr[cluster].value;
        ctx.stroke();
    }



    master.hightlight = function(namearr){
        filter_by_name = namearr||[];
        if (filter_by_name.length) {
            front_ctx.clearRect(0, 0, graphicopt.width, graphicopt.height);
            d3.values(path).filter(d=>(filter_by_name.find(n => n === d[0].name)&& d.length)>1?d.sort((a,b)=>a.t-b.t):false).forEach(path=>{
                // make the combination of 0->4 [0,0,1,2] , [0,1,2,3], [1,2,3,4],[2,3,4,4]
                for (let i=0;i<path.length-1;i++){
                    let a =( path[i-1]||path[i]).value;
                    let b = path[i].value;
                    let c = path[i+1].value;
                    let d = (path[i+2]||path[i+1]).value;
                    drawline(front_ctx,[a,b,c,d],path[i].cluster);
                }
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
    master.generateTable = function () {
        d3.select('#tsneInformation table').selectAll('*').remove();
        table_info = d3.select('#tsneInformation table').styles({'width':tableWidth+'px'});
        let tableData = [
            [
                {text:"Input",type:"title"},
                {label:'#Plots',content:datain.length,variable: 'datain'}
            ],
            [
                {text:"Setting",type:"title"},
            ],
            [
                {text:"Output",type:"title"},
                {label:"#Iterations",content:'_',variable: 'iteration'},
                {label:"Time per step",content:'_',variable:'time'},
                {label:"Total time",content:'_',variable:'totalTime'},
            ]
        ];
        d3.values(controlPanel).forEach(d=>{
            tableData[1].push({label:d.text,type:d.type,content:d,variable: d.variable})
        });

        let tbodys = table_info.selectAll('tbody').data(tableData);
        tbodys
            .enter().append('tbody')
            .selectAll('tr').data(d=>d)
            .enter().append('tr')
            .selectAll('td').data(d=>d.type==="title"?[d]:[{text:d.label},d.type?{content:d.content,variable:d.variable}:{text:d.content,variable:d.variable}])
            .enter().append('td')
            .attr('colspan',d=>d.type?"2":null)
            .style('text-align',(d,i)=>d.type==="title"?"center":(i?"right":"left"))
            .attr('class',d=>d.variable)
            .each(function(d){
                if (d.text!==undefined) // value display only
                    d3.select(this).text(d.text);
                else{ // other component display
                    let formatvalue = formatTable[d.content.variable]||(e=>Math.round(e));
                    if (d.content.type==="slider"){
                        let div = d3.select(this).style('width',d.content.width).append('div').attr('class','valign-wrapper');
                        noUiSlider.create(div.node(), {
                            start: (graphicopt.opt[d.content.variable]),
                            connect: 'lower',
                            tooltips: {to: function(value){return formatvalue(value)}, from:function(value){return +value.split('1e')[1];}},
                            step: d.content.step||1,
                            orientation: 'horizontal', // 'horizontal' or 'vertical'
                            range: {
                                'min': d.content.range[0],
                                'max': d.content.range[1],
                            },
                        });
                        div.node().noUiSlider.on("change", function () { // control panel update method
                            graphicopt.opt[d.content.variable] = + this.get();
                            clickArr = [];
                            start();
                        });
                    }else if (d.content.type === "checkbox") {
                        let div = d3.select(this).style('width', d.content.width).append('label').attr('class', 'valign-wrapper left-align');
                        div.append('input')
                            .attrs({
                                type: "checkbox",
                                class: "filled-in"
                            }).on('change',function(){
                            graphicopt[d.content.variable]  =  this.checked;
                            if (d.content.callback)
                                d.content.callback();
                        }).node().checked = graphicopt[d.content.variable];
                        div.append('span')
                    }
                }
            });
    };
    function updateTableInput(){
        table_info.select(`.datain`).text(e=>datain.length);
        try {
            d3.select('.perplexity div').node().noUiSlider.updateOptions({
                range: {
                    'min': 1,
                    'max': Math.round(datain.length/2),
                }
            });
            d3.select('.perplexity div').node().noUiSlider.set(20);
        }catch(e){

        }
    }
    function updateTableOutput(output){
        d3.entries(output).forEach(d=>{
            table_info.select(`.${d.key}`).text(e=>d.value? formatTable[e.variable]? formatTable[e.variable](d.value):d3.format('.4s')(d.value) :'_');
        });
    }

    function updateTableOption() {

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
    master.graphicopt = function (__) {
        //Put all of the options into a variable called graphicopt
        if (arguments.length) {
            for (let i in __) {
                if ('undefined' !== typeof __[i]) {
                    graphicopt[i] = __[i];
                }
            }
            if (graphicopt.radaropt)
                graphicopt.radaropt.schema = serviceFullList;
            // createRadar = _.partialRight(createRadar_func,graphicopt.radaropt,colorscale)
            return master;
        }else {
            return graphicopt;
        }

    };

    master.solution = function (_) {
        return solution;
    };

    master.renderUMAP = function (_) {
        render(_);
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
};
function handle_data_umap(tsnedata) {
    let dataIn = tsnedata;

    // d3.values(tsnedata).forEach(axis_arr => {
    //     let lastcluster;
    //     let lastdataarr;
    //     let count = 0;
    //     sampleS.timespan.forEach((t, i) => {
    //         let index = axis_arr.cluster;
    //         axis_arr.clusterName = cluster_info[index].name;
    //         // timeline precalculate
    //         if (!(lastcluster !== undefined && index === lastcluster) || runopt.suddenGroup&& calculateMSE_num(lastdataarr,axis_arr[i])>cluster_info[axis_arr[i].cluster].mse*runopt.suddenGroup) {
    //             lastcluster = index;
    //             lastdataarr = axis_arr[i];
    //             axis_arr[i].timestep = count; // TODO temperal timestep
    //             count++;
    //             dataIn.push(axis_arr[i])
    //         }
    //         // return index;
    //         // return cluster_info.findIndex(c=>distance(c.__metrics.normalize,axis_arr)<=c.radius);
    //
    //         // dataIn.push(axis_arr[i]) // testing with full data
    //     })
    // });

    umapopt.opt = {
        // nEpochs: 20, // The number of epochs to optimize embeddings via SGD (computed automatically = default)
        nNeighbors: 15, // The number of nearest neighbors to construct the fuzzy manifold (15 = default)
        nComponents: 2, // The number of components (dimensions) to project the data to (2 = default)
        minDist: 0.1, // The effective minimum distance between embedded points, used with spread to control the clumped/dispersed nature of the embedding (0.1 = default)
    };
    umapTS.graphicopt(umapopt).color(colorCluster).init(dataIn, cluster_info.map(c => c.__metrics.normalize));
}
function calculateMSE_num(a,b){
    return ss.sum(a.map((d,i)=>(d-b[i])*(d-b[i])));
}

//draw leader plots
// function drawLeaderPlot(ctx_,target_,plotPosition_,isMouseOver_) {
//     let ctx = ctx_;
//     let plot = target_.plot;
//     let group = target_.cluster;
//     let plotPosition = plotPosition_.map(d=>d);
//     let plotIndex = dataRadar2.map(d=>d.plot).findIndex(dd=>dd===plot); // [#plot in dataRadar2 and measures]
//     let sampleIndex = plot.split("-")[0];
//     let varIndex = plot.split("-")[1];  // for 1D only
//     let xVarIndex = measures[0][sampleIndex][varIndex][0];  // measures[i][sample] needs has similar lengh
//     let yVarIndex = measures[0][sampleIndex][varIndex][1];
//     let plotSize = (selectedDisplay === '1D') ? 30 : 60;
//     let color = [];
//     // ctx.translate(-plotSize,-plotSize/2);
//     if (displayType === "rose") {
//         // draw Radar Chart
//         let dataRadarChart = dataRadar2[plotIndex];
//         let angle = Math.PI*2/dataRadarChart.length;
//         let rRadarChart = plotSize/2.1;
//         // if (mouseOverPosition.length > 0) {
//             // Sample notation
//             // ctx.font = "10px Arial";
//             // ctx.fillStyle = 'rgb(0,0,0)';
//             // ctx.fillText(mapsample2.get(+sampleIndex),plotPosition[0],plotPosition[1]-rRadarChart);
//             // ctx.fill();
//             // Variable notation
//             // let notation = '';
//             // let notationArr = mapvar2.get(+varIndex).split('');
//             // for (let i = 0; i < 8; i++) {
//             //     notation += notationArr[i];
//             // }
//             // ctx.translate(plotPosition[0]-rRadarChart,plotPosition[1]);
//             // ctx.rotate(-Math.PI/2);
//             // ctx.font = "8px Arial";
//             // ctx.fillStyle = 'rgb(0,0,0)';
//             // ctx.fillText(notation,0,0);
//             // ctx.fill();
//             // ctx.rotate(Math.PI/2);
//             // ctx.translate(-plotPosition[0]+rRadarChart,-plotPosition[1]);
//         // }
//         for (let k = 5; k > 0; k--) {
//             ctx.beginPath();
//             ctx.arc(plotPosition[0],plotPosition[1],0.2*rRadarChart*k,0,2*Math.PI);
//             // ctx.arc(xscale(plotPosition[0]),yscale(plotPosition[1]),0.2*rRadarChart*k,0,2*Math.PI);
//             ctx.strokeStyle = "rgb(180,180,180)";
//             ctx.stroke();
//             ctx.fillStyle = "rgb(255,255,255)";
//             ctx.fill();
//         }
//         dataRadarChart.forEach((d,i)=>{
//             ctx.beginPath();
//             let colorRadar = colorCluster(cluster_info[group].name);    // for paper
//             // let colorRadar;
//             // switch (type[i]) {
//             //     case 0:
//             //         colorRadar = [18, 169, 101];
//             //         break;
//             //     case 1:
//             //         colorRadar = [232, 101, 11];
//             //         break;
//             //     case 2:
//             //         colorRadar = [89, 135, 222];
//             //         break;
//             // }
//             // ctx.arc(plotPosition[0],plotPosition[1],d*rRadarChart,(i-0.25)*angle-Math.PI/2,(i+0.25)*angle-Math.PI/2);
//             ctx.arc(xscale(plotPosition[0]),yscale(plotPosition[1]),d*rRadarChart,(i-0.25)*angle-Math.PI/2,(i+0.25)*angle-Math.PI/2);
//             ctx.fillStyle = `rgb(${colorRadar[0]},${colorRadar[1]},${colorRadar[2]})`;
//             ctx.fill();
//             ctx.beginPath();
//             ctx.moveTo(plotPosition[0],plotPosition[1]);
//             // ctx.moveTo(xscale(plotPosition[0]),yscale(plotPosition[1]));
//             ctx.lineTo(plotPosition[0]+d*rRadarChart*Math.cos((i-0.25)*angle-Math.PI/2),plotPosition[1]+d*rRadarChart*Math.sin((i-0.25)*angle-Math.PI/2));
//             // ctx.lineTo(xscale(plotPosition[0])+d*rRadarChart*Math.cos((i-0.25)*angle-Math.PI/2),yscale(plotPosition[1])+d*rRadarChart*Math.sin((i-0.25)*angle-Math.PI/2));
//             ctx.lineTo(plotPosition[0]+d*rRadarChart*Math.cos((i+0.25)*angle-Math.PI/2),plotPosition[1]+d*rRadarChart*Math.sin((i+0.25)*angle-Math.PI/2));
//             // ctx.lineTo(xscale(plotPosition[0])+d*rRadarChart*Math.cos((i+0.25)*angle-Math.PI/2),yscale(plotPosition[1])+d*rRadarChart*Math.sin((i+0.25)*angle-Math.PI/2));
//             ctx.fill();
//         });
//     } else if (displayType === "series") {
//         // Draw main plots
//         ctx.beginPath();
//         ctx.fillStyle = "rgb(220,220,220)";
//         let strokeColor = colorCluster(cluster_info[group].name);
//         strokeColor.opacity = 0.5;      // for paper
//         ctx.strokeStyle = strokeColor;
//         ctx.lineWidth = 3;
//         ctx.fill();
//         ctx.stroke();
//         if (selectedDisplay === '1D') {
//             ctx.strokeRect(plotPosition[0],plotPosition[1], 2*plotSize, plotSize);
//             // ctx.strokeRect(xscale(plotPosition[0]),yscale(plotPosition[1]), 2*plotSize, plotSize);
//             ctx.fillRect(plotPosition[0],plotPosition[1], 2*plotSize, plotSize);
//             // ctx.fillRect(xscale(plotPosition[0]),yscale(plotPosition[1]), 2*plotSize, plotSize);
//         } else {
//             ctx.strokeRect(plotPosition[0],plotPosition[1], plotSize, plotSize);
//             // ctx.strokeRect(xscale(plotPosition[0]),yscale(plotPosition[1]), 2*plotSize, plotSize);
//             ctx.fillRect(plotPosition[0],plotPosition[1], plotSize, plotSize);
//             // ctx.fillRect(xscale(plotPosition[0]),yscale(plotPosition[1]), 2*plotSize, plotSize);
//         }
//         // if (mouseOverPosition.length > 0) {
//             // Variable notation
//             // let notation = '';
//             // let notationArr = mapvar2.get(+varIndex).split('');
//             // for (let i = 0; i < 8; i++) {
//             //     notation += notationArr[i];
//             // }
//             // ctx.translate(plotPosition[0],plotPosition[1]+plotSize);
//             // ctx.rotate(-Math.PI/2);
//             // ctx.font = "8px Arial";
//             // ctx.fillStyle = 'rgb(0,0,0)';
//             // ctx.fillText(notation,0,0);
//             // ctx.fill();
//             // ctx.rotate(Math.PI/2);
//             // ctx.translate(-plotPosition[0],-plotPosition[1]-plotSize);
//             // Sample notation
//             // ctx.font = "10px Arial";
//             // ctx.fillStyle = 'rgb(0,0,0)';
//             // ctx.fillText(mapsample2.get(+sampleIndex),plotPosition[0],plotPosition[1]);
//             // ctx.fill();
//         // }
//         ctx.lineWidth = 1;
//         switch (selectedDisplay) {
//             case "1D":
//                 timedata.forEach(function (time, step) {
//                     if (step) {
//                         if(data[sampleIndex][varIndex][step]>=0 && data[sampleIndex][varIndex][step-1]>=0 && data[sampleIndex][varIndex][step]>=0 && data[sampleIndex][varIndex][step-1]>=0) {
//                             let x1 = plotPosition[0]+0.05*plotSize+1.9*plotSize*(step-1)/timedata.length;
//                             // let x1 = xscale(plotPosition[0])+0.05*plotSize+1.9*plotSize*(step-1)/timedata.length;
//                             let x2 = plotPosition[0]+0.05*plotSize+1.9*plotSize*step/timedata.length;
//                             // let x2 = xscale(plotPosition[0])+0.05*plotSize+1.9*plotSize*step/timedata.length;
//                             let y1 = plotPosition[1]+0.05*plotSize+0.9*plotSize*(1-data[sampleIndex][varIndex][step-1]);
//                             // let y1 = yscale(plotPosition[1])+0.05*plotSize+0.9*plotSize*(1-data[sampleIndex][varIndex][step-1]);
//                             let y2 = plotPosition[1]+0.05*plotSize+0.9*plotSize*(1-data[sampleIndex][varIndex][step]);
//                             // let y2 = yscale(plotPosition[1])+0.05*plotSize+0.9*plotSize*(1-data[sampleIndex][varIndex][step]);
//                             color[0] = (step < timedata.length/2) ? 0 : (step-timedata.length/2)*255/(timedata.length/2);
//                             color[1] = 0;
//                             color[2] = (step < timedata.length/2) ? 255-255*step/(timedata.length/2) : 0;
//                             ctx.beginPath();
//                             ctx.moveTo(x1,y1);
//                             ctx.lineTo(x2, y2);
//                             ctx.strokeStyle = `rgb(${color[0]},${color[1]},${color[2]})`;
//                             ctx.stroke();
//                         }
//                     }
//                 });
//                 break;
//             case "2D":
//                 timedata.forEach((time,step)=>{
//                     if(step) {
//                         // CS plots - X(t) for 1D
//                         if(data[sampleIndex][xVarIndex][step]>=0 && data[sampleIndex][xVarIndex][step-1]>=0 && data[sampleIndex][yVarIndex][step]>=0 && data[sampleIndex][yVarIndex][step-1]>=0) {
//                             let x1 = plotPosition[0]+0.05*plotSize+0.9*plotSize*data[sampleIndex][xVarIndex][step-1];
//                             let x2 = plotPosition[0]+0.05*plotSize+0.9*plotSize*data[sampleIndex][xVarIndex][step];
//                             let y1 = plotPosition[1]+0.05*plotSize+0.9*plotSize*(1-data[sampleIndex][yVarIndex][step-1]);
//                             let y2 = plotPosition[1]+0.05*plotSize+0.9*plotSize*(1-data[sampleIndex][yVarIndex][step]);
//                             // if (step<timedata.length/2) {stroke(0,0,255-255*step/(timedata.length/2)); fill(0,0,255-255*step/(timedata.length/2));}
//                             // else {stroke((step-timedata.length/2)*255/(timedata.length/2),0,0); fill((step-timedata.length/2)*255/(timedata.length/2),0,0);}
//                             // circle(x1,y1,4);
//                             // strokeWeight(0.3);
//                             // line(x1,y1,x2,y2);
//                             // strokeWeight(1);
//                             color[0] = (step < timedata.length/2) ? 0 : (step-timedata.length/2)*255/(timedata.length/2);
//                             color[1] = 0;
//                             color[2] = (step < timedata.length/2) ? 255-255*step/(timedata.length/2) : 0;
//                             ctx.beginPath();
//                             ctx.moveTo(x1,y1);
//                             ctx.lineTo(x2, y2);
//                             ctx.arc(x2,y2,1,0,2*Math.PI);
//                             ctx.strokeStyle = `rgb(${color[0]},${color[1]},${color[2]})`;
//                             ctx.fillStyle = `rgb(${color[0]},${color[1]},${color[2]})`;
//                             ctx.lineWidth = 0.1;
//                             ctx.stroke();
//                             ctx.fill();
//                         }
//
//                     }
//                 });
//                 break;
//         }
//
//     }
//     // ctx.translate(plotSize,plotSize/2);
// }



// CHANGE TYPE OF CHART IN DIMENSION REDUCTION TECHNIQUES
// function onClickFunction() {
//     let mouse = d3.mouse(this);
//
//     // in interaction mode
//     if ((interactionOption.sample !== 'noOption') || (interactionOption.variable !== 'noOption')) {
//         let leftButtonPosition = [(myWidth-300)*0.7,50];
//         let rightButtonPosition = [(myWidth-300)*0.7+50,50];
//         let buttonSize = [20,20];
//
//         let quitButtonSize = [120,20];
//         let quitButtonPosition = [(myWidth-300)*0.7+80,50];
//
//         let checkChangePage1 = (mouse[0]>=leftButtonPosition[0]) && (mouse[0]<=leftButtonPosition[0]+buttonSize[0]) && (mouse[1]>=leftButtonPosition[1]) && (mouse[1]<=leftButtonPosition[1]+buttonSize[1]);
//         let checkChangePage2 = (mouse[0]>=rightButtonPosition[0]) && (mouse[0]<=rightButtonPosition[0]+buttonSize[0]) && (mouse[1]>=rightButtonPosition[1]) && (mouse[1]<=rightButtonPosition[1]+buttonSize[1]);
//         let checkQuitInteraction = (mouse[0]>=quitButtonPosition[0]) && (mouse[0]<=quitButtonPosition[0]+quitButtonSize[0]) && (mouse[1]>=quitButtonPosition[1]) && (mouse[1]<=quitButtonPosition[1]+quitButtonSize[1]);
//
//         // change the page
//         if (checkChangePage1 || checkChangePage2) {
//             clickArr.push({
//                 'Page': true,
//             });
//         }
//
//         // turn off interaction mode
//         if (checkQuitInteraction) {
//             clickArr = [];      // delete clickArr after changing mode
//             interactionOption.sample = 'noOption';
//             interactionOption.variable = 'noOption';
//             $('#dataInstances').val('noOption').selected = true;
//             $('#variable').val('noOption').selected = true;
//         }
//
//         // draw again
//         switch (visualizingOption) {
//             case 'PCA':
//                 pcaTS.renderPCA();
//                 break;
//             case 'tSNE':
//                 tsneTS.renderTSNE();
//                 break;
//             case 'UMAP':
//                 umapTS.renderUMAP();
//                 break;
//         }
//     } else {    // no interaction mode
//         // keep only #maxPerPage plots on the screen
//         if (clickArr.length === maxPerPage) clickArr.splice(0,1);
//
//         // click turn off button of time series
//         let buttonPosition = [];
//         let buttonSize = [12,12];
//         // let plotSize = (selectedDisplay === '1D') ? [(myWidth-400)*0.25,(myHeight-200)/maxPerPage] : [(myHeight-300)/maxPerPage,(myHeight-300)/maxPerPage];
//         let plotSize = (selectedDisplay === '1D') ? [2*(myHeight-200)/maxPerPage,(myHeight-200)/maxPerPage] : [(myHeight-300)/maxPerPage,(myHeight-300)/maxPerPage];
//         let checkClickPoint = true;
//         clickArr.forEach((d,i)=>{
//             let plotPosition = (selectedDisplay === '1D') ? [(myWidth-300)*0.7,100+(clickArr.length-1-i)*plotSize[1]+5] : [(myWidth-300)*0.7,80+(clickArr.length-1-i)*(plotSize[1]+40)];
//             // let plotPosition = (selectedDisplay === '1D') ? [(myWidth-300)*0.7,100+position_*(plotSize[1]+5)] : [(myWidth-300)*0.7,80+position_*(plotSize[1]+40)];
//             buttonPosition[i] = [plotPosition[0]+plotSize[0]+3,plotPosition[1]];
//         });
//         buttonPosition.forEach((d,i)=>{
//            let checkButton = (mouse[0]>=d[0])&&(mouse[0]<=d[0]+buttonSize[0])&&(mouse[1]>=d[1])&&(mouse[1]<=d[1]+buttonSize[1]);
//            checkClickPoint = checkClickPoint && !checkButton;
//            if(checkButton) clickArr.splice(i,1);
//         });
//         if (!checkClickPoint) {
//             switch (visualizingOption) {
//                 case 'PCA':
//                     pcaTS.renderPCA();
//                     break;
//                 case 'tSNE':
//                     tsneTS.renderTSNE();
//                     break;
//                 case 'UMAP':
//                     umapTS.renderUMAP();
//                     break;
//             }
//         } else if(dimensionReductionData.length > 0) findClosestDataPoint(mouse,dimensionReductionData,true);
//     }
//     // switch (visualizingOption) {
//     //     case 'PCA':
//     //         pcaTS.renderPCA();
//     //         break;
//     //     case 'tSNE':
//     //         tsneTS.renderTSNE();
//     //         break;
//     //     case 'UMAP':
//     //         umapTS.renderUMAP();
//     //         break;
//     // }
// }



// zoom function
// function zoomFunction(contextDR,widthDR,heightDR) {
//     context.clearRect(0, 0, width, height);
//     transformDR = d3.event.transform;
//     switch (visualizingOption) {
//         case 'PCA':
//             pcaTS.renderPCA();
//             break;
//         case 'tSNE':
//             tsneTS.renderTSNE();
//             break;
//         case 'UMAP':
//             umapTS.renderUMAP();
//             break;
//     }
// }

// draw time series
// function drawTimeSeries(ctx_,plot_,position_,mousePosition_,page_) {
//
//     let sampleIndex = +plot_.split('-')[0];
//     let varIndex = +plot_.split('-')[1];
//     let xVarIndex = measures[0][sampleIndex][varIndex][0];
//     let yVarIndex = measures[0][sampleIndex][varIndex][1];
//     // let plotSize = (selectedDisplay === '1D') ? [(myWidth-400)*0.25,(myHeight-200)/maxPerPage] : [(myHeight-300)/maxPerPage,(myHeight-300)/maxPerPage];
//     let plotSize = (selectedDisplay === '1D') ? [2*(myHeight-200)/maxPerPage,(myHeight-200)/maxPerPage] : [(myHeight-300)/maxPerPage,(myHeight-300)/maxPerPage];
//     let plotPosition = (selectedDisplay === '1D') ? [(myWidth-300)*0.7,100+position_*(plotSize[1]+5)] : [(myWidth-300)*0.7,80+position_*(plotSize[1]+40)];
//     let ctx = ctx_;
//     let plotIndex = dataRadar2.findIndex(d=>{
//         return d.plot === plot_;
//     });
//     let group = dataRadar2[plotIndex].cluster;
//
//     // check interaction
//     let checkInteraction, checkBothInteraction;
//     checkInteraction = !((interactionOption.sample === 'noOption') && (interactionOption.variable === 'noOption'));
//     checkBothInteraction = (interactionOption.sample !== 'noOption') && (interactionOption.variable !== 'noOption');
//
//     // draw rectangles of time series
//     ctx.beginPath();
//     ctx.fillStyle = "rgb(220,220,220)";
//     ctx.strokeStyle = colorCluster(cluster_info[group].name);
//     ctx.lineWidth = 3;
//     ctx.fill();
//     ctx.stroke();
//     ctx.strokeRect(plotPosition[0],plotPosition[1], plotSize[0], plotSize[1]);
//     ctx.fillRect(plotPosition[0],plotPosition[1], plotSize[0], plotSize[1]);
//
//     switch (selectedDisplay) {
//         case '1D':
//             // Variable notation
//             let notationVar = '';
//             let countSpaceVar = [], myCountSpaceVar = [], countLineVar = 0, countIndexVar = 0, countFalse = 0;
//             let notationArrVar = mapvar2.get(varIndex).split('');
//             notationArrVar.forEach((d,i)=>{
//                 if (d === ' ') myCountSpaceVar.push(i);
//             });
//             countSpaceVar = myCountSpaceVar.map((d,i)=>{
//                 if (i) {
//                     if (d-myCountSpaceVar[i-1]>3) return d;
//                     else return false;
//                 } else {
//                     if (d>2) return d;
//                     else return false;
//                 }
//             });
//             countSpaceVar.forEach(d=>{if(d===false) countFalse += 1;});
//
//             // Instance notation
//             let notationIns = '';
//             let countSpaceIns = [], myCountSpaceIns = [], countLineIns = 0, countIndexIns = 0, countFalse2 = 0;
//             let notationArrIns = mapsample2.get(sampleIndex).split('');
//             notationArrIns.forEach((d,i)=>{
//                 if (d === ' ') myCountSpaceIns.push(i);
//             });
//             countSpaceIns = myCountSpaceIns.map((d,i)=>{
//                 if (i) {
//                     if (d-myCountSpaceIns[i-1]>3) return d;
//                     else return false;
//                 } else {
//                     if (d>2) return d;
//                     else return false;
//                 }
//             });
//             countSpaceIns.forEach(d=>{if(d===false) countFalse2 += 1;});
//
//             if (checkInteraction) {     // in interaction mode
//                 if (interactionOption.sample !== 'noOption') {      // turn on instance
//                     ctx.translate(plotPosition[0]-5,plotPosition[1]+plotSize[1]);
//                     ctx.rotate(-Math.PI/2);
//                     // ctx.font = "12px Arial";
//                     ctx.font = "10px Arial";
//                     ctx.fillStyle = 'rgb(0,0,0)';
//                     if (notationArrVar.length > 14) {
//                         if (countSpaceVar.length === 0) {
//                             notationVar = '';
//                             for (let j = 0; j < 14; j++) {
//                                 notationVar += notationArrVar[j];
//                             }
//                             ctx.fillText(notationVar,0,0);
//                         } else {
//                             countLineVar = 0;
//                             countSpaceVar.forEach((d,i)=>{
//                                 if (d) {
//                                     notationVar = '';
//                                     if (i === 0) {
//                                         if (countSpaceVar.length>1) {
//                                             for (let j = 0; j < d; j++) {
//                                                 notationVar += notationArrVar[j];
//                                             }
//                                             ctx.fillText(notationVar,0,-15*(countSpaceVar.length-countFalse));
//                                             countLineVar += 1;
//                                         } else {
//                                             for (let j = 0; j < d; j++) {
//                                                 notationVar += notationArrVar[j];
//                                             }
//                                             ctx.fillText(notationVar,0,-15*(countSpaceVar.length-countFalse));
//                                             notationVar = '';
//                                             for (let j = d+1; j < notationArrVar.length; j++) {
//                                                 notationVar += notationArrVar[j];
//                                             }
//                                             ctx.fillText(notationVar,0,0);
//                                             countLineVar += 1;
//                                         }
//                                     } else if (i<countSpaceVar.length-1) {
//                                         for (let j = countSpaceVar[i-1-countIndexVar]+1; j < d; j++) {
//                                             notationVar += notationArrVar[j];
//                                         }
//                                         ctx.fillText(notationVar,0,-(countSpaceVar.length-countLineVar-countFalse)*15);
//                                         countLineVar += 1;
//                                     } else {
//                                         for (let j = countSpaceVar[i-1-countIndexVar]+1; j < d; j++) {
//                                             notationVar += notationArrVar[j];
//                                         }
//                                         ctx.fillText(notationVar,0,-(countSpaceVar.length-countLineVar-countFalse)*15);
//                                         notationVar = '';
//                                         for (let j = d+1; j < notationArrVar.length; j++) {
//                                             notationVar += notationArrVar[j];
//                                         }
//                                         ctx.fillText(notationVar,0,0);
//                                         countLineVar += 1;
//                                     }
//                                     countIndexVar = 0;
//                                 } else countIndexVar += 1;
//                             });
//                         }
//                     } else {
//                         ctx.fillText(mapvar2.get(varIndex),0,0);
//                     }
//                     ctx.fill();
//                     ctx.rotate(Math.PI/2);
//                     ctx.translate(-plotPosition[0]+5,-plotPosition[1]-plotSize[1]);
//                 } else {        // turn on variable or bot
//                     ctx.translate(plotPosition[0]-5,plotPosition[1]+plotSize[1]);
//                     ctx.rotate(-Math.PI/2);
//                     // ctx.font = "12px Arial";
//                     ctx.font = "10px Arial";
//                     ctx.fillStyle = 'rgb(0,0,0)';
//                     if (notationArrIns.length > 14) {
//                         if (countSpaceIns.length === 0) {
//                             notationIns = '';
//                             for (let j = 0; j < 14; j++) {
//                                 notationIns += notationArrIns[j];
//                             }
//                             ctx.fillText(notationIns,0,0);
//                         } else {
//                             countLineIns = 0;
//                             countSpaceIns.forEach((d,i)=>{
//                                 if (d) {
//                                     notationIns = '';
//                                     if (i === 0) {
//                                         if (countSpaceIns.length-countFalse2>1) {
//                                             for (let j = 0; j < d; j++) {
//                                                 notationIns += notationArrIns[j];
//                                             }
//                                             ctx.fillText(notationIns,0,-15*(countSpaceIns.length-countFalse2));
//                                             countLineIns += 1;
//                                         } else {
//                                             for (let j = 0; j < d; j++) {
//                                                 notationIns += notationArrIns[j];
//                                             }
//                                             ctx.fillText(notationIns,0,-15*(countSpaceIns.length-countFalse2));
//                                             notationIns = '';
//                                             for (let j = d+1; j < notationArrIns.length; j++) {
//                                                 notationIns += notationArrIns[j];
//                                             }
//                                             ctx.fillText(notationIns,0,0);
//                                             countLineIns += 1;
//                                         }
//                                     } else if (i<countSpaceIns.length-1) {
//                                         for (let j = countSpaceIns[i-1-countIndexIns]+1; j < d; j++) {
//                                             notationIns += notationArrIns[j];
//                                         }
//                                         ctx.fillText(notationIns,0,-(countSpaceIns.length-countLineIns-countFalse2)*15);
//                                         countLineIns += 1;
//                                     } else {
//                                         for (let j = countSpaceIns[i-1-countIndexIns]+1; j < d; j++) {
//                                             notationIns += notationArrIns[j];
//                                         }
//                                         ctx.fillText(notationIns,0,-(countSpaceIns.length-countLineIns-countFalse2)*15);
//                                         notationIns = '';
//                                         for (let j = d+1; j < notationArrIns.length; j++) {
//                                             notationIns += notationArrIns[j];
//                                         }
//                                         ctx.fillText(notationIns,0,0);
//                                         countLineIns += 1;
//                                     }
//                                     countIndexIns = 0;
//                                 } else countIndexIns += 1;
//                             });
//                         }
//                     } else {
//                         ctx.fillText(mapsample2.get(sampleIndex),0,0);
//                     }
//                     ctx.fill();
//                     ctx.rotate(Math.PI/2);
//                     ctx.translate(-plotPosition[0]+5,-plotPosition[1]-plotSize[1]);
//                 }
//             } else {    // no interaction mode
//                 ctx.translate(plotPosition[0]-5,plotPosition[1]+plotSize[1]);
//                 ctx.rotate(-Math.PI/2);
//                 // ctx.font = "12px Arial";
//                 ctx.font = "10px Arial";
//                 ctx.fillStyle = 'rgb(0,0,0)';
//                 if (notationArrVar.length > 14) {
//                     if (countSpaceVar.length === 0) {
//                         notationVar = '';
//                         for (let j = 0; j < 14; j++) {
//                             notationVar += notationArrVar[j];
//                         }
//                         ctx.fillText(notationVar,0,0);
//                     } else {
//                         countLineVar = 0;
//                         countSpaceVar.forEach((d,i)=>{
//                             if (d) {
//                                 notationVar = '';
//                                 if (i === 0) {
//                                     if (countSpaceVar.length>1) {
//                                         for (let j = 0; j < d; j++) {
//                                             notationVar += notationArrVar[j];
//                                         }
//                                         ctx.fillText(notationVar,0,-15*(countSpaceVar.length));
//                                         countLineVar += 1;
//                                     } else {
//                                         for (let j = 0; j < d; j++) {
//                                             notationVar += notationArrVar[j];
//                                         }
//                                         ctx.fillText(notationVar,0,-15*(countSpaceVar.length));
//                                         notationVar = '';
//                                         for (let j = d+1; j < notationArrVar.length; j++) {
//                                             notationVar += notationArrVar[j];
//                                         }
//                                         ctx.fillText(notationVar,0,0);
//                                         countLineVar += 1;
//                                     }
//                                 } else if (i<countSpaceVar.length-1) {
//                                     for (let j = countSpaceVar[i-1-countIndexVar]+1; j < d; j++) {
//                                         notationVar += notationArrVar[j];
//                                     }
//                                     ctx.fillText(notationVar,0,-(countSpaceVar.length-countLineVar)*15);
//                                     countLineVar += 1;
//                                 } else {
//                                     for (let j = countSpaceVar[i-1-countIndexVar]+1; j < d; j++) {
//                                         notationVar += notationArrVar[j];
//                                     }
//                                     ctx.fillText(notationVar,0,-(countSpaceVar.length-countLineVar)*15);
//                                     notationVar = '';
//                                     for (let j = d+1; j < notationArrVar.length; j++) {
//                                         notationVar += notationArrVar[j];
//                                     }
//                                     ctx.fillText(notationVar,0,0);
//                                     countLineVar += 1;
//                                 }
//                                 countIndexVar = 0;
//                             } else countIndexVar += 1;
//                         });
//                     }
//                 } else {
//                     ctx.fillText(mapvar2.get(varIndex),0,0);
//                 }
//                 ctx.fill();
//                 ctx.rotate(Math.PI/2);
//                 ctx.translate(-plotPosition[0]+5,-plotPosition[1]-plotSize[1]);
//                 // ctx.font = '12px Arial';
//                 ctx.font = '10px Arial';
//                 ctx.fillText(mapsample2.get(sampleIndex),plotPosition[0]+2,plotPosition[1]+15);
//             }
//             break;
//             case "2D":
//                 // x Variable notation
//                 let xNotation = '';
//                 let xNotationArr = [];
//                 let xCountSpace = [], myXCountSpace = [], xCountLine = 0, xCountIndex = 0, xCountFalse = 0;
//                 xNotationArr = mapvar2.get(xVarIndex).split('');
//                 xNotationArr.forEach((d,i)=>{
//                     if (d === ' ') myXCountSpace.push(i);
//                 });
//                 xCountSpace = myXCountSpace.map((d,i)=>{
//                     if (i) {
//                         if (d-myXCountSpace[i-1]>3) return d;
//                         else return false;
//                     } else {
//                         if (d>2) return d;
//                         else return false;
//                     }
//                 });
//                 xCountSpace.forEach(d=>{if(d===false) xCountFalse += 1;});
//
//                 // y Variable notation
//                 let yNotation = '';
//                 let yNotationArr = [];
//                 let yCountSpace = [], myYCountSpace = [], yCountLine = 0, yCountIndex = 0, yCountFalse = 0;
//                 yNotationArr = mapvar2.get(yVarIndex).split('');
//                 yNotationArr.forEach((d,i)=>{
//                     if (d === ' ') myYCountSpace.push(i);
//                 });
//                 yCountSpace = myYCountSpace.map((d,i)=>{
//                     if (i) {
//                         if (d-myYCountSpace[i-1]>3) return d;
//                         else return false;
//                     } else {
//                         if (d>2) return d;
//                         else return false;
//                     }
//                 });
//                 yCountSpace.forEach(d=>{if(d===false) yCountFalse += 1;});
//
//                 // Instance notation
//                 let notationIns2D = '';
//                 let notationArrIns2D = [];
//                 let countSpaceIns2D = [], myCountSpaceIns2D = [], countLineIns2D = 0, countIndexIns2D = 0, countFalse2D = 0;
//                 notationArrIns2D = mapsample2.get(sampleIndex).split('');
//                 notationArrIns2D.forEach((d,i)=>{
//                     if (d === ' ') myCountSpaceIns2D.push(i);
//                 });
//                 countSpaceIns2D = myCountSpaceIns2D.map((d,i)=>{
//                     if (i) {
//                         if (d-myCountSpaceIns2D[i-1]>3) return d;
//                         else return false;
//                     } else {
//                         if (d>2) return d;
//                         else return false;
//                     }
//                 });
//                 countSpaceIns2D.forEach(d=>{if(d===false) countFalse2D += 1;});
//
//                 ctx.translate(plotPosition[0]-5,plotPosition[1]+plotSize[1]);
//                 ctx.rotate(-Math.PI/2);
//                 ctx.font = "12px Arial";
//                 ctx.fillStyle = 'rgb(0,0,0)';
//                 if (yNotationArr.length > 14) {
//                     if (yCountSpace.length === 0) {
//                         yNotation = '';
//                         for (let j = 0; j < 14; j++) {
//                             yNotation += yNotationArr[j];
//                         }
//                         ctx.fillText(yNotation,0,0);
//                     } else {
//                         yCountLine = 0;
//                         yCountSpace.forEach((d,i)=>{
//                             if (d) {
//                                 yNotation = '';
//                                 if (i === 0) {
//                                     if (yCountSpace.length>1) {
//                                         for (let j = 0; j < d; j++) {
//                                             yNotation += yNotationArr[j];
//                                         }
//                                         ctx.fillText(yNotation,0,-15*(yCountSpace.length-yCountFalse));
//                                         yCountLine += 1;
//                                     } else {
//                                         for (let j = 0; j < d; j++) {
//                                             yNotation += yNotationArr[j];
//                                         }
//                                         ctx.fillText(yNotation,0,-15*(yCountSpace.length-yCountFalse));
//                                         yNotation = '';
//                                         for (let j = d+1; j < yNotationArr.length; j++) {
//                                             yNotation += yNotationArr[j];
//                                         }
//                                         ctx.fillText(yNotation,0,0);
//                                         yCountLine += 1;
//                                     }
//                                 } else if (i<yCountSpace.length-1) {
//                                     for (let j = yCountSpace[i-1-yCountIndex]+1; j < d; j++) {
//                                         yNotation += yNotationArr[j];
//                                     }
//                                     ctx.fillText(yNotation,0,-(yCountSpace.length-yCountLine-yCountFalse)*15);
//                                     yCountLine += 1;
//                                 } else {
//                                     for (let j = yCountSpace[i-1-yCountIndex]+1; j < d; j++) {
//                                         yNotation += yNotationArr[j];
//                                     }
//                                     ctx.fillText(yNotation,0,-(yCountSpace.length-yCountLine-yCountFalse)*15);
//                                     yNotation = '';
//                                     for (let j = d+1; j < yNotationArr.length; j++) {
//                                         yNotation += yNotationArr[j];
//                                     }
//                                     ctx.fillText(yNotation,0,0);
//                                     yCountLine += 1;
//                                 }
//                                 yCountIndex = 0;
//                             } else yCountIndex += 1;
//                         });
//                     }
//                 } else {
//                     ctx.fillText(mapvar2.get(yVarIndex),0,0);
//                 }
//                 ctx.fill();
//                 ctx.rotate(Math.PI/2);
//                 ctx.translate(-plotPosition[0]+5,-plotPosition[1]-plotSize[1]);
//                 ctx.translate(plotPosition[0],plotPosition[1]+plotSize[1]+10);
//                 // if (xNotationArr.length > 14) {
//                 //     if (xCountSpace.length === 0) {
//                 //         xNotation = '';
//                 //         for (let j = 0; j < 14; j++) {
//                 //             xNotation += xNotationArr[j];
//                 //         }
//                 //         ctx.fillText(xNotation,0,0);
//                 //     } else {
//                 //         xCountLine = 0;
//                 //         xCountSpace.forEach((d,i)=>{
//                 //             if (d) {
//                 //                 xNotation = '';
//                 //                 if (i === 0) {
//                 //                     if (xCountSpace.length>1) {
//                 //                         for (let j = 0; j < d; j++) {
//                 //                             xNotation += xNotationArr[j];
//                 //                         }
//                 //                         ctx.fillText(xNotation,0,-15*(xCountSpace.length-xCountFalse));
//                 //                         xCountLine += 1;
//                 //                     } else {
//                 //                         for (let j = 0; j < d; j++) {
//                 //                             xNotation += xNotationArr[j];
//                 //                         }
//                 //                         ctx.fillText(xNotation,0,-15*(xCountSpace.length-xCountFalse));
//                 //                         xNotation = '';
//                 //                         for (let j = d+1; j < xNotationArr.length; j++) {
//                 //                             xNotation += xNotationArr[j];
//                 //                         }
//                 //                         ctx.fillText(xNotation,0,0);
//                 //                         xCountLine += 1;
//                 //                     }
//                 //                 } else if (i<xCountSpace.length-1) {
//                 //                     for (let j = xCountSpace[i-1-xCountIndex]+1; j < d; j++) {
//                 //                         xNotation += xNotationArr[j];
//                 //                     }
//                 //                     ctx.fillText(xNotation,0,-(xCountSpace.length-xCountLine-xCountFalse)*15);
//                 //                     xCountLine += 1;
//                 //                 } else {
//                 //                     for (let j = xCountSpace[i-1-xCountIndex]+1; j < d; j++) {
//                 //                         xNotation += xNotationArr[j];
//                 //                     }
//                 //                     ctx.fillText(xNotation,0,-(xCountSpace.length-xCountLine-xCountFalse)*15);
//                 //                     xNotation = '';
//                 //                     for (let j = d+1; j < xNotationArr.length; j++) {
//                 //                         xNotation += xNotationArr[j];
//                 //                     }
//                 //                     ctx.fillText(xNotation,0,0);
//                 //                     xCountLine += 1;
//                 //                 }
//                 //                 xCountIndex = 0;
//                 //             } else xCountIndex += 1;
//                 //         });
//                 //     }
//                 // } else {
//                 //     ctx.fillText(mapvar2.get(xVarIndex),0,0);
//                 // }
//                 ctx.fillText(mapvar2.get(xVarIndex),0,0);
//                 ctx.translate(-plotPosition[0],-plotPosition[1]-plotSize[1]-10);
//                 ctx.translate(plotPosition[0],plotPosition[1]-3);
//                 ctx.fillText(mapsample2.get(sampleIndex),0,0);
//                 ctx.translate(-plotPosition[0],-plotPosition[1]+3);
//
//                 break;
//     }
//
//
//     // draw time series
//     ctx.lineWidth = 1;
//     switch (selectedDisplay) {
//         case "1D":
//             timedata.forEach(function (time, step) {
//                 if (step) {
//                     if(data[sampleIndex][varIndex][step]>=0 && data[sampleIndex][varIndex][step-1]>=0) {
//                         let x1 = plotPosition[0]+0.05*plotSize[0]+0.9*plotSize[0]*(step-1)/timedata.length;
//                         let x2 = plotPosition[0]+0.05*plotSize[0]+0.9*plotSize[0]*step/timedata.length;
//                         let y1 = plotPosition[1]+0.05*plotSize[1]+0.9*plotSize[1]*(1-data[sampleIndex][varIndex][step-1]);
//                         let y2 = plotPosition[1]+0.05*plotSize[1]+0.9*plotSize[1]*(1-data[sampleIndex][varIndex][step]);
//                         color[0] = (step < timedata.length/2) ? 0 : (step-timedata.length/2)*255/(timedata.length/2);
//                         color[1] = 0;
//                         color[2] = (step < timedata.length/2) ? 255-255*step/(timedata.length/2) : 0;
//                         ctx.beginPath();
//                         ctx.moveTo(x1,y1);
//                         ctx.lineTo(x2, y2);
//                         ctx.strokeStyle = `rgb(${color[0]},${color[1]},${color[2]})`;
//                         ctx.stroke();
//                     }
//                 }
//             });
//             break;
//         case "2D":
//             timedata.forEach(function (time, step) {
//                 if (step) {
//                     if(data[sampleIndex][xVarIndex][step]>=0 && data[sampleIndex][xVarIndex][step-1]>=0 && data[sampleIndex][yVarIndex][step]>=0 && data[sampleIndex][yVarIndex][step-1]>=0) {
//                         let x1 = plotPosition[0]+0.05*plotSize[0]+0.9*plotSize[0]*data[sampleIndex][xVarIndex][step-1];
//                         let x2 = plotPosition[0]+0.05*plotSize[0]+0.9*plotSize[0]*data[sampleIndex][xVarIndex][step];
//                         let y1 = plotPosition[1]+0.05*plotSize[1]+0.9*plotSize[1]*(1-data[sampleIndex][yVarIndex][step-1]);
//                         let y2 = plotPosition[1]+0.05*plotSize[1]+0.9*plotSize[1]*(1-data[sampleIndex][yVarIndex][step]);
//                         color[0] = (step < timedata.length/2) ? 0 : (step-timedata.length/2)*255/(timedata.length/2);
//                         color[1] = 0;
//                         color[2] = (step < timedata.length/2) ? 255-255*step/(timedata.length/2) : 0;
//                         ctx.beginPath();
//                         ctx.moveTo(x1,y1);
//                         ctx.lineTo(x2, y2);
//                         ctx.arc(x2,y2,1,0,2*Math.PI);
//                         ctx.strokeStyle = `rgb(${color[0]},${color[1]},${color[2]})`;
//                         ctx.fillStyle = `rgb(${color[0]},${color[1]},${color[2]})`;
//                         ctx.lineWidth = 0.3;
//                         ctx.stroke();
//                         ctx.fill();
//                     }
//                 }
//             });
//             break;
//     }
//
//
//     // draw rose chart
//     let dataRadarChart = dataRadar2[plotIndex];
//     let angle = Math.PI*2/dataRadarChart.length;
//     let rRadarChart = plotSize[1]/2.1;
//     let rPlotPosition = [plotPosition[0]+plotSize[0]+rRadarChart+5,plotPosition[1]+plotSize[1]/2];
//     for (let k = 5; k > 0; k--) {
//         ctx.beginPath();
//         ctx.arc(rPlotPosition[0],rPlotPosition[1],0.2*rRadarChart*k,0,2*Math.PI);
//         // ctx.arc(xscale(plotPosition[0]),yscale(plotPosition[1]),0.2*rRadarChart*k,0,2*Math.PI);
//         ctx.strokeStyle = "rgb(180,180,180)";
//         ctx.stroke();
//         ctx.fillStyle = "rgb(255,255,255)";
//         ctx.fill();
//     }
//     dataRadarChart.forEach((d,i)=>{
//         ctx.beginPath();
//         let colorRadar;
//         switch (type[i]) {
//             case 0:
//                 colorRadar = [18, 169, 101];
//                 break;
//             case 1:
//                 colorRadar = [232, 101, 11];
//                 break;
//             case 2:
//                 colorRadar = [89, 135, 222];
//                 break;
//         }
//         ctx.arc(rPlotPosition[0],rPlotPosition[1],d*rRadarChart,(i-0.25)*angle-Math.PI/2,(i+0.25)*angle-Math.PI/2);
//         ctx.fillStyle = `rgb(${colorRadar[0]},${colorRadar[1]},${colorRadar[2]})`;
//         ctx.fill();
//         ctx.beginPath();
//         ctx.moveTo(rPlotPosition[0],rPlotPosition[1]);
//         ctx.lineTo(rPlotPosition[0]+d*rRadarChart*Math.cos((i-0.25)*angle-Math.PI/2),rPlotPosition[1]+d*rRadarChart*Math.sin((i-0.25)*angle-Math.PI/2));
//         ctx.lineTo(rPlotPosition[0]+d*rRadarChart*Math.cos((i+0.25)*angle-Math.PI/2),rPlotPosition[1]+d*rRadarChart*Math.sin((i+0.25)*angle-Math.PI/2));
//         ctx.fill();
//         ctx.closePath();
//     });
//     // draw start chart
//     // ctx.beginPath();
//     // ctx.moveTo(rPlotPosition[0]+dataRadarChart[0]*rRadarChart*Math.cos(i*angle-Math.PI/2),rPlotPosition[1]+dataRadarChart[0]*rRadarChart*Math.sin(i*angle-Math.PI/2));
//     // dataRadarChart.forEach((d,i)=>{
//     //     if (i!==0) ctx.lineTo(rPlotPosition[0]+d*rRadarChart*Math.cos(i*angle-Math.PI/2),rPlotPosition[1]+d*rRadarChart*Math.sin(i*angle-Math.PI/2));
//     // });
//     // ctx.fillStyle = 'rgb(89, 135, 222)';
//     // ctx.fill();
//     // ctx.closePath();
//
//     // mouse over
//     let xMouse = mousePosition_[0];
//     let yMouse = mousePosition_[1];
//     let checkMouseOver = (xMouse >= plotPosition[0]+0.05*plotSize[0]) && (xMouse <= plotPosition[0]+0.95*plotSize[0]) && (yMouse >= plotPosition[1]+0.05*plotSize[1]) && (yMouse <= plotPosition[1]+0.95*plotSize[1]);
//     if (checkMouseOver) {
//         let dX = 0.9*plotSize[0]/timedata.length;
//         let step = Math.floor((xMouse-plotPosition[0]-0.05*plotSize[0])/dX);
//         let x = plotPosition[0]+0.05*plotSize[0]+dX*step;
//         let y = data[sampleIndex][varIndex][step]>=0 ? plotPosition[1]+0.05*plotSize[1]+0.9*plotSize[1]*(1-data[sampleIndex][varIndex][step]) : 'No data';
//         // let dataValue = Math.round(dataRaw[sampleIndex][varIndex][step]).toString();
//         let dataValue = (Math.floor(dataRaw[sampleIndex][varIndex][step]) > 100) ? Math.floor(dataRaw[sampleIndex][varIndex][step]) : Math.floor(dataRaw[sampleIndex][varIndex][step]*100)/100;
//         // draw x-notation
//         ctx.beginPath();
//         ctx.fillStyle = 'rgb(0,0,0)';
//         ctx.moveTo(x,plotPosition[1]+plotSize[1]);
//         ctx.lineTo(x-5,plotPosition[1]+plotSize[1]+5);
//         ctx.lineTo(x+5,plotPosition[1]+plotSize[1]+5);
//         ctx.lineTo(x,plotPosition[1]+plotSize[1]);
//         ctx.fill();
//         ctx.closePath();
//         ctx.fillRect(x-25,plotPosition[1]+plotSize[1]+5,50,12);
//         ctx.fillStyle = 'rgb(255,255,255)';
//         ctx.font = '10px Arial';
//         ctx.fillText(timedata[step],x-23,plotPosition[1]+plotSize[1]+5+10);
//
//         // draw y-notation:
//         if (typeof (y) === 'number') {
//             ctx.beginPath();
//             ctx.fillStyle = 'rgb(0,0,0)';
//             ctx.moveTo(x,y);
//             ctx.lineTo(x+5,y-5);
//             ctx.lineTo(x+5,y+5);
//             ctx.lineTo(x,y);
//             ctx.fill();
//             ctx.closePath();
//             ctx.fillRect(x+5,y-6,26,12);
//             ctx.fillStyle = 'rgb(255,255,255)';
//             ctx.font = '10px Arial';
//             ctx.fillText(dataValue,x+7,y+4);
//         }
//     }
//
//     // clickable button
//     if (interactionOption.sample !== 'noOption' || interactionOption.variable !== 'noOption') {
//         let leftButtonPosition = [(myWidth-300)*0.7,50];
//         // let rightButtonPosition = [(myWidth-300)*0.7+80,50];
//         let rightButtonPosition = [(myWidth-300)*0.7+50,50];
//         let buttonSize = [20,20];
//
//         let quitButtonSize = [120,20];
//         let quitButtonPosition = [(myWidth-300)*0.7+80,50];
//
//         let checkLeft = (trueMousePosition[0]>=leftButtonPosition[0]) && (trueMousePosition[0]<=leftButtonPosition[0]+buttonSize[0]) && (trueMousePosition[1]>=leftButtonPosition[1]) && (trueMousePosition[1]<=leftButtonPosition[1]+buttonSize[1]);
//         let checkRight = (trueMousePosition[0]>=rightButtonPosition[0]) && (trueMousePosition[0]<=rightButtonPosition[0]+buttonSize[0]) && (trueMousePosition[1]>=rightButtonPosition[1]) && (trueMousePosition[1]<=rightButtonPosition[1]+buttonSize[1]);
//         let checkQuit = (trueMousePosition[0]>=quitButtonPosition[0]) && (trueMousePosition[0]<=quitButtonPosition[0]+quitButtonSize[0]) && (trueMousePosition[1]>=quitButtonPosition[1]) && (trueMousePosition[1]<=quitButtonPosition[1]+quitButtonSize[1]);
//
//         let giveFeedBack = checkLeft || checkRight || checkQuit;
//         ctx.beginPath();
//         // draw buttons
//         ctx.fillStyle = (checkLeft) ? 'rgb(255,0,0)' : 'rgb(180,180,180)';
//         ctx.fillRect(leftButtonPosition[0],leftButtonPosition[1],buttonSize[0],buttonSize[1]);  // left button
//         ctx.fill();
//         ctx.fillStyle = (checkRight) ? 'rgb(255,0,0)' : 'rgb(180,180,180)';
//         ctx.fillRect(rightButtonPosition[0],rightButtonPosition[1],buttonSize[0],buttonSize[1]);    // right button
//         ctx.fill();
//         ctx.fillStyle = (checkQuit) ? 'rgb(255,0,0)' : 'rgb(180,180,180)';
//         ctx.fillRect(quitButtonPosition[0],quitButtonPosition[1],quitButtonSize[0],quitButtonSize[1]);  // quit button
//         ctx.fill();
//         // draw signs of buttons
//         ctx.fillStyle = 'rgb(255,255,255)';
//         ctx.moveTo(leftButtonPosition[0]+buttonSize[0]/2-5,leftButtonPosition[1]+buttonSize[1]/2);  // left
//         ctx.lineTo(leftButtonPosition[0]+buttonSize[0]/2+5,leftButtonPosition[1]+buttonSize[1]/2+5);
//         ctx.lineTo(leftButtonPosition[0]+buttonSize[0]/2+5,leftButtonPosition[1]+buttonSize[1]/2-5);
//         ctx.lineTo(leftButtonPosition[0]+buttonSize[0]/2-5,leftButtonPosition[1]+buttonSize[1]/2);
//         ctx.fill();
//         ctx.moveTo(rightButtonPosition[0]+buttonSize[0]/2+5,rightButtonPosition[1]+buttonSize[1]/2);  // right
//         ctx.lineTo(rightButtonPosition[0]+buttonSize[0]/2-5,rightButtonPosition[1]+buttonSize[1]/2+5);
//         ctx.lineTo(rightButtonPosition[0]+buttonSize[0]/2-5,rightButtonPosition[1]+buttonSize[1]/2-5);
//         ctx.lineTo(rightButtonPosition[0]+buttonSize[0]/2+5,rightButtonPosition[1]+buttonSize[1]/2);
//         ctx.fill();
//         // ctx.font = '12px Arial';
//         ctx.font = '10px Arial';
//         ctx.textAlign = "center";
//
//         ctx.fillText('Quit interaction section',quitButtonPosition[0]+60,quitButtonPosition[1]+quitButtonSize[1]-5);
//         ctx.fill();
//         ctx.fillStyle = 'rgb(0,0,0)';
//         // ctx.font = '16px Arial';
//         ctx.font = '12px Arial';
//         ctx.fillText(currentPage.toString(),leftButtonPosition[0]+buttonSize[0]+15,leftButtonPosition[1]+buttonSize[1]-5);
//         ctx.textAlign = "left";
//         ctx.fill();
//     } else {    // no interaction mode
//         let buttonPosition = [plotPosition[0]+plotSize[0]+3,plotPosition[1]];
//         let buttonSize = [12,12];
//         let checkButton = (trueMousePosition[0]>=buttonPosition[0]) && (trueMousePosition[0]<=buttonPosition[0]+buttonSize[0]) && (trueMousePosition[1]>=buttonPosition[1]) && (trueMousePosition[1]<=buttonPosition[1]+buttonSize[1]);
//
//         // draw turn off button
//         ctx.beginPath();
//         ctx.fillStyle = (checkButton) ? 'rgb(255,0,0)' : 'rgb(0,0,0)';
//         ctx.fillRect(plotPosition[0]+plotSize[0]+3,plotPosition[1],buttonSize[0],buttonSize[1]);
//         ctx.fill();
//         ctx.lineWidth = 1;
//         ctx.strokeStyle = 'rgb(255,255,255)';
//         ctx.moveTo(plotPosition[0]+plotSize[0]+4,plotPosition[1]+1);
//         ctx.lineTo(plotPosition[0]+plotSize[0]+buttonSize[0]+2,plotPosition[1]+buttonSize[1]-1);
//         ctx.stroke();
//         ctx.moveTo(plotPosition[0]+plotSize[0]+buttonSize[0]+2,plotPosition[1]+1);
//         ctx.lineTo(plotPosition[0]+plotSize[0]+4,plotPosition[1]+buttonSize[1]-1);
//         ctx.stroke();
//         ctx.lineWidth = 1;
//     }
// }

// function Change layout when number of time series exceeds 6
// function changePage(num_) {
//     let leftButtonPosition = [(myWidth-300)*0.7,50];
//     let rightButtonPosition = [(myWidth-300)*0.7+50,50];
//     let buttonSize = [20,20];
//
//     let checkLeft = (trueMousePosition[0]>=leftButtonPosition[0]) && (trueMousePosition[0]<=leftButtonPosition[0]+buttonSize[0]) && (trueMousePosition[1]>=leftButtonPosition[1]) && (trueMousePosition[1]<=leftButtonPosition[1]+buttonSize[1]);
//     let checkRight = (trueMousePosition[0]>=rightButtonPosition[0]) && (trueMousePosition[0]<=rightButtonPosition[0]+buttonSize[0]) && (trueMousePosition[1]>=rightButtonPosition[1]) && (trueMousePosition[1]<=rightButtonPosition[1]+buttonSize[1]);
//
//     if (checkLeft) {
//         if (currentPage > 1) currentPage -= 1;
//     }
//     if (checkRight) {
//         if (currentPage<num_) currentPage += 1;
//     }
// }

// print Metrics
// function printMetrics(solution_) {
//     let index;
//     switch (visualizingOption) {
//         case 'UMAP':
//             index = umapTS.solution().findIndex(d=>d[0] === solution_[0] && d[1] === solution_[1]);
//             break;
//         case 'PCA':
//             index = pcaTS.solution().findIndex(d=>d[0] === solution_[0] && d[1] === solution_[1]);
//             break;
//         case 'tSNE':
//             index = tsneTS.solution().findIndex(d=>d[0] === solution_[0] && d[1] === solution_[1]);
//             break;
//     }
//     console.log(dataRadar2[index]);
// }