

class Map {
    /**
     * @param selectedSpecies refers to initial selected bird species.
     * @param speciesDict contains the data for all birds.
     */
    constructor(selectedSpecies, speciesDict) {
        this.selectedSpecies = selectedSpecies;
        this.speciesDict = speciesDict;
        this.lineChart = null;
        this.selectedFrequencies = null;
        this.activeYear = 2012;
        this.activeSeason = [new Date(this.activeYear, 0, 1), new Date(this.activeYear + 1, 0, 1)];
        this.selectedData = speciesDict;
        this.width = 700;
        this.height = 650;
        this.projection = null;
        this.showTrend = false;

        this.initializeMap();
    }

    setLineChart(chart) {
        this.lineChart = chart;
    }

    initializeMap() {
        let that = this;
        console.log("initMap");

        let svg = d3.select("#mapSvg")
            .attr("width", this.width)
            .attr("height", this.height);

        d3.select(".trendButton").on("click", function () {
            if (this.showTrend) {
                this.hideTrend()
                that.showTrend = false;
            }
            else {
                if (that.selectedSpecies.length != 0) {
                    that.displayTrend()
                    that.showTrend = true;
                }
            }
        })

        this.projection = d3.geoAlbers()
            .center([-10, 45])
            .rotate([105, 0])
            .parallels([35, 55])
            .scale(400)
            .translate([that.width / 2, that.height / 2]);

        let path = d3.geoPath().projection(that.projection);

        d3.json("data/north-america.json")
            .then(function (json) {
                {
                    svg.selectAll("path")
                        .data(json.features)
                        .enter()
                        .append("path")
                        .attr("d", path)
                        .style("fill", "white")
                        .style("stroke", "black")
                        .style("stroke-width", "1");
                }
            })

        
        this.drawSeason();
        this.drawYearBar();
    }

    updateMap(data) {
        let that = this;
        this.selectedData = data;

        let totalCount = 0;
        let totalDur = 0;

        that.selectedFrequencies = [];

        for (let i = 0; i < that.selectedSpecies.length; i++) {
            that.selectedFrequencies.push({ name: that.selectedSpecies[i], count: 0, obsDur: 0 });
        }


        let obsScale = function (d) {

            let count = isNaN(parseInt(d.count)) ? 0 : parseInt(d.count);
            let obsDur = isNaN(parseInt(d.obsDur)) ? 0 : parseInt(d.obsDur);

            let index = that.selectedSpecies.indexOf(d.commonName);
            that.selectedFrequencies[index].count += count;
            that.selectedFrequencies[index].obsDur += obsDur;

            let opac = count / obsDur;
            return opac;
        };
        let svg = d3.select("#mapSvg");

        svg.selectAll("circle")
            .data(data)
            .join("circle")
            .attr("cx", d => {
                return that.projection([d.long, d.lat])[0];
            })
            .attr("cy", d => {
                return that.projection([d.long, d.lat])[1];
            })
            .attr("r", 5)

            .style("fill", d => {
                return that.getColorFromName(d.commonName);

            })
            .style("opacity", d => obsScale(d))
            .on("mouseover", d => console.log("Observation count:", d.count));

        let totalFreq = totalCount / totalDur;

        console.log("totalCount, totalDur", totalCount, totalDur, totalFreq);

    }

