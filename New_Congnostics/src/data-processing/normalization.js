/*
INPUT:
Points: array of points
Each point: array of coordinates || null if this point is removed from the array

OUTPUT:
same structure with input, but coordinates are normalized
*/
function normalization(points) {
  let result = [];
  let x_max = -Infinity, y_max = -Infinity;
  let x_min = Infinity, y_min = Infinity;
  for (let t = 0; t < points.length; t++) {
    if (points[t]!==null) {
      if (points[t][0] < x_min) x_min = points[t][0];
      if (points[t][0] > x_max) x_max = points[t][0];
      if (points[t][1] < y_min) y_min = points[t][1];
      if (points[t][1] > y_max) y_max = points[t][1];
    }
  }
  for (let t = 0; t < points.length; t++) {
    if (points[t]!==null) {
      result[t] = [];
      result[t][0] = (x_max > x_min) ? (points[t][0]-x_min)/(x_max-x_min) : 0.5;
      result[t][1] = (y_max > y_min) ? (points[t][1]-y_min)/(y_max-y_min) : 0.5;
    } else {
      result[t] = null;
    }
  }
  return result;
}
