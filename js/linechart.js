class lineChart {

    constructor(selectedSpecies, speciesDict) {
        this.selectedSpecies = selectedSpecies;
        this.speciesDict = speciesDict;
        this.map = null
        this.freqDict = [];
        this.circleData = [];
        this.maxFreq = 0;
        this.activeYear = 2010;
        this.activeSeason = [new Date(2010, 0, 1), new Date(2011, 0, 1)];
        this.lineChartXScale = null;
        this.lineChartYScale = null;
        this.margin = { top: 20, right: 20, bottom: 20, left: 40 };
        this.width = 700 - this.margin.left - this.margin.right;
        this.height = 650 - this.margin.top - this.margin.bottom;

        d3.select("#lineChart").append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")")
            .attr("id", "lineChartSvg")

        //this.updateFreqDict();
        this.initLineChart()
        this.updateLineChart(speciesDict)
    }


    initLineChart() {
        let that = this;

        d3.select('#lineChart')
            .append('div')
            .attr("class", "lineChartTooltip")
            .style("opacity", 0);

        this.lineChartXScale = d3.scaleLinear().domain([2010, 2018]).range([0, this.width]);
        let lineChartXAxis = d3.axisBottom().scale(this.lineChartXScale).tickFormat(d => d)
        d3.select("#lineChartSvg").append("g")
            .attr("transform", "translate(0, " + this.height + ")")
            .attr("class", "lineChartXAxis")
            .call(lineChartXAxis)

        this.lineChartYScale = d3.scaleLinear().domain([0, that.freqMax]).range([this.height, 0]);
        let lineChartYAxis = d3.axisLeft().scale(this.lineChartYScale)
        d3.select("#lineChartSvg").append("g")
            .attr("class", "lineChartYAxis")
            .call(lineChartYAxis)

    }

    /**
    * Update the line chart with a new subset of data.
    */
    updateLineChart(data) {
        let that = this;
        this.updateFreqDict(data)
        console.log("new FreqDict", that.freqDict)
        console.log("new circleData", this.circleData)
        console.log("new maxFreq", this.maxFreq)

        //Update the Y axis
        this.lineChartYScale = d3.scaleLinear().domain([0, this.maxFreq]).range([this.height, 0]);
        let lineChartYAxis = d3.axisLeft().scale(that.lineChartYScale)
        d3.select(".lineChartYAxis").call(lineChartYAxis)

        //Line generator to convert frequency data into a path.
        let lineGenerator = d3.line()
            .x(d => that.lineChartXScale(d.year))
            .y(d => that.lineChartYScale(d.freq))
            .curve(d3.curveMonotoneX)

        for(var i = 0; i < this.freqDict.length; i++)
        {
            console.log("adding line", this.freqDict[i])
            this.freqDict[i].line = lineGenerator(this.freqDict[i].data)
        }

        //Update path
        d3.select("#lineChartSvg").selectAll(".lineChartLine").data(that.freqDict).join("path")
            .attr("class", d => "lineChartLine " + d.commonName)
            .attr("d", d => lineGenerator(d.data))
            .style("fill", "none")
            .style("stroke", "black")

        //Generate circles for the year data 
        d3.select("#lineChartSvg").selectAll(".lineChartCircle").data(that.circleData).join("circle")
            .attr("class", "lineChartCircle")
            .attr("cx", d => that.lineChartXScale(d.year))
            .attr("cy", d => that.lineChartYScale(d.freq))
            .attr("r", 5)
            .on("mouseover", d => {
                let name = [d.commonName]
                let output = this.tooltipRender(d);
                let tool = d3.select(".lineChartTooltip").style("left", d3.event.pageX + 15 + "px")
                                                .style("top", d3.event.pageY + 15 + "px")
                                                .style("opacity", 1)
                tool.selectAll("h1").data(name).join("h1").text(d => d)
                tool.selectAll("h2").data(output).join("h2").text(d => d)
            })
            .on("mouseout", () => d3.select(".lineChartTooltip").style("opacity", 0))
            .on("click", d => d3.selectAll("lineChartLine " + d.commonName).classed("selected", true))

    }

    /**
    * Adds the yearly frequency for each bird selected.
    */
    updateFreqDict(data) {
        let that = this
        let max = 0;
        let tempFreqDict = [];
        this.selectedSpecies.map(function (element) {
            tempFreqDict.push ({
                "commonName": element,
                //"year": [],
                //"freq": [],
                "data": [],
                "line": "d"
            })
        })

        this.selectedSpecies.map(function (element, index) {
            for (var i = 0; i < Object.keys(data[element]).length; i++) {
                let currentYear = Object.keys(data[element])[i];
                let temp = data[element][currentYear]//.filter(d => {if (d.commonName == selectedSpecies[j]){return true}else{return false}})
                //console.log("temp", temp)
                let birdFreq = 0;
                let nonFaultyBirdCount = 0;
                for (var k = 0; k < temp.length; k++) {
                    if(temp[k].count != "X" && +temp[k].obsDur > 120)
                    {
                        birdFreq += +temp[k].count * 60 / +temp[k].obsDur;
                        nonFaultyBirdCount++;
                    }
                    else
                    {
                        //console.log("faulty data", temp[k].count, +temp[k].obsDur)
                    }
                }
                if (max < birdFreq / nonFaultyBirdCount) {
                    max = birdFreq / nonFaultyBirdCount;
                }
                that.circleData.push({"year": currentYear, "freq": birdFreq / nonFaultyBirdCount, "commonName": element})
                //tempFreqDict[index].year.push(currentYear)
                //tempFreqDict[index].freq.push(birdFreq / nonFaultyBirdCount)
                tempFreqDict[index].data.push({ "year": currentYear, "freq": birdFreq / nonFaultyBirdCount})
            }
        })
        

        this.maxFreq = max;
        this.freqDict = tempFreqDict;
    }

    setMap(map) {
        this.map = map;
    }

    tooltipRender(d) {
        let year = "Current Year: " + d.year;
        let freq = "Expected birds seen per hour: " + d.freq.toFixed(3);
        return [year, freq];
    }

}
