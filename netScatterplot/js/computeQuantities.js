class ComputeQuantities {
    constructor() {
    }

    // edge length computation
    // plotData: array of data point in a plot
    // data point is an object of {name: point name, x0: at t0, y0: at t0, x1: at t1, y1: at t1}
    static EdgeLength (plotData) {
        let edgeLength = [];
        for (let i = 0; i < plotData.length; i++) {
            edgeLength[i] = {};
            edgeLength[i].name = plotData[i].name;
            let dX = plotData[i].x1 - plotData[i].x0;
            let dY = plotData[i].y1 - plotData[i].y0;
            edgeLength[i].value = Math.sqrt(Math.pow(dX,2)+Math.pow(dY,2));
        }
        return edgeLength;
    }

    // angle computation
    // plotData: array of data point in a plot
    // data point is an object of {name: point name, x0: at t0, y0: at t0, x1: at t1, y1: at t1}
    static Angle (plotData) {
        let angle = [];
        for (let i = 0; i < plotData.length; i++) {
            angle[i] = {};
            angle[i].name = plotData[i].name;
            let dX = plotData[i].x1 - plotData[i].x0;
            let dY = plotData[i].y1 - plotData[i].y0;
            if (dX > 0) {
                angle[i].value = Math.atan(dY/dX);
            } else if (dX === 0) {
                angle[i].value = (dY > 0) ? Math.atan(Infinity) : Math.atan(-Infinity);
            } else if (dX < 0) {
                angle[i].value = (dY > 0) ? Math.atan(dY/dX) + Math.PI : Math.atan(dY/dX) - Math.PI;
            }
        }
        return angle;
    }

}