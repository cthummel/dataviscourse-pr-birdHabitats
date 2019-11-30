

class Map {
    /**
     * @param selectedSpecies refers to initial selected bird species.
     * @param speciesDict contains the data for all birds.
     */
    constructor(selectedSpecies, speciesDict, nameDict) {
        this.selectedSpecies = selectedSpecies;
        this.speciesDict = speciesDict;
        this.nameDict = nameDict;
        this.lineChart = null;
        //this.selectedFrequencies = null;
        this.maxFrequency = 0;
        this.activeYear = 2012;
        this.activeSeason = [new Date(2012, 0, 1), new Date(2012 + 1, 0, 1)];
        this.selectedData = speciesDict;
        this.width = 700;
        this.height = 650;
        this.projection = null;
        this.showTrend = false;

        this.projection = d3.geoAlbers()
            .center([-10, 45])
            .rotate([105, 0])
            .parallels([35, 55])
            .scale(400)
            .translate([this.width / 2, this.height / 2]);

        let path = d3.geoPath().projection(this.projection);

        d3.json("data/north-america.json")
            .then(json =>
                {
                    d3.select("#mapSvg").selectAll("path")
                        .data(json.features)
                        .enter()
                        .append("path")
                        .attr("d", path)
                        .style("fill", "white")
                        .style("stroke", "black")
                        .style("stroke-width", "1");
                    
                        this.initializeMap();
                        this.initializeSliders();
                        this.updateMap(this.selectedSpecies);
                }
                    
            )

        
        
        

        
    }

    setLineChart(chart) {
        this.lineChart = chart;
    }

    initializeMap() {
        let that = this;
        console.log("initMap", this.speciesDict);

        d3.select('#Map')
            .append('div')
            .attr("class", "mapTooltip")
            .style("opacity", 0);
        
        let svg = d3.select("#mapSvg")
            .attr("width", this.width)
            .attr("height", this.height);

        d3.select(".trendButton").on("click", function () {
            if (that.showTrend) {
                that.hideTrend()
                that.showTrend = false;
            }
            else {
                if (that.selectedSpecies.length != 0) {
                    that.displayTrend()
                    that.showTrend = true;
                }
            }
        })
    }

    initializeSliders() {
        d3.select("#seasonDiv")
            .append("svg")
            .attr("width", this.width + 100)
            .attr("height", 150).attr("id", "seasonSVG")
            .attr("translate", "transform(0, " + this.height + ")");

        d3.select('body')
            .append('div').attr('id', 'activeYear-bar');


        this.drawSeason();
        this.drawYearBar();
    }

    updateMap(selectedBirds) {
        let that = this;
        this.selectedSpecies = selectedBirds;
        this.selectedData = this.subsetByYear();
        let max = 0
        
        for (var i = 0; i < this.selectedData.length; i++) {
            if (this.selectedData[i].count != "X" || this.selectedData[i].obsDur != "") {
                let tempFreq = +this.selectedData[i].count * 60 / +this.selectedData[i].obsDur;
                if(max < tempFreq)
                {
                    max = tempFreq;
                }
            }
        }
        
        let opacityScale = function(data)
        {
            let scale = d3.scaleLinear().domain([0, max]).range([.02, .15])
            let count = data.count == "X" ? 0: +data.count 
            let obs = data.obsDur == "" ? 300: +data.obsDur
            return scale(count * 60 / obs)
        }

        let svg = d3.select("#mapSvg");
        svg.selectAll("circle")
            .data(this.selectedData)
            .join("circle")
            .attr("cx", d => {
                return that.projection([d.long, d.lat])[0];
            })
            .attr("cy", d => {
                return that.projection([d.long, d.lat])[1];
            })
            .attr("r", 5)
            .style("fill", d => {
                if(d.birdCode == that.selectedSpecies[0])
                {
                    return "blue"
                }
                else if (d.birdCode == that.selectedSpecies[1])
                {
                    return "red"
                }
                else if (d.birdCode == that.selectedSpecies[2])
                {
                    return "green"
                }
                else
                {
                    return "black"
                }
            })
            .style("opacity", d => opacityScale(d))
            .on("mouseover", d => {
                //console.log("mousedover", d)
                let name = [that.nameDict[d.birdCode]];
                let output = this.tooltipRender(d);
                let tool = d3.select(".mapTooltip").style("left", d3.event.pageX + 15 + "px")
                                                .style("top", d3.event.pageY + 15 + "px")
                                                .style("opacity", 1)
                tool.selectAll("h1").data(name).join("h1").text(d => d)
                tool.selectAll("h2").data(output).join("h2").text(d => d)
            })
            .on("mouseout", () => d3.select(".mapTooltip").style("opacity", 0))

        if(this.showTrend)
        {
            this.displayTrend();
        }

    }

