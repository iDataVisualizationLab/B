Promise.all([d3.text("data/state.txt"),
  d3.text("data/IndustryFiltered.txt")
]).then(function (file) {
  console.log(file[0]);
});
