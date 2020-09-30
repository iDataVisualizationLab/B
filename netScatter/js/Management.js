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
            // encode the plots
            EncodePlots.NetScatterPlot();
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

            // Management.Visualization();

            codeManager.isComputing = false;
            codeManager.needComputation = false;
            codeManager.needUpdate = true;
            d3.select('.cover').classed('hidden', true);
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
        let myWindow = controlVariable.displaySeries ? [2600,5600] : [2600,4600];
        DesignApplication.CreateCanvas('mainCanvasHolder','HMLCanvas','myCanvas',myWindow[0],myWindow[1],'#ffffff');
        // Draw plots
        if (controlVariable.metricSeries) {
            DesignApplication.drawMetricSeries('HMLCanvas');
        } else {
            let headerInfo = {
                font: 'Arial',
                size: 30,
                position: {
                    high: controlVariable.displaySeries ? [100,600] : [100,100],
                    median: controlVariable.displaySeries ? [500,600] : [500,100],
                    low: controlVariable.displaySeries ? [900,600] : [900,100],
                }
            };
            let plotInfo = {
                // size: [150,150],
                size: [300,300],
                position: controlVariable.displaySeries ? [100,700] : [100,200],
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
    static ComputeMetrics() {
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
            e.metrics['Pos correlation'] = ComputeMetrics.PositiveCorrelation(e.quantities.angle);
            e.metrics['Neg correlation'] = ComputeMetrics.NegativeCorrelation(e.quantities.angle);
            e.outliers.length = ComputeMetrics.Outlying(e.quantities.edgeLength,true).outliers;
            e.outliers.angle = ComputeMetrics.Outlying(e.quantities.angle,false).outliers;
            e.metrics['Intersection'] = ComputeMetrics.Intersection(e.arrows);
            e.metrics['Translation'] = ComputeMetrics.Translation(e.arrows,e.points);
            e.metrics['Entropy'] = ComputeMetrics.Complexity(e.quantities.angle);
        });
    }

    // cluster and draw
    static ClusterAndDraw() {
        initClusterObj();
        let kMeanGroup = $('#knum').val() || 6;
        let kMeanIterations = $('#kiteration').val() || 1;
        recalculateCluster( {clusterMethod: 'kmean',bin:{k:kMeanGroup,iterations:kMeanIterations}},function(){
            clickArr = [];
            plotPosition = [];
            reCalculateTsne();
            Management.Visualization();
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
                    'Skewed length': 0,
                    'Skewed angle': 0,
                    // 'IQR': 0,
                    'Outlying length': 0,
                    'Outlying angle': 0,
                    'Pos correlation': 0,
                    'Neg correlation': 0,
                    'Intersection': 0,
                    'Translation': 0,
                    'Entropy': 0,
                },
                outliers: {
                    length: [],
                    angle: [],
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