    displayTrend() {
        let that = this;
        let combinedFreqList = []
        let birdIndexDict = {}
        console.log("Trying to show trend")
        for (var i = 0; i < this.selectedSpecies.length; i++) {
            birdIndexDict[that.selectedSpecies[i]] = i;
        }
        //console.log("birdDict", birdIndexDict, birdIndexDict["Yellow-bellied Sapsucker"])

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

        //console.log("SpeciesDict in Trend", this.speciesDict)
        for (const index in this.selectedSpecies) {
            let bird = this.selectedSpecies[index]
            //console.log(that.speciesDict[bird][2018])

            for(var j = 0; j < that.speciesDict[bird][2018].length; j++)
            {
                if (that.speciesDict[bird][2018][j].count == "X" || that.speciesDict[bird][2018][j].obsDur == "") {
                    continue;
                }
                let freq = +that.speciesDict[bird][2018][j].count * 60 / +that.speciesDict[bird][2018][j].obsDur;
                finalTrend[birdIndexDict[bird]].lat += freq * that.speciesDict[bird][2018][j].lat
                finalTrend[birdIndexDict[bird]].long += freq * that.speciesDict[bird][2018][j].long
                finalTrend[birdIndexDict[bird]].freq += freq
            }
        }
        //console.log("combinedTrend", combinedTrend)
        for (var record in finalTrend) {
            //console.log(record, combinedTrend[record])
            finalTrend[record].lat = finalTrend[record].lat / finalTrend[record].freq
            finalTrend[record].long = finalTrend[record].long / finalTrend[record].freq
            combinedTrend[record].finalYearLat = finalTrend[record].lat
            combinedTrend[record].finalYearLong = finalTrend[record].long
            combinedTrend[record].finalYearFreq = finalTrend[record].freq
            combinedFreqList.push(finalTrend[record].freq)
        }

        for (const index in this.selectedSpecies) {
            let bird = this.selectedSpecies[index]
            //console.log(that.speciesDict[bird][this.activeYear])

            for(var j = 0; j < that.speciesDict[bird][this.activeYear].length; j++)
            {
                if (that.speciesDict[bird][this.activeYear][j].count == "X" || that.speciesDict[bird][this.activeYear][j].obsDur == "") {
                    continue;
                }
                let freq = +that.speciesDict[bird][this.activeYear][j].count * 60 / +that.speciesDict[bird][this.activeYear][j].obsDur;
                currentTrend[birdIndexDict[bird]].lat += freq * that.speciesDict[bird][this.activeYear][j].lat
                currentTrend[birdIndexDict[bird]].long += freq * that.speciesDict[bird][this.activeYear][j].long
                currentTrend[birdIndexDict[bird]].freq += freq
            }
        }
        for (var record in currentTrend) {
            currentTrend[record].lat = currentTrend[record].lat / currentTrend[record].freq
            currentTrend[record].long = currentTrend[record].long / currentTrend[record].freq
            combinedTrend[record].currentYearLat = currentTrend[record].lat
            combinedTrend[record].currentYearLong = currentTrend[record].long
            combinedTrend[record].currentYearFreq = currentTrend[record].freq
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
            .style("opacity", .8)
        //.title(d => d.freq)

        d3.select("#mapSvg").selectAll(".trendEndCircle").data(finalTrend).join("circle")
            .attr("class", "trendEndCircle")
            .attr("cx", d => that.projection([d.long, d.lat])[0])
            .attr("cy", d => that.projection([d.long, d.lat])[1])
            .attr("r", d => circleSizer(d.freq))
            .style("fill", "green")
            .style("stroke", "black")
            .style("opacity", .8)
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

    subsetByYear()
    {
        let that = this;
        let newData = []
        for (var i = 0; i < that.selectedSpecies.length; i++) {
            for (var j = 0; j < speciesDict[that.selectedSpecies[i]][that.activeYear].length; j++) {
                newData.push(speciesDict[that.selectedSpecies[i]][that.activeYear][j])
            }
        }
        return newData;
    }

    /**
    * Draws the slider for the Year Bar
    */
    drawYearBar() {
        let that = this;

        //Slider to change the activeYear of the data
        this.yearScale = d3.scaleLinear().domain([2010, 2018]).range([30, 700]);

        this.yearSlider = d3.select('#activeYear-bar')
            .append('div').classed('slider-wrap', true)
            .append('input').classed('slider', true)
            .attr('type', 'range')
            .attr('min', 2010)
            .attr('max', 2018)
            .attr('value', this.activeYear)

        let sliderLabel = d3.select('.slider-wrap')
            .append('div').classed('slider-label', true)
            .append('svg')
            .attr("width", this.width)
            .attr("height", this.height);

        let sliderText = sliderLabel.append('text').text(this.activeYear);

        sliderText.attr('x', that.yearScale(this.activeYear));
        sliderText.attr('y', 25);

        this.yearSlider.on('input', function () {
            //YOUR CODE HERE
            that.activeYear = this.value;
            d3.select("#activeYear-bar").select(".slider-wrap").select(".slider-label").select("text").attr("x", that.yearScale(that.activeYear) - 0).text(that.activeYear)
            that.updateMap(that.selectedSpecies);

        });
    }

    setYear(year)
    {
        let that = this;
        this.activeYear = year;
        d3.select(".slider").attr("value", year)
        d3.select("#activeYear-bar").select(".slider-wrap").select(".slider-label").select("text").attr("x", that.yearScale(that.activeYear)).text(that.activeYear)
        that.updateMap(that.selectedSpecies);
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
            .attr("x", (d, i) => i * 125)
            .attr("class", d => d.type)
            .on("click", d => d3.select(".brushGroup").call(brush.move, [seasonScale(d.start), seasonScale(d.end)]));
        seasonRectGroup.selectAll("text")
            .data(tempData)
            .join("text")
            .attr("x", (d, i) => i * 125)
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
                if (selection != null) {
                    //Check how much was brushed
                    that.activeSeason = [seasonScale.invert(left), seasonScale.invert(right)]
                    console.log("active season", that.activeSeason);
                    //that.selectedData = that.speciesDict[][that.activeYear]
                }
                
            })
            .on("end", () => {
                //console.log("Brushing Complete", d3.event.selection)
                if (d3.event.selection == null) {
                    that.activeSeason = [new Date(that.activeYear, 0, 1), new Date(that.activeYear + 1, 0, 1)]
                    //that.selectedData = that.speciesDict[that.activeYear]
                }
                else {
                    const [left, right] = d3.event.selection;
                    that.activeSeason = [seasonScale.invert(left), seasonScale.invert(right)]
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

    tooltipRender(d) {
        let location = "County: " + d.countyID;
        let tempCount = +d.count;
        let tempDur = +d.obsDur;
        if(d.count == "X")
        {
            tempCount = 0;
        } 
        if(d.obsDur == "")
        {
            tempDur = 300;
        }
        let freq = tempCount * 60 / tempDur;
        let freqText = "Expected birds seen per hour: " + freq.toFixed(3);
        return [location, freqText];
    }

}

