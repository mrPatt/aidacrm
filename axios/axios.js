var axios = require('axios');
var mysql = require('mysql');
var express = require('express');
var Query = require('node-mysql-ejq');
var config = require('../config/config');
var cheerio = require('cherio');
var con = mysql.createConnection(config.db);

var query = new Query(con);

var router = express.Router();

var token = '';

function apos(a){
	if(typeof a == 'string'){
		if(a.includes("'")){
			var splited = a.split("'");
			splited[0] = splited[0] + "\\'";
			a = splited.join('');
			
			return a;
		} else {
			return a;
		}
	} else {
		return a;
	}
}

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
	
	var a = 10000;
	try{
		for(var f=0; f<36; f++){
			await setTimeout(function(){console.log(a)}, 1000);
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

				var selectContact = await query.select({table: 'contacts', where: {name: apos(data[i].name)}});
				if(selectContact.length==0){
					var iData = {name: apos(data[i].name), created_at: new Date(data[i].created_at*1000),
								updated_at: new Date(data[i].updated_at*1000),
								created_by: insertUser.insertId, amo_id: data[i].id, resp_user_id: insertResp.insertId,
								group_id: selectGroup[0].id};
						console.log(iData)
						var insertContact = await query.insert({table: 'contacts', data: iData});
					} else {
						var iData = {name: apos(data[i].name), created_at: new Date(data[i].created_at*1000),
								updated_at: new Date(data[i].updated_at*1000),
								created_by: insertUser.insertId, amo_id: data[i].id, resp_user_id: insertResp.insertId,
								group_id: selectGroup[0].id};
						selectContact = selectContact[0]
						var insertContact = {insertId: selectContact.id}
						var updateContact = await query.update({table: 'contacts', where: {amo_id: data[i].id}, data: iData})
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
							var selectCV = await query.select({table: 'contacts_value', where: {value: data[i].custom_fields[j].values[k].value}});
							if(selectCV.length == 0){
								var iCV =	{value: data[i].custom_fields[j].values[k].value, field_id: insertCF.insertId, 
											contact_id: insertContact.insertId};
								var insertCV = await query.insert({table: 'contacts_value', data: iCV});
								console.log(iCV);			
							} else {
								var iCV =	{value: data[i].custom_fields[j].values[k].value, field_id: insertCF.insertId, 
											contact_id: insertContact.insertId};
								selectCV = selectCV[0];
								var insertCV = {insertId: selectCV.id};
								var updateCV = await query.update({table: 'contacts_value', where: {id: insertCV.insertId}, data: iCV})
							}
							
							
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

						var selectTL = await query.select({table: 'tags_link', where: {related_id: `${data[i].tags[j].id}`}});
							if(selectTL.length==0){
								var iTL = {tags_id: insertTag.insertId, type: 'contacts', related_id: insertContact.insertId};
								var insertTL = await query.insert({table: 'tags_link', data: iTL});
								console.log(iTL);
							} else {
								selectTL = selectTL[0];
								var insertTL = {insertId: selectTL.id}
							}
					}
				}
				a = a + 500;
				
			}

		console.log('SUCCESS');
		res.send();
	} catch(e){
		console.log(e);
		res.redirect(401, '/axios/auth');
	}
});

