function drawInterface (lensing) {
    // find x-position - table lensing
    let x = [];
    let dx = timeLineWidth/tKey.length;
    let mouseX = mouse.x - timelinePadding;
    let cT = Math.floor(mouseX/dx);                // time nearest mouse position
    let sT = (cT - lR >= 0) ? cT - lR : 0;
    let eT = (cT + lR < tKey.length) ? cT + lR : tKey.length-1;
    let small = timeLineWidth/(tKey.length+(scaleFactor-1)*(eT-sT+1));
    let large = scaleFactor*small;
    if (lensing) {
        for (let t = 0; t < tKey.length; t++) {
            if (t<sT) x[t] = timelinePadding+t*small+0.5*small;
            else if (t<=eT) x[t] = timelinePadding+sT*small+(t-sT)*large+0.5*large;
            else x[t] = timelinePadding+t*small+0.5*small+(eT-sT+1)*(large-small);
        }
    } else {
        for (let t = 0; t < tKey.length; t++) {
            x[t] = timelinePadding + t*dx +0.5*dx;
        }
    }

    // draw time in timeline and vertical dash lines
    d3.selectAll('.verticalLines').remove();
    d3.selectAll('.timelineNotation').remove();
    for (let i = 0; i <= Math.floor((tKey.length-1)/timelineStep); i++) {
        let text = (typeof (timelineText) === 'string') ? tKey[timelineStep*i] : tKey[timelineStep*i].split(' ')[timelineText];
        let fontSize = 13;
        d3.select('#timeline')
            .append('text')
            .attr('class','timelineNotation')
            .attr('x',x[timelineStep*i])
            .attr('y',16)
            .text(text)
            .style('fill','black')
            .style('text-anchor','middle')
            .style('font',fontSize.toString()+'px Time New Roman');
        d3.select('#interface')
            .append('line')
            .attr('class','verticalLines')
            .attr('x1',x[timelineStep*i])
            .attr('y1',0)
            .attr('x2',x[timelineStep*i])
            .attr('y2',height-20-10-10)
            .style('stroke','rgba(0,0,0,0.4)')
            .style('stroke-width',0.5)
            .style('stroke-dasharray','4');
    }
    // draw area charts of the base line and difference charts
    d3.selectAll('.lineChart').remove();
    d3.selectAll('.netScatterPlot').remove();
    d3.select('#interface')
        .append('path')
        .attr('class','lineChart')
        .datum(score[0])
        .attr('fill','none')
        .attr('stroke','black')
        .attr('stroke-width',2)
        .attr('d',d3.line()
            .curve(d3.curveNatural)
            .x((e,t)=>x[t+ds[0]])
            .y((e)=> chartHeight*(1-e)));
    for (let r = 1; r < ds.length; r++) {
        d3.select('#interface')
            .append('clipPath')
            .attr('id','above'+r.toString())
            .attr('class','lineChart')
            .datum(score[r])
            .append('path')
            .attr('d',d3.area()
                .curve(d3.curveNatural)
                .x((e,t)=>x[t+ds[r]])
                .y0(chartHeight+chartHeight*r)
                .y1((e)=> chartHeight*r+chartHeight*(1-e)));
        d3.select('#interface')
            .append('clipPath')
            .attr('id','below'+r.toString())
            .attr('class','lineChart')
            .datum(score[r])
            .append('path')
            .attr('d',d3.area()
                .curve(d3.curveNatural)
                .x((e,t)=>x[t+ds[r]])
                .y0(chartHeight*r)
                .y1((e)=>chartHeight*r+chartHeight*(1-e)));
        d3.select('#interface')
            .append('path')
            .attr('class','lineChart')
            .datum(score[0])
            .attr('clip-path','url(#above'+r.toString()+')')
            .attr('fill','#ff7f00')
            .attr('d',d3.area()
                .curve(d3.curveNatural)
                .x((e,t)=>x[t+ds[0]])
                .y0(chartHeight*r)
                .y1((e)=>chartHeight*r+chartHeight*(1-e)))
        d3.select('#interface')
            .append('path')
            .attr('class','lineChart')
            .datum(score[0])
            .attr('clip-path','url(#below'+r.toString()+')')
            .attr('fill','#1f78b4')
            .attr('d',d3.area()
                .curve(d3.curveNatural)
                .x((e,t)=>x[t+ds[0]])
                .y0(chartHeight+chartHeight*r)
                .y1((e)=>chartHeight*r+chartHeight*(1-e)))
        d3.select('#interface')
            .append('path')
            .attr('class','lineChart')
            .datum(score[0])
            .attr('fill','none')
            .attr('stroke','black')
            .attr('stroke-width',0.5)
            .attr('d',d3.line()
                .curve(d3.curveNatural)
                .x((e,t)=>x[t+ds[0]])
                .y((e)=>chartHeight*r+chartHeight*(1-e)));
    }
    // draw net scatter when lensing
    if (lensing) {
        let cR = (Math.floor(mouse.y/chartHeight) < ds.length) ? Math.floor(mouse.y/chartHeight) : ds.length-1;
        if (cT >= ds[cR]) {
            let tS = (sT >= ds[cR]) ? sT : ds[cR];
            for (let t = tS; t <= eT; t++) {
                let x1 = x[t] - 0.5*large + pPadding;
                let y1 = chartHeight*cR+chartHeight*(1-score[cR][t-ds[cR]]);
                let text1 = tKey[t-ds[cR]]+'-'+tKey[t];
                let vectors1 = buildPlot(t,ds[cR]);
                let mySize = (large-2*pPadding > 80) ? 80 : large-2*pPadding;
                drawNetScatter('interface','netScatterPlot','plot-0',x1,y1,mySize,text1,vectors1,false,false);
            }
        }
    }
    // create a layer for interaction
    d3.select('#layerInteraction').remove();
    d3.select('#interface')
        .append('rect')
        .attr('id','layerInteraction')
        .attr('width',timeLineWidth)
        .attr('height',height-20-10-10+50)             // height of #interface
        .attr('x',timelinePadding)
        .attr('y',0)
        .attr('fill','rgba(200,200,200,0)')
        .attr('stroke','none');
    mouseMove('layerInteraction');
    mouseOut('layerInteraction');
    mouseClick('layerInteraction');
}

