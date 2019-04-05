var JSZip = require('jszip');
var Docxtemplater = require('docxtemplater');
var express = require('express');
var Query = require('node-mysql-ejq');
var axios = require('axios');
var router = express.Router();
var mysql = require('mysql');
var con = mysql.createConnection(config.db);
var query = new Query(con);

var fs = require('fs');
var path = require('path');

router.post('/asdf', async function(req, res){
    //Load the docx file as a binary
    var content = fs.readFileSync(path.resolve('../html/doc', 'Образец Договора 2019.docx'), 'binary');
    
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
    var huinya = fs.writeFileSync(path.resolve(`../html/doc`, `Договор № ${req.body.number}.docx`), buf);
    console.log(url)

    res.send();

});

var pidarok = {};

router.post('/test', async function(req, res){
    try{
        var axi = await axios('https://azim.amocrm.ru/private/api/auth.php?type=json', {
            method: 'post',
            withCredentials: true,
            data: {
                USER_LOGIN: 'sd@aziaimport.kz',
                USER_HASH: '8d287fef2df5800f515f0261353a4a8c'
            }
        });
        if(axi.data.response.auth){
            token = axi.headers['set-cookie'][0].split(' ')[0].split('=')[1].split(';')[0]
            res.send()
        } else {
            res.status(401).send()
        }
        console.log(req.body)
        if (req.body['leads[add][0][id]']) {   
            var result = await axios.get(`https://azim.amocrm.ru/api/v2/leads?id=${req.body['leads[add][0][id]']}`,{
                headers:{
                    Cookie: `session_id=${token}`
                }
            });
            var row = result.data._embedded.items[0];
            console.log(row)
            for(var i=0; i<row.custom_fields.length; i++){
                for(var x=0; x<row.custom_fields[i].values.length; x++){
                    if(row.custom_fields[i].values[x].value){
                        let name = null;
                        switch(row.custom_fields[i].name){
                            case 'Регион' : 
                            {
                                var select = await con.query(`SELECT 
                                                                short_name
                                                            FROM
                                                                dich
                                                            WHERE
                                                                name = '${row.custom_fields[i].values[0].value}'`)
                            name = 'reg'; 
                            row.custom_fields[i].values[x].value = select[0].short_name;
                            }
                            break;
                            case 'Наименование предприятия': name = 'com_name'; break;
                            case 'Ф.И.О Директора': name = 'client_name'; break;
                            case 'Ф.И.О Директора в род. падеже': name = 'client_name_rod'; break;
                            case 'Действует на основании': name = 'client_root_doc'; break;
                            case 'БИН/ИИН': name = 'bin'; break;
                            case 'СЧЕТ(ИИК)': name = 'iik'; break;
                            case 'Банк': name = 'bank'; break;
                            case 'Юр. Адрес': name = 'law_address'; break;
                        }
                        pidarok[name] = row.custom_fields[i].values[x].value;
                    }
                }
            }

            var content = fs.readFileSync(path.resolve('../html/doc', 'asdf.docx'), 'binary');
            pidarok.year = new Date().getUTCFullYear();
            pidarok.month = getFullMonth(new Date().getUTCMonth());
            pidarok.day = new Date().getUTCDate();
            var insert = await con.query(`INSERT INTO
                                            docum(name)
                                        VALUES (?)`, [`Договор № ${pidarok.reg}-${pidarok.year}.docx`]);
            var zip = new JSZip(content);
            var doc = new Docxtemplater();
            doc.loadZip(zip);
            pidarok.count = insert.insertId;
            doc.setData(
                pidarok
            );

            try {
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
                throw error;
            }

            var buf = doc.getZip().generate({type: 'nodebuffer'});
            var huinya = fs.writeFileSync(path.resolve(`../html/doc`, `Договор № ${pidarok.bin}.docx`), buf);
        }
        var url = new URL(`http://crm.aziaimport.kz:3000/word/doc`)
        var add = [{
            element_id: row.id,
            element_type: "2",
            text: url,
            note_type: "4",
            created_at: new Date(Date.now()),
            responsible_user_id: row.resp_user_id,
            created_by: row.created_by
        }]
        
        var asdf = await axios('https://azim.amocrm.ru/api/v2/notes', {
            method: 'post',
            withCredentials: true,
            headers:{
                Cookie: `session_id=${token}`,
                'Content-Type': 'application/json'
            },
            data: {
                add: add
            }
        }, function (error, response, body){
            if(error){
                console.log('error',error)
            }
            console.log('response',response);
        });   
       
        // console.log('сюда даже не доходит')

        res.status(200).send();
    }catch(e){
        console.log(e);
        res.status(500).send(e);
    }
});

router.get('/doc', async function(req, res){
    try{
        res.download(`../html/doc/Договор № ${pidarok.bin}.docx`);
    }catch(e){
        console.log(e);
        res.status(500).send(e);
    }
})

let getFullMonth = month => {
 switch(month){
  case 0: return 'Января'; break;
  case 1: return 'Февраля'; break;
  case 2: return ' Марта'; break;
  case 3: return 'Апреля'; break;
  case 4: return 'Мая'; break;
  case 5: return 'Июня'; break;
  case 6: return 'Июля'; break;
  case 7: return 'Августа'; break;
  case 8: return 'Сентября'; break;
  case 9: return 'Октября'; break;
  case 10: return 'Ноября'; break;
  case 11: return 'Декабря'; break;
 }
}

module.exports = router;