/*
INPUT:
x0: x-coordinate of point 0
y0: y-coordinate of point 0
x1: x-coordinate of point 1
y1: y-coordinate of point 1
x2: x-coordinate of point 2
y2: y-coordinate of point 2

OUTPUT:
cosine of angle of two vectors: v1: point 0 to point 1, v2: point 0 to point 2
*/

function cosine (x0,y0,x1,y1,x2,y2) {
    let v1 = Math.sqrt((x1-x0)*(x1-x0)+(y1-y0)*(y1-y0));
    let v2 = Math.sqrt((x2-x0)*(x2-x0)+(y2-y0)*(y2-y0));
    let scalarProduct = (x1-x0)*(x2-x0)+(y1-y0)*(y2-y0);
    return scalarProduct/(v1*v2);
}