function noPlot () {
    d3.select('#plotsDiv')
        .attr('width',0)
        .attr('height',0)
        .style('background','rgba(255,255,255,0)')
        .style('border','1px solid rgba(255,255,255,0)');
    d3.select('#plots')
        .attr('width',0)
        .attr('height',0)
        .attr('viewBox',[0,0,0,0]);
    d3.selectAll('.rPlots').remove();
}

function drawNetScatter (svgID,plotClass,plotID,x,y,size,notation,vectors,highlight,interaction) {
    d3.selectAll('.notation').remove();
    let strokeWidth = highlight ? 2 : 1;
    // draw rectangle
    d3.select('#'+svgID)
        .append('rect')
        .attr('class',plotClass)
        .attr('width',size)
        .attr('height',size)
        .attr('x',x)
        .attr('y',y)
        .style('fill','white')
        .style('stroke','black')
        .style('stroke-width',strokeWidth);
    // draw notation
    let textSize = 2*size/(notation.length+1);
    if (textSize > 18) textSize = 18;
    d3.select('#'+svgID)
        .append('text')
        .attr('class',plotClass)
        .attr('x',x)
        .attr('y',y-3)
        .attr('fill','black')
        .style('font',textSize.toString()+'px Time New Roman')
        .text(notation);
    if (highlight) {
        let xVar = selectedPlot.split(' vs.')[0];
        let yVar = selectedPlot.split(' vs.')[1];
        d3.select('#'+svgID)
            .append('text')
            .attr('class','notation')
            .attr('x',x)
            .attr('y',y+size+15)
            .attr('fill','black')
            .style('font',(textSize-3).toString()+'px Time New Roman')
            .text(xVar);
        d3.select('#'+svgID)
            .append('text')
            .attr('class','notation')
            .attr('x',0)
            .attr('y',0)
            .attr('transform','translate('+(x-3).toString()+','+(y+size).toString()+') rotate(-90)')
            .attr('fill','black')
            .style('font',(textSize-3).toString()+'px Time New Roman')
            .text(yVar);
    }
    // draw legend
    if (selectedData === 'HPCC') {
        for (let i = 1; i < 10; i++) {
            // horizontal axis
            d3.select('#'+svgID)
                .append('line')
                .attr('class',plotClass)
                .attr('x1',x+size*0.1*i)
                .attr('y1',y+size-5)
                .attr('x2',x+size*0.1*i)
                .attr('y2',y+size)
                .style('stroke','black')
                .style('fill','none');
            // vertical axis
            d3.select('#'+svgID)
                .append('line')
                .attr('class',plotClass)
                .attr('x1',x)
                .attr('y1',y+size*0.1*i)
                .attr('x2',x+5)
                .attr('y2',y+size*0.1*i)
                .style('stroke','black')
                .style('fill','none');
        }
    }
    // draw vectors
    for (let v = 0; v < vectors.length; v++) {
        let x0 = x + 5 + (size-10)*vectors[v][0];
        let y0 = y + 5 + (size-10)*(1-vectors[v][1]);
        let x1 = x + 5 + (size-10)*vectors[v][2];
        let y1 = y + 5 + (size-10)*(1-vectors[v][3]);
        let L = Math.sqrt((x1-x0)*(x1-x0)+(y1-y0)*(y1-y0));
        // // draw points for paper
        // d3.select('#'+svgID)
        //     .append('circle')
        //     .attr('class',plotClass)
        //     .attr('cx',x0)
        //     .attr('cy',y0)
        //     .attr('r',3)
        //     .attr('stroke','none')
        //     .attr('fill','blue');
        // d3.select('#'+svgID)
        //     .append('circle')
        //     .attr('class',plotClass)
        //     .attr('cx',x1)
        //     .attr('cy',y1)
        //     .attr('r',3)
        //     .attr('stroke','none')
        //     .attr('fill','red');
        // draw vectors
        if (x0 !== x1 || y0 !== y1) {
            let d = L/4 < 5 ? L/4 : 5;      // size of triangle in the arrow
            let dd = d/Math.sqrt(3);
            let vID = plotID+'-vector-'+vectors[v][4].toString();
            let hID = vID+'-header';
            let myURL = 'url(#'+hID+')';
            // define vector header
            d3.select('#'+svgID)
                .append('defs')
                .attr('class',plotClass)
                .append('marker')
                .attr('class',plotClass)
                .attr('id',hID)
                .attr('viewBox', [0, 0, d, 2*dd])
                .attr('refX', d)
                .attr('refY', dd)
                .attr('markerWidth', d)
                .attr('markerHeight', d)
                .attr('orient', 'auto-start-reverse')
                .append('path')
                .attr('class',plotClass)
                .attr('d', d3.line()([[0,0],[0,2*dd],[d,dd]]))
                .attr('stroke', 'none')
                .attr('fill','rgba(0,0,0,0.6)');
            // draw line
            d3.select('#'+svgID)
                .append('path')
                .attr('class',plotClass)
                .attr('id',vID)
                .attr('d',d3.line()([[x0,y0],[x1,y1]]))
                .attr('stroke','rgba(0,0,0,0.6)')
                .attr('marker-end',myURL)
                .attr('fill','none');
            if (interaction) {
                mouseOver(vID);
                mouseOver(hID);
            }
        }
    }
}

