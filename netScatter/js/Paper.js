class Paper {
    constructor() {
    }

    // draw high low scores
    static HighLowScore () {
        let data = Paper.MyData();
        let vectorLength = ComputeQuantities.EdgeLengthBin(data);
        let vectorAngle = ComputeQuantities.AngleBin(data);
        let outlyingLength = ComputeMetrics.Outlying(vectorLength,true).score;
        let outlyingAngle = ComputeMetrics.Outlying(vectorAngle,false).score;
        let positiveCorrelation = ComputeMetrics.PositiveCorrelation(vectorAngle);
        let negativeCorrelation = ComputeMetrics.NegativeCorrelation(vectorAngle);
        let intersection = ComputeMetrics.Intersection(data);
        let translation = ComputeMetrics.Translation(data,[]);
        let complexity = ComputeMetrics.Similarity(data);
        // let complexity = ComputeMetrics.Entropy(vectorAngle);
        Paper.netScatterPlot('HMLCanvas',[100,4000],[300,300],data);
        console.log('Outlying length: '+outlyingLength);
        console.log('Outlying angle: '+outlyingAngle);
        console.log('Positive correlation: '+positiveCorrelation);
        console.log('Negative correlation: '+negativeCorrelation);
        console.log('intersection: '+intersection);
        console.log('translation: '+translation);
        console.log('similarity: '+complexity);
    }

    // draw net scatter plot
    static netScatterPlot (canvasID,position,size,data) {
        let canvas = document.getElementById(canvasID);
        let ctx = canvas.getContext('2d');
        // draw rectangle
        ctx.beginPath();
        ctx.fillStyle = 'rgb(220,220,220)';
        ctx.fillRect(position[0],position[1],size[0],size[1]);
        ctx.strokeStyle = 'rgb(0,0,0)';
        ctx.strokeRect(position[0],position[1],size[0],size[1]);
        ctx.fill();
        ctx.stroke();
        ctx.closePath();
        // draw vectors
        data.forEach(e=>{
            let x0 = position[0] + 5 + (size[0]-10)*e.start[0];      // padding = 5
            let y0 = position[1] + 5 + (size[1]-10)*(1-e.start[1]);
            let x1 = position[0] + 5 + (size[0]-10)*e.end[0];      // padding = 5
            let y1 = position[1] + 5 + (size[1]-10)*(1-e.end[1]);
            if (x0 !== x1 || y0 !== y1) {
                let p = Geometry.LineEquation(x0,y0,x1,y1);
                let L = Math.sqrt((x1-x0)*(x1-x0)+(y1-y0)*(y1-y0));
                let d = L/4 < 5 ? L/4 : 5;      // size of triangle in the arrow
                let x2 = (x0-x1 > 0) ? x1+Math.abs(p[1])*d/Math.sqrt(p[0]*p[0]+p[1]*p[1]) : x1-Math.abs(p[1])*d/Math.sqrt(p[0]*p[0]+p[1]*p[1]);
                let y2 = (y0-y1 > 0) ? y1+Math.abs(p[0])*d/Math.sqrt(p[0]*p[0]+p[1]*p[1]) : y1-Math.abs(p[0])*d/Math.sqrt(p[0]*p[0]+p[1]*p[1]);
                let x3 = x2 + (y1-y2)/Math.sqrt(3);
                let y3 = y2 - (x1-x2)/Math.sqrt(3);
                let x4 = x2 - (y1-y2)/Math.sqrt(3);
                let y4 = y2 + (x1-x2)/Math.sqrt(3);
                // line
                ctx.beginPath();
                ctx.moveTo(x0,y0);
                ctx.lineTo(x1,y1);
                ctx.strokeStyle = 'rgb(0,0,0)';
                ctx.stroke();
                ctx.closePath();
                // triangle
                ctx.beginPath();
                ctx.moveTo(x1,y1);
                ctx.lineTo(x3,y3);
                ctx.lineTo(x4,y4);
                ctx.lineTo(x1,y1);
                ctx.fillStyle = 'rgb(0,0,0)';
                ctx.fill();
                ctx.closePath();
            }
        });
    }

    // generate data
    static MyData() {
        let data = [];

        // High outlying length
        // for (let i = 0; i < 30; i++) {
        //     let R = (i === 18 || i === 9 || i === 27) ? 0.6 : Math.random()*0.1+0.1;
        //     let r = Math.random()*0.05;
        //     let a = i*Math.PI*2/30;
        //     let x0 = 0.5 + r*Math.cos(a);
        //     let y0 = 0.5 + r*Math.sin(a);
        //     let x1 = x0 + R*Math.cos(a);
        //     let y1 = y0 + R*Math.sin(a);
        //     if (x1 < 0) x1 = 0;
        //     if (x1 > 1) x1 = 1;
        //     if (y1 < 0) y1 = 0;
        //     if (y1 > 1) y1 = 1;
        //     data[i] = {start:[x0,y0],end:[x1,y1]};
        // }

        // Low outlying length
        // for (let i = 0; i < 30; i++) {
        //     let R = Math.random()*0.2+0.2;
        //     let r = Math.random()*0.05;
        //     let a = i*Math.PI*2/30;
        //     let x0 = 0.5 + r*Math.cos(a);
        //     let y0 = 0.5 + r*Math.sin(a);
        //     let x1 = x0 + R*Math.cos(a);
        //     let y1 = y0 + R*Math.sin(a);
        //     if (x1 < 0) x1 = 0;
        //     if (x1 > 1) x1 = 1;
        //     if (y1 < 0) y1 = 0;
        //     if (y1 > 1) y1 = 1;
        //     data[i] = {start:[x0,y0],end:[x1,y1]};
        // }

        // high outlying angle
        // for (let i = 0; i < 30; i++) {
        //     let R =  Math.random()*0.2+0.3;
        //     let r = Math.random()*0.2;
        //     let a = (i === 18 || i === 9) ? i*Math.PI/30 : i*Math.PI/30 + Math.PI;
        //     let x0 = 0.5 + r*Math.cos(a);
        //     let y0 = 0.5 + r*Math.sin(a);
        //     let x1 = 0.5 + R*Math.cos(a);
        //     let y1 = 0.5 + R*Math.sin(a);
        //     if (x1 < 0) x1 = 0;
        //     if (x1 > 1) x1 = 1;
        //     if (y1 < 0) y1 = 0;
        //     if (y1 > 1) y1 = 1;
        //     data[i] = {start:[x0,y0],end:[x1,y1]};
        // }

        // low outlying angle
        // for (let i = 0; i < 30; i++) {
        //     let x0 = Math.random()*0.8+0.1;
        //     let y0 = Math.random()*0.8+0.1;
        //     let r = 0.1;
        //     let dx = x0 - 0.5;
        //     let dy = y0 - 0.5;
        //     let a = (dx > 0) ? Math.PI*3/2 + Math.atan(dy/dx) : Math.atan(dy/dx) + Math.PI/2;
        //     let x1 = x0 + r*Math.cos(a);
        //     let y1 = y0 + r*Math.sign(a);
        //     data[i] = {start:[x0,y0],end:[x1,y1]};
        // }

        // high positive correlation
        // for (let i = 0; i < 6; i++) {
        //     for (let j = 0; j < 5; j++) {
        //         let x0 = j/6+1/6;
        //         let y0 = i/8+1/8;
        //         let a = Math.PI/4 + Math.random()*Math.PI/12;
        //         let r = Math.random()*1/10+(1/6-1/10);
        //         let x1 = x0 + r*Math.cos(a);
        //         let y1 = y0 + r*Math.sin(a);
        //         if (x1 < 0) x1 = 0;
        //         if (x1 > 1) x1 = 1;
        //         if (y1 < 0) y1 = 0;
        //         if (y1 > 1) y1 = 1;
        //         data[j+i*5] = {start:[x0,y0],end:[x1,y1]};
        //     }
        // }

        // low positive correlation
        // for (let i = 0; i < 6; i++) {
        //     for (let j = 0; j < 5; j++) {
        //         let x0 = j/6+1/6;
        //         let y0 = i/8+1/8;
        //         let a = ((j+i*5) % 2 === 0) ? Math.PI/6 + Math.random()*Math.PI/12 : Math.PI*5/6 + Math.random()*Math.PI/12;
        //         let r = Math.random()*1/10+(1/6-1/10);
        //         let x1 = x0 + r*Math.cos(a);
        //         let y1 = y0 + r*Math.sin(a);
        //         if (x1 < 0) x1 = 0;
        //         if (x1 > 1) x1 = 1;
        //         if (y1 < 0) y1 = 0;
        //         if (y1 > 1) y1 = 1;
        //         data[j+i*5] = {start:[x0,y0],end:[x1,y1]};
        //     }
        // }

        // high negative correlation
        // for (let i = 0; i < 30; i++) {
        //     let l = Paper.normalDistribution()*0.9-0.1;
        //     let d = Paper.normalDistribution()*(1-l*l)*0.7;
        //     let x1 = 0.5+(l+d)/Math.sqrt(2);
        //     let y1 = 0.5+(d-l)/Math.sqrt(2);
        //     let a = -Math.PI/6-Math.random()*Math.PI/6;
        //     let r = Math.random()*1/10+(1/6-1/10);
        //     let x2 = x1 + r*Math.cos(a);
        //     let y2 = y1 + r*Math.sin(a);
        //     data[i] = {start:[x1,y1],end:[x2,y2]};
        // }

        // low negative correlation
        // for (let i = 0; i < 6; i++) {
        //     for (let j = 0; j < 5; j++) {
        //         let x0 = j/6+1/6;
        //         let y0 = i/8+1/8;
        //         let a = Math.random()*2*Math.PI;
        //         let r = Math.random()*1/10+(1/6-1/10);
        //         let x1 = x0 + r*Math.cos(a);
        //         let y1 = y0 + r*Math.sin(a);
        //         if (x1 < 0) x1 = 0;
        //         if (x1 > 1) x1 = 1;
        //         if (y1 < 0) y1 = 0;
        //         if (y1 > 1) y1 = 1;
        //         data[j+i*5] = {start:[x0,y0],end:[x1,y1]};
        //     }
        // }

        // high intersection
        // for (let i = 0; i < 30; i++) {
        //     let x0 = Math.random()*0.8+0.1;
        //     let y0 = Math.random()*0.8+0.1;
        //     let x1 = Math.random()*0.8+0.1;
        //     let y1 = Math.random()*0.8+0.1;
        //     data[i] = {start:[x0,y0],end:[x1,y1]};
        // }

        // low intersection
        // for (let i = 0; i < 30; i++) {
        //     let x0 = Math.random()*0.8+0.1;
        //     let y0 = Math.random()*0.8+0.1;
        //     let r = 0.1;
        //     let dx = x0 - 0.5;
        //     let dy = y0 - 0.5;
        //     let a = (dx > 0) ? Math.PI/2 + Math.atan(dy/dx) : Math.atan(dy/dx) - Math.PI/2;
        //     let x1 = x0 + r*Math.cos(a);
        //     let y1 = y0 + r*Math.sign(a);
        //     data[i] = {start:[x0,y0],end:[x1,y1]};
        // }

        // high translation
        // for (let i = 0; i < 30; i++) {
        //     let x0 = Math.random()*0.4;
        //     let y0 = Math.random()*0.4;
        //     let a = Math.PI/6;
        //     let r = 0.6;
        //     let x1 = x0 + r*Math.cos(a);
        //     let y1 = y0 + r*Math.sign(a);
        //     data[i] = {start:[x0,y0],end:[x1,y1]};
        // }

        // low translation
        // for (let i = 0; i < 30; i++) {
        //     let x0 = Math.random()*0.8+0.1;
        //     let y0 = Math.random()*0.8+0.1;
        //     let c = Math.random()-0.5;
        //     let a = (c>0) ? Math.PI/6 : Math.PI/6-Math.PI;
        //     let r = 0.1;
        //     let x1 = x0 + r*Math.cos(a);
        //     let y1 = y0 + r*Math.sign(a);
        //     data[i] = {start:[x0,y0],end:[x1,y1]};
        // }

        // high entropy
        // for (let i = 0; i < 30; i++) {
        //     let R = Math.random()*0.2+0.3;
        //     let r = Math.random()*0.1+0.1;
        //     let a = i*Math.PI*2/30;
        //     let x0 = 0.5 + R*Math.cos(a);
        //     let y0 = 0.5 + R*Math.sin(a);
        //     let x1 = 0.5 + r*Math.cos(a);
        //     let y1 = 0.5 + r*Math.sin(a);
        //     if (x1 < 0) x1 = 0;
        //     if (x1 > 1) x1 = 1;
        //     if (y1 < 0) y1 = 0;
        //     if (y1 > 1) y1 = 1;
        //     data[i] = {start:[x0,y0],end:[x1,y1]};
        // }

        // low entropy
        // for (let i = 0; i < 30; i++) {
        //     let x0 = Math.random()*0.4+0.5;
        //     let y0 = Math.random()*0.4+0.1;
        //     let a = Math.PI*5/6;
        //     let r = Math.random()*0.2+0.2;
        //     let x1 = x0 + r*Math.cos(a);
        //     let y1 = y0 + r*Math.sign(a);
        //     if (x1 < 0) x1 = 0;
        //     if (x1 > 1) x1 = 1;
        //     if (y1 < 0) y1 = 0;
        //     if (y1 > 1) y1 = 1;
        //     data[i] = {start:[x0,y0],end:[x1,y1]};
        // }

        // high complexity
        // for (let i = 0; i < 30; i++) {
        //     let x0 = Math.random();
        //     let y0 = Math.random();
        //     let x1 = Math.random();
        //     let y1 = Math.random();
        //     data[i] = {start:[x0,y0],end:[x1,y1]};
        // }

        // high similarity
        for (let i = 0; i < 30; i++) {
            let x0, y0, x1, y1;
            if (i < 10) {
                x0 = 0.7+Math.random()*0.2;
                y0 = 0.1+Math.random()*0.2;
                x1 = x0+(0.1)*Math.cos(5*Math.PI/6);
                y1 = y0+(0.1)*Math.sin(5*Math.PI/6);
            } else {
                x0 = 0.1+Math.random()*0.3;
                y0 = 0.7+Math.random()*0.2;
                x1 = x0+(0.1)*Math.cos(Math.PI/6);
                y1 = y0+(0.1)*Math.sin(Math.PI/6);
            }
            data[i] = {start:[x0,y0],end:[x1,y1]};
        }

        // low similarity
        // for (let i = 0; i < 30; i++) {
        //     let x0 = Math.random()*0.8+0.1;
        //     let y0 = Math.random()*0.8+0.1;
        //     let r = 0.1;
        //     let a = 2*Math.PI*Math.random();
        //     let x1 = x0+r*Math.cos(a);
        //     let y1 = y0+r*Math.sin(a);
        //     data[i] = {start:[x0,y0],end:[x1,y1]};
        // }


        return data;
    }

    static normalDistribution () {
        let u = 2*Math.random()-1;
        let v = 2*Math.random()-1;
        let r = u*u + v*v;
        if (r===0||r>=1) return Paper.normalDistribution();
        else return 0.2*u*Math.sqrt(-2*Math.log(r)/r);
    }

}