    displayTrend() {
        let that = this;
        let combinedFreqList = []
        let birdIndexDict = {}
        for (var i = 0; i < this.selectedSpecies.length; i++) {
            birdIndexDict[that.selectedSpecies[i]] = i;
        }
        console.log("birdDict", birdIndexDict, birdIndexDict["Yellow-bellied Sapsucker"])

        let mercProj = d3.geoAlbers()
            .center([-10, 45])
            .rotate([105, 0])
            .parallels([35, 55])
            .scale(400)
            .translate([that.width / 2, that.height / 2]);

        let circleSizer = function (d) {
            let cScale = d3.scaleSqrt().range([5, 20]).domain([cMin, cMax]);
            return d ? cScale(d) : 5;
        };

        let currentTrend = this.selectedSpecies.map(function (element) {
            return {
                "name": element,
                "lat": 0,
                "long": 0,
                "freq": 0
            }
        })
        let finalTrend = this.selectedSpecies.map(function (element) {
            return {
                "name": element,
                "lat": 0,
                "long": 0,
                "freq": 0
            }
        })
        let combinedTrend = this.selectedSpecies.map(function (element) {
            return {
                "name": element,
                "currentYearLat": 0,
                "currentYearLong": 0,
                "currentYearFreq": 0,
                "finalYearLat": 0,
                "finalYearLong": 0,
                "finalYearFreq": 0
            }
        })


        for (const bird in this.yearDict[2018]) {
            if (that.yearDict[2018][bird].count == "X" || that.yearDict[2018][bird].obsDur == "") {
                continue;
            }
            let freq = +that.yearDict[2018][bird].count * 60 / +that.yearDict[2018][bird].obsDur;
            finalTrend[birdIndexDict[that.yearDict[2018][bird].commonName]].lat += freq * that.yearDict[2018][bird].lat
            finalTrend[birdIndexDict[that.yearDict[2018][bird].commonName]].long += freq * that.yearDict[2018][bird].long
            finalTrend[birdIndexDict[that.yearDict[2018][bird].commonName]].freq += freq
        }
        for (var record in finalTrend) {
            finalTrend[record].lat = finalTrend[record].lat / finalTrend[record].freq
            finalTrend[record].long = finalTrend[record].long / finalTrend[record].freq
            combinedTrend[birdIndexDict[finalTrend[record].name]].finalYearLat = finalTrend[record].lat
            combinedTrend[birdIndexDict[finalTrend[record].name]].finalYearLong = finalTrend[record].long
            combinedTrend[birdIndexDict[finalTrend[record].name]].finalYearFreq = finalTrend[record].freq
            combinedFreqList.push(finalTrend[record].freq)
        }

        for (const bird in this.selectedData) {
            if (that.selectedData[bird].count == "X" || that.selectedData[bird].obsDur == "") {
                continue;
            }
            let freq = +that.selectedData[bird].count * 60 / +that.selectedData[bird].obsDur;
            currentTrend[birdIndexDict[that.selectedData[bird].commonName]].lat += freq * that.selectedData[bird].lat
            currentTrend[birdIndexDict[that.selectedData[bird].commonName]].long += freq * that.selectedData[bird].long
            currentTrend[birdIndexDict[that.selectedData[bird].commonName]].freq += freq
        }
        for (var record in currentTrend) {
            currentTrend[record].lat = currentTrend[record].lat / currentTrend[record].freq
            currentTrend[record].long = currentTrend[record].long / currentTrend[record].freq
            combinedTrend[birdIndexDict[currentTrend[record].name]].currentYearLat = currentTrend[record].lat
            combinedTrend[birdIndexDict[currentTrend[record].name]].currentYearLong = currentTrend[record].long
            combinedTrend[birdIndexDict[currentTrend[record].name]].currentYearFreq = currentTrend[record].freq
            combinedFreqList.push(currentTrend[record].freq)
        }

        //For circle sizing
        let cMin = d3.min(combinedFreqList);
        let cMax = d3.max(combinedFreqList);

        //Draw the circles and connecting line on map
        d3.select("#mapSvg").selectAll(".trendLine").data(combinedTrend).join("line")
            .attr("class", "trendLine")
            .attr("x1", d => that.projection([d.currentYearLong, d.currentYearLat])[0])
            .attr("y1", d => that.projection([d.currentYearLong, d.currentYearLat])[1])
            .attr("x2", d => that.projection([d.finalYearLong, d.finalYearLat])[0])
            .attr("y2", d => that.projection([d.finalYearLong, d.finalYearLat])[1])
            .style("stroke-width", 5)
            .style("stroke", "black")

        d3.select("#mapSvg").selectAll(".trendStartCircle").data(currentTrend).join("circle")
            .attr("class", "trendStartCircle")
            .attr("cx", d => that.projection([d.long, d.lat])[0])
            .attr("cy", d => that.projection([d.long, d.lat])[1])
            .attr("r", d => circleSizer(d.freq))
            .style("fill", "green")
            .style("stroke", "black")
        //.title(d => d.freq)

        d3.select("#mapSvg").selectAll(".trendEndCircle").data(finalTrend).join("circle")
            .attr("class", "trendEndCircle")
            .attr("cx", d => that.projection([d.long, d.lat])[0])
            .attr("cy", d => that.projection([d.long, d.lat])[1])
            .attr("r", d => circleSizer(d.freq))
            .style("fill", "green")
            .style("stroke", "black")
        //.title(d => d.freq)

        //Swap the display on the button
        d3.select(".trendButton").text("Hide Trend")

    }

