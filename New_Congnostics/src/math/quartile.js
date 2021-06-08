/*
INPUT:
array: ascending order

OUTPUT:
object with three attributes: q1: value of q1, q2: value of q2, q3: value of q3
*/
function quartile (array) {
    let L = array.length;
    let q1, q2, q3;
    if (L % 2 === 0) {
        q2 = (array[L/2] + array[L/2+1])/2;
    } else {
        q2 = array[(L-1)/2+1];
    }
    let l = (L%2===0) ? L/2 : (L-1)/2;
    if (l % 2 === 0) {
        q1 = (array[l/2] + array[l/2+1])/2;
        if (L%2===0) q3 = (array[l+l/2]+array[l+l/2+1])/2;
        else q3 = (array[l+1+l/2]+array[l+1+l/2+1])/2;
    } else {
        q1 = array[(l-1)/2+1];
        if (L%2===0) q3 = array[l+(l-1)/2+1];
        else q3 = array[l+1+(l-1)/2+1];
    }
    return {q1:q1,q2:q2,q3:q3};
}