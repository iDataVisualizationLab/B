function changeTab (evt,tabName) {
    let tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (let i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablinks");
    for (let i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";

    // call visualization function
    if (tabName === 'multi-resolution') {
        main();
        // add event listener to timeline
        mouseMove('timeline');
        mouseOut('timeline');
        // brushing
        mouseClick('timeline');
    } else if (tabName === 'bi-plot') {
        drawBiPlot();
    }
}