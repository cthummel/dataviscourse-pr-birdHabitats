<template>
    <div id="bubbleChart">


        <svg width="800" height="1000" id="bubbleSvg"></svg>


    </div>
</template>

<script>


    export default {
        name: 'BubbleChart',
        props: {
            selectedSpecies: null,

        },

        data() {
            return {

            }
        },

        methods: {



            initScales() {

            },


            buildBubbleChart() {

            },

        },

        mounted() {

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
<style scoped>

    #bubbleChart{
        overflow: hidden;
    }



</style>