    hideTrend() {
        d3.selectAll(".trendLine").remove()
        d3.selectAll(".trendStartCircle").remove()
        d3.selectAll(".trendEndCircle").remove()
        d3.select(".trendButton").text("Show Trend")
    }

    /**
    * Draws the slider for the Year Bar
    */
    drawYearBar() {
        let that = this;

        //Slider to change the activeYear of the data
        let yearScale = d3.scaleLinear().domain([2010, 2018]).range([30, 700]);

        let yearSlider = d3.select('#activeYear-bar')
            .append('div').classed('slider-wrap', true)
            .append('input').classed('slider', true)
            .attr('type', 'range')
            .attr('min', 2010)
            .attr('max', 2018)
            .attr('value', this.activeYear)

        let sliderLabel = d3.select('.slider-wrap')
            .append('div').classed('slider-label', true)
            .append('svg')
            .attr("width", this.width - 100)
            .attr("height", this.height);

        let sliderText = sliderLabel.append('text').text(this.activeYear);

        sliderText.attr('x', yearScale(this.activeYear));
        sliderText.attr('y', 25);

        yearSlider.on('input', function () {
            //YOUR CODE HERE
            that.activeYear = this.value;
            d3.select("#activeYear-bar").select(".slider-wrap").select(".slider-label").select("text").attr("x", yearScale(that.activeYear)).text(that.activeYear)
            //that.updatePlot(that.activeYear, xdrop, ydrop, cdrop);


        });
    }