function drawRadarChart (svgID,eClass,points,radius) {
    d3.select('#'+svgID)
        .append('rect')
        .attr('class',eClass)
        .attr('x',45)
        .attr('y',435)
        .attr('width',300)
        .attr('height',300)
        .style('fill','white');
    for (let i = 1; i <= 5; i++) {
        d3.select('#'+svgID)
            .append('circle')
            .attr('class',eClass)
            .attr('cx',195)
            .attr('cy',585)
            .attr('r',10+i*0.2*radius)
            .style('fill','rgba(200,200,200,0.1)')
            .style('stroke','rgba(200,200,200,0.6)')
            .style('stroke-width',0.5);
    }
    for (let i = 0; i < points.length; i++) {
        d3.select('#'+svgID)
            .append('line')
            .attr('x1',195)
            .attr('y1',585)
            .attr('x2',195+Math.cos(i*2*Math.PI/mKey.length-Math.PI/2)*(10+radius))
            .attr('y2',585+Math.sin(i*2*Math.PI/mKey.length-Math.PI/2)*(10+radius))
            .style('stroke','rgba(200,200,200,0.6)')
            .style('stroke-width',0.5)
            .style('fill','none');
        let a = i*360/mKey.length;
        let x = 195+Math.cos(i*2*Math.PI/mKey.length-Math.PI/2)*(15+radius);
        let y = 585+Math.sin(i*2*Math.PI/mKey.length-Math.PI/2)*(15+radius);
        if (a > 90 && a < 270) {
            a = a - 180;
            x = 195+Math.cos(i*2*Math.PI/mKey.length-Math.PI/2)*(20+radius);
            y = 585+Math.sin(i*2*Math.PI/mKey.length-Math.PI/2)*(20+radius);
        }
        d3.select('#'+svgID)
            .append('text')
            .attr('x',0)
            .attr('y',0)
            .style('font','12px Times New Roman')
            .attr('transform','translate('+x.toString()+','+y.toString()+') rotate('+a.toString()+')')
            .style('text-anchor','middle')
            .text(mKey[i]);
    }
    d3.select('#'+svgID)
        .append('path')
        .attr('class',eClass)
        .datum(points)
        .attr('fill',"rgba(200,0,0,0.3)")
        .attr('d',d3.areaRadial()
            .curve(d3.curveCardinalClosed)
            .startAngle((e,i)=>i*2*Math.PI/mKey.length)
            .innerRadius(0)
            .outerRadius(e=>10+e*radius))
        .attr('transform','translate(195,585)');
}

