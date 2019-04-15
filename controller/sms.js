var mysql = require('mysql');
var util = require('util');
var axios = require('axios');
var express = require('express');
var config = require('../config/config');
var urlencode = require('urlencode');
var con = mysql.createConnection(config.db);

con.query = util.promisify(con.query)

var router = express.Router();

router.post('/send1', async function(req, res){
	var text = '';
	var phone = '';
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
			console.log(token)
			res.send()
		} else {
			res.status(401).send()
		}
		if(req.body['leads[add][0][id]']){
            var result = await axios.get(`https://azim.amocrm.ru/api/v2/leads?id=${req.body['leads[add][0][id]']}`,{
				headers: {
					Cookie: `session_id=${token}`
				},
				withCredentials: true
            });
            var row = result.data._embedded.items[0];
            if(row.main_contact.id){
            	
	            var contact = await axios.get(`https://azim.amocrm.ru/api/v2/contacts?id=${row.main_contact.id}`,{
						headers: {
							Cookie: `session_id=${token}`
						},
						withCredentials: true
	            	});
	            var contactRow = contact.data._embedded.items[0];
	            for(var i = 0; i < contactRow.custom_fields.length; i++){
	            	if(contactRow.custom_fields[i].values[j]){
	            		for(var j = 0; i < contactRow.custom_fields[i].values.length; j++){
		            		if(contactRow.custom_fields[i].id == 2082){
		            			phone = contactRow.custom_fields[i].values[j].value;

	            			}
	            		}
	            	}
	            }
	        }
	        text = `Здравствуйте ${contactRow.name}! Произведена оплата поставщику ${row.name}. С уважением AZIA IMPORT.`;
        }else if(req.body['leads[status][0][old_status_id]']){
        	var result = await axios.get(`https://azim.amocrm.ru/api/v2/leads?id=${req.body['leads[status][0][id]']}`,{
				headers: {
					Cookie: `session_id=${token}`
				},
				withCredentials: true
            });
            var row = result.data._embedded.items[0];
            if(row.main_contact.id){            	
	            var contact = await axios.get(`https://azim.amocrm.ru/api/v2/contacts?id=${row.main_contact.id}`,{
						headers: {
							Cookie: `session_id=${token}`
						},
						withCredentials: true
	            	});
	            var contactRow = contact.data._embedded.items[0];
	            for(var i = 0; i < contactRow.custom_fields.length; i++){
            		for(var j = 0; j < contactRow.custom_fields[i].values.length; j++){
            			if(contactRow.custom_fields[i].values[j]){
		            		if(contactRow.custom_fields[i].id == 2082){
		            			var phone = contactRow.custom_fields[i].values[j].value;
	            			}
	            		}
	            	}
	            }
	        }
	        text = `Здравствуйте ${contactRow.name}! Произведена оплата поставщику ${row.name}. С уважением AZIA IMPORT.`;
	        text = urlencode(text)
	        
        }
		var sender = await axios(`https://smsc.kz/sys/send.php?login=aziaimport&psw=Aziaimport&phones=${phone}&mes=${text}&sender=AZIA IMPORT`, {
				method: 'post',
				withCredentials: true
            });
		console.log(sender)
		res.status(200).send();
	}catch(e){
		console.log(e);
		res.status(500).send(e);
	}
});

router.post('/send2', async function(req, res){
	var text = '';
	var phone = '';
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
			console.log(token)
			res.send()
		} else {
			res.status(401).send()
		}
		if(req.body['leads[add][0][id]']){
            var result = await axios.get(`https://azim.amocrm.ru/api/v2/leads?id=${req.body['leads[add][0][id]']}`,{
				headers: {
					Cookie: `session_id=${token}`
				},
				withCredentials: true
            });
            var row = result.data._embedded.items[0];
            if(row.main_contact.id){
            	
	            var contact = await axios.get(`https://azim.amocrm.ru/api/v2/contacts?id=${row.main_contact.id}`,{
						headers: {
							Cookie: `session_id=${token}`
						},
						withCredentials: true
	            	});
	            var contactRow = contact.data._embedded.items[0];
	            for(var i = 0; i < contactRow.custom_fields.length; i++){
	            	if(contactRow.custom_fields[i].values[j]){
	            		for(var j = 0; i < contactRow.custom_fields[i].values.length; j++){
		            		if(contactRow.custom_fields[i].id == 2082){
		            			phone = contactRow.custom_fields[i].values[j].value;

	            			}
	            		}
	            	}
	            }
	        }
	        text = `Здравствуйте ${contactRow.name}! Произведена оплата поставщику ${row.name}. С уважением AZIA IMPORT.`;
        }else if(req.body['leads[status][0][old_status_id]']){
        	var result = await axios.get(`https://azim.amocrm.ru/api/v2/leads?id=${req.body['leads[status][0][id]']}`,{
				headers: {
					Cookie: `session_id=${token}`
				},
				withCredentials: true
            });
            var row = result.data._embedded.items[0];
            if(row.main_contact.id){            	
	            var contact = await axios.get(`https://azim.amocrm.ru/api/v2/contacts?id=${row.main_contact.id}`,{
						headers: {
							Cookie: `session_id=${token}`
						},
						withCredentials: true
	            	});
	            var contactRow = contact.data._embedded.items[0];
	            for(var i = 0; i < contactRow.custom_fields.length; i++){
            		for(var j = 0; j < contactRow.custom_fields[i].values.length; j++){
            			if(contactRow.custom_fields[i].values[j]){
		            		if(contactRow.custom_fields[i].id == 2082){
		            			var phone = contactRow.custom_fields[i].values[j].value;
	            			}
	            		}
	            	}
	            }
	        }
	        text = `Здравствуйте, ${contactRow.name}! Ваш платеж принят и прошел в реестр. С уважением AZIA IMPORT.`;
	        text = urlencode(text)
	        
        }
		var sender = await axios(`https://smsc.kz/sys/send.php?login=aziaimport&psw=Aziaimport&phones=${phone}&mes=${text}&sender=AZIA IMPORT`, {
				method: 'post',
				withCredentials: true
            });
		console.log(sender)
		res.status(200).send();
	}catch(e){
		console.log(e);
		res.status(500).send(e);
	}
});


module.exports = router;