    drawSeason() {
        let that = this;
        //let monthDict = {0: "January", 1: "Februrary", 2: "March", 3: "April", 4: "May", 5: "June", 6: "July", 7: "August", 8: "September", 9: "October", 10: "November", 11: "December"}
        let monthDict = {
            0: "Jan",
            1: "Feb",
            2: "Mar",
            3: "Apr",
            4: "May",
            5: "Jun",
            6: "Jul",
            7: "Aug",
            8: "Sept",
            9: "Oct",
            10: "Nov",
            11: "Dec"
        }
        let tempData = [
            new seasonalData("year-round", new Date(this.activeYear, 0, 1), new Date(this.activeYear, 11, 31)),
            new seasonalData("breeding", new Date(this.activeYear, 6, 1), new Date(this.activeYear, 8, 31)),
            new seasonalData("pre-migration", new Date(this.activeYear, 2, 1), new Date(this.activeYear, 5, 31)),
            new seasonalData("post-migration", new Date(this.activeYear, 9, 1), new Date(this.activeYear, 10, 31))
        ]
        //Add season selector rectangles
        let seasonRectGroup = d3.select("#seasonSVG").append("g").attr("class", "selectRect");
        //let rectData = [{"time": "year-round", "pos": 0}, {"time": "breeding", "pos": 100}, {"time": "pre-migration", "pos": 200}, {"time": "post-migration", "pos": 300}];
        seasonRectGroup.selectAll("rect")
            .data(tempData)
            .join("rect")
            .attr("width", 40)
            .attr("height", 20)
            .attr("x", (d, i) => i * 100)
            .attr("class", d => d.type)
            .on("click", d => d3.select(".brushGroup").call(brush.move, [seasonScale(d.start), seasonScale(d.end)]));
        seasonRectGroup.selectAll("text")
            .data(tempData)
            .join("text")
            .attr("x", (d, i) => i * 100)
            .attr("y", 45)
            .style("font-weight", "bold")
            .text(d => d.type)
        //Build the Axis
        console.log([new Date(this.activeYear, 0, 1), new Date(this.activeYear, 11, 31)])
        let seasonScale = d3.scaleTime().domain([new Date(this.activeYear, 0, 1), new Date(this.activeYear, 11, 31)]).range([25, 750])
        let seasonAxis = d3.axisBottom().scale(seasonScale).ticks(11).tickFormat(d => {
            return monthDict[d.getMonth()]
        })
        d3.select("#seasonSVG").append("g")
            .attr("transform", "translate(0, 120)")
            .attr("class", "seasonAxis")
            .call(seasonAxis)
        //Build the brushable box
        d3.select("#seasonSVG").append("g").attr("class", "brushRectGroup").attr("transform", "translate(0, 90)")
            .selectAll("rect")
            .data(tempData)
            .join("rect")
            .attr("width", d => seasonScale(d.end) - seasonScale(d.start))
            .attr("height", 30)
            .attr("x", d => seasonScale(d.start))
            .attr("class", d => d.type)
        //Add the brush
        let brush = d3.brushX().extent([[0, 0], [that.width + 50, 30]])
            .on("start", () => {

            })
            .on("brush", () => {
                //console.log("Brushing")
                const selection = d3.event.selection;
                const [left, right] = selection;
                if (selection == null) {
                    //Check how much was brushed.
                    that.activeSeason = [new Date(that.activeYear, 0, 1), new Date(that.activeYear, 11, 31)]
                    that.selectedData = that.yearDict[that.activeYear]
                }
                else {
                    that.activeSeason = [seasonScale.invert(left), seasonScale.invert(right)]
                    console.log("active season", that.activeSeason);
                    //Here we subset the data set using the new season.
                    that.selectedData = that.yearDict[that.activeYear].filter(d => {
                        if (new Date(d.date) <= that.activeSeason[1] && new Date(d.date) >= that.activeSeason[0]) {
                            return true
                        } else {
                            return false
                        }
                    })
                }
            })
            .on("end", () => {
                //console.log("Brushing Complete", d3.event.selection)
                if (d3.event.selection == null) {
                    that.activeSeason = [new Date(that.activeYear, 0, 1), new Date(that.activeYear, 11, 31)]
                    that.selectedData = that.yearDict[that.activeYear]
                }
                else {
                    const [left, right] = d3.event.selection;
                    that.activeSeason = [seasonScale.invert(left), seasonScale.invert(right)]

                    //console.log("active season", that.activeSeason);
                    //Here we subset the data set using the new season.
                    that.selectedData = that.yearDict[that.activeYear].filter(d => {
                        if (new Date(d.date) <= that.activeSeason[1] && new Date(d.date) >= that.activeSeason[0]) {
                            return true
                        } else {
                            return false
                        }
                    })

                    // console.log(that.activeYear);
                    // console.log("new data: ", that.selectedData)
                    // console.log("new season: ", that.activeSeason)
                }

            })
        d3.select("#seasonSVG").append("g").attr("class", "brushGroup").attr("transform", "translate(0, 90)").call(brush)
    }

    /**
    * Called when bird changes in case seasonal data is different.
    */
    updateSeasonalDisplay(seasonalData){
        //Add season selector rectangles
        let seasonRectGroup = d3.select(".selectRect")
        seasonRectGroup.selectAll("rect")
            .data(seasonalData)
            .join("rect")
            .attr("width", 40)
            .attr("height", 20)
            .attr("x", (d, i) => i * 100)
            .attr("class", d => d.type)
            .on("click", d => d3.select(".brushGroup").call(brush.move, [seasonScale(d.start), seasonScale(d.end)]));
        seasonRectGroup.selectAll("text")
            .data(seasonalData)
            .join("text")
            .attr("x", (d, i) => i * 100)
            .attr("y", 45)
            .style("font-weight", "bold")
            .text(d => d.type)
        //Build the brushable box
        d3.select(".brushRectGroup").selectAll("rect")
            .data(seasonalData)
            .join("rect")
            .attr("width", d => seasonScale(d.end) - seasonScale(d.start))
            .attr("height", 30)
            .attr("x", d => seasonScale(d.start))
            .attr("class", d => d.type)
    }

}

