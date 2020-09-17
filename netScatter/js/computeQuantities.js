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

    // edge length bin computation
    // binData: array of bin centers in a plot
    // format: [{start:[x,y],end:[x,y]},...]
    // return array of edges' length
    static EdgeLengthBin (binData) {
        let edgeLength = [];
        for (let i = 0; i < binData.length; i++) {
            let dX = binData[i].end[0] - binData[i].start[0];
            let dY = binData[i].end[1] - binData[i].start[1];
            edgeLength[i] = Math.sqrt(dX*dX+dY*dY);
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

    // angle bin computation
    // binData: array of bin centers in a plot
    // format: [{start:[x,y],end:[x,y]},...]
    // return array of angle
    static AngleBin (binData) {
        let angle = [];
        for (let i = 0; i < binData.length; i++) {
            let dX = binData[i].end[0] - binData[i].start[0];
            let dY = binData[i].end[1] - binData[i].start[1];
            if (dX !== 0 || dY !== 0) {
                if (dX > 0) {
                    angle[i] = Math.atan(dY/dX);
                } else if (dX === 0) {
                    angle[i] = (dY > 0) ? Math.atan(Infinity) : Math.atan(-Infinity);
                } else if (dX < 0) {
                    angle[i] = (dY > 0) ? Math.atan(dY/dX) + Math.PI : Math.atan(dY/dX) - Math.PI;
                }
            } else {
                angle[i] = 'point';
            }
        }
        return angle;
    }

}