function highlightPlot () {
    d3.selectAll('.rPlots').remove();
    // analyze the position of the mouse
    let hl = checkHighlight();
    let check = hl[0];
    let index = hl[1];
    let cR = (Math.floor(mouse.y/chartHeight) < ds.length) ? Math.floor(mouse.y/chartHeight) : ds.length-1;
    // draw highlight plot
    if (check) {
        d3.select('#plotsDiv')
            .attr('width',390)
            .attr('height',780)
            .style('background','rgba(204,204,204,0.8)')
            .style('border','1px solid rgba(0,0,0,0.1)');
        d3.select('#plots')
            .style('position','relative')
            .style('top',0)
            .style('left',0)
            .style('background','rgba(204,204,204,0.8)')
            .attr('width',390)
            .attr('height',780)
            .attr('viewBox',[0,0,390,780]);
        let text = tKey[index-ds[cR]]+'-'+tKey[index];
        let vectors = buildPlot(index,ds[cR]);
        drawNetScatter('plots','rPlots','rPlot',20,20,350,text,vectors,true,true);
        let metrics = [];
        metrics[0] = outlyingVector(vectors);
        metrics[1] = outlyingLength(vectors);
        metrics[2] = outlyingAngle(vectors);
        metrics[3] = correlation(vectors);
        metrics[4] = entropy(vectors);
        metrics[5] = intersection(vectors);
        metrics[6] = translation(vectors);
        metrics[7] = homogeneous(vectors);
        drawRadarChart('plots','rPlots',metrics,100);
    } else {
        noPlot();
    }
}

function highlightVector (svgID,itsClass,x,y,text) {
    d3.select('#'+svgID)
        .append('text')
        .attr('x',x)
        .attr('y',y-5)
        .attr('class',itsClass)
        .style('fill','red')
        .style('font','10px Time New Roman')
        .style('text-anchor','middle')
        .text(text);
}