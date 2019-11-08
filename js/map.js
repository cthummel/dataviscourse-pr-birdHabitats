class seasonalData{
    /**
     * @param type Type of season for the bird
     * @param start Date of start of season
     * @param end Date of end of season 
     */
    constructor(type, start, end)
    {
        this.type = type;
        this.start = start;
        this.end = end;
    }
}


class Map {

    constructor(data) {
        this.data = data;
        this.projection = null;
        this.activeYear = 2016;
        this.activeSeason = [new Date(this.activeYear, 0, 1), new Date(this.activeYear, 11, 31)]
        this.width = 750;
        this.height = 650;

        console.log(this.activeSeason[0])

        this.initMap();
        this.initializeSliders()
    }

    initMap() {

        //bind 'this' context to variable so we can use Map class variables inside promise
        let self = this;

        d3.json("data/custom.geo.json")
            .then(function (json) {
                {
                    let projection = d3.geoAlbersUsa()
                        .translate([self.width / 2, self.height / 2])
                        .scale([1000]);

                    let mercProj = d3.geoAlbers()
                                .center([-10, 45])
                                .rotate([105, 0])
                                .parallels([35, 55])
                                .scale(500)
                                .translate([self.width / 2, self.height / 2]);


                    let path = d3.geoPath()
                        .projection(mercProj);

                    let svg = d3.select("#mapSvg")
                        .attr("width", self.width)
                        .attr("height", self.height);

                    let maxObs = d3.max(self.data, function(d) { return +d.count;} );

                    console.log("maxObs", maxObs);


                    let obsScale = function(count){

                        if(typeof count !== "number")
                        {
                            return 1/maxObs*2;
                        }
                        else{
                            return count/maxObs*2;
                        }
                    }

                    //Could something like this work for the opacity scale?
                    //let tempScale = d3.scaleLinear().domain([minObs, maxObs]).range([.2, 1]);

                    svg.selectAll("path")
                        .data(json.features)
                        .enter()
                        .append("path")
                        .attr("d", path)
                        .style("fill", "white")
                        .style("stroke", "black")
                        .style("stroke-width", "1");

                    svg.selectAll("circle")
                        .data(self.data)
                        .join("circle")

                        .attr("cx", function (d) {
                            return mercProj([d.long, d.lat])[0];
                        })
                        .attr("cy", function (d) {
                            return mercProj([d.long, d.lat])[1];
                        })
                        .attr("r", 5)
                        .style("fill", "blue")
                        .style("opacity", d => obsScale(d.count))
                        .on("mouseover", d => console.log("Observation count:", d.count));
                }
            });
    }

    /**
     * Initializes the slider and brush for the map
     */
    initializeSliders()
    {
        d3.select("body").append("div").attr("id", "seasonDiv")
                         .append("svg")
                         .attr("width", this.width)
                         .attr("height", 150).attr("id", "seasonSVG")
                         .attr("translate", "transform(0, " + this.height + ")");

        d3.select('body')
          .append('div').attr('id', 'activeYear-bar');


        this.drawSeason();
        this.drawYearBar();
    }

    /**
     * Initializes the season visualization. Run this on startup.
     */
    drawSeason()
    {
        let that = this;
        //let monthDict = {0: "January", 1: "Februrary", 2: "March", 3: "April", 4: "May", 5: "June", 6: "July", 7: "August", 8: "September", 9: "October", 10: "November", 11: "December"}
        let monthDict = {0: "Jan", 1: "Feb", 2: "Mar", 3: "Apr", 4: "May", 5: "Jun", 6: "Jul", 7: "Aug", 8: "Sept", 9: "Oct", 10: "Nov", 11: "Dec"}
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
                       .attr("x", (d,i) => i * 100)
                       .attr("class", d => d.type)
                       .on("click", d => d3.select(".brushGroup").call(brush.move, [seasonScale(d.start), seasonScale(d.end)]));
        seasonRectGroup.selectAll("text")
                       .data(tempData)
                       .join("text")
                       .attr("x", (d,i) => i * 100)
                       .attr("y", 45)
                       .style("font-weight", "bold")
                       .text(d => d.type)

        //Build the Axis
        console.log([new Date(this.activeYear, 0, 1), new Date(this.activeYear, 11, 31)])
        let seasonScale = d3.scaleTime().domain([new Date(this.activeYear, 0, 1), new Date(this.activeYear, 11, 31)]).range([25,750])
        let seasonAxis = d3.axisBottom().scale(seasonScale).ticks(11).tickFormat(d => {return monthDict[d.getMonth()]})
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
        let brush = d3.brushX().extent([[0, 0], [that.width, 30]])
                               .on("start", () => {
                                   console.log("Brushing started")
                                   
                               })
                               .on("brush", () => {
                                   console.log("Brushing")
                                   const selection = d3.event.selection;
                                   const [left, right] = selection;
                                   const selectedIndices = [];
                                   if (selection) 
                                   {
                                        //Check how much was brushed.

                                   }
                               })
                               .on("end", () => {
                                   console.log("Brushing Complete", d3.event.selection)
                                   const [left, right] = d3.event.selection;
                                   if(!d3.event.selection)
                                   {
                                        that.activeSeason = [new Date(this.activeYear, 0, 1), new Date(this.activeYear, 11, 31)]
                                   }
                                   else
                                   {
                                       that.activeSeason = [seasonScale.invert(left), seasonScale.invert(right)]
                                       console.log("new season: ", that.activeSeason)
                                   }
                               })

        d3.select("#seasonSVG").append("g").attr("class", "brushGroup").attr("transform", "translate(0, 90)").call(brush)
    }

    /**
     * Called when the year or bird changes in case seasonal data is different.
     */
    updateSeason(seasonalData)
    {
        //Add season selector rectangles
        let seasonRectGroup = d3.select(".selectRect")
        seasonRectGroup.selectAll("rect")
                       .data(seasonalData)
                       .join("rect")
                       .attr("width", 40)
                       .attr("height", 20)
                       .attr("x", (d,i) => i * 100)
                       .attr("class", d => d.type)
                       .on("click", d => d3.select(".brushGroup").call(brush.move, [seasonScale(d.start), seasonScale(d.end)]));
        seasonRectGroup.selectAll("text")
                       .data(seasonalData)
                       .join("text")
                       .attr("x", (d,i) => i * 100)
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


    /**
     * Draws the slider for the Year Bar
     */
    drawYearBar() {
        let that = this;

        //Slider to change the activeYear of the data
        let yearScale = d3.scaleLinear().domain([2004, 2016]).range([30, 730]);

        let yearSlider = d3.select('#activeYear-bar')
            .append('div').classed('slider-wrap', true)
            .append('input').classed('slider', true)
            .attr('type', 'range')
            .attr('min', 2004)
            .attr('max', 2016)
            .attr('value', this.activeYear);

        let sliderLabel = d3.select('.slider-wrap')
            .append('div').classed('slider-label', true)
            .append('svg');

        let sliderText = sliderLabel.append('text').text(this.activeYear);

        sliderText.attr('x', yearScale(this.activeYear));
        sliderText.attr('y', 25);

        yearSlider.on('input', function() {
            //YOUR CODE HERE 
            that.activeYear = this.value;
            d3.select("#activeYear-bar").select(".slider-wrap").select(".slider-label").select("text").attr("x", yearScale(that.activeYear)).text(that.activeYear)
            //that.updatePlot(that.activeYear, xdrop, ydrop, cdrop);
        });
    }

    displayRaster(birdname, displayType)
    {
        if(displayType == "abundance")
        {

        }
        else if(displayType == "range")
        {

        }
        else
        {

        }
    }


}
