var axios = require('axios');
var mysql = require('mysql');
var express = require('express');
var Query = require('node-mysql-ejq');
var config = require('../config/config');
var con = mysql.createConnection(config.db);

var query = new Query(con);

var router = express.Router();

var token = '';

router.post('/users', async function(req, res){
	try{
		var axi = await axios('https://azim.amocrm.ru/api/v2/account?with=users', {
			method: 'get',
			headers: {
				Cookie: `session_id=${token}`
			},
			withCredentials: true
		});

		var data = axi.data._embedded.users;
		console.log('adsf')
		for(var key in data){
			var selectId = await query.select({table: 'users_group', where: {amo_id: `${data[key].group_id}`}});
			var iUser = {name: data[key].name, amo_id: data[key].id, login: data[key].login, is_active: data[key].is_active, 
						is_free: data[key].is_free, is_admin: data[key].is_admin, group_id: selectId[0].id}
			var insertUser = await query.insert({table: 'users', data: iUser});
			console.log(iUser);
			var iPrivileges = data[key].rights;
			iPrivileges.user_id = insertUser.insertId;
			var insertPriv = await query.insert({table: 'privileges', data: iPrivileges});
		}
		res.send();
	} catch(e){
		console.log(e);
		res.redirect(401, '/axios/auth');
	}
})

