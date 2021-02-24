// MOUSE MOVE ASSIGNMENT
function mouseMove(id) {
    let element = document.getElementById(id);
    element.addEventListener('mousemove',event=>{
        if (!clicked && !highlighted) {
            // lensing
            mouse.x = event.offsetX;
            mouse.y = event.offsetY;
            d3.selectAll('.netScatterPlot').remove();
            if (mouse.x >= timelinePadding && mouse.x <= timeLineWidth+timelinePadding) {
                drawInterface(true);
            }
        } else if (clicked && !highlighted) {
            // highlight plots
            cMouse.x = event.offsetX;
            cMouse.y = event.offsetY;
            highlightPlot();
        }
    });
}

// MOUSE OUT ASSIGMENT
function mouseOut(id) {
    let element = document.getElementById(id);
    element.addEventListener('mouseout',event=>{
        if (!clicked) {
            drawInterface(false);
            noPlot();
        }
    });
}

// MOUSE CLICK ASSIGMENT
function mouseClick(id) {
    let element = document.getElementById(id);
    element.addEventListener('click',event=>{
        let check = checkHighlight()[0];
        if (!check)  clicked = !clicked;
        if (check && clicked) highlighted = !highlighted;
    });
}

function checkHighlight () {
    let check = false;
    let index = null;
    let dx = timeLineWidth/tKey.length;
    let cT = Math.floor((mouse.x-timelinePadding)/dx);                // time nearest mouse position
    let sT = (cT - lR >= 0) ? cT - lR : 0;
    let eT = (cT + lR < tKey.length) ? cT + lR : tKey.length-1;
    let small = timeLineWidth/(tKey.length+(scaleFactor-1)*(eT-sT+1));
    let large = scaleFactor*small;
    let cR = (Math.floor(mouse.y/chartHeight) < ds.length) ? Math.floor(mouse.y/chartHeight) : ds.length-1;
    let tS = (sT>=ds[cR]) ? sT : ds[cR];
    for (let t = tS; t <= eT; t++) {
        let x1 = timelinePadding+sT*small+(t-sT)*large+0.5*large - 0.5*large + pPadding;
        let y1 = chartHeight*cR+chartHeight*(1-score[cR][t-ds[cR]]);
        let size = large-2*pPadding;
        if (cMouse.x>=x1&&cMouse.x<=x1+size&&cMouse.y>=y1&&cMouse.y<=y1+size) {
            check = true;
            index = t;
            break;
        }
    }
    return [check,index];
}

// MOUSE OVER VECTORS
function mouseOver (id) {
    let element = document.getElementById(id);
    element.addEventListener('mouseenter',event=>{
        let text = iKey[+element.id.split('-')[2]]
        highlightVector('plots','highlightedVector',event.offsetX,event.offsetY,text);
    });
    element.addEventListener('mouseleave',event=>{
        d3.selectAll('.highlightedVector').remove();
    });
}