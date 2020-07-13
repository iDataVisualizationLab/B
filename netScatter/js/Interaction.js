class Interaction {
   constructor() {
   }

    // Filtering
    // return index/code of plots that satisfy netSP.filter
    // plotData: array of plots whose element is a plot and contains metrics information
    // filters: objects of all metrics, each element is array [lowerLimit,upperLimit]
    static Filtering (plotData,filters) {
        let filterPlots = [];
        plotData.forEach((e,i)=>{
            if (e.data.length > 0) {
                let check = true;
                for (let m in filters) {
                    let lowerLimit = filters[m][0];
                    let upperLimit = filters[m][1];
                    check = check && e.metrics[m] >= lowerLimit && e.metrics[m] <= upperLimit;
                }
                if (check) filterPlots.push(i);
            }
        });
        return filterPlots;
    }

    // Sorting
    // sort chosen metric after filtering in descending order
    // plotData: array of plots whose element is a plot and contains metrics information
    // filteredData: array of index of filtered plots
    static Sorting(plotData,filteredData,chosenMetric) {
       let array = filteredData.map(e=>[e,plotData[e].metrics[chosenMetric]]);
       array.sort((a,b)=>b[1]-a[1]);
       return array.map(e => e[0]);
    }

    // Drop down menu for Interaction tab
    static dropDownMenuForInteraction() {
        // add variables list

        d3.selectAll('.variable1').remove();
        d3.selectAll('.variable2').remove();
        d3.selectAll('.time').remove();

        netSP.variableInfo.forEach(d=>{
            d3.select('#variable1').append('option').attr('class','variable1').attr('value',d[1]).text(d[1]);
            d3.select('#variable2').append('option').attr('class','variable2').attr('value',d[1]).text(d[1]);
        });
        netSP.timeInfo.forEach((d,i)=>{
            if (i) d3.select('#time').append('option').attr('class','time').attr('value',d).text(d);
        });
        // if (visualizingOption === 'LMH') {
        //     d3.select('#dataInstances').attr('disabled','');
        //     d3.select('#variable').attr('disabled','');
        // }
        // if (visualizingOption === 'tSNE'||visualizingOption === 'PCA'||visualizingOption === 'UMAP') {
        //     d3.select('#dataInstances').attr('disabled',null);
        //     d3.select('#variable').attr('disabled',null);
        // }
    }

    // MOUSE OVER FUNCTION
    static mouseOverFunction() {
        let mouse = d3.mouse(this);
        let data = [], myIndex;
        switch (controlVariable.visualizing) {
            case 'PCA':
                data = pcaTS.solution()
                break;
            case 'tSNE':
                data = tsneTS.solution();
                break;
            case 'UMAP':
                data = umapTS.solution();
                break;
        }
        if(data.length > 0) myIndex = Interaction.MouseOverPoint(mouse,data);
        controlVariable.mouseClick.index.forEach((e,i)=>{
            let qCheck1 = mouse[0] >= designVariable.dr.rd.quitSign.position[0] && mouse[0] <= designVariable.dr.rd.quitSign.position[0]+designVariable.dr.rd.quitSign.size[0];
            let qCheck2 = mouse[1] >= designVariable.dr.rd.quitSign.position[1]+i*130 && mouse[1] <= designVariable.dr.rd.quitSign.position[1]+i*130+designVariable.dr.rd.quitSign.size[1];
            designVariable.dr.rd.quitSign.mouseOver[i] = qCheck1 && qCheck2;
        });
        if (myIndex !== -1) {
            controlVariable.mouseOver.check = true;
            controlVariable.mouseOver.index = myIndex;
        } else {
            controlVariable.mouseOver.check = false;
            controlVariable.mouseOver.index = -1;
        }
        switch (controlVariable.visualizing) {
            case 'PCA':
                pcaTS.renderPCA();
                break;
            case 'tSNE':
                tsneTS.renderTSNE();
                break;
            case 'UMAP':
                umapTS.renderUMAP();
                break;
        }
    }

    // Mouse over point
    static MouseOverPoint(mousePosition,data) {
       // transform from screen space to data space
       let xData = xscale.invert(mousePosition[0]);
       let yData = yscale.invert(mousePosition[1]);
       // find the closest point in the data space
        let myQuadTree = d3.quadtree().addAll(data);
        let xFindingRange = xscale.invert(3)-xscale.invert(0);
        let yFindingRange = yscale.invert(3)-yscale.invert(0);
        let findingRange = Math.sqrt(xFindingRange*xFindingRange+yFindingRange*yFindingRange);
        let closest = myQuadTree.find(xData,yData,findingRange);
        if (closest) return data.findIndex(e=>e[0]===closest[0]&&e[1]===closest[1]);
        else return -1;
    }

    // clicked function
    static MouseClickFunction() {
        $('#dataInstances').val('noOption').selected = true;
        $('#variable1').val('noOption').selected = true;
        $('#variable2').val('noOption').selected = true;
        $('#time').val('noOption').selected = true;
        controlVariable.interaction.variable1 = 'noOption';
        controlVariable.interaction.variable2 = 'noOption';
        controlVariable.interaction.time = 'noOption';
        controlVariable.interaction.instance = 'noOption';
        let mouse = d3.mouse(this);
        let data = [], index;
        switch (controlVariable.visualizing) {
            case 'PCA':
                data = pcaTS.solution()
                break;
            case 'tSNE':
                data = tsneTS.solution();
                break;
            case 'UMAP':
                data = umapTS.solution();
                break;
        }
        let sign = false;
        controlVariable.mouseClick.index.forEach((e,i)=>{
            let qCheck1 = mouse[0] >= designVariable.dr.rd.quitSign.position[0] && mouse[0] <= designVariable.dr.rd.quitSign.position[0]+designVariable.dr.rd.quitSign.size[0];
            let qCheck2 = mouse[1] >= designVariable.dr.rd.quitSign.position[1]+i*130 && mouse[1] <= designVariable.dr.rd.quitSign.position[1]+i*130+designVariable.dr.rd.quitSign.size[1];
            designVariable.dr.rd.quitSign.mouseClick[i] = qCheck1 && qCheck2;
            if (qCheck1 && qCheck2) sign = true;
        });
        if (sign && controlVariable.mouseClick.index.length > 0) {
            let myIndex = designVariable.dr.rd.quitSign.mouseClick.findIndex(e=>e===true);
            controlVariable.mouseClick.index.splice(controlVariable.mouseClick.index.length - 1 - myIndex,1);
        } else {
            if (data.length > 0) index = Interaction.MouseOverPoint(mouse, data);
            if (index !== -1) {
                let check = controlVariable.mouseClick.index.findIndex(e => e === index) === -1;
                if (check) {
                    if (controlVariable.mouseClick.index.length > maxPerPage) {
                        controlVariable.mouseClick.index.splice(0, 1);
                    }
                    controlVariable.mouseClick.index.push(index);
                }
            }
        }
        switch (controlVariable.visualizing) {
            case 'PCA':
                pcaTS.renderPCA();
                break;
            case 'tSNE':
                tsneTS.renderTSNE();
                break;
            case 'UMAP':
                umapTS.renderUMAP();
                break;
        }
    }


}