router.post('/contacts', async function(req, res){
	
	var a = 501;
	try{
		for(var f=0; f<36; f++){
			await setTimeout(function(){console.log(a)}, 5000);
			var axi = await axios(`https://azim.amocrm.ru/api/v2/contacts?limit_rows=500&limit_offset=${a}`, {
				method: 'get',
				headers: {
					Cookie: `session_id=${token}`
				},
				withCredentials: true
			});

			console.log(axi)

			var data = axi.data._embedded.items;

			for(var i=0; i<data.length; i++){
				var selectUser = await query.select({table: 'users', where: {amo_id: `${data[i].created_by}`}});
				if(selectUser.length==0){
					var iUser = {amo_id: data[i].created_by, group_id: 9};
					var insertUser = await query.insert({table: 'users', data: iUser});
				} else {
					selectUser = selectUser[0]
					var insertUser = {insertId: selectUser.id};
				}

				var selectGroup = await query.select({table: 'users_group', where: {amo_id: `${data[i].group_id}`}});

				var selectResp = await query.select({table: 'users', where: {amo_id: data[i].responsible_user_id}});
				if(selectResp.length==0){
					var iResp = {amo_id: data[i].responsible_user_id, group_id: 9};
					var insertResp = await query.insert({table: 'users', data: iResp});
				} else {
					selectResp = selectResp[0]
					var insertResp = {insertId: selectResp.id};
				}

				var selectContact = await query.select({table: 'contacts', where: {name: `${data[i].name}`}});
				if(selectContact.length==0){
					var iData = {name: data[i].name, created_at: new Date(data[i].created_at*1000), updated_at: new Date(data[i].updated_at*1000),
						created_by: insertUser.insertId, amo_id: data[i].id, resp_user_id: insertResp.insertId,
						group_id: selectGroup[0].id};
						console.log(iData)
						

						var insertContact = await query.insert({table: 'contacts', data: iData});
					} else {
						selectContact = selectContact[0]
						var insertContact = {insertId: selectContact.id}
					}

					for(var j=0; j<data[i].custom_fields.length; j++){
						var selectCF = await query.select({table: 'custom_fields', where: {name: data[i].custom_fields[j].name}});
						if(selectCF.length==0){
							var iCF = {name: data[i].custom_fields[j].name, data_type: 1, field_type: 1, group_id: 1}

							var insertCF = await query.insert({table: 'custom_fields', data: iCF});
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
				a = a + 500;
				
			}

		
		res.send();
	} catch(e){
		console.log(e);
		res.redirect(401, '/axios/auth');
	}
});

router.post('/company', async function(req, res){
	try{
		var axi = await axios('https://azim.amocrm.ru/api/v2/companies', {
			method: 'get',
			headers: {
				Cookie: `session_id=${token}`
			},
			withCredentials: true
		});

		var data = axi.data._embedded.items;

		for(var i=0; i<data.length; i++){
			var selectUser = await query.select({table: 'users', where: {amo_id: `${data[i].created_by}`}});
			if(selectUser.length==0){
				var iUser = {amo_id: data[i].created_by, group_id: 9};
				var insertUser = await query.insert({table: 'users', data: iUser});
			} else {
				selectUser = selectUser[0]
				var insertUser = {insertId: selectUser.id};
			}

			var selectGroup = await query.select({table: 'users_group', where: {amo_id: `${data[i].group_id}`}});

			var selectResp = await query.select({table: 'users', where: {amo_id: `${data[i].responsible_user_id}`}});

			var selectCompany = await query.select({table: 'leads_company', where: {name: `${data[i].name}`}});
			if(selectCompany.length==0){
				var iData = {name: data[i].name, created_at: new Date(data[i].created_at*1000), updated_at: new Date(data[i].updated_at*1000),
						created_by: insertUser.insertId, amo_id: data[i].id, resp_user_id: selectResp[0].id,
						group_id: selectGroup[0].id};

				var insertCompany = await query.insert({table: 'leads_company', data: iData});
			} else {
				selectCompany = selectCompany[0]
				var insertCompany = {insertId: selectCompany.id}
			}

			for(var j=0; j<data[i].custom_fields.length; j++){
				var selectCF = await query.select({table: 'custom_fields', where: {name: data[i].custom_fields[j].name}});
				if(selectCF.length==0){
					var iCF = {name: data[i].custom_fields[j].name, data_type: 1, field_type: 1, group_id: 1}
					var insertCF = await query.insert({table: 'custom_fields', data: iCF});
					console.log(iCF);
				} else {
					selectCF = selectCF[0];
					var insertCF = {insertId: selectCF.id};
				}

				for(var k=0; k<data[i].custom_fields[j].values.length; k++){
					var iCV = {value: data[i].custom_fields[j].values[k].value, field_id: insertCF.insertId, 
						leads_company_id: insertCompany.insertId};

					var insertCV = await query.insert({table: 'leads_company_value', data: iCV});
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

				var iTL = {tags_id: insertTag.insertId, type: 'company', related_id: insertComapny.insertId};
				var insertTL = await query.insert({table: 'tags_link', data: iTL});
				console.log(iTL);
			}
		}

		res.send();
	} catch(e){
		console.log(e);
		res.redirect(401, '/axios/auth');
	}
});

router.post('/leads', async function(req, res){
	try{
		var axi = await axios('https://azim.amocrm.ru/api/v2/leads', {
			method: 'get',
			headers: {
				Cookie: `session_id=${token}`
			},
			withCredentials: true
		});

		var data = axi.data._embedded.items;

		for(var i=0; i<data.length; i++){
			var selectUser = await query.select({table: 'users', where: {amo_id: `${data[i].created_by}`}});
			if(selectUser.length==0){
				var iUser = {amo_id: data[i].created_by, group_id: 9};
				var insertUser = await query.insert({table: 'users', data: iUser});
			} else {
				selectUser = selectUser[0]
				var insertUser = {insertId: selectUser.id};
			}

			var selectGroup = await query.select({table: 'users_group', where: {amo_id: `${data[i].group_id}`}});

			var selectResp = await query.select({table: 'users', where: {amo_id: `${data[i].responsible_user_id}`}});

			var selectLeads = await query.select({table: 'leads', where: {name: `${data[i].name}`}});
			if(selectLeads==0){
				var iData = {name: data[i].name, created_at: new Date(data[i].created_at*1000), updated_at: new Date(data[i].updated_at*1000),
							closed_at: new Date(data[i].closed_at*1000), created_by: insertUser.insertId,
							resp_user_id: selectResp[0].id, group_id: selectGroup[0].id};
				var insertLeads = await query.insert({table: 'leads', data: iData});
			} else {
				selectLeads = selectLeads[0];
				var insertLeads = {insertId: selectLeads.id};
			}

			for(var j=0; j<data[i].custom_fields.length; j++){
				var selectCF = await query.select({table: 'custom_fields', where: {name: data[i].custom_fields[j].name}});
				if(selectCF.length==0){
					var iCF = {name: data[i].custom_fields[j].name, data_type: 1, field_type: 1, group_id: 1}
					var insertCF = await query.insert({table: 'custom_fields', data: iCF});
					console.log(iCF);
				} else {
					selectCF = selectCF[0];
					var insertCF = {insertId: selectCF.id};
				}

				for(var k=0; k<data[i].custom_fields[j].values.length; k++){
					var iCV = {value: data[i].custom_fields[j].values[k].value, fields_id: insertCF.insertId, 
						leads_id: insertLeads.insertId};

					var insertCV = await query.insert({table: 'leads_value', data: iCV});
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

				var iTL = {tags_id: insertTag.insertId, type: 'leads', related_id: insertLeads.insertId};
				var insertTL = await query.insert({table: 'tags_link', data: iTL});
				console.log(iTL);
			}
		}

		res.send();
	} catch(e){
		console.log(e);
		res.redirect(401, '/axios/auth');
	}
});

router.post('/pipeline', async function(req, res){
	try{
		var axi = await axios('https://azim.amocrm.ru/api/v2/account?with=pipelines', {
			method: 'get',
			headers: {
				Cookie: `session_id=${token}`
			},
			withCredentials: true
		});

		var data = axi.data._embedded.pipelines;
		for(var key in data){
			var iPipe = {name: data[key].name, amo_id: data[key].id, is_main: data[key].is_main, pos: data[key].sort}
			var insertPipeline = await query.insert({table: 'pipelines', data: iPipe});
			
			for(var key2 in data[key].statuses){
				console.log(data[key].statuses[key2])
				var iStep = {name: data[key].statuses[key2].name, position:data[key].statuses[key2].sort, 
							is_editable: data[key].statuses[key2].is_editable, amo_id: data[key].statuses[key2].id,
							pipeline_id: insertPipeline.insertId}
				var insertStep = await query.insert({table: 'step', data: iStep})
			}
		}
		res.send();
	} catch(e){
		console.log(e);
		res.redirect(401, '/axios/auth');
	}
});

router.post('/task', async function(req, res){
	try{
		var axi = await axios('https://azim.amocrm.ru/api/v2/tasks', {
			method: 'get',
			headers: {
				Cookie: `session_id=${token}`
			},
			withCredentials: true
		});

		var data = axi.data._embedded.items;

		for(var i=0; i<data.length; i++){
			var selectUser = await query.select({table: 'users', where: {amo_id: `${data[i].created_by}`}});
			if(selectUser.length==0){
				var iUser = {amo_id: data[i].created_by, group_id: 9};
				var insertUser = await query.insert({table: 'users', data: iUser});
			} else {
				selectUser = selectUser[0]
				var insertUser = {insertId: selectUser.id};
			}

			for(var j=0; j<data.length; j++){
				var selectCF = await query.select({table: 'task_type', where: {name: data[i].task_type}});
				if(selectCF.length==0){
					var iCF = {name: data[i].task_type, group_id: 1}
					var insertCF = await query.insert({table: 'task_type', data: iCF});
					console.log(iCF);
				} else {
					selectCF = selectCF[0];
					var insertCF = {insertId: selectCF.id};
				}

			}

			var selectGroup = await query.select({table: 'users_group', where: {amo_id: `${data[i].group_id}`}});

			var selectResp = await query.select({table: 'users', where: {amo_id: `${data[i].responsible_user_id}`}});
			
			var iData = {comment: data[i].text, created_at: new Date(data[i].created_at*1000), updated_at: new Date(data[i].updated_at*1000), 
						complete_till: new Date(data[i].complete_till_at*1000), created_by: insertUser.insertId,
						amo_id: data[i].id, resp_user_id: selectResp[0].id, group_id: selectGroup[0].id, 
						is_completed: data[i].is_completed, task_type: selectCF.id};
						//console.log(iData)

			var insertTask = await query.insert({table: 'task', data: iData});

			if(typeof data[i].result.id!='undefined'){
				var iCV = {text: data[i].result.text, amo_id: data[i].result.id, task_id: insertTask.insertId};
				var insertCV = await query.insert({table: 'task_result', data: iCV});
			} 
			
			console.log(iCV);
			
			
		}

		res.send();
	} catch(e){
		console.log(e);
		res.redirect(401, '/axios/auth');
	}
});

router.post('/groups', async function(req, res){
	try{
		var axi = await axios('https://azim.amocrm.ru/api/v2/account?with=groups', {
			method: 'get',
			headers: {
				Cookie: `session_id=${token}`
			},
			withCredentials: true
		});

		var data = axi.data._embedded.groups;
		for(var key in data){
			var iGroup = {name: data[key].name, amo_id: data[key].id};
			console.log(iGroup)
			var insertGroup = await query.insert({table: 'users_group', data: iGroup});
		}
		res.send();
	} catch(e){
		console.log(e);
		res.redirect(401, '/axios/auth');
	}
})

router.get('/auth', async function(req, res){

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
	} catch(e){
		console.log(e);
		res.status(500).send();
	}
})

router.post('/test', async function(req, res){

	try{
		console.log('test')
		res.redirect(300, '/axios/test2')
	} catch(e){
		res.status(500).send();
	}
})

module.exports = router;