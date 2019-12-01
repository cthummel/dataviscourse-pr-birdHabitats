<template>
    <div id="Map">
        <button class="trendButton">Show Trend</button>
        <div id="speciesObservationalFreqs">

            <ul>
                <li v-for="f in selectedFrequencies">
                    Total Observation Frequency for {{f.name}}: {{ (f.count * 60 /f.obsDur).toFixed(3) }} (birds/hour)
                </li>
            </ul>

        </div>
        <svg id="mapSvg">


        </svg>
        <div id="seasonDiv">
        </div>

        <div id="activeYear-bar">

        </div>
    </div>
</template>

<script>


    import {seasonalData} from './../../js/seasonalData'


    export default {
        name: 'Map',

        props: {
            selectedSpecies: null,
        },

        data() {
            return {
                selectedFrequencies: null,
                activeYear: 2012,
                selectedData: null,
                width: 700,
                height: 650,
                projection: null,
                selectedDate: null,
                file: null,
                files: null,
                yearDict: null,
                speciesDict: null,
                initBool: null,
                showTrend: false,
                fileMap: {
                    "Yellow-bellied Sapsucker": {file: "data/yebsap50k.json",color: "blue"},
                    "Rufous Hummingbird": {file: "data/rufhum50k.json", color: "red"},
                    "Henslow's Sparrow": {file: "data/henspa.json", color: "green"}
                }

            }
        },
        methods: {
            initMap() {

                let self = this;

                console.log("initMap");

                let svg = d3.select("#mapSvg")
                    .attr("width", self.width)
                    .attr("height", self.height);

                d3.select(".trendButton").on("click", function(){
                    if(self.showTrend)
                    {
                        self.hideTrend()
                        self.showTrend = false;
                    }
                    else
                    {
                        if(self.selectedSpecies.length != 0)
                        {
                            self.displayTrend()
                            self.showTrend = true;
                        }
                    }
                })


                let mercProj = d3.geoAlbers()
                    .center([-10, 45])
                    .rotate([105, 0])
                    .parallels([35, 55])
                    .scale(400)
                    .translate([self.width / 2, self.height / 2]);

                this.projection = mercProj;

                let path = d3.geoPath()
                    .projection(mercProj);

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
            },


            getColorFromName(name){

                //console.log(name);
                if(name === "Yellow-bellied Sapsucker"){
                    return "blue";
                }
                else if(name === "Rufous Hummingbird"){
                    return "red";
                }
                else if (name == "Henslow's Sparrow")
                {
                    return "green"
                }
                else
                {
                    return "black";
                }
            },

            rebuildFromSelectedData(data) {

                let self = this;


                let mercProj = d3.geoAlbers()
                    .center([-10, 45])
                    .rotate([105, 0])
                    .parallels([35, 55])
                    .scale(400)
                    .translate([self.width / 2, self.height / 2]);


                //
                // let maxObs = d3.max(self.selectedData, function(d) { return +d.count;} );
                //
                // console.log("maxObs", maxObs);


                let totalCount = 0;
                let totalDur = 0;

                self.selectedFrequencies = [];

                for(let i = 0; i < self.selectedSpecies.length; i++){
                    self.selectedFrequencies.push({name: self.selectedSpecies[i],count: 0, obsDur: 0});
                }


                let obsScale = function (d) {

                    let count = isNaN(parseInt(d.count)) ? 0 : parseInt(d.count);
                   let  obsDur = isNaN(parseInt(d.obsDur)) ? 0 : parseInt(d.obsDur);

                   let index = self.selectedSpecies.indexOf(d.commonName);
                    self.selectedFrequencies[index].count += count;
                    self.selectedFrequencies[index].obsDur += obsDur;

                    let opac =  count / obsDur;
                    return opac;
                };


                let svg = d3.select("#mapSvg");


                svg.selectAll("circle")
                    .data(data)
                    .join("circle")
                    .attr("cx", d => {
                        return mercProj([d.long, d.lat])[0];
                    })
                    .attr("cy", d => {
                        return mercProj([d.long, d.lat])[1];
                    })
                    .attr("r", 5)

                    .style("fill", d =>{
                       return self.getColorFromName(d.commonName);

                    })
                    .style("opacity", d => obsScale(d))
                    .on("mouseover", d => console.log("Observation count:", d.count));

                let totalFreq = totalCount/totalDur;

                console.log("totalCount, totalDur", totalCount, totalDur, totalFreq);

            },


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
            },

            drawSeason: function () {
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
                        else
                        {
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
                        if(d3.event.selection == null)
                        {
                            that.activeSeason = [new Date(that.activeYear, 0, 1), new Date(that.activeYear, 11, 31)]
                            that.selectedData = that.yearDict[that.activeYear]
                        }
                        else
                        {
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
            },

            /**
             * Called when bird changes in case seasonal data is different.
             */
            updateSeasonalDisplay: function (seasonalData) {
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
            },

            filterDataByYear(value) {
                if(value.hasOwnProperty(this.activeYear)){

                    return value[this.activeYear];

                }
            },


            /**
             * Draws the slider for the Year Bar
             */
            drawYearBar: function () {
                let that = this;

                //Slider to change the activeYear of the data
                let yearScale = d3.scaleLinear().domain([2012, 2018]).range([30, 700]);

                let yearSlider = d3.select('#activeYear-bar')
                    .append('div').classed('slider-wrap', true)
                    .append('input').classed('slider', true)
                    .attr('type', 'range')
                    .attr('min', 2012)
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
            },

            buildYearDict(data) {

                let yearsGen = function (start, stop) {

                    let years = [];
                    while (start <= stop) {
                        years.push(start++);
                    }
                    return years;
                };

                let yearDict = {};

                let years = yearsGen(2008, 2018);

                for (let i = 0; i < years.length; i++) {

                    let yearObservations = data.filter(d => d.date.slice(0, 4) === years[i].toString());
                    console.log("yearObservations.length", yearObservations.length)
                    yearDict[years[i]] = yearObservations.slice(0, yearObservations.length);

                }

                console.log("yearDict", yearDict);
                this.yearDict = yearDict;
                return yearDict;


            },

            getFileFromSpecies(species) {

                let file = "";

                if (this.fileMap.hasOwnProperty(species)) {
                    file = this.fileMap[species].file;

                }
                return file;
            },

            sendDataBackToApp: function(data)
            {
                console.log("before sending", data)
                this.$emit('update-species-dict', data)
            },

            initSelectedData: function () {

                let self = this;


                this.selectedData = [];


                let values = Object.values(this.speciesDict);

                for(let i = 0; i < values.length; i++){
                    let v = values[i];

                    let data = this.filterDataByYear(v);

                    for(let j = 0; j < data.length; j++){
                        this.selectedData.push(data[j]);
                    }
                }
            },

            buildSpeciesDict(speciesList) {


                let self = this;
                console.log("speciesList", speciesList);


                let promises = [];

                self.speciesDict = {};

                for (let i = 0; i < speciesList.length; i++) {
                    let species = speciesList[i];
                    let file = this.getFileFromSpecies(species);

                    let p = new Promise((resolve) => {
                        d3.json(file).then(function (data) {
                            //console.log("data", data);
                            // data = self.filterByObsDur(data);

                            if (self.speciesDict.hasOwnProperty(file)) {

                            } else {
                                let yearDict = self.buildYearDict(data);
                                resolve(self.speciesDict[species] = yearDict);
                            }

                        });
                    });

                    promises.push(p);
                }

                Promise.all(promises).then(values => {
                    console.log(values);
                    self.initBool = true;// [3, 1337, "foo"]
                    self.initSelectedData();
                });

                this.sendDataBackToApp(this.speciesDict)
            },

            filterByObsDur(data) {

                let newData = data.filter(d => parseInt(d.obsDur) < "120");

                return newData;


            },

            displayTrend()
            {
                let that = this;
                let combinedFreqList = []
                let birdIndexDict = {}
                for(var i = 0; i < this.selectedSpecies.length; i++)
                {
                    birdIndexDict[that.selectedSpecies[i]] = i; 
                }
                console.log("birdDict", birdIndexDict, birdIndexDict["Yellow-bellied Sapsucker"])

                let mercProj = d3.geoAlbers()
                    .center([-10, 45])
                    .rotate([105, 0])
                    .parallels([35, 55])
                    .scale(400)
                    .translate([self.width / 2, self.height / 2]);

                let circleSizer = function(d) {
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
                

                for(const bird in this.yearDict[2018])
                {
                    if (that.yearDict[2018][bird].count == "X" || that.yearDict[2018][bird].obsDur == "")
                    {
                        continue;
                    }
                    let freq = +that.yearDict[2018][bird].count * 60 / +that.yearDict[2018][bird].obsDur;
                    finalTrend[birdIndexDict[that.yearDict[2018][bird].commonName]].lat  += freq * that.yearDict[2018][bird].lat 
                    finalTrend[birdIndexDict[that.yearDict[2018][bird].commonName]].long += freq * that.yearDict[2018][bird].long 
                    finalTrend[birdIndexDict[that.yearDict[2018][bird].commonName]].freq += freq 
                }
                for(var record in finalTrend)
                {
                    finalTrend[record].lat = finalTrend[record].lat / finalTrend[record].freq
                    finalTrend[record].long = finalTrend[record].long / finalTrend[record].freq
                    combinedTrend[birdIndexDict[finalTrend[record].name]].finalYearLat = finalTrend[record].lat
                    combinedTrend[birdIndexDict[finalTrend[record].name]].finalYearLong = finalTrend[record].long
                    combinedTrend[birdIndexDict[finalTrend[record].name]].finalYearFreq = finalTrend[record].freq
                    combinedFreqList.push(finalTrend[record].freq)
                }
                
                for(const bird in this.selectedData)
                {
                    if (that.selectedData[bird].count == "X" || that.selectedData[bird].obsDur == "")
                    {
                        continue;
                    }
                    let freq = +that.selectedData[bird].count * 60 / +that.selectedData[bird].obsDur;
                    currentTrend[birdIndexDict[that.selectedData[bird].commonName]].lat += freq * that.selectedData[bird].lat 
                    currentTrend[birdIndexDict[that.selectedData[bird].commonName]].long += freq * that.selectedData[bird].long 
                    currentTrend[birdIndexDict[that.selectedData[bird].commonName]].freq += freq 
                }
                for(var record in currentTrend)
                {
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

            },

            hideTrend()
            {
                d3.selectAll(".trendLine").remove()
                d3.selectAll(".trendStartCircle").remove()
                d3.selectAll(".trendEndCircle").remove()
                d3.select(".trendButton").text("Show Trend")
            },
        },

            beforeMount() {
                console.log("before mount");


            },
            mounted() {
                console.log("map mounted");
                this.initMap();
                this.initializeSliders();
                this.activeYear = 2012;


            },
            watch: {
                selectedSpecies: function () {
                    this.buildSpeciesDict(this.selectedSpecies);
                },

                activeYear: function () {
                    if (this.initBool) {
                        this.initSelectedData();
                    }
                    if(this.showTrend)
                    {
                        this.displayTrend();
                    }
                },


                selectedData: function () {

                    let data = this.selectedData
                    this.rebuildFromSelectedData(data);
                    if (this.showTrend)
                    {
                        this.displayTrend();
                    }

                }


            }
        }
</script>

<style>

    .year-round {
        fill: lightgreen;
    }

    .breeding {
        fill: aqua;
    }

    .pre-migration {
        fill: coral;
    }

    .post-migration {
        fill: hotpink;
    }

    #seasonDiv {
        margin-left: 50px;
    }

    .slider {
        -webkit-appearance: none;
        width: 725px;
        height: 15px;
        border-radius: 5px;
        background: #d3d3d3;
        outline: none;
        opacity: 0.7;
        -webkit-transition: .2s;
        transition: opacity .2s;
        margin-left: 20px
    }

    .slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 25px;
        height: 25px;
        border-radius: 50%;
        background: #4CAF50;
        cursor: pointer;
    }

    .slider::-moz-range-thumb {
        width: 25px;
        height: 25px;
        border-radius: 50%;
        background: #D4E157;
        cursor: pointer;
    }

    .slider:hover {
        opacity: 1;
    }

    .slider-label svg {
        width: 750px;
        height: 35px;
    }

    .slider-label svg text {
        text-anchor: middle;
    }

    .slider-wrap {
        display: inline-block;
        float: left;
        width: 750px;
        margin-left: 50px;
    }
    .trendButton {
        background: white;
        border: 2px solid rgb(16, 126, 252);
        border-radius: 6px;
        color: rgb(16, 126, 252);
        padding: 20px;
        text-align: center;
        text-decoration: none;
        display: inline-block;
        font-size: 16px;
        margin: 4px 2px;
        width: 150px;
    }
    .trendButton:hover {
        background: rgb(16, 126, 252);
        color: white;
    }

</style>


