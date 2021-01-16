class Management {
    constructor() {
    }

    // Load and compute
    // run before any interactive activities
    static LoadAndComputation(dataFile,instanceFile,variableFile,type) {
        codeManager.isComputing = true;
        Promise.all([
            d3.csv(dataFile),
            d3.csv(instanceFile),
            d3.csv(variableFile),
        ]).then(files=>{
            // reset variables
            netSP.plots.length = 0;
            netSP.encode.length = 0;
            // store data in format: instance -> variable -> time series
            netSP.data = ReadFile.IVTFormat(files,type);
            // add information to interaction tab
            Interaction.dropDownMenuForInteraction();
            // get percentages
            // DataProcessing.Percentages(data);
            // get z-score
            // DataProcessing.GetZScore(data);
            // get relative change
            // DataProcessing.GetRelativeChange(data);
            // Normalize the net scatter plot
            DataProcessing.NormalizationNetScatterPlot(netSP.data);
            // DataProcessing.Z_Normalization2D(netSP.data);

            // // compute max score for paper
            // for (let i = 1; i < netSP.timeInfo.length; i++) {
            //     let t1 = 0;
            //     let t2 = t1 + i;
            //     netSP.step = i;
            //
            //     paper.data[i-1] = {
            //         'Outlying vector': -Infinity,
            //         'Outlying length': -Infinity,
            //         'Outlying angle': -Infinity,
            //         'Correlation': -Infinity,
            //         'Entropy': -Infinity,
            //         'Intersection': -Infinity,
            //         'Translation': -Infinity,
            //         'Homogeneous': -Infinity,
            //     };
            //
            //     while (t2 < netSP.timeInfo.length) {
            //         // encode the plots
            //         EncodePlots.NetScatterPlot();   // start here to record data
            //         // attributes for every plot
            //         Management.FormPlots();
            //         // store data point to every net scatter plot
            //         DataProcessing.NetScatterPlot(netSP.data);
            //         // Store bins to NetSP.plot[index].arrows and points
            //         DataProcessing.AdaptiveBinning();
            //         // Compute quantities and metrics for every plot
            //         Management.ComputeMetrics(i);
            //
            //         t1 += 1;
            //         t2 = t1 + i;
            //     }
            // }
            //
            // // save max score to file
            // let csv = JSON.stringify(paper.data);
            //
            // let hiddenElement = document.createElement('a');
            // hiddenElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
            // hiddenElement.target = '_blank';
            // hiddenElement.download = 'employment_result.json';
            // hiddenElement.click();

            // encode the plots
            EncodePlots.NetScatterPlot();   // start here to record data
            // attributes for every plot
            Management.FormPlots();
            // store data point to every net scatter plot
            DataProcessing.NetScatterPlot(netSP.data);
            // Store bins to NetSP.plot[index].arrows and points
            DataProcessing.AdaptiveBinning();
            // Compute quantities and metrics for every plot
            Management.ComputeMetrics();

            // clustering and draw
            Management.ClusterAndDraw();

            Management.Visualization();

            codeManager.isComputing = false;
            codeManager.needComputation = false;
            codeManager.needUpdate = true;
            d3.select('.cover').classed('hidden', true);

            // print running time
            console.log('running time of normalization: '+(timeMeasure[1]-timeMeasure[0]).toString()+'ms');
            console.log('running time of binning: '+(timeMeasure[3]-timeMeasure[2]).toString()+'ms');
            console.log('running time of computing metrics: '+(timeMeasure[5]-timeMeasure[4]).toString()+'ms');
        });
    }

    // Visualization
    static Visualization() {
        // Filtering
        let filteredPlots = Interaction.Filtering(netSP.plots,netSP.filter);
        // Sorting
        let sortedPlots = Interaction.Sorting(netSP.plots,filteredPlots,controlVariable.selectedMetric);
        // Pick plots to display
        let displayPlots = {
            high: [],
            median: [],
            low: [],
        }
        let nDisplay = 10;
        if (sortedPlots.length >= nDisplay) {
            for (let p = 0; p < nDisplay; p++) {
                displayPlots.high.push(sortedPlots[p]);
                displayPlots.median.push(sortedPlots[Math.floor(sortedPlots.length * 0.5) - Math.floor(nDisplay*0.5) + p]);
                displayPlots.low.push(sortedPlots[sortedPlots.length - nDisplay + p]);
            }
        }
        // Create canvas
        // let myWindow = controlVariable.displaySeries ? [1300,2800] : [1300,2300];
        // let myWindow = controlVariable.displaySeries ? [2600,5600] : [2600,4600];
        let myWindow = [2600,4600];
        DesignApplication.CreateCanvas('mainCanvasHolder','HMLCanvas','myCanvas',myWindow[0],myWindow[1],'#ffffff');
        // Draw plots
        if (controlVariable.metricSeries) {
            DesignApplication.drawMetricSeries('HMLCanvas');
        } else {
            let headerInfo = {
                font: 'Arial',
                size: 30,
                position: {
                    // high: controlVariable.displaySeries ? [200,600] : [200,100],
                    high: [200,100],
                    // median: controlVariable.displaySeries ? [900,600] : [900,100],
                    median: [900,100],
                    // low: controlVariable.displaySeries ? [1600,600] : [1600,100],
                    low: [1600,100],
                }
            };
            let plotInfo = {
                // size: [150,150],
                size: [300,300],
                // position: controlVariable.displaySeries ? [100,700] : [100,200],
                position: [100,200],
                notations: {
                    font: 'Arial',
                    size: 13,
                    color: '#000000',
                }
            }
            let blankSize = [50,50];
            DesignApplication.HMLView('HMLCanvas',headerInfo,plotInfo,blankSize,displayPlots);
        }
    }

    // draw time series of metrics
    static drawMetricSeries() {
        if (controlVariable.metricSeries) {
            d3.select('#metricSeries').attr('disabled',null);
            d3.select('#netScatterPlot').attr('disabled',true);
        } else {
            d3.select('#metricSeries').attr('disabled',true);
            d3.select('#netScatterPlot').attr('disabled',null);
        }
        controlVariable.metricSeries = !controlVariable.metricSeries;
        Management.Visualization();
    }

    // computing metrics
    static ComputeMetrics(diff) {
        // measure time
        timeMeasure[4] = performance.now();

        netSP.plots.forEach((e,i)=>{
            e.quantities.edgeLength = ComputeQuantities.EdgeLengthBin(e.arrows);
            e.quantities.angle = ComputeQuantities.AngleBin(e.arrows);
            // e.metrics['Mean length'] = ComputeMetrics.MeanValue(e.quantities.edgeLength);
            // e.metrics['q90'] = ComputeMetrics.ComputeQuartile(e.quantities.edgeLength,0.9);
            // e.metrics['Skewed length'] = ComputeMetrics.Skewed(e.quantities.edgeLength);
            // e.metrics['Skewed angle'] = ComputeMetrics.Skewed(e.quantities.angle);
            // e.metrics['Std length'] = ComputeMetrics.StandardDeviation(e.quantities.edgeLength);
            // e.metrics['IQR'] = ComputeMetrics.ComputeIQR(e.quantities.edgeLength);
            e.metrics['Outlying length'] = ComputeMetrics.Outlying(e.quantities.edgeLength,true).score;
            e.metrics['Outlying angle'] = ComputeMetrics.Outlying(e.quantities.angle,false).score;
            let myO = ComputeMetrics.OutlyingPattern(e.arrows);
            e.metrics['Outlying vector'] = myO.score;
            // e.metrics['Pos correlation'] = ComputeMetrics.PositiveCorrelation(e.quantities.angle);
            // e.metrics['Neg correlation'] = ComputeMetrics.NegativeCorrelation(e.quantities.angle);
            e.metrics['Correlation'] = ComputeMetrics.Correlation(e.quantities.angle);
            e.outliers.length = ComputeMetrics.Outlying(e.quantities.edgeLength,true).outliers;
            e.outliers.angle = ComputeMetrics.Outlying(e.quantities.angle,false).outliers;
            e.outliers.vector = myO.outliers;
            e.metrics['Intersection'] = ComputeMetrics.Intersection(e.arrows);
            let myTranslation = ComputeMetrics.Translation(e.arrows,e.points);
            e.metrics['Translation'] = myTranslation.score;
            e.outliers.position = myTranslation.outliers;
            e.metrics['Entropy'] = ComputeMetrics.Entropy(e.quantities.angle);
            e.metrics['Homogeneous'] = ComputeMetrics.Similarity(e.arrows);

            // for paper
            // paper.data[diff-1]['Outlying vector'] = (e.metrics['Outlying vector'] && e.metrics['Outlying vector'] > paper.data[diff-1]['Outlying vector']) ? e.metrics['Outlying vector'] : paper.data[diff-1]['Outlying vector'];
            // paper.data[diff-1]['Outlying length'] = (e.metrics['Outlying length'] && e.metrics['Outlying length'] > paper.data[diff-1]['Outlying length']) ? e.metrics['Outlying length'] : paper.data[diff-1]['Outlying length'];
            // paper.data[diff-1]['Outlying angle'] = (e.metrics['Outlying angle'] && e.metrics['Outlying angle'] > paper.data[diff-1]['Outlying angle']) ? e.metrics['Outlying angle'] : paper.data[diff-1]['Outlying angle'];
            // paper.data[diff-1]['Correlation'] = (e.metrics['Correlation'] && e.metrics['Correlation'] > paper.data[diff-1]['Correlation']) ? e.metrics['Correlation'] : paper.data[diff-1]['Correlation'];
            // paper.data[diff-1]['Entropy'] = (e.metrics['Entropy'] && e.metrics['Entropy'] > paper.data[diff-1]['Entropy']) ? e.metrics['Entropy'] : paper.data[diff-1]['Entropy'];
            // paper.data[diff-1]['Intersection'] = (e.metrics['Intersection'] && e.metrics['Intersection'] > paper.data[diff-1]['Intersection']) ? e.metrics['Intersection'] : paper.data[diff-1]['Intersection'];
            // paper.data[diff-1]['Translation'] = (e.metrics['Translation'] && e.metrics['Translation'] > paper.data[diff-1]['Translation']) ? e.metrics['Translation'] : paper.data[diff-1]['Translation'];
            // paper.data[diff-1]['Homogeneous'] = (e.metrics['Homogeneous'] && e.metrics['Homogeneous'] > paper.data[diff-1]['Homogeneous']) ? e.metrics['Homogeneous'] : paper.data[diff-1]['Homogeneous'];

        });

        // measure time
        timeMeasure[5] = performance.now();
    }

    // cluster and draw
    static ClusterAndDraw() {

        initClusterObj();
        let kMeanGroup = $('#knum').val() || 6;
        let kMeanIterations = $('#kiteration').val() || 1;
        recalculateCluster( {clusterMethod: 'kmean',bin:{k:kMeanGroup,iterations:kMeanIterations}},function(){
            // time measure
            timeMeasure[6] = performance.now();

            clickArr = [];
            plotPosition = [];
            reCalculateTsne();

            // time measure
            timeMeasure[7] = performance.now();

            // rendering
            Management.Visualization();

            // print clustering time
            console.log('running time of clustering: '+(timeMeasure[7]-timeMeasure[6]).toString()+'ms');
        });
        d3.select('.cover').classed('hidden', true);
    }

    // form plots in netSP
    static FormPlots() {
        netSP.plots.length = 0;
        for (let p = 0; p < netSP.encode.length; p++) {
            netSP.plots[p] = {
                quantities: {
                    edgeLength: [],
                    angle: [],
                },
                metrics: {
                    // 'q90': 0,
                    // 'Skewed length': 0,
                    // 'Skewed angle': 0,
                    // 'IQR': 0,
                    'Outlying vector':0,
                    'Outlying length': 0,
                    'Outlying angle': 0,
                    'Correlation': 0,
                    // 'Neg correlation': 0,
                    'Entropy': 0,
                    'Intersection': 0,
                    'Translation': 0,
                    'Homogeneous': 0,
                },
                outliers: {
                    length: [],
                    angle: [],
                    position: [],
                    vector: [],
                },
                outliersList: {
                    length: [],
                    angle: [],
                },
                data: [],
                arrows: [],
                points: [],
            }
        }
    }
}