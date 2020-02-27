class DesignHTML {
    constructor (ID_name,quantity) {
        this.name = ID_name;
        this.quantity = quantity;
    }

    // draw plotly for experiment
    designPlotlyExperiment () {
        for (let i = 0; i < this.quantity; i++) {
            // create parent div
            let parentID = this.name+i.toString();
            d3.select('body')
                .append('div')
                .attr('id',parentID)
                .attr('class','row');
            // create first column
            for (let j = 0; j < 3; j++) {
                let columnID = parentID+'_'+j.toString();
                d3.select('#'+parentID)
                    .append('div')
                    .attr('id',columnID)
                    .attr('class','column');
            }
        }
    }
}