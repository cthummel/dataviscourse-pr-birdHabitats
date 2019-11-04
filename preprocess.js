//thank gosh d3 properly handles the whitespace
d3.dsv("\t", "data/smallTest.txt", function(d) {

    return {
        commonName: d['COMMON NAME'],
        lat: d.LATITUDE,
        long: d.LONGITUDE,
        count: d['OBSERVATION COUNT']
    };

}).then(function(data) {
    let map = new Map(data);
});