router.post('/company', async function(req, res){
	var a = 10000
	try{
		for(var f=0; f<23; f++){
			await setTimeout(function(){console.log(a)}, 1000);
			var axi = await axios(`https://azim.amocrm.ru/api/v2/companies?limit_rows=500&limit_offset=${a}`, {
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
				if(selectResp.length==0){
					var iResp = {amo_id: data[i].responsible_user_id, group_id: 9};
					var insertResp = await query.insert({table: 'users', data: iResp});
				} else {
					selectResp = selectResp[0]
					var insertResp = {insertId: selectResp.id};
				}

				var selectCompany = await query.select({table: 'leads_company', where: {name: apos(data[i].name)}});
				if(selectCompany.length==0){
					var iData = {name: apos(data[i].name), created_at: new Date(data[i].created_at*1000), 
						updated_at: new Date(data[i].updated_at*1000),
						created_by: insertUser.insertId, amo_id: data[i].id, resp_user_id: insertResp.insertId,
						group_id: selectGroup[0].id};

					var insertCompany = await query.insert({table: 'leads_company', data: iData});
					console.log(iData)
				} else {
					var iData = {name: apos(data[i].name), created_at: new Date(data[i].created_at*1000), 
						updated_at: new Date(data[i].updated_at*1000),
						created_by: insertUser.insertId, amo_id: data[i].id, resp_user_id: insertResp.insertId,
						group_id: selectGroup[0].id};
					selectCompany = selectCompany[0]
					var insertCompany = {insertId: selectCompany.id}
					var updateCompany = await query.update({table: 'leads_company', where: {amo_id: data[i].id}, data: iData})
				}
					if(data[i].contacts.id)
					for (var j = 0; j < data[i].contacts.id.length; j++) {
						var selectContact = await query.select({table: 'contacts', where: {amo_id: `${data[i].contacts.id[j]}`}});
						console.log(selectContact);
						if(selectContact == 0){
							selectContact = {}
						} else {
							console.log(selectContact[j])
							var iContact = {contact_id: selectContact[0].id, leads_company_id: insertCompany.insertId};
							var insertContact = await query.insert({table: 'leads_company_contacts', data: iContact});
						}
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
							var selectCV = await query.select({table: 'leads_company_value', 
															   where: {value: data[i].custom_fields[j].values[k].value}});
							if(selectCV.length == 0){
								var iCV = {value: data[i].custom_fields[j].values[k].value, field_id: insertCF.insertId, 
									leads_company_id: insertCompany.insertId};
									var insertCV = await query.insert({table: 'leads_company_value', data: iCV});
									console.log(iCV);
								} else {
									selectCV = selectCV[0];
									var insertCV = {insertId: selectCV.id}
									var iCV =	{value: data[i].custom_fields[j].values[k].value, field_id: insertCF.insertId, 
											contact_id: insertContact.insertId};
									selectCV = selectCV[0];
									var insertCV = {insertId: selectCV.id};
									var updateCV = await query.update({table: 'contacts_value', where: {id: insertCV.insertId}, data: iCV})
								}
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

							var selectTL = await query.select({table: 'tags_link', where: {related_id: `${data[i].tags[j].id}`}});
							if(selectTL.length==0){
								var iTL = {tags_id: insertTag.insertId, type: 'leads', related_id: insertCompany.insertId};
								var insertTL = await query.insert({table: 'tags_link', data: iTL});
								console.log(iTL);
							} else {
								selectTL = selectTL[0];
								var insertTL = {insertId: selectTL.id}
							}
						}
					}
					a = a + 500
				}
				console.log('SUCCESS');
				res.send();
			} catch(e){
				console.log(e);
				res.redirect(401, '/axios/auth');
			}
		});

router.post('/leads', async function(req, res){
	var a = 1;
	try{
		for(var f=0; f<32; f++){
			await setTimeout(function(){console.log(a)}, 1000);
			var axi = await axios(`https://azim.amocrm.ru/api/v2/leads?limit_rows=500&limit_offset=${a}`, {
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
				if(selectResp.length==0){
					var iResp = {amo_id: data[i].responsible_user_id, group_id: 9};
					var insertResp = await query.insert({table: 'users', data: iResp});
				} else {
					selectResp = selectResp[0]
					var insertResp = {insertId: selectResp.id};
				}

				var selectStep = await query.select({table: 'step', where: {amo_id: `${data[i].status_id}`}});

				var selectPipe = await query.select({table: 'pipelines', where: {amo_id: `${data[i].pipeline.id}`}});

				if(typeof data[i].main_contact.id != 'undefined'){
						var selectMC = await query.select({table: 'contacts', where: {amo_id: data[i].main_contact.id}});
						if(selectMC.length == 0){
							var iMC = {name: 'loh_contact', amo_id: data[i].main_contact.id};
							var insertMC = await query.insert({table: 'contacts', data: iMC});
						} else {
							selectMC = selectMC[0]
							var insertMC = {insertId: selectMC.id}
						}
				} else {
					var insertMC = {insertId: null}
				}
				
				if(typeof data[i].company.id != 'undefined'){
					var selectLC = await query.select({table: 'leads_company', where: {amo_id:`${data[i].company.id}`}});
					console.log(selectLC)
					if(selectLC.length == 0){
						var iLC = {name: 'loh_company', amo_id: data[i].company.id};
						var insertLC = await query.insert({table: 'leads_company', data: iLC});
					} else {
						selectLC = selectLC[0]
						var insertLC = {insertId: selectLC.id};
					}
				}

				var selectLeads = await query.select({table: 'leads', where: {name: apos(data[i].name)}});
				if(selectLeads.length==0){
					var closed_at = null;
					if(data[i].closed_at != 0){
						closed_at = new Date(data[i].closed_at*1000);
					}
					var iData = {name: apos(data[i].name), created_at: new Date(data[i].created_at*1000),
								 updated_at: new Date(data[i].updated_at*1000),
								 closed_at: closed_at, created_by: insertUser.insertId,
								 resp_user_id: insertResp.insertId, group_id: selectGroup[0].id, amo_id: data[i].id, 
								 status: selectStep[0].id, pipeline_id: selectPipe[0].id, main_contact_id: insertMC.insertId,
								 leads_company_id: insertLC.insertId};
					var insertLeads = await query.insert({table: 'leads', data: iData});
					console.log(iData)
				} else {
					var iData = {name: apos(data[i].name), created_at: new Date(data[i].created_at*1000),
								 updated_at: new Date(data[i].updated_at*1000),
								 closed_at: closed_at, created_by: insertUser.insertId,
								 resp_user_id: insertResp.insertId, group_id: selectGroup[0].id, amo_id: data[i].id, 
								 status: selectStep[0].id, pipeline_id: selectPipe[0].id, main_contact_id: insertMC.insertId,
								 leads_company_id: insertLC.insertId};
					selectLeads = selectLeads[0];
					var insertLeads = {insertId: selectLeads.id};
					var updateLeads = await query.update({table: 'leads', where: {amo_id: data[i].id}, data: iData})
				}
				console.log(data[i].contacts.id);
				if(typeof data[i].contacts.id != 'undefined'){
					for (var j = 0; j < data[i].contacts.id.length; j++) {
						if(typeof data[i].contacts.id[j] != 'undefined'){
							var selectContact = await query.select({table: 'contacts', where: {amo_id: `${data[i].contacts.id[j]}`}});
							console.log(selectContact);
							if(selectContact == 0){
								selectContact = {}
							} else {
								var iContact = {contact_id: selectContact[0].id, leads_id: insertLeads.insertId};
								var insertContact = await query.insert({table: 'leads_contacts', data: iContact});
								console.log(iContact)
							}
						}
					}
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
							var selectCV = await query.select({table: 'leads_value', where: {value: data[i].custom_fields[j].values[k].value}});
							if(selectCV.length == 0){
								var iCV = {value: data[i].custom_fields[j].values[k].value, field_id: insertCF.insertId, 
									leads_id: insertLeads.insertId};
								var insertCV = await query.insert({table: 'leads_value', data: iCV});
									console.log(iCV);
							} else {
								var iCV = {value: data[i].custom_fields[j].values[k].value, field_id: insertCF.insertId, 
									leads_id: insertLeads.insertId};
								selectCV = selectCV[0];
								var insertCV = {insertId: selectCV.id}
								var updateCV = await query.update({table: 'contacts_value', where: {id: insertCV.insertId}, data: iCV})
								}

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
							var selectTL = await query.select({table: 'tags_link', where: {related_id: `${data[i].tags[j].id}`}});
							if(selectTL.length==0){
								var iTL = {tags_id: insertTag.insertId, type: 'leads', related_id: insertLeads.insertId};
								var insertTL = await query.insert({table: 'tags_link', data: iTL});
								console.log(iTL);
							} else {
								selectTL = selectTL[0];
								var insertTL = {insertId: selectTL.id}
							}
							
						}
					}
					a = a + 500
				}
				console.log('SUCCESS');
				res.send();
			} catch(e){
				console.log(e);
				res.redirect(401, '/axios/auth');
			}
			
		});

router.get('/budget', async function(req, res){
	var a = await con.query(`SELECT amo_id FROM amocrm.leads`);
	var budget = [];

	for(var f = 0; f < a.length; f++){
		try {
			var leads  = a[f];
    		var axi = await axios(`https://azim.amocrm.ru/leads/detail/${leads.amo_id}`, {
				method: 'get',
				headers: {
					Cookie: `session_id=${token}`
				},
				withCredentials: true
			});
			var $ = cheerio.load(axi.data);
            var budget = $('#lead_card_budget').val();
            var str = budget.replace(/\s/g, '');
            if(str != ''){
            	var vitalya_pidor = await con.query(`UPDATE leads SET budget = ${str} WHERE amo_id = ${leads.amo_id}`)
            } else{
            	console.log(str)
            }
            
            console.log(f, str);
           
    		res.send()
   		} catch (e) {
       		console.log(e)
    	}
	}
    
})

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
			console.log('SUCCESS');
			res.send();
		} catch(e){
			console.log(e);
			res.redirect(401, '/axios/auth');
		}
	});

