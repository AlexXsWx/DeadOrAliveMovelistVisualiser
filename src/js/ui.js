define('ui', ['d3'], function(d3) {
   
    return {
        showAbbreviations: showAbbreviations
    };


    function showAbbreviations(abbreviations) {

        if (!abbreviations) return;

        var table = d3.select('#abbreviations table');

        for (name in abbreviations) {
            var row = table.append('tr');
            row.append('td').text(name);
            row.append('td').append('input').node().value = abbreviations[name];
        }

    }

});