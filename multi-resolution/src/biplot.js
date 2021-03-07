// input: matrix of input data
// each sample: a row
// each feature: a column
// structure: 2D array: [[sample1],[sample2],...]
// source: https://mljs.github.io/pca/#pca
// note: no lack of data
// x-axis: PC1, y-axis: PC2
function biPlot (input,svgID,vectors,scale,check) {
    let N = input.length;           // #samples
    let F = input[0].length;        // #features
    let pca = new ML.PCA(input,{scale:true});
    let scores = pca.predict(input,{scale: true}).data;     // [[sample1: PC1, PC2, ...], [sample2: PC1, PC2, ...], ...]
    let loading = pca.getLoadings().data;                   // [[pc1],[pc2],...] or sample -> PC
    let eigenValues = pca.getEigenvalues();
    // draw vectors of features in biPlot
    let features = mKey.filter((e,i)=>check[i]);
    for (let i = 0; i < F; i++) {
        let x = 510 + 100*loading[0][i]*Math.sqrt(eigenValues[0])*scale;
        let y = 510 - 100*loading[1][i]*Math.sqrt(eigenValues[1])*scale;
        d3.select('#'+svgID)
            .append('line')
            .attr('class','myBiPlot')
            .attr('x1',510)
            .attr('y1',510)
            .attr('x2',x)
            .attr('y2',y)
            .style('fill','none')
            .style('stroke',myColor[i])
            .style('stroke-width',1);
        d3.select('#'+svgID)
            .append('rect')
            .attr('class','myBiPlot')
            .attr('x',x-3)
            .attr('y',y-3)
            .attr('width',6)
            .attr('height',6)
            .style('fill',myColor[i])
            .style('stroke','none');
        d3.select('#'+svgID)
            .append('text')
            .attr('class','myBiPlot')
            .attr('x',x >= 0 ? x + 5 : x - 5)
            .attr('y',y >= 0 ? y + 5 : y - 5)
            .style('fill',myColor[i])
            .style('stroke','none')
            .style('font','12px Times New Roman')
            .text(features[i]);
    }
    // draw points in biPlot
    for (let i = 0; i < N; i++) {
        let x = 510 + 100*scores[i][0];
        let y = 510 - 100*scores[i][1];
        let options = {
            size: 50,
            x: x-25,
            y: y-25,
            rectFill: 'rgba(255,255,255,0.6)',
            rectStroke: 'rgba(0,0,0,0.6)',
            rectStrokeWidth: 1,
            notation: null,
            highlight: false,
            vectorColor: 'rgba(0,0,255,0.6)',
            interaction: false,
        }
        drawNetScatter(svgID,'myBiPlot','plot'+i,vectors[i],options);
        lensingBiPlot(svgID,'plot'+i,vectors[i],x,y,input[i],features);
    }
}

// draw biPlot
function drawBiPlot () {
    d3.selectAll('.myBiPlot').remove();
    d3.selectAll('.highlight-biplot').remove();
    let input = [];
    let vectors = [];
    let check = [];
    check[0] = document.getElementById('outlying-vector').checked;
    check[1] = document.getElementById('outlying-length').checked;
    check[2] = document.getElementById('outlying-angle').checked;
    check[3] = document.getElementById('Correlation').checked;
    check[4] = document.getElementById('Entropy').checked;
    check[5] = document.getElementById('Intersection').checked;
    check[6] = document.getElementById('Translation').checked;
    check[7] = document.getElementById('Homogeneous').checked;
    let count = 0;
    for (let i = 0; i < mKey.length; i++) {
        vectors[count] = generatePlots(i,'high');
        let m = [];
        if (check[0]) m.push(outlyingVector(vectors[count]));
        if (check[1]) m.push(outlyingLength(vectors[count]));
        if (check[2]) m.push(outlyingAngle(vectors[count]));
        if (check[3]) m.push(correlation(vectors[count]));
        if (check[4]) m.push(entropy(vectors[count]));
        if (check[5]) m.push(intersection(vectors[count]));
        if (check[6]) m.push(translation(vectors[count]));
        if (check[7]) m.push(homogeneous(vectors[count]));
        input[count] = m.map(e=>e);
        m.length = 0;
        vectors[count+1] = generatePlots(i,'low');
        if (check[0]) m.push(outlyingVector(vectors[count+1]));
        if (check[1]) m.push(outlyingLength(vectors[count+1]));
        if (check[2]) m.push(outlyingAngle(vectors[count+1]));
        if (check[3]) m.push(correlation(vectors[count+1]));
        if (check[4]) m.push(entropy(vectors[count+1]));
        if (check[5]) m.push(intersection(vectors[count+1]));
        if (check[6]) m.push(translation(vectors[count+1]));
        if (check[7]) m.push(homogeneous(vectors[count+1]));
        input[count+1] = m.map(e=>e);
        count += 2;
    }
    biPlot(input,'biPlot',vectors,3,check);
}

// lensing bi-plot
function lensingBiPlot (svgID,id,vectors,x,y,featuresScore,featuresText) {
    let plot = document.getElementById(id);
    let options = {
        size: 150,
        x: x-75,
        y: y-75,
        rectFill: 'rgba(255,255,255,1)',
        rectStroke: 'rgba(0,0,0,1)',
        rectStrokeWidth: 1,
        notation: null,
        highlight: false,
        vectorColor: 'rgba(0,0,255,1)',
        interaction: false,
    }
    let rOptions = {
        cx: x+150,
        cy: y,
        highlight: false,
        radius: 50,
        color: "rgba(200,0,0,0.3)",
        text: featuresText,
        font: '8px Times New Roman',
        backgroundFill: 'rgba(255,255,255,0.6)',
        backgroundStroke: 'rgba(0,0,0,0.1)',
        backgroundStrokeWidth: 0.5,
    }
    plot.addEventListener('mouseenter',event=>{
        drawNetScatter(svgID,'highlight-biplot','highlight-bi-plot',vectors,options);
        drawRadarChart(svgID,'highlight-biplot',featuresScore,rOptions);
        document.getElementById('highlight-bi-plot').addEventListener('mouseout',event=>{
            d3.selectAll('.highlight-biplot').remove();
        });
    });
}