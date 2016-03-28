define('UI', ['Tools'], function(_) {
   
    return {
        showAbbreviations: showAbbreviations
    };


    function showAbbreviations(abbreviations) {

        if (!abbreviations) return;

        var table = _.getDomElement('abbreviation').getElementsByTagName('table')[0];

        for (name in abbreviations) {
            table.appendChild(
                _.createDomElement({
                    tag: 'tr',
                    children: [
                        _.createDomElement({
                            tag: 'td',
                            children: [ _.createTextNode(name) ]
                        }),
                        _.createDomElement({
                            tag: 'td',
                            children: [
                                _.createDomElement({
                                    tag: 'input',
                                    attributes: { 'value': abbreviations[name] }
                                })
                            ]
                        })
                    ]
                })
            );
        }

    }

});