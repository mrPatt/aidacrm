var axios = require('axios');
var mysql = require('mysql');
var util = require('util');
var express = require('express');
var config = require('../config/config');
var cheerio = require('cherio');
var Query = require('node-mysql-ejq');
var con = mysql.createConnection(config.db);
//con.query = util.promisify(con.query)
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

router.get('/lc', async function(req, res){
	var a = 1;
	try{
		for(var f=0; f<36; f++){
			await setTimeout(function(){console.log(a)}, 1000);
			
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
			var contactRow = await axios(`https://azim.amocrm.ru/api/v2/leads?limit_rows=500&limit_offset=${a}`, {
				method: 'get',
				headers: {
					Cookie: `session_id=${token}`
				},
				withCredentials: true
			});
			var data = contactRow.data._embedded.items;
			for(var i = 0; i < data.length; i++){
				if(typeof data[i].contacts.id != 'undefined'){
					for (var j = 0; j < data[i].contacts.id.length; j++) {
						if(typeof data[i].contacts.id[j] != 'undefined'){
							var selectContact = await query.select({table: 'contacts', where: {amo_id: `${data[i].contacts.id[j]}`}});
							var selectLeads = await query.select({table: 'leads', where: {amo_id: `${data[i].id}`}});
							console.log(selectContact);
							if(selectContact == 0){
								selectContact = {}
							} else {
								var iContact = {contact_id: selectContact[0].id, leads_id: selectLeads[0].id};
								var insertContact = await query.insert({table: 'leads_contacts', data: iContact});
								console.log(iContact)
							}
						}
					}
				}
			}
			a = a + 500;
		}
		res.status(200).send();
	}catch(e){
		console.log(e);
		res.status(500).send(e);
	}
})

router.get('/lcc', async function(req, res){
	var a = 1;
	try{
		for(var f=0; f<36; f++){
			await setTimeout(function(){console.log(a)}, 1000);
			
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
			var contactRow = await axios(`https://azim.amocrm.ru/api/v2/contacts?limit_rows=500&limit_offset=${a}`, {
				method: 'get',
				headers: {
					Cookie: `session_id=${token}`
				},
				withCredentials: true
			});
			var data = contactRow.data._embedded.items;
			for(var i = 0; i < data.length; i++){
				if(typeof data[i].company.id != 'undefined'){
					var selectContact = await query.select({table: 'contacts', where: {amo_id: `${data[i].id}`}});
					var selectLeadsCom = await query.select({table: 'leads_company', where: {amo_id: `${data[i].company.id}`}});
					console.log(selectContact);
					if(selectContact == 0){
						selectContact = {}
					} else {
						var iContact = {contact_id: selectContact[0].id, leads_company_id: selectLeadsCom[0].id};
						var insertContact = await query.insert({table: 'leads_company_contacts', data: iContact});
						console.log(iContact)
					}
				}	
			}
			a = a + 500;
		}
		res.status(200).send();
	}catch(e){
		console.log(e);
		res.status(500).send(e);
	}
})

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
	
	var a = 1;
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

				var selectContact = await query.select({table: 'contacts', where: {amo_id: data[i].id}});
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
							var iCF = {name: data[i].custom_fields[j].name, field_type: 1, group_id: 1, lcc_id: 2}

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
	var a = 1;
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

				var selectCompany = await query.select({table: 'leads_company', where: {amo_id: data[i].id}});
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
							var iCF = {name: data[i].custom_fields[j].name, field_type: 1, group_id: 1, lcc_id: 3}
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
								var insertCV = {insertId: selectCV.id};
								var iCV =	{value: data[i].custom_fields[j].values[k].value, field_id: insertCF.insertId, 
										leads_company_id: insertCompany.insertId};
								var updateCV = await query.update({table: 'leads_company_value', where: {id: insertCV.insertId}, data: iCV})
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
		for(var f=0; f<40; f++){
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

				var selectLeads = await query.select({table: 'leads', where: {amo_id: data[i].id}});
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
								 leads_company_id: insertLC.insertId, budget: data[i].sale, is_deleted: data[i].is_deleted};
					var insertLeads = await query.insert({table: 'leads', data: iData});
					console.log(iData)
				} else {
					var closed_at = null;
					if(data[i].closed_at != 0){
						closed_at = new Date(data[i].closed_at*1000);
					}
					var iData = {name: apos(data[i].name), created_at: new Date(data[i].created_at*1000),
								 updated_at: new Date(data[i].updated_at*1000),
								 closed_at: closed_at, created_by: insertUser.insertId,
								 resp_user_id: insertResp.insertId, group_id: selectGroup[0].id, amo_id: data[i].id, 
								 status: selectStep[0].id, pipeline_id: selectPipe[0].id, main_contact_id: insertMC.insertId,
								 leads_company_id: insertLC.insertId, budget: data[i].sale, is_deleted: data[i].is_deleted};
					console.log(iData) 
					var updateLeads = await query.update({table: 'leads', where: {amo_id: data[i].id}, data: iData});
					selectLeads = selectLeads[0];
					var insertLeads = {insertId: selectLeads.id};
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
							var iCF = {name: data[i].custom_fields[j].name, field_type: 1, group_id: 1}
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
								var updateCV = await query.update({table: 'leads_value', where: {id: insertCV.insertId}, data: iCV})
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
            var str = budget.replace(/\s+/g, '');
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
});

