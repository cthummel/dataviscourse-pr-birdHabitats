<template>
    <div id="lineChart">


    </div>
</template>

<script>


    export default {
        name: 'lineChart',
        props: {
            selectedSpecies: null,
        },

        data() {
            return {
                yearDict: null,
                freqDict: null,
                activeSeason:[new Date(this.activeYear, 0, 1), new Date(this.activeYear, 11, 31)],
                lineChartXScale: null,
                lineChartYScale: null,
                margin: {top: 20, right: 10, bottom: 20, left: 10},
                width: null,
                height: null,
            }
        },

        methods: {



            initLineChart() {
                let freqMax = d3.max(freqDict)

                this.lineChartXScale = d3.scaleLinear().domain([0, 7]).range([0, this.width]);
                let lineChartXAxis = d3.axisBottom().scale(lineChartXScale).tickFormat(d => d + 2012)
                d3.select("#lineChartSvg").append("g")
                                          .attr("transform", "translate(0, " + this.height + ")")
                                          .attr("class", "lineChartXAxis")
                                          .call(lineChartXAxis)

                this.lineChartYScale = d3.scaleLinear().domain([0, freqMax]).range([this.height, 0]);
                let lineChartYAxis = d3.axisLeft().scale(lineChartYScale)
                d3.select("#lineChartSvg").append("g")
                                          .attr("class", "lineChartYAxis")
                                          .call(lineChartYAxis)
                                
            },

            /**
             * Update the line chart with a new subset of data.
             */
            updateLineChart(){
                let that = this;

                //Update the Y axis
                let freqMax = d3.max(freqDict)
                this.lineChartYScale = d3.scaleLinear().domain([0, freqMax]).range([this.height, 0]);
                let lineChartYAxis = d3.axisBottom().scale(lineChartYScale)
                d3.select(".lineChartYAxis").call(lineChartYAxis)

                //Line generator to convert frequency data into a path.
                var lineGenerator = d3.line()
                                      .x(d => that.lineChartXScale(d.year))
                                      .y(d => that.lineChartYScale(d.freq))
                                      .curve(d3.curveMonotoneX)

                //Update path
                svg.append("path").data(dataset) 
                                  .attr("class", "line") 
                                  .attr("d", d => lineGenerator(d))
                                  .on("click", console.log("select this bird now pls"))

                //Generate circles for the year data 
                svg.selectAll(".dot").data(dataset).join("circle")
                                     .attr("class", "lineChartCircle") 
                                     .attr("cx", d => that.lineChartXScale(d.year))
                                     .attr("cy", d => that.lineChartYScale(d.freq))
                                     .attr("r", 5)
                                     .on("click", console.log("select this bird now pls"))

            },

            /**
             * Adds the yearly frequency for each bird selected.
             */
            updateFreqDict(yearDataSet){
                

            },

            buildBubbleChart() {

            },

        },

        mounted() {
            this.width = 700 - this.margin.left - this.margin.right;
            this.height = 650 - this.margin.top - this.margin.bottom;
            d3.select("#lineChart").append("svg")
                                   .attr("width", this.width + this.margin.left + this.margin.right)
                                   .attr("height", this.height + this.margin.top + this.margin.bottom)
            this.initLineChart()
        },

        watch: {

            selectedSpecies: function () {
                this.buildBubbleChart();
            },

            selectedYear: function(){
                this.buildBubbleChart();
            }

        }


    }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>

    #lineChart{
        overflow: hidden;
    }



</style>

