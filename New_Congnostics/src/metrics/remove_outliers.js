/*
INPUT:
Points: array of points
Each point: array of coordinates || null if this point is removed from the array
Outliers: array of index of outliers

OUTPUT:
Array of points: null replaces with outliers
*/

function remove_outliers (Points,Outliers) {
    let result = Points.map(e=>{
        if(e!==null) return e.map(e_=>e_);
        else return null;
    });
    if (Outliers.length > 0) {
        for (let i = 0; i < Outliers.length; i++) {
            result[Outliers[i]] = null;
        }
    }
    return result;
}