router.post('/amo', async function(req, res){
    try {
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
            console.log('Новая сделка');
            var result = await axios.get(`https://azim.amocrm.ru/api/v2/leads?id=${req.body['leads[add][0][id]']}`,{
				headers: {
					Cookie: `session_id=${token}`
				},
				withCredentials: true
            });
            var row = result.data._embedded.items[0];
            var selectRespUser = await con.query(`SELECT 
	            									ANY_VALUE(u.id) AS user_id,
	            									ANY_VALUE(ug.id) AS group_id
	            								FROM 
	            									users_group ug
	            								LEFT JOIN
	            									users u 
	            								ON 
	            									ug.id = u.group_id
	            								WHERE 
	            									ug.amo_id = ${row.group_id}
	            								AND
	            									u.amo_id = ${row.responsible_user_id}
	            								GROUP BY 
	            									u.id`);
            var selectUser = await con.query(`SELECT 
            									id
            								FROM
            									users 
            								WHERE
            									amo_id = ${row.created_by}`)
            var selectPipe = await con.query(`SELECT 
            									id
            								FROM
            									pipelines
            								WHERE 
            									amo_id = ${row.pipeline.id}`);
            var selectStep = await con.query(`SELECT 
            									id
            								FROM
            									step
            								WHERE 
            									amo_id = ${row.status_id}`);
            var selectContact = [];
            if(row.main_contact.id){
            	selectContact = await con.query(`SELECT 
            										id
            									FROM 
            										contacts 
            									WHERE 
            										amo_id = ${row.main_contact.id}`)
            }

            var selectCompany = [];
            if(row.company.id){
            	selectCompany = await con.query(`SELECT 
            										id
            									FROM
            										leads_company
            									WHERE 
            										amo_id = ${row.company.id}`)
            }
            
            if(row.main_contact.id){
            	
	            var contact = await axios.get(`https://azim.amocrm.ru/api/v2/contacts?id=${row.main_contact.id}`,{
						headers: {
							Cookie: `session_id=${token}`
						},
						withCredentials: true
	            	});
	            var contactRow = contact.data._embedded.items[0];
	            var insertContact = {};
	            var selectRespUserContact = await con.query(`SELECT 
			            									ANY_VALUE(u.id) AS user_id,
			            									ANY_VALUE(ug.id) AS group_id
			            								FROM 
			            									users_group ug
			            								LEFT JOIN
			            									users u 
			            								ON 
			            									ug.id = u.group_id
			            								WHERE 
			            									ug.amo_id = ${contactRow.group_id}
			            								AND
			            									u.amo_id = ${contactRow.responsible_user_id}
			            								GROUP BY 
			            									u.id`);
	            var selectUserContact = await con.query(`SELECT 
		            									id
		            								FROM
		            									users 
		            								WHERE
		            									amo_id = ${contactRow.created_by}`);
	            if(selectContact.length == 0){
	            	insertContact = await con.query(`INSERT INTO
	            											contacts (name, 
		            												created_at, 
		            												updated_at, 
		            												created_by,
		            												amo_id,
		            												resp_user_id,
		            												group_id)
		            									VALUES (?, ?, ?, ?, ?, ?, ?)`, [contactRow.name,
		            																	new Date(contactRow.created_at*1000),
		            																	new Date(contactRow.updated_at*1000),
		            																	selectUserContact[0].id,
		            																	contactRow.id,
		            																	selectRespUserContact[0].user_id,
		            																	selectRespUserContact[0].group_id]);
	            	for(var i = 0; i < contactRow.custom_fields.length; i++){
	            		for(var k = 0; k < contactRow.custom_fields[i].values.length; k++){
	            			var selectContactCF = await con.query(`SELECT 
			            											id,
			            											name
				            									FROM
				            										custom_fields
				            									WHERE 
				            										name = '${contactRow.custom_fields[i].name}'`);
		            		console.log('selectContactCFselectContactCFselectContactCF',selectContactCF)
		            		var insertContactCF = await con.query(`INSERT INTO 
				            											contacts_value (field_id,
				            															value,
				            															contact_id)
				            										VALUES (?, ?, ?)`, [selectContactCF[0].id,
				            															contactRow.custom_fields[i].values[k].value,
				            															insertContact.insertId])
	            		}
					}
	            }else{
	            	var updateContact = await con.query(`UPDATE 
		            										contacts 
		            									SET 
		            										name = '${contactRow.name}', 
															created_at = FROM_UNIXTIME(${contactRow.created_at}), 
															updated_at = FROM_UNIXTIME(${contactRow.updated_at}), 
															created_by = ${selectUserContact[0].id},
															amo_id = ${contactRow.id},
															resp_user_id = ${selectRespUserContact[0].user_id},
															group_id = ${selectRespUserContact[0].group_id}
														WHERE 
															amo_id = ${contactRow.id}`);
	            	for(var i = 0; i < contactRow.custom_fields.length; i++){
	            		var selectContactCF = await con.query(`SELECT 
			            											id,
			            											name
				            									FROM
				            										custom_fields
				            									WHERE 
				            										name = '${contactRow.custom_fields[i].name}'`);
	            		for(var k = 0; k < contactRow.custom_fields[i].values.length; k++){
	            			var selectContactValue = await con.query(`SELECT
	            														id,
	            														field_id,
            															value,
            															contact_id
            														FROM 
            															contacts_value
            														WHERE 
            															contact_id = ${selectContact[0].id}
            														AND
            															value = '${contactRow.custom_fields[i].values[k].value}'`)
		            		if(selectContactValue.length == 0){
		            			console.log('selectContactCFselectContactCFselectContactCF',selectContactCF)
		            			var insertContactCF = await con.query(`INSERT INTO 
					            											contacts_value (field_id,
					            															value,
					            															contact_id)
					            										VALUES (?, ?, ?)`, [selectContactCF[0].id,
					            															contactRow.custom_fields[i].values[k].value,
					            															insertContact.insertId])
		            		}else if(selectContactCF.length == 0){
		            			console.log('asdf')
		            		}else{
		            			console.log('selectContactCFselectContactCFselectContactCF',selectContactCF)
		            			var updateCF = await con.query(`UPDATE 
			            											contacts_value
			            										SET 
			            											field_id = ${selectContactCF[0].id},
																	value = ${contactRow.custom_fields[i].values[k].value},
																	contact_id = ${selectContact[0].id}
																WHERE 
																	contact_id = ${selectContact[0].id}`)
		            		}
		            		
		            	}
		            }
	            }
            }
            var insertCompany = {};
            if(row.company.id){
            	
	            var company = await axios.get(`https://azim.amocrm.ru/api/v2/companies?id=${row.company.id}`,{
					headers: {
						Cookie: `session_id=${token}`
					},
					withCredentials: true
	        	});
	        	var companyRow = company.data._embedded.items[0];
	        	var selectCompanyCF = {};
	        	var selectRespUserCompany = await con.query(`SELECT 
		            									ANY_VALUE(u.id) AS user_id,
		            									ANY_VALUE(ug.id) AS group_id
		            								FROM 
		            									users_group ug
		            								LEFT JOIN
		            									users u 
		            								ON 
		            									ug.id = u.group_id
		            								WHERE 
		            									ug.amo_id = ${companyRow.group_id}
		            								AND
		            									u.amo_id = ${companyRow.responsible_user_id}
		            								GROUP BY 
		            									u.id`);
	        	var selectUserCompany = await con.query(`SELECT 
	            									id
	            								FROM
	            									users 
	            								WHERE
	            									amo_id = ${companyRow.created_by}`);
	        	
	            if(selectCompany.length == 0){
	            	insertCompany = await con.query(`INSERT INTO
	        											leads_company (name, 
		            												created_at, 
		            												updated_at, 
		            												created_by,
		            												amo_id,
		            												resp_user_id,
		            												group_id)
	            									VALUES (?, ?, ?, ?, ?, ?, ?)`, [companyRow.name,
	            																	new Date(companyRow.created_at*1000),
	            																	new Date(companyRow.updated_at*1000),
	            																	selectUserCompany[0].id,
	            																	companyRow.id,
	            																	selectRespUserCompany[0].user_id,
	            																	selectRespUserCompany[0].group_id]);
	            	console.log(`insertCompany----------------`, insertCompany)
	            	for(var i = 0; i < companyRow.custom_fields.length; i++){
	            		for(var k = 0; k < contactRow.custom_fields[i].values.length; k++){
		            		selectCompanyCF = await con.query(`SELECT 
				            											id,
				            											name
					            									FROM
					            										custom_fields
					            									WHERE 
					            										name = '${companyRow.custom_fields[i].name}'`);
		            		var insertCompanyCF = await con.query(`INSERT INTO 
		            											leads_company_value (field_id,
		            															value,
		            															leads_company_id)
		            										VALUES (?, ?, ?)`, [selectCompanyCF[0].id,
		            															companyRow.custom_fields[i].values[k].value,
		            															insertCompany.insertId])
		            	}
	            	}
	            }else{
	            	var updateCompany = await con.query(`UPDATE 
	            											leads_company 
	            										SET 
	            											name = '${companyRow.name}', 
	        												created_at = FROM_UNIXTIME(${companyRow.created_at}), 
	        												updated_at = FROM_UNIXTIME(${companyRow.updated_at}), 
	        												created_by = ${selectUserCompany[0].id},
	        												amo_id = ${companyRow.id},
	        												resp_user_id = ${selectRespUserCompany[0].user_id},
	        												group_id = ${selectRespUserCompany[0].group_id}
	        											WHERE 
	        												amo_id = ${companyRow.id}`)
	            	for(var i = 0; i < companyRow.custom_fields.length; i++){
	            		for(var k = 0; k < contactRow.custom_fields[i].values.length; k++){
		            		if(selectCompanyCF == 0){
		            			var insertCompanyCF = await con.query(`INSERT INTO 
					            											leads_company_value (field_id,
					            															value,
					            															leads_company_id)
					            										VALUES (?, ?, ?)`, [selectCompanyCF[0].id,
					            															companyRow.custom_fields[i].values[k].value,
					            															insertCompany.insertId])
		            		}else if(selectCompanyCF){
		            			console.log('asdf')
		            		}else{
		            			var updateCompanyCF = await con.query(`UPDATE 
				            											leads_company_value
				            										SET 
				            											field_id = ${selectCompanyCF[0].id},
																		value = ${companyRow.custom_fields[i].values[k].value},
																		leads_company_id = ${selectCompany.id}
																	WHERE 
																		leads_company_id = ${selectCompany.id}`)
		            		}
		            	}
		            }
	            }
            }
            
            var insertLead = await con.query(`INSERT INTO 
	            								leads 	(name, 
	            										budget, 
	            										resp_user_id, 
	            										created_at, 
	            										updated_at, 
	            										created_by, 
	            										group_id, 
	            										amo_id,
	            										status,
	            										pipeline_id,
	            										main_contact_id,
	            										leads_company_id,
	            										is_deleted)
            								VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 	[row.name, 
            																					row.sale,
            																					selectRespUser[0].user_id,
            																					new Date(row.created_at*1000),
            																					new Date(row.updated_at*1000),
            																					selectUser[0].id,
            																					selectRespUser[0].group_id,
            																					row.id,
            																					selectStep[0].id,
            																					selectPipe[0].id,
            																					insertContact && insertContact.insertId ? insertContact.insertId : null,
            																					insertContact && insertCompany.insertId ? insertCompany.insertId : null,
            																					row.is_deleted])
            console.log(`insertLead----------------`, insertLead)
            for(var i = 0; i < row.custom_fields.length; i++){
            	if(contactRow.custom_fields.length !== 0){
	            	for(var k = 0; k < contactRow.custom_fields[i].values.length; k++){
	            		var selectCF = await con.query(`SELECT 
	            											id,
	            											name
		            									FROM
		            										custom_fields
		            									WHERE 
		            										name = '${row.custom_fields[i].name}'`);
	            		var insertCF = await con.query(`INSERT INTO 
	            											leads_value (field_id,
	            														value,
	            														leads_id)
	            										VALUES (?, ?, ?)`, [selectCF[0].id,
	            															row.custom_fields[i].values[k].value,
	            															insertLead.insertId])
	            	}
            	}
            }
            if(selectContact.length == 0 || insertContact !== 0){
            	var insertLeadsContacts = {};
            	if(typeof row.contacts.id !== 'undefined'){
					for (var j = 0; j < row.contacts.id.length; j++) {
						if(typeof row.contacts.id[j] !== 'undefined'){
							insertLeadsContacts = await con.query(`INSERT INTO
            											leads_contacts (contact_id,
            															leads_id)
            											VALUES(?, ?)`, [insertContact.insertId,
            															insertLead.insertId]);
						}
					}
				}
            	console.log(`insertLeadsContacts----------------`, insertLeadsContacts)
            }else{
            	var updateLeadsContacts = {};
            	if(typeof row.contacts.id != 'undefined'){
					for (var j = 0; j < row[i].contacts.id.length; j++) {
						if(typeof row.contacts.id[j] != 'undefined'){
							var selCont = await con.query(`SELECT 
															id
														FROM
															contacts
														WHERE 
															amo_id = ${row.contacts.id[j]}`)
							console.log(selCont)
							updateLeadsContacts = await con.query(`INSERT INTO
            											leads_contacts (contact_id,
            															leads_id)
            											VALUES(?, ?)`, [selCont[0].id,
            															insertLead.insertId]);
						}
					}
				}
            	console.log(`insertLeadsContacts----------------`, updateLeadsContacts)
            }
            if(selectCompany.length == 0 && insertContact !== 0 && insertCompany !== 0){
            	var insertLeadsCompanyContacts = await con.query(`INSERT INTO
            											leads_company_contacts (contact_id,
            																	leads_company_id)
            											VALUES(?, ?)`, [insertContact.insertId,
            															insertCompany.insertId])
           		console.log(`insertLeadsCompanyContacts----------------`, insertLeadsCompanyContacts)
            }else{
            	var updateLeadsCompanyContacts = await con.query(`INSERT INTO
            											leads_company_contacts (contact_id,
            															leads_company_id)
            											VALUES(?, ?)`, [selectCompany[0].id,
            															insertCompany.insertId]);
            	console.log(`updateLeadsCompanyContacts----------------`, updateLeadsCompanyContacts)
            }  
        }else if(req.body['leads[status][0][old_status_id]']){
        	var result = await axios.get(`https://azim.amocrm.ru/api/v2/leads?id=${req.body['leads[status][0][id]']}`,{
				headers: {
					Cookie: `session_id=${token}`
				},
				withCredentials: true
            });
            var row = result.data._embedded.items[0];
            console.log('updateROW', row);
            var insertContact = {};
            var insertCompany = {};
            var selectRespUser = await con.query(`SELECT 
	            									ANY_VALUE(u.id) AS user_id,
	            									ANY_VALUE(ug.id) AS group_id
	            								FROM 
	            									users_group ug
	            								LEFT JOIN
	            									users u 
	            								ON 
	            									ug.id = u.group_id
	            								WHERE 
	            									ug.amo_id = ${row.group_id}
	            								AND
	            									u.amo_id = ${row.responsible_user_id}
	            								GROUP BY 
	            									u.id`);
            var selectUser = await con.query(`SELECT 
            									id
            								FROM
            									users 
            								WHERE
            									amo_id = ${row.created_by}`)
            var selectPipe = await con.query(`SELECT 
            									id
            								FROM
            									pipelines
            								WHERE 
            									amo_id = ${row.pipeline.id}`);
            var selectStep = await con.query(`SELECT 
            									id
            								FROM
            									step
            								WHERE 
            									amo_id = ${row.status_id}`);
            var selectContact = {};
            if(row.main_contact.id){
            	selectContact = await con.query(`SELECT 
            										id
            									FROM 
            										contacts 
            									WHERE 
            										amo_id = ${row.main_contact.id}`)
            }

            var selectCompany = {};
            if(row.company.id){
            	selectCompany = await con.query(`SELECT 
            										id
            									FROM
            										leads_company
            									WHERE 
            										amo_id = ${row.company.id}`)
            }
            if(row.main_contact.id){
	            var contact = await axios.get(`https://azim.amocrm.ru/api/v2/contacts?id=${row.main_contact.id}`,{
						headers: {
							Cookie: `session_id=${token}`
						},
						withCredentials: true
	            	});
	            var contactRow = contact.data._embedded.items[0];
	            var selectContactCF = [];
            	for(var i = 0; i < contactRow.custom_fields.length; i++){
	            		selectContactCF = await con.query(`SELECT 
			            											id AS id,
			            											name AS name
				            									FROM
				            										custom_fields
				            									WHERE 
				            										name = '${contactRow.custom_fields[i].name}'`);
	            }
	            var selectRespUserContact = await con.query(`SELECT 
			            									ANY_VALUE(u.id) AS user_id,
			            									ANY_VALUE(ug.id) AS group_id
			            								FROM 
			            									users_group ug
			            								LEFT JOIN
			            									users u 
			            								ON 
			            									ug.id = u.group_id
			            								WHERE 
			            									ug.amo_id = ${contactRow.group_id}
			            								AND
			            									u.amo_id = ${contactRow.responsible_user_id}
			            								GROUP BY 
			            									u.id`);
	            var selectUserContact = await con.query(`SELECT 
			            									id
			            								FROM
			            									users 
			            								WHERE
			            									amo_id = ${contactRow.created_by}`);
	            if(selectContact.length == 0){
	            	insertContact = await con.query(`INSERT INTO
            											contacts (name, 
	            												created_at, 
	            												updated_at, 
	            												created_by,
	            												amo_id,
	            												resp_user_id,
	            												group_id)
	            									VALUES (?, ?, ?, ?, ?, ?, ?)`, [contactRow.name,
	            																	new Date(contactRow.created_at*1000),
	            																	new Date(contactRow.updated_at*1000),
	            																	selectUserContact[0].id,
	            																	contactRow.id,
	            																	selectRespUserContact[0].user_id,
	            																	selectRespUserContact[0].group_id]);
	            	for(var i = 0; i < contactRow.custom_fields.length; i++){
	            		for(var k = 0; k < contactRow.custom_fields[i].values.length; k++){
		            		var insertContactCF = await con.query(`INSERT INTO 
				            											contacts_value (field_id,
				            															value,
				            															contact_id)
				            										VALUES (?, ?, ?)`, [selectContactCF[0].id,
				            															contactRow.custom_fields[i].values[k].value,
				            															insertContact.insertId])
		            	}
					}
				}else if(selectContact == 'undefined'){
					console.log('asdf')
	            }else{
	            	var updateContact = await con.query(`UPDATE 
		            										contacts 
		            									SET 
		            										name = '${contactRow.name}', 
															created_at = FROM_UNIXTIME(${contactRow.created_at}), 
															updated_at = FROM_UNIXTIME(${contactRow.updated_at}), 
															created_by = ${selectUserContact[0].id},
															amo_id = ${contactRow.id},
															resp_user_id = ${selectRespUserContact[0].user_id},
															group_id = ${selectRespUserContact[0].group_id}
														WHERE 
															amo_id = ${contactRow.id}`);
	            	for(var i = 0; i < contactRow.custom_fields.length; i++){
	            		for(var k = 0; k < contactRow.custom_fields[i].values.length; k++){
	            			var selectContactValue = await con.query(`SELECT 
	            														id,
	            														value,
	            														field_id
	            													FROM
	            														contacts_value
	            													WHERE
	            														contact_id = ${selectContact[0].id}`)
	            			if(selectContactValue.length){
			            		var updateCF = await con.query(`UPDATE 
			            											contacts_value
			            										SET 
			            											field_id = ${selectContactCF[0].id},
																	value = '${contactRow.custom_fields[i].values[k].value}',
																	contact_id = ${selectContact[0].id}
																WHERE 
																	contact_id = ${selectContact[0].id}
																AND 
																	id = ${selectContactValue[0].id}`)
	            			}
		            	}
	            	}
	            }
            }
            if(row.company.id){
            	var selectCompanyCF = [];
	            var company = await axios.get(`https://azim.amocrm.ru/api/v2/companies?id=${row.company.id}`,{
					headers: {
						Cookie: `session_id=${token}`
					},
					withCredentials: true
	        	});
	        	var companyRow = company.data._embedded.items[0];
	        	for(var i = 0; i < companyRow.custom_fields.length; i++){
	            		selectCompanyCF = await con.query(`SELECT 
			            											id,
			            											name
				            									FROM
				            										custom_fields
				            									WHERE 
				            										name = '${companyRow.custom_fields[i].name}'`);
	            }
	        	var selectRespUserCompany = await con.query(`SELECT 
				            									ANY_VALUE(u.id) AS user_id,
				            									ANY_VALUE(ug.id) AS group_id
				            								FROM 
				            									users_group ug
				            								LEFT JOIN
				            									users u 
				            								ON 
				            									ug.id = u.group_id
				            								WHERE 
				            									ug.amo_id = ${companyRow.group_id}
				            								AND
				            									u.amo_id = ${companyRow.responsible_user_id}
				            								GROUP BY 
				            									u.id`);
	        	var selectUserCompany = await con.query(`SELECT 
			            									id
			            								FROM
			            									users 
			            								WHERE
			            									amo_id = ${companyRow.created_by}`);
	            if(selectCompany.length == 0){
	            	insertCompany = await con.query(`INSERT INTO
	        											leads_company (name, 
		            												created_at, 
		            												updated_at, 
		            												created_by,
		            												amo_id,
		            												resp_user_id,
		            												group_id)
	            									VALUES (?, ?, ?, ?, ?, ?, ?)`, [companyRow.name,
	            																	new Date(companyRow.created_at*1000),
	            																	new Date(companyRow.updated_at*1000),
	            																	selectUserCompany[0].id,
	            																	companyRow.id,
	            																	selectRespUserCompany[0].user_id,
	            																	selectRespUserCompany[0].group_id]);
	            	for(var i = 0; i < companyRow.custom_fields.length; i++){
	            		for(var k = 0; k < companyRow.custom_fields[i].values.length; k++){
		            		var insertCompanyCF = await con.query(`INSERT INTO 
				            											leads_company_value (field_id,
				            															value,
				            															leads_company_id)
				            										VALUES (?, ?, ?)`, [selectCompanyCF[0].id,
				            															companyRow.custom_fields[i].values[k].value,
				            															insertCompany.insertId])
		            	}
	            	}
	            }else if(selectCompany == 'undefined'){
	            	console.log('asdf')
	            }else{
	            	var selectCompanyValue = await con.query(`SELECT 
	            												id,
	            												value,
	            												field_id
	            											FROM
	            												leads_company_value
	            											WHERE
	            												leads_company_id = ${selectCompany[0].id}`)
	            	var updateCompany = await con.query(`UPDATE 
	            											leads_company 
	            										SET 
	            											name = '${companyRow.name}', 
	        												created_at = FROM_UNIXTIME(${companyRow.created_at}), 
	        												updated_at = FROM_UNIXTIME(${companyRow.updated_at}), 
	        												created_by = ${selectUserCompany[0].id},
	        												amo_id = ${companyRow.id},
	        												resp_user_id = ${selectRespUserCompany[0].user_id},
	        												group_id = ${selectRespUserCompany[0].group_id}
	        											WHERE 
	        												id = ${selectCompany[0].id}`)
	            	for(var i = 0; i < companyRow.custom_fields.length; i++){
	            		for(var k = 0; k < companyRow.custom_fields[i].values.length; k++){
	            			if(selectCompanyValue.length !== 0){
			            		var updateCompanyCF = await con.query(`UPDATE 
			            											leads_company_value
			            										SET 
			            											field_id = ${selectCompanyCF[0].id},
																	value = '${companyRow.custom_fields[i].values[k].value}',
																	leads_company_id = ${selectCompany[0].id}
																WHERE 
																	leads_company_id = ${selectCompany[0].id}
																AND 
																	id = ${selectCompanyValue[0].id}`)
	            			}else{
	            				var insertCompanyCF = await con.query(`INSERT INTO 
	            														leads_company_value(field_id, value, leads_company_id)
	            													VALUES(?, ?, ?)`, [selectCompanyCF[0].id, 
	            																		companyRow.custom_fields[i].values[k].value,
	            																		selectCompany[0].id])
	            			}
		            	}
	            	}
	            }
            }
            var selectLead = await con.query(`SELECT 
            									id
            								FROM 
            									leads
            								WHERE 
            									amo_id = ${row.id}`);
            console.log('selectLead',selectLead)
            if(selectLead.length !== 0){
            	var updateLead = await con.query(`UPDATE 
            										leads 
            									SET 
            										name = '${row.name}', 
            										budget = ${row.sale}, 
            										resp_user_id = ${selectRespUser[0].user_id}, 
            										created_at = FROM_UNIXTIME('${row.created_at}'),
            										updated_at = FROM_UNIXTIME('${row.updated_at}'), 
            										created_by = ${selectUser[0].id}, 
            										group_id = ${selectRespUser[0].group_id}, 
            										amo_id = ${row.id},
            										status = ${selectStep[0].id},
            										pipeline_id = ${selectPipe[0].id},
            										main_contact_id = ${insertContact.insertId ? (insertContact.insertId ? insertContact.insertId : null) : (selectContact[0].id ? selectContact[0].id : null)},
            										leads_company_id = ${insertCompany.insertId ? (insertCompany.insertId ? insertCompany.insertId : null) : (selectCompany[0].id ? selectCompany[0].id : null)},
            										is_deleted = ${row.is_deleted}
            									WHERE 
            										amo_id = ${row.id}`)
            	if(selectLead[0].id){
            		var selectLeadsValue = await con.query(`SELECT 
	            												id,
	            												value,
	            												field_id
	            											FROM
	            												leads_value
	            											WHERE 
	            												leads_id = ${selectLead[0].id}`)
            		for(let i = 0; i < row.custom_fields.length; i++){
            			for(let k = 0; k < row.custom_fields[i].values.length; k++){
	            			let selectCF = await con.query(`SELECT 
			            											id,
			            											name
				            									FROM
				            										custom_fields
				            									WHERE 
				            										name = '${row.custom_fields[i].name}'`);
            			
		            		if(selectLeadsValue.length == 0){
		            			let insertCF = await con.query(`INSERT INTO 
			            											leads_value (field_id,
			            														value,
			            														leads_id)
			            										VALUES (?, ?, ?)`, [selectCF[0].id,
			            															row.custom_fields[i].values[k].value,
			            															selectLead[0].id])
		            		}else{
		            			let updateCF = await con.query(`UPDATE
			            											leads_value 
			            										SET 
			            											field_id = ${selectCF[0].id},
			            											value = '${row.custom_fields[i].values[k].value}',
			            											leads_id = ${selectLead[0].id}
			            										WHERE 
			            											id = ${selectLeadsValue[0].id}`);
		            		}
	            		}
	            	}
            	}else if(selectLead =='undefined'){
            		console.log('asdf')
            	}
            	
            	
            }else{
            	var insertLead = await con.query(`INSERT INTO 
	            								leads 	(name, 
	            										budget, 
	            										resp_user_id, 
	            										created_at, 
	            										updated_at, 
	            										created_by, 
	            										group_id, 
	            										amo_id,
	            										status,
	            										pipeline_id,
	            										main_contact_id,
	            										leads_company_id,
	            										is_deleted)
            								VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 	[row.name, 
            																					row.sale,
            																					selectRespUser[0].user_id,
            																					new Date(row.created_at*1000),
            																					new Date(row.updated_at*1000),
            																					selectUser[0].id,
            																					selectRespUser[0].group_id,
            																					row.id,
            																					selectStep[0].id,
            																					selectPipe[0].id,
            																					insertContact.insertId ? insertContact.insertId : null,
            																					insertCompany.insertId ? insertCompany.insertId : null,
            																					row.is_deleted])
            	console.log(`insertLead----------------`, insertLead)
            	for(var i = 0; i < row.custom_fields.length; i++){
            		for(var k = 0; k < row.custom_fields[i].values.length; k++){
	            		var selectCF = await con.query(`SELECT 
	            											id,
	            											name
		            									FROM
		            										custom_fields
		            									WHERE 
		            										name = '${row.custom_fields[i].name}'`);
	            		var insertCF = await con.query(`INSERT INTO 
	            											leads_value (field_id,
	            														value,
	            														leads_id)
	            										VALUES (?, ?, ?)`, [selectCF[0].id,
	            															row.custom_fields[i].values[k].value,
	            															insertLead.insertId])
	            	}
            	}

            }

        }
        res.status(200).send();
	}catch(e){
		console.log(e);
		res.status(500).send(e);
	}
});

router.post('/test', async function(req, res){

	try{
		console.log('test')
		res.redirect(300, '/axios/test2')
	} catch(e){
		res.status(500).send();
	}
})

module.exports = router;
