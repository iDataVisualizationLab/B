function lineEquation (x1,y1,x2,y2) {
    let result = [];
    if (x1 !== x2) {
        result[0] = (y1-y2)/(x1-x2);
        result[1] = -1;
        result[2] = (y2*x1-y1*x2)/(x1-x2);
    } else {
        result[0] = 1;
        result[1] = 0;
        result[2] = -x1;
    }
    return result;
}

function checkLineSegmentCrossing (x1,y1,x2,y2,x3,y3,x4,y4) {
    let result = false;
    let l1 = lineEquation(x1,y1,x2,y2);
    let l2 = lineEquation(x3,y3,x4,y4);
    let check1 = (l1[0]*x3+l1[1]*y3+l1[2])*(l1[0]*x4+l1[1]*y4+l1[2]) < 0;
    let check2 = (l2[0]*x1+l2[1]*y1+l2[2])*(l2[0]*x2+l2[1]*y2+l2[2]) < 0;
    if (check1 && check2) result = true;
    return result;
}