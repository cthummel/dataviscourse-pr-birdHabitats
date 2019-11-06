<template>
    <div id="parallelCoords">


        <svg width="800" height="1000" id="parallelCoordsSvg"></svg>


    </div>
</template>

<script>


    export default {
        name: 'ParallelCoords',
        props: {
            selectedSpecies: null,

        },

        data() {
            return {

            }
        },

        methods: {


            buildParallelCoords() {

            },

        },

        mounted() {

        },

        watch: {

            selectedSpecies: function () {
                this.buildParallelCoords();
            },

            selectedYear: function(){
                this.buildParallelCoords();
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

