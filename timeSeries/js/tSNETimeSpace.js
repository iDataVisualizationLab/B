d3.tsneTimeSpace = function () {
    let leaderDraw = leaderList.map(d=>d);
    let storeDraw = [];
    let graphicopt = {
            margin: {top: myHeight*0.2, right: (myWidth-400)*0.3+60, bottom: myHeight*0.1, left: (myWidth-400)*0.1},
            width: myWidth-400,
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
                epsilon: 20, // epsilon is learning rate (10 = default)
                perplexity: 1000, // roughly how many neighbors each point influences (30 = default)
                dim: 2, // dimensionality of the embedding (2 = default)
                stopCondition: -4, // parameter for tsne worker - Ngan 12/17/2019
            }, radaropt: {
                // summary:{quantile:true},
                mini: true,
                levels: 6,
                gradient: true,
                w: 40,
                h: 40,
                showText: false,
                margin: {top: 0, right: 0, bottom: 0, left: 0},
            },
            linkConnect: true,
        },
        controlPanel = {
            epsilon: {text: "Epsilon", range: [1, 40], type: "slider", variable: 'epsilon', width: '100px'},
            perplexity: {text: "Perplexity", range: [1, 1000], type: "slider", variable: 'perplexity', width: '100px'},
            stopCondition: {
                text: "Limit \u0394 cost",
                range: [-12, -3],
                type: "slider",
                variable: 'stopCondition',
                width: '100px'
            },
            // linkConnect: {text: "Draw link", type: "checkbox", variable: 'linkConnect', width: '100px',callback:()=>render(!isBusy)},
        },
        formatTable = {
            'time': function (d) {
                return millisecondsToStr(d)
            },
            'totalTime': function (d) {
                return millisecondsToStr(d)
            },
            'iteration': function (d) {
                return d
            },
            'stopCondition': function (d) {
                return '1e' + Math.round(d)
            }
        }, tableWidth = 200
        ,
        runopt = {},
        isBusy = false;
    let tsne, colorscale;
    let master = {}, solution, datain = [], filter_by_name = [], table_info, path, cluster = [];
    xscale = d3.scaleLinear(); yscale = d3.scaleLinear();
    // grahic
    let background_canvas, background_ctx, front_canvas, front_ctx, svg;
    //----------------------color----------------------
    // let createRadar = _.partialRight(createRadar_func, graphicopt.radaropt, colorscale);
    // let createRadar = _.partialRight(graphicopt.radaropt, colorscale);

    function renderSvgRadar() {
        let datapoint = svg.selectAll(".linkLinegg").interrupt().data(d => datain.map(e => e.__metrics), d => d.name + d.timestep);
        datapoint.exit().remove();
        let datapoint_n = datapoint.enter().append('g')
            .attr('class', 'linkLinegg timeline');
        datapoint_n.each(function (d, i) {
            createRadar(d3.select(this).select('.linkLineg'), d3.select(this), d, {colorfill: true}).classed('hide', d.hide);// hide 1st radar
        });

        datapoint_n.merge(datapoint).attr('transform', function (d) {
            return `translate(${xscale(d.position[0])},${yscale(d.position[1])})`
        })
            .on('mouseover', d => {
                master.hightlight([d.name_or])
                svg.selectAll('.linkLinegg').filter(e => d.name_or !== e.name_or).classed('hide', true)
                // d3.selectAll('.h'+d[0].name).dispatch('mouseover');
            }).on('mouseleave', d => {
            master.unhightlight(d.name_or)
            svg.selectAll('.linkLinegg.hide').classed('hide', false)
            // d3.selectAll('.h'+d[0].name).dispatch('mouseleave');
        })
    }

    function start() {
        dimensionReductionData = [];
        svg.selectAll('*').remove();
        if (tsne)
            tsne.terminate();
        tsne = new Worker('js/tSNETimeSpaceworker.js');
        // tsne.postMessage({action:"initcanvas", canvas: offscreen, canvasopt: {width: graphicopt.widthG(), height: graphicopt.heightG()}}, [offscreen]);
        tsne.postMessage({action: "initcanvas", canvasopt: {width: graphicopt.widthG(), height: graphicopt.heightG()}});
        console.log(`----inint tsne with: `, graphicopt.opt);
        colorarr = colorscale.domain().map((d, i) => ({name: d, order: +d.split('_')[1], value: colorscale.range()[i]}))
        colorarr.sort((a, b) => a.order - b.order);

        tsne.postMessage({action: "colorscale", value: colorarr});
        tsne.postMessage({action: "inittsne", value: graphicopt.opt});
        tsne.postMessage({action: "initDataRaw", value: datain, clusterarr: cluster});
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
        })
    }

    master.init = function (arr, clusterin) {
        datain = arr;
        cluster = clusterin;
        handle_data(datain);
        updateTableInput();
        xscale.range([graphicopt.margin.left, graphicopt.width - graphicopt.margin.right]);
        yscale.range([graphicopt.margin.top, graphicopt.height - graphicopt.margin.bottom]);

        background_canvas = document.getElementById("tsneScreen");
        background_canvas.width = graphicopt.width;
        background_canvas.height = graphicopt.height;
        background_ctx = background_canvas.getContext('2d');
        front_canvas = document.getElementById("tsneScreen_fornt");
        front_canvas.width = graphicopt.width;
        front_canvas.height = graphicopt.height;
        front_ctx = front_canvas.getContext('2d');
        svg = d3.select('#tsneScreen_svg').attrs({width: graphicopt.width, height: graphicopt.height});

        start();

        return master;
    };

    function render(isradar) {
        if (solution) {
            // createRadar = _.partialRight(createRadar_func, graphicopt.radaropt, colorscale);
            background_ctx.clearRect(0, 0, graphicopt.width, graphicopt.height);
            if (filter_by_name && filter_by_name.length)
                front_ctx.clearRect(0, 0, graphicopt.width, graphicopt.height);
            path = {};
            let bCountTsne = 0;
            // let mouseOverSample, mouseOverVariable;
            // solution.findIndex((d,i)=>{
            //     const myTarget = datain[i];
            //     if (d[0] === mouseOverPosition[0] && d[1] === mouseOverPosition[1]) {
            //         mouseOverSample = myTarget.plot.split('-')[0];
            //         mouseOverVariable = myTarget.plot.split('-')[1];
            //         return true;
            //     } else return false;
            // });

            // interaction condition
            let checkInteraction, checkBothInteraction;
            checkInteraction = !((interactionOption.sample === 'noOption') && (interactionOption.variable === 'noOption'));
            checkBothInteraction = (interactionOption.sample !== 'noOption') && (interactionOption.variable !== 'noOption');

            // Draw points
            solution.forEach(function (d, i) {
                const target = datain[i];
                target.__metrics.position = d;
                if (!path[target.name])
                    path[target.name] = [];
                path[target.name].push({name: target.name, key: target.timestep, value: d, cluster: target.cluster});

                // zoom
                // let dataDR = transformDR.apply([xscale(d[0]),yscale(d[1])]);

                // interaction condition
                let checkSample, checkVariable;
                if (checkInteraction) {
                    checkSample = target.plot.split('-')[0] === interactionOption.sample;
                    switch (selectedDisplay) {
                        case '1D':
                            checkVariable = target.plot.split('-')[1] === interactionOption.variable;
                            break;
                        case '2D':
                            checkVariable = measures[0][0][+target.plot.split('-')[1]][0] === +interactionOption.variable || measures[0][0][+target.plot.split('-')[1]][1] === +interactionOption.variable;
                            break;
                    }
                }
                let isMouseOver = (d[0] === mouseOverPosition[0]) && (d[1] === mouseOverPosition[1]);

                // set up pointSize
                if (!checkInteraction) {    // no interaction
                    if (isMouseOver) pointSize = 3*multipleMouseOver;
                    else pointSize = 3;
                } else {    // interaction
                    if (checkBothInteraction) {
                        if (checkSample && checkVariable) pointSize = (isMouseOver) ? 3*multipleMouseOver*multipleHighlight : 3*multipleHighlight;
                        // else pointSize = (isMouseOver) ? 3*multipleMouseOver : 3;
                        else pointSize = 3;
                    } else {
                        if (checkSample || checkVariable) pointSize = (isMouseOver) ? 3*multipleMouseOver*multipleHighlight : 3*multipleHighlight;
                        // else pointSize = (isMouseOver) ? 3*multipleMouseOver : 3;
                        else pointSize = 3;
                    }
                }

                // color control - opacity
                let fillColor = d3.color(colorarr[target.cluster].value);
                if (!checkInteraction) {    // no interaction
                    if (mouseOverPosition.length===0) fillColor.opacity = 0.8;
                    else if (isMouseOver) fillColor.opacity = 1;
                    else fillColor.opacity = 0.2;
                } else {    // interaction
                    if (checkBothInteraction) {
                        if (checkSample && checkVariable) fillColor.opacity = 1;
                        // else fillColor.opacity = (isMouseOver)?1:0.2;
                        else fillColor.opacity = 0.2;
                    } else {
                        if (checkSample || checkVariable) fillColor.opacity = 1;
                        // else fillColor.opacity = (isMouseOver)?1:0.2;
                        else fillColor.opacity = 0.2;
                    }
                }

                // begin draw point
                background_ctx.beginPath();
                background_ctx.fillStyle = fillColor + '';
                background_ctx.arc(xscale(d[0]), yscale(d[1]), pointSize,0,2*Math.PI);
                background_ctx.fill();
                let li = (leaderDraw.length>0) ? leaderDraw.findIndex(dd=>dd===target.plot) : -1;
                // if (li !== -1) {drawLeaderPlot(background_ctx,leaderDraw[li],li,d); leaderDraw.splice(li,1); console.log(leaderDraw);}
                // if (li !== -1) {storeDraw[bCountUmap] = [background_ctx,target,d]; bCountUmap+=1;}
                if (li !== -1) {storeDraw[bCountTsne] = [background_ctx,target,[d[0],d[1]]]; bCountTsne+=1;}
            });
            // draw clicked charts
            solution.forEach((d,i)=>{
                const target = datain[i];
                target.__metrics.position = d;

                // zoom
                // let dataDR = transformDR.apply([xscale(d[0]),yscale(d[1])]);

                // interaction condition
                let checkSample, checkVariable;

                if (checkInteraction) {     // interaction
                    checkSample = target.plot.split('-')[0] === interactionOption.sample;
                    switch (selectedDisplay) {
                        case '1D':
                            checkVariable = target.plot.split('-')[1] === interactionOption.variable;
                            break;
                        case '2D':
                            checkVariable = measures[0][0][+target.plot.split('-')[1]][0] === +interactionOption.variable || measures[0][0][+target.plot.split('-')[1]][1] === +interactionOption.variable;
                            break;
                    }
                    if (checkBothInteraction) {
                        if (checkSample && checkVariable)
                            drawLeaderPlot(background_ctx,target,[xscale(d[0]),yscale(d[1])],false);
                    } else {
                        if (checkVariable || checkSample)
                            drawLeaderPlot(background_ctx,target,[xscale(d[0]),yscale(d[1])],false);
                    }
                } else {    // no interaction
                    let checkClicked = (clickArr.length > 0) ? clickArr.findIndex(cd => cd.clickedData[0]===d[0]&&cd.clickedData[1]===d[1]) : -1;
                    if (checkClicked !== -1) {
                        // drawLeaderPlot(background_ctx,target,d);
                        // let isMouseOver = (d[0] === mouseOverPosition[0]) && (d[1] === mouseOverPosition[1]);
                        // if (isMouseOver) drawLeaderPlot(background_ctx,target,[xscale(d[0]),yscale(d[1])],true);
                        // else drawLeaderPlot(background_ctx,target,[xscale(d[0]),yscale(d[1])],false);
                        drawLeaderPlot(background_ctx,target,[xscale(d[0]),yscale(d[1])],false);
                    }
                }
            });
            // draw leader plots
            storeDraw.forEach(dd=>{
                let checkInteraction;
                if ((interactionOption.sample === 'noOption') && (interactionOption.variable === 'noOption'))
                    checkInteraction = false;
                else checkInteraction = true;
                if (!checkInteraction && mouseOverPosition.length === 0 && clickArr.length === 0) drawLeaderPlot(dd[0],dd[1],[xscale(dd[2][0]),yscale(dd[2][1])],false);
            });
            // if (graphicopt.linkConnect) {
            //     d3.values(path).filter(d => d.length > 1 ? d.sort((a, b) => a.t - b.t) : false).forEach(path => {
            //         // make the combination of 0->4 [0,0,1,2] , [0,1,2,3], [1,2,3,4],[2,3,4,4]
            //         for (let i = 0; i < path.length - 1; i++) {
            //             let a = (path[i - 1] || path[i]).value;
            //             let b = path[i].value;
            //             let c = path[i + 1].value;
            //             let d = (path[i + 2] || path[i + 1]).value;
            //             drawline(background_ctx, [a, b, c, d], path[i].cluster);
            //         }
            //     })
            // }

            // if (isradar) {
            //     renderSvgRadar();
            // }

            // draw clicked-highlight time series
            if (!checkInteraction) {        // no interaction
                if (clickArr.length > maxPerPage) {
                    for (let i = clickArr.length - 1; i > clickArr.length - maxPerPage - 1; i--) {
                        let myIndex_ = solution.findIndex(d=>d[0] === clickArr[i].clickedData[0] && d[1] === clickArr[i].clickedData[1]);
                        let plot_ = datain[myIndex_].plot;
                        drawTimeSeries(background_ctx,plot_,clickArr.length-1-i,trueMousePosition);
                    }
                } else {
                    for (let i = 0; i < clickArr.length; i++) {
                        let myIndex_ = solution.findIndex(d=>d[0] === clickArr[i].clickedData[0] && d[1] === clickArr[i].clickedData[1]);
                        let plot_ = datain[myIndex_].plot;
                        drawTimeSeries(background_ctx,plot_,clickArr.length-1-i,trueMousePosition);
                    }
                }
            } else {        // interaction
                let myCase;
                if ((interactionOption.sample !== 'noOption')&&(interactionOption.variable === 'noOption')) myCase = 'instances';
                if ((interactionOption.sample === 'noOption')&&(interactionOption.variable !== 'noOption')) myCase = 'variable';
                if ((interactionOption.sample !== 'noOption')&&(interactionOption.variable !== 'noOption')) myCase = 'both';

                switch (myCase) {
                    case 'both':
                        switch (selectedDisplay) {
                            case '1D':
                                let checkData = data[+interactionOption.sample][+interactionOption.variable].findIndex(d=>d>=0) !== -1;
                                if (checkData) {
                                    let plot_ = interactionOption.sample + '-' + interactionOption.variable;
                                    drawTimeSeries(background_ctx,plot_,0,trueMousePosition);
                                }
                                break;
                            case '2D':
                                measures[0][+interactionOption.sample].forEach((element,index)=>{
                                    if (element[0] === +interactionOption.variable || element[1] === +interactionOption.variable) {
                                        let plot_ = interactionOption.sample + '-' + index.toString();
                                        drawTimeSeries(background_ctx,plot_,0,trueMousePosition);
                                    }
                                });
                                break;
                        }
                        break;
                    case 'instances':
                        switch (selectedDisplay) {
                            case '1D':
                                let checkDataArr = [];
                                let numTimeSeries = 0;
                                data[+interactionOption.sample].forEach((d,i)=>{
                                    checkDataArr[i] = d.findIndex(d=>d>=0) !== -1;
                                    if (checkDataArr[i]) numTimeSeries += 1;
                                });
                                let indexArr = [];
                                checkDataArr.forEach((d,i)=>{
                                    if(d) indexArr.push(i);
                                });
                                let numLayout = Math.ceil(numTimeSeries/maxPerPage);
                                let lastPageNum = numTimeSeries%maxPerPage;
                                // change page
                                if (clickArr.length>0) {
                                    changePage(numLayout);
                                    clickArr=[];
                                }
                                if (currentPage < numLayout) {
                                    for (let j = maxPerPage-1; j > -1; j--) {
                                        let plot_ = interactionOption.sample + '-' + indexArr[j+maxPerPage*(currentPage-1)].toString();
                                        drawTimeSeries(background_ctx,plot_,j,trueMousePosition);
                                    }
                                } else {
                                    for (let j = lastPageNum - 1; j > -1; j--) {
                                        let plot_ = interactionOption.sample + '-' + indexArr[j+maxPerPage*(numLayout-1)].toString();
                                        drawTimeSeries(background_ctx,plot_,j,trueMousePosition);
                                    }
                                }
                                break;
                            case '2D':
                                let numLayout2D = Math.ceil(measures[0][+interactionOption.sample].length/maxPerPage);
                                let lastPageNum2D = measures[0][+interactionOption.sample].length%maxPerPage;
                                // change page
                                if (clickArr.length>0) {
                                    changePage(numLayout2D);
                                    clickArr=[];
                                }
                                measures[0][+interactionOption.sample].forEach((element,index)=>{
                                    if (currentPage < numLayout2D) {
                                        for (let j = maxPerPage-1; j > -1; j--) {
                                            let plot_ = interactionOption.sample + '-' + index.toString();
                                            drawTimeSeries(background_ctx,plot_,j,trueMousePosition);
                                        }
                                    } else {
                                        for (let j = lastPageNum2D - 1; j > -1; j--) {
                                            let plot_ = interactionOption.sample + '-' + index.toString();
                                            drawTimeSeries(background_ctx,plot_,j,trueMousePosition);
                                        }
                                    }
                                });
                                break;
                        }
                        break;
                    case 'variable':
                        switch (selectedDisplay) {
                            case '1D':
                                let checkDataArr2 = [];
                                let numTimeSeries2 = 0;
                                data.forEach((d,i)=>{
                                    checkDataArr2[i] = d[+interactionOption.variable].findIndex(d=>d>=0) !== -1;
                                    if (checkDataArr2[i]) numTimeSeries2 += 1;
                                });
                                let indexArr2 = [];
                                checkDataArr2.forEach((d,i)=>{
                                    if(d) indexArr2.push(i);
                                });
                                let numLayout2 = Math.ceil(numTimeSeries2/maxPerPage);
                                let lastPageNum2 = numTimeSeries2%maxPerPage;
                                // change page
                                if (clickArr.length>0) {
                                    changePage(numLayout2);
                                    clickArr=[];
                                }
                                if (currentPage < numLayout2) {
                                    for (let j = maxPerPage - 1; j > -1; j--) {
                                        let plot_ = indexArr2[j+maxPerPage*(currentPage-1)].toString() + '-' + interactionOption.variable;
                                        drawTimeSeries(background_ctx,plot_,j,trueMousePosition);
                                    }
                                } else {
                                    for (let j = lastPageNum2 - 1; j > -1; j--) {
                                        let plot_ = indexArr2[j+maxPerPage*(numLayout2-1)].toString() + '-' + interactionOption.variable;
                                        drawTimeSeries(background_ctx,plot_,j,trueMousePosition);
                                    }
                                }
                                break;
                            case '2D':
                                let numTimeSeries2D = 0;
                                let timeSeriesIndexArr = [];
                                measures[0].forEach((element,index)=>{
                                    element.forEach((element_,index_)=>{
                                        if (element_[0] === +interactionOption.variable || element_[1] === +interactionOption.variable) {timeSeriesIndexArr[numTimeSeries2D] = index.toString()+'-'+index_.toString(); numTimeSeries2D += 1;}
                                    });
                                });
                                let numLayout22D = Math.ceil(timeSeriesIndexArr.length/maxPerPage);
                                let lastPageNum22D = timeSeriesIndexArr.length%maxPerPage;
                                // change page
                                if (clickArr.length>0) {
                                    changePage(numLayout22D);
                                    clickArr=[];
                                }
                                if (currentPage < numLayout22D) {
                                    for (let j = maxPerPage - 1; j > -1; j--) {
                                        let plot_ = timeSeriesIndexArr[j+maxPerPage*(currentPage-1)];
                                        drawTimeSeries(background_ctx,plot_,j,trueMousePosition);
                                    }
                                } else {
                                    for (let j = lastPageNum22D - 1; j > -1; j--) {
                                        let plot_ = timeSeriesIndexArr[j+maxPerPage*(numLayout22D-1)];
                                        drawTimeSeries(background_ctx,plot_,j,trueMousePosition);
                                    }
                                }
                                break;
                        }
                        break;
                }

            }
        }
    }

    function handle_data(data) {
        data.forEach(d => {
            d.__metrics = d.map((m, i) => {
                return {axis: serviceFullList[i].text, value: m}
            });
            d.__metrics.name = d.clusterName;
            d.__metrics.name_or = d.name;
            d.__metrics.timestep = d.timestep;
        })
    }

    master.stop = function () {
        if (tsne) {
            tsne.terminate();
            // renderSvgRadar()
        }
    };


    function positionLink_canvas(path, ctx) { //path 4 element
        // return p = new Path2D(positionLink(a,b));
        ctx.beginPath();
        return d3.line()
            .x(function (d) {
                return xscale(d[0]);
            })
            .y(function (d) {
                return yscale(d[1]);
            })
            .curve(d3.curveCardinalOpen)
            .context(ctx)(path);
    }

    function drawline(ctx, path, cluster) {
        positionLink_canvas(path, ctx);

        // ctx.beginPath();
        // ctx.moveTo(xscale(d[0]), yscale(d[1]));
        // ctx.lineTo(xscale(nexttime[0]), yscale(nexttime[1]));
        ctx.strokeStyle = colorarr[cluster].value;
        ctx.stroke();
    }


    master.hightlight = function (namearr) {
        filter_by_name = namearr || [];
        if (filter_by_name.length) {
            front_ctx.clearRect(0, 0, graphicopt.width, graphicopt.height);
            d3.values(path).filter(d => (filter_by_name.find(n => n === d[0].name) && d.length) > 1 ? d.sort((a, b) => a.t - b.t) : false).forEach(path => {
                // make the combination of 0->4 [0,0,1,2] , [0,1,2,3], [1,2,3,4],[2,3,4,4]
                for (let i = 0; i < path.length - 1; i++) {
                    let a = (path[i - 1] || path[i]).value;
                    let b = path[i].value;
                    let c = path[i + 1].value;
                    let d = (path[i + 2] || path[i + 1]).value;
                    drawline(front_ctx, [a, b, c, d], path[i].cluster);
                }
            })

            d3.select(background_canvas).style('opacity', 0.1);
            d3.select(front_canvas).style('opacity', 1);


        }
    };
    master.unhightlight = function () {
        filter_by_name = [];
        d3.select(background_canvas).style('opacity', 1);
        d3.select(front_canvas).style('opacity', 0);
    };
    master.generateTable = function () {
        d3.select('#tsneInformation table').selectAll('*').remove();
        table_info = d3.select('#tsneInformation table').styles({'width': tableWidth + 'px'});
        let tableData = [
            [
                {text: "Input", type: "title"},
                {label: '#Plots', content: datain.length, variable: 'datain'}
            ],
            [
                {text: "Setting", type: "title"},
            ],
            [
                {text: "Output", type: "title"},
                {label: "#Iterations", content: '_', variable: 'iteration'},
                {label: "Cost", content: '_', variable: 'cost'},
                {label: "\u0394 cost", content: '_', variable: 'deltacost'},
                {label: "Time per step", content: '_', variable: 'time'},
                {label: "Total time", content: '_', variable: 'totalTime'},
            ]
        ];
        d3.values(controlPanel).forEach(d => {
            tableData[1].push({label: d.text, type: d.type, content: d, variable: d.variable})
        });

        let tbodys = table_info.selectAll('tbody').data(tableData);
        tbodys
            .enter().append('tbody')
            .selectAll('tr').data(d => d)
            .enter().append('tr')
            .selectAll('td').data(d => d.type === "title" ? [d] : [{text: d.label}, d.type ? {
            content: d.content,
            variable: d.variable
        } : {text: d.content, variable: d.variable}])
            .enter().append('td')
            .attr('colspan', d => d.type ? "2" : null)
            .style('text-align', (d, i) => d.type === "title" ? "center" : (i ? "right" : "left"))
            .attr('class', d => d.variable)
            .each(function (d) {
                if (d.text !== undefined) // value display only
                    d3.select(this).text(d.text);
                else { // other component display
                    let formatvalue = formatTable[d.content.variable] || (e => Math.round(e));
                    if (d.content.type === "slider") {
                        let div = d3.select(this).style('width', d.content.width).append('div').attr('class', 'valign-wrapper');
                        noUiSlider.create(div.node(), {
                            start: (graphicopt.opt[d.content.variable]),
                            connect: 'lower',
                            tooltips: {
                                to: function (value) {
                                    return formatvalue(value)
                                }, from: function (value) {
                                    return +value.split('1e')[1];
                                }
                            },
                            step: d.content.step || 1,
                            orientation: 'horizontal', // 'horizontal' or 'vertical'
                            range: {
                                'min': d.content.range[0],
                                'max': d.content.range[1],
                            },
                        });
                        div.node().noUiSlider.on("change", function () { // control panel update method
                            graphicopt.opt[d.content.variable] = +this.get();
                            clickArr = [];
                            start();
                        });
                    } else if (d.content.type === "checkbox") {
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

    function updateTableInput() {
        table_info.select(`.datain`).text(e => datain.length);
        d3.select('.perplexity div').node().noUiSlider.updateOptions({
            range: {
                'min': 1,
                'max': Math.round(datain.length / 2),
            }
        });
        d3.select('.perplexity div').node().noUiSlider.set(20);
        clickArr = [];      // delete clickArr after changing mode
        interactionOption.sample = 'noOption';
        interactionOption.variable = 'noOption';
        $('#dataInstances').val('noOption').selected = true;
        $('#variable').val('noOption').selected = true;
    }

    function updateTableOutput(output) {
        d3.entries(output).forEach(d => {
            table_info.select(`.${d.key}`).text(e => d.value ? formatTable[e.variable] ? formatTable[e.variable](d.value) : d3.format('.4s')(d.value) : '_');
        });

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
        } else {
            return runopt;
        }

    };
    master.graphicopt = function (__) {
        //Put all of the options into a variable called graphicopt
        if (arguments.length) {
            for (let i in __) {
                if ('undefined' !== typeof __[i]) {
                    if (i === "opt") {
                        for (let j in __[i]) {
                            if ('undefined' !== typeof __[i][j]) {
                                graphicopt[i][j] = __[i][j];
                            }
                        }
                    } else
                        graphicopt[i] = __[i];
                }
            }
            if (graphicopt.radaropt)
                graphicopt.radaropt.schema = serviceFullList;
            // createRadar = _.partialRight(createRadar_func, graphicopt.radaropt, colorscale);
            return master;
        } else {
            return graphicopt;
        }

    };

    master.solution = function (_) {
        return solution;
    };

    master.renderTSNE = function (_) {
        render(_);
    };

    master.color = function (_) {
        return arguments.length ? (colorscale = _, master) : colorscale;
    };

    master.schema = function (_) {
        return arguments.length ? (graphicopt.radaropt.schema = _, schema = _, master) : schema;
    };
    master.dispatch = function (_) {
        return arguments.length ? (returnEvent = _, master) : returnEvent;
    };

    return master;
}

function handle_data_tsne(tsnedata) {
    let dataIn = tsnedata;
    TsneTSopt.opt = {
        epsilon: 20, // epsilon is learning rate (10 = default)
        perplexity: Math.round(dataIn.length / cluster_info.length), // roughly how many neighbors each point influences (30 = default)
        dim: 2, // dimensionality of the embedding (2 = default)
    };
    tsneTS.graphicopt(TsneTSopt).color(colorCluster).init(dataIn, cluster_info.map(c => c.__metrics.normalize));
}

function calculateMSE_num(a, b) {
    return ss.sum(a.map((d, i) => (d - b[i]) * (d - b[i])));
}

// //draw leader plots
// function drawLeaderPlot(ctx_,target_,plotPosition_) {
//     let ctx = ctx_;
//     let plot = target_.plot;
//     let group = target_.cluster;
//     let plotPosition = plotPosition_;
//     let plotIndex = dataRadar2.map(d=>d.plot).findIndex(d=>d===plot); // [#plot in dataRadar2 and measures]
//     let sampleIndex = plot.split("-")[0];
//     let varIndex = plot.split("-")[1];
//     let plotSize = 30;
//     let color = [];
//     ctx.translate(-plotSize/2,-plotSize/2);
//     if (chooseType === "radar") {
//         // draw Radar Chart
//         let dataRadarChart = dataRadar2[plotIndex];
//         let angle = Math.PI*2/dataRadarChart.length;
//         let rRadarChart = plotSize/2.1;
//         for (var k = 5; k > 0; k--) {
//             ctx.beginPath();
//             ctx.arc(xscale(plotPosition[0])+plotSize,yscale(plotPosition[1])-plotSize/2,0.2*rRadarChart*k,0,2*Math.PI);
//             ctx.strokeStyle = "rgb(180,180,180)";
//             ctx.stroke();
//             ctx.fillStyle = "rgb(255,255,255)";
//             ctx.fill();
//         }
//         dataRadarChart.forEach((d,i)=>{
//             ctx.beginPath();
//             let colorRadar;
//             switch (type[i]) {
//                 case 0:
//                     colorRadar = [18, 169, 101];
//                     break;
//                 case 1:
//                     colorRadar = [232, 101, 11];
//                     break;
//                 case 2:
//                     colorRadar = [89, 135, 222];
//                     break;
//             }
//             ctx.arc(xscale(plotPosition[0])+plotSize, yscale(plotPosition[1])-plotSize/2,d*rRadarChart,(i-0.25)*angle-Math.PI/2,(i+0.25)*angle-Math.PI/2);
//             ctx.fillStyle = `rgb(${colorRadar[0]},${colorRadar[1]},${colorRadar[2]})`;
//             ctx.fill();
//             ctx.beginPath();
//             ctx.moveTo(xscale(plotPosition[0])+plotSize,yscale(plotPosition[1])-plotSize/2);
//             ctx.lineTo(xscale(plotPosition[0])+plotSize+d*rRadarChart*Math.cos((i-0.25)*angle-Math.PI/2),yscale(plotPosition[1])-plotSize/2+d*rRadarChart*Math.sin((i-0.25)*angle-Math.PI/2));
//             ctx.lineTo(xscale(plotPosition[0])+plotSize+d*rRadarChart*Math.cos((i+0.25)*angle-Math.PI/2),yscale(plotPosition[1])-plotSize/2+d*rRadarChart*Math.sin((i+0.25)*angle-Math.PI/2));
//             ctx.fill();
//         });
//     }
//     if (chooseType === "series") {
//         // Draw main plots
//         ctx.beginPath();
//         ctx.fillStyle = "rgb(255,255,255)";
//         ctx.strokeStyle = colorCluster(cluster_info[group].name);
//         ctx.lineWidth = 3;
//         ctx.fill();
//         ctx.stroke();
//         ctx.strokeRect(xscale(plotPosition[0]), yscale(plotPosition[1]), 2*plotSize, plotSize);
//         ctx.fillRect(xscale(plotPosition[0]), yscale(plotPosition[1]), 2*plotSize, plotSize);
//         ctx.lineWidth = 1;
//         timedata.forEach(function (time, step) {
//             if (step) {
//                 if(data[sampleIndex][varIndex][step]>=0 && data[sampleIndex][varIndex][step-1]>=0 && data[sampleIndex][varIndex][step]>=0 && data[sampleIndex][varIndex][step-1]>=0) {
//                     let x1 = xscale(plotPosition[0])+0.05*plotSize+1.9*plotSize*(step-1)/timedata.length;
//                     let x2 = xscale(plotPosition[0])+0.05*plotSize+1.9*plotSize*step/timedata.length;
//                     let y1 = yscale(plotPosition[1])+0.05*plotSize+0.9*plotSize*(1-data[sampleIndex][varIndex][step-1]);
//                     let y2 = yscale(plotPosition[1])+0.05*plotSize+0.9*plotSize*(1-data[sampleIndex][varIndex][step]);
//                     color[0] = (step < timedata.length/2) ? 0 : (step-timedata.length/2)*255/(timedata.length/2);
//                     color[1] = 0;
//                     color[2] = (step < timedata.length/2) ? 255-255*step/(timedata.length/2) : 0;
//                     ctx.beginPath();
//                     ctx.moveTo(x1,y1);
//                     ctx.lineTo(x2, y2);
//                     ctx.strokeStyle = `rgb(${color[0]},${color[1]},${color[2]})`;
//                     ctx.stroke();
//                 }
//             }
//         });
//     }
//     ctx.translate(plotSize/2,plotSize/2);
//
// }