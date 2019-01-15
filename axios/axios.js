var axios = require('axios');
var mysql = require('mysql');
var express = require('express');
var Query = require('node-mysql-ejq');
var config = require('../config/config');
var con = mysql.createConnection(config.db);;

var query = new Query(con);

var router = express.Router();

router.post('/asdf', async function(req, res){
	console.log('asdf');
	try{
		var axi = await axios('https://azim.amocrm.ru/api/v2/contacts', {
			method: 'get',
			headers: {
				Cookie: `session_id=2dsf3jeumf7mghlm3cvkmrtjo1616do3ho3d58c3lopjpenjdra0`
			},
			withCredentials: true
		})

		var data = axi.data._embedded.items;

		for(var i=0; i<data.length; i++){
			var selectUser = await query.select({table: 'users', where: {name: `${data[i].created_by}`}});
			if(selectUser.length==0){
				var iUser = {name: data[i].created_by};
				var insertUser = await query.insert({table: 'users', data: iUser});
			} else {
				selectUser = selectUser[0]
				var insertUser = {insertId: selectUser.id};
			}
			console.log('asdf1');
			var iData = {name: data[i].name, created_at: new Date(data[i].created_at*1000), updated_at: new Date(data[i].updated_at*1000),
						created_by: insertUser.insertId};
			var insertContact = await query.insert({table: 'contacts', data: iData});

			for(var j=0; j<data[i].custom_fields.length; j++){
				var selectCF = await query.select({table: 'group_fields', where: {name: data[i].custom_fields[j].name}});
				if(selectCF.length==0){
					var iCF = {name: data[i].custom_fields[j].name, data_type: 1, field_type: 1, group_id: 1}
					var insertCF = await query.insert({table: 'group_fields', data: iCF});
					console.log(iCF);
				} else {
					selectCF = selectCF[0];
					var insertCF = {insertId: selectCF.id};
				}

				for(var k=0; k<data[i].custom_fields[j].values.length; k++){
					var iCV = {value: data[i].custom_fields[j].values[k].value, field_id: insertCF.insertId, contact_id: insertContact.insertId};
					var insertCV = await query.insert({table: 'contacts_value', data: iCV});
					console.log(iCV);
				}
			}

			for(var j=0; j<data[i].tags.length; j++){
				var selectTag = await query.select({table: 'tags', where: {name: data[i].tags[j].name}});
				if(selectTag.length==0){
					var iTag = {name: data[i].tags[j].name};
					var insertTag = await query.insert({table: 'tags', data: iTag});
					console.log(iTag);
				} else {
					selectTag = selectTag[0];
					var insertTag = {insertId: selectTag.id};
				}

				var iTL = {tags_id: insertTag.insertId, type: 'contacts', related_id: insertContact.insertId};
				var insertTL = await query.insert({table: 'tags_link', data: iTL});
				console.log(iTL);
			}
		}

		res.send();
	} catch(e){
			console.log(e);
			res.status(500).send();
	}
});
/*
router.post('/test', async function(req, res){
	console.log('asdf')
	try{
		var axi = await axios('https://azim.amocrm.ru/api/v2/contacts?id=233682', {
			method: 'get',
			headers: {
				Cookie: `session_id=2dsf3jeumf7mghlm3cvkmrtjo1616do3ho3d58c3lopjpenjdra0`
			},
			withCredentials: true
		})

		var data = axi.data._embedded.items;
		console.log(data[0].custom_fields[0].values[0].value)
		res.send();
	} catch(e){
		res.status(500).send();
	}
})
*/
module.exports = router;