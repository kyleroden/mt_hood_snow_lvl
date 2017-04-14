'use strict';
    //set the margins for the outer svg
    //D3 conventions for margin uses an object
    const margin = {
        left: 50,
        bottom: 40,
        right: 20,
        top: 10
    };
    const width = 900 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    //make a function to parse the time values
    const parseTime = d3.timeParse("%Y-%m-%d");
    //create a range (based on pixel width) in which to display the svg line chart
    const x = d3.scaleTime().range([0, width]);
    //invert y range so low values will be on bottom
    const y = d3.scaleLinear().range([height, 0]);

    const draw_line = d3.line()
        .x(function(d) {
            //returns a value which fits the scale for x
            return x(d.date);
        })
        //returns a value which fits the scale of y
        .y(function(d) {
            return y(d.snowlvl);
        });
    //accessor function, normalizes the data
    function normalizer(d) {
        return {
            date: d.date,
            snowlvl: +d.snowlvl
        };
    }
    function post_data(d) {
        d.date = parseTime(d.date);
        //D3 CONVENTION: use + to parseInt
        d["snowlvl"] = +d["snowlvl"];
    }
    //append svg object to the div
    const svg = d3.select("#line_graph").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        //then append a holding group for the lines
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    d3.queue()
        .defer(d3.csv, "mt_hood_2014-2015_snow.csv")
        .defer(d3.csv, "mt_hood_2016-2017_snow.csv")
        .await(function(error, file1, file2) {
            if (error) {
                console.error("error: " + error);
            } else {
                file1.forEach(function(x) {
                    //normalize data (str to int for snowpack & parse date)
                    normalizer(x);
                    post_data(x);
                });
                file2.forEach(function(x) {
                    normalizer(x);
                    post_data(x);
                });
                //get min value from file1 data
                const file1_min_date = d3.extent(file1, function(d) {
                    return d.date;
                });
                //get min value from file2 data
                const file2_max_date = d3.extent(file2, function(d) {
                    return d.date;
                });
                //create an array of the min value of the first data set and the max value of
                //the next data set to pass to domain
                const total_domain = new Array(file1_min_date[0], file2_max_date[1]);
                //define the min and max values of x and y axis (domain)
                x.domain(total_domain);
                //the max y value should be the highest snow level found in the data
                y.domain([0, d3.max(file1, function(d) {
                    return d.snowlvl;
                })]);
                //append the draw_line path to the svg wrapper
                svg.append("path")
                    .data([file1])
                    .attr("class", "first_line")
                    .attr("d", draw_line);
                svg.append("path")
                    .data([file2])
                    .attr("class", "second_line")
                    .attr("d", draw_line);
                // place x axis at bottom
                svg.append("g")
                    .attr("transform", "translate(0," + height + ")")
                    .call(d3.axisBottom(x));
                //label the x axis
                svg.append("text")
                    .attr("transform", "translate(" + (width / 2) + "," + (height + margin.top + 25) + ")")
                    .style("text-anchor", "middle")
                    .text("Date");
                // place y axis on left
                svg.append("g")
                    .call(d3.axisLeft(y));
                //make a label for y axis
                svg.append("text")
                    //rotate it properly
                    .attr("transform", "rotate(-90)")
                    .attr("y", 0 - margin.left)
                    .attr("x", 0 - (height / 2))
                    .attr("dy", "1em")
                    .style("text-anchor", "middle")
                    .text("Snow-Water Equivlent (Inches)");
            } //end await
        });