router.post('/task', async function(req, res){
	var a = 1;
	try{
		for(var f=0; f<50; f++){
			await setTimeout(function(){console.log(a)}, 1000);
			var axi = await axios(`https://azim.amocrm.ru/api/v2/tasks?limit_rows=500&limit_offset=${a}`, {
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
					var selectCF = await query.select({table: 'task_type', where: {type_id: data[i].task_type}});
					if(selectCF.length==0){
						var iCF = {type_id: data[i].task_type}
						var insertCF = await query.insert({table: 'task_type', data: iCF});
						console.log(iCF);
					} else {
						selectCF = selectCF[0];
						var insertCF = {insertId: selectCF.id};
					}

				}

				var selectGroup = await query.select({table: 'users_group', where: {amo_id: `${data[i].group_id}`}});

				var selectResp = await query.select({table: 'users', where: {amo_id: `${data[i].responsible_user_id}`}});
				if(selectResp.length==0){
					var iResp = {amo_id: data[i].responsible_user_id, group_id: 9};
					var insertResp = await query.insert({table: 'users', data: iResp});
				} else {
					selectResp = selectResp[0]
					var insertResp = {insertId: selectResp.id};
				}

				var selectId = await query.select({table: 'task', where: {amo_id: data[i].id}});
				if(selectId.length == 0){
					var iData = {comment: data[i].text, created_at: new Date(data[i].created_at*1000), updated_at: new Date(data[i].updated_at*1000), 
						complete_till: new Date(data[i].complete_till_at*1000), created_by: insertUser.insertId,
						amo_id: data[i].id, resp_user_id: insertResp.insertId, group_id: selectGroup[0].id, 
						is_completed: data[i].is_completed, task_type: insertCF.insertId, element_type: insertCF.insertId, 
						element_id: data[i].element_id};
							//console.log(iData)

							var insertTask = await query.insert({table: 'task', data: iData});

							if(typeof data[i].result.id!='undefined'){
								var iCV = {text: data[i].result.text, amo_id: data[i].result.id, task_id: insertTask.insertId};
								var insertCV = await query.insert({table: 'task_result', data: iCV});
							} 
				}


						console.log(iCV);
					}
					a = a + 500;
				}
				console.log('SUCCESS');
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
		console.log('SUCCESS');
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