// generate vector plots of particular visual patterns
// hardcode
function generatePlots (type,range) {
    let vectors = [];
    if (type === 0) {   // outlying vector
        if (range === 'high') {
            for (let i = 0; i < 30; i++) {
                let x0, y0, x1, y1, r, a;
                if (i < 25) {
                    x0 = Math.random()*0.1+0.8;
                    y0 = Math.random()*0.1+0.1;
                    r = 0.1;
                    a = Math.PI*3/4;
                    x1 = x0+r*Math.cos(a);
                    y1 = y0+r*Math.sin(a);
                    vectors.push([x0,y0,x1,y1]);
                } else {
                    let c = Math.floor(Math.random()*3);
                    switch (c) {
                        case 0:
                            x0 = Math.random()*0.1;
                            y0 = Math.random()*0.1;
                            r = 0.1;
                            a = Math.PI/4;
                            x1 = x0+r*Math.cos(a);
                            y1 = y0+r*Math.sin(a);
                            break;
                        case 1:
                            x0 = Math.random()*0.1;
                            y0 = Math.random()*0.1+0.9;
                            r = 0.1;
                            a = -Math.PI/4;
                            x1 = x0+r*Math.cos(a);
                            y1 = y0+r*Math.sin(a);
                            break;
                        case 2:
                            x0 = Math.random()*0.1+0.9;
                            y0 = Math.random()*0.1+0.9;
                            r = 0.1;
                            a = -Math.PI*3/4;
                            x1 = x0+r*Math.cos(a);
                            y1 = y0+r*Math.sin(a);
                            break;
                    }
                    vectors.push([x0,y0,x1,y1]);
                }
            }
        } else if (range === 'low') {
            for (let i = 0; i < 30; i++) {
                let l = normalDistribution()*0.9-0.1;
                let d = normalDistribution()*(1-l*l)*0.7;
                let x0 = 0.5+(l-d)/Math.sqrt(2);
                let y0 = 0.5+(d+l)/Math.sqrt(2);
                let a = -Math.PI/6-Math.random()*Math.PI/6;
                let r = Math.random()*1/10+(1/6-1/10);
                let x1 = x0 + r*Math.cos(a);
                let y1 = y0 + r*Math.sin(a);
                vectors.push([x0,y0,x1,y1]);
            }
        }
    }
    if (type === 1) {       // outlying length
        if (range === 'high') {
            for (let i = 0; i < 30; i++) {
                let R = (i === 18 || i === 9 || i === 27) ? 0.6 : Math.random()*0.1+0.1;
                let r = Math.random()*0.05;
                let a = i*Math.PI*2/30;
                let x0 = 0.5 + r*Math.cos(a);
                let y0 = 0.5 + r*Math.sin(a);
                let x1 = x0 + R*Math.cos(a);
                let y1 = y0 + R*Math.sin(a);
                if (x1 < 0) x1 = 0;
                if (x1 > 1) x1 = 1;
                if (y1 < 0) y1 = 0;
                if (y1 > 1) y1 = 1;
                vectors.push([x0,y0,x1,y1]);
            }
        } else if (range === 'low') {
            for (let i = 0; i < 30; i++) {
                let R = Math.random()*0.2+0.2;
                let r = Math.random()*0.05;
                let a = i*Math.PI*2/30;
                let x0 = 0.5 + r*Math.cos(a);
                let y0 = 0.5 + r*Math.sin(a);
                let x1 = x0 + R*Math.cos(a);
                let y1 = y0 + R*Math.sin(a);
                if (x1 < 0) x1 = 0;
                if (x1 > 1) x1 = 1;
                if (y1 < 0) y1 = 0;
                if (y1 > 1) y1 = 1;
                vectors.push([x0,y0,x1,y1]);
            }
        }
    }
    if (type === 2) {       // outlying angle
        if (range === 'high') {
            for (let i = 0; i < 30; i++) {
                let R =  Math.random()*0.2+0.3;
                let r = Math.random()*0.2;
                let a = (i === 18 || i === 9) ? i*Math.PI/30 : i*Math.PI/30 + Math.PI;
                let x0 = 0.5 + r*Math.cos(a);
                let y0 = 0.5 + r*Math.sin(a);
                let x1 = 0.5 + R*Math.cos(a);
                let y1 = 0.5 + R*Math.sin(a);
                if (x1 < 0) x1 = 0;
                if (x1 > 1) x1 = 1;
                if (y1 < 0) y1 = 0;
                if (y1 > 1) y1 = 1;
                vectors.push([x0,y0,x1,y1]);
            }
        } else if (range === 'low') {
            for (let i = 0; i < 30; i++) {
                let x0 = Math.random()*0.8+0.1;
                let y0 = Math.random()*0.8+0.1;
                let r = 0.1;
                let dx = x0 - 0.5;
                let dy = y0 - 0.5;
                let a = (dx > 0) ? Math.PI*3/2 + Math.atan(dy/dx) : Math.atan(dy/dx) + Math.PI/2;
                let x1 = x0 + r*Math.cos(a);
                let y1 = y0 + r*Math.sign(a);
                vectors.push([x0,y0,x1,y1]);
            }
        }
    }
    if (type === 3) {       // correlation
        if (range === 'high') {
            for (let i = 0; i < 30; i++) {
                let l = normalDistribution()*0.9-0.1;
                let d = normalDistribution()*(1-l*l)*0.7;
                let x0 = 0.5+(l+d)/Math.sqrt(2);
                let y0 = 0.5+(d-l)/Math.sqrt(2);
                let a = -Math.PI/6-Math.random()*Math.PI/6;
                let r = Math.random()*1/10+(1/6-1/10);
                let x1 = x0 + r*Math.cos(a);
                let y1 = y0 + r*Math.sin(a);
                vectors.push([x0,y0,x1,y1]);
            }
        } else if (range === 'low') {
            for (let i = 0; i < 6; i++) {
                for (let j = 0; j < 5; j++) {
                    let x0 = j/6+1/6;
                    let y0 = i/8+1/8;
                    let a = ((j+i*5) % 2 === 0) ? Math.PI/6 + Math.random()*Math.PI/12 : Math.PI*5/6 + Math.random()*Math.PI/12;
                    let r = Math.random()*1/10+(1/6-1/10);
                    let x1 = x0 + r*Math.cos(a);
                    let y1 = y0 + r*Math.sin(a);
                    if (x1 < 0) x1 = 0;
                    if (x1 > 1) x1 = 1;
                    if (y1 < 0) y1 = 0;
                    if (y1 > 1) y1 = 1;
                    vectors.push([x0,y0,x1,y1]);
                }
            }
        }
    }
    if (type === 4) {       // entropy
        if (range === 'high') {
            for (let i = 0; i < 30; i++) {
                let R = Math.random()*0.2+0.3;
                let r = Math.random()*0.1+0.1;
                let a = i*Math.PI*2/30;
                let x0 = 0.5 + R*Math.cos(a);
                let y0 = 0.5 + R*Math.sin(a);
                let x1 = 0.5 + r*Math.cos(a);
                let y1 = 0.5 + r*Math.sin(a);
                if (x1 < 0) x1 = 0;
                if (x1 > 1) x1 = 1;
                if (y1 < 0) y1 = 0;
                if (y1 > 1) y1 = 1;
                vectors.push([x0,y0,x1,y1]);
            }
        } else if (range === 'low') {
            for (let i = 0; i < 30; i++) {
                let x0 = Math.random()*0.4+0.5;
                let y0 = Math.random()*0.4+0.1;
                let a = Math.PI*5/6;
                let r = Math.random()*0.2+0.2;
                let x1 = x0 + r*Math.cos(a);
                let y1 = y0 + r*Math.sign(a);
                if (x1 < 0) x1 = 0;
                if (x1 > 1) x1 = 1;
                if (y1 < 0) y1 = 0;
                if (y1 > 1) y1 = 1;
                vectors.push([x0,y0,x1,y1]);
            }
        }
    }
    if (type === 5) {       // intersection
        if (range === 'high') {
            for (let i = 0; i < 30; i++) {
                let x0 = Math.random()*0.8+0.1;
                let y0 = Math.random()*0.8+0.1;
                let x1 = Math.random()*0.8+0.1;
                let y1 = Math.random()*0.8+0.1;
                vectors.push([x0,y0,x1,y1]);
            }
        } else if (range === 'low') {
            for (let i = 0; i < 30; i++) {
                let x0 = Math.random()*0.8+0.1;
                let y0 = Math.random()*0.8+0.1;
                let r = 0.1;
                let dx = x0 - 0.5;
                let dy = y0 - 0.5;
                let a = (dx > 0) ? Math.PI/2 + Math.atan(dy/dx) : Math.atan(dy/dx) - Math.PI/2;
                let x1 = x0 + r*Math.cos(a);
                let y1 = y0 + r*Math.sin(a);
                vectors.push([x0,y0,x1,y1]);
            }
        }
    }
    if (type === 6) {       // translation
        if (range === 'high') {
            for (let i = 0; i < 30; i++) {
                let x0 = Math.random()*0.4;
                let y0 = Math.random()*0.4;
                let a = Math.PI/6;
                let r = 0.6;
                let x1 = x0 + r*Math.cos(a);
                let y1 = y0 + r*Math.sign(a);
                vectors.push([x0,y0,x1,y1]);
            }
        } else if (range === 'low') {
            for (let i = 0; i < 30; i++) {
                let x0 = Math.random()*0.8+0.1;
                let y0 = Math.random()*0.8+0.1;
                let c = Math.random()-0.5;
                let a = (c>0) ? Math.PI/6 : Math.PI/6-Math.PI;
                let r = 0.1;
                let x1 = x0 + r*Math.cos(a);
                let y1 = y0 + r*Math.sign(a);
                vectors.push([x0,y0,x1,y1]);
            }
        }
    }
    if (type === 7) {           // homogeneous
        if (range === 'high') {
            for (let i = 0; i < 30; i++) {
                let x0, y0, x1, y1;
                // if (i < 10) {
                //     x0 = 0.7+Math.random()*0.2;
                //     y0 = 0.1+Math.random()*0.2;
                //     x1 = x0+(0.1)*Math.cos(5*Math.PI/6);
                //     y1 = y0+(0.1)*Math.sin(5*Math.PI/6);
                // } else {
                    x0 = 0.1+Math.random()*0.3;
                    y0 = 0.7+Math.random()*0.2;
                    x1 = x0+(0.1)*Math.cos(Math.PI/6);
                    y1 = y0+(0.1)*Math.sin(Math.PI/6);
                // }
                vectors.push([x0,y0,x1,y1]);
            }
        } else if (range === 'low') {
            for (let i = 0; i < 30; i++) {
                let x0 = Math.random()*0.8+0.1;
                let y0 = Math.random()*0.8+0.1;
                let r = 0.1;
                let a = 2*Math.PI*Math.random();
                let x1 = x0+r*Math.cos(a);
                let y1 = y0+r*Math.sin(a);
                vectors.push([x0,y0,x1,y1]);
            }
        }
    }
    return vectors;
}

function normalDistribution () {
    let u = 2*Math.random()-1;
    let v = 2*Math.random()-1;
    let r = u*u + v*v;
    if (r===0||r>=1) return normalDistribution();
    else return 0.2*u*Math.sqrt(-2*Math.log(r)/r);
}