var JSZip = require('jszip');
var Docxtemplater = require('docxtemplater');
var express = require('express');
var router = express.Router();

var fs = require('fs');
var path = require('path');

router.post('/test', async function(req, res){
    //Load the docx file as a binary
    var content = fs
        .readFileSync(path.resolve(__dirname, 'Образец Договора 2019.DOCX'), 'binary');

    var zip = new JSZip(content);

    var doc = new Docxtemplater();
    doc.loadZip(zip);

    //set the templateVariables
    doc.setData({
        number: req.body.number,
        day: req.body.day,
        month: req.body.month,
        year: req.body.year
    });

    try {
        // render the document (replace all occurences of {first_name} by John, {last_name} by Doe, ...)
        doc.render()
    }
    catch (error) {
        var e = {
            message: error.message,
            name: error.name,
            stack: error.stack,
            properties: error.properties,
        }
        console.log(JSON.stringify({error: e}));
        // The error thrown here contains additional information when logged with JSON.stringify (it contains a property object).
        throw error;
    }

    var buf = doc.getZip()
                 .generate({type: 'nodebuffer'});

    // buf is a nodejs buffer, you can either write it to a file or do anything else with it.
    res.send(fs.writeFileSync(path.resolve(__dirname, 'output.docx'), buf));

})

module.exports = router;