<template>
    <div id="lineChart">


    </div>
</template>

<script>


    export default {
        name: 'lineChart',
        props: {
            selectedSpecies: null,
            speciesDict: null,
        },

        data() {
            return {
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


            /**
             * Initialize values on start up for the line chart display.
             */
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
                d3.select("#lineChartSvg").append("path").data(dataset) 
                                          .attr("class", "line") 
                                          .attr("d", d => lineGenerator(d))
                                          .on("click", console.log("select this bird now pls"))

                //Generate circles for the year data 
                d3.select("#lineChartSvg").selectAll(".lineChartCircle").data(dataset).join("circle")
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
                let that = this
                let birdIndexDict = {}
                let newFreqDict = {}
                for(var i = 0; i < this.selectedSpecies.length; i++)
                {
                    birdIndexDict[that.selectedSpecies[i]] = i; 
                }

                for(var i = 2012; i < this.speciesDict.length + 2012; i++)
                {
                    for(var j = 0; j < that.selectedSpecies.length; j++)
                    {
                        let temp = that.speciesDict[selectedSpecies[j]].filter(d => {if (d.commonName == selectedSpecies[j]){return true}else{return false}})
                        let birdFreq = 0;
                        for(var k = 0; k < temp.length; k++)
                        {
                            birdFreq += +temp[k].count * 60 / +temp[k].obsDur;
                        }
                        birdFreq = birdFreq / temp.length;
                        mew
                    }
                }

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
                                   .append("g")
                                   .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")")
                                   .attr("id", "lineChartSvg")


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
    .line:hover{
        stroke-width: 10px
    }



</style>

