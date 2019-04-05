var mysql = require('mysql');
var express = require('express');
var Query = require('node-mysql-ejq');
var config = require('../config/config');
var con = mysql.createConnection(config.db);

var query = new Query(con);

var router = express.Router();

//select all leads by pipeline or pipeline with step limit 20
router.get('/api/select', async function(req, res){
	var p_id = req.body.p_id;
	var s_id = req.body.s_id;
	var list = req.body.list;
	try{
		if(list == 1 && !s_id){
			var select = await con.query(`SELECT 
											L.id leads_id, 
											L.name leads_name,
											L.budget budget,
											L.created_at leads_created_at,
											L.main_contact_id main_contact,
											L.leads_company_id leads_company,
											C.id main_contact_id,
											C.name contact_name,
											LC.id leads_company_id,
											LC.name company_name,
											P.id pipeline_id,
											P.name  pipeline_name,
											P.pos pipeline_position,
											S.id step_id,
											S.name step_name,
											S.position step_position,
											CL.id color_id,
											CL.name color_name
										FROM 
											leads L
										LEFT JOIN 
											contacts C 
										ON 
											L.main_contact_id = C.id
										LEFT JOIN 
											leads_company LC 
										ON 
											L.leads_company_id = LC.id
										LEFT JOIN 
											pipelines P 
										ON 
											L.pipeline_id = P.id
										LEFT JOIN 
											step S 
										ON 
											L.status = S.id 
										LEFT JOIN 
											color CL
										ON 
											S.color_id = CL.id 
										WHERE 
											P.id = ${p_id} 
										AND 
											L.is_deleted IS NULL 
										OR 
											L.is_deleted = 0
										ORDER BY 
											L.updated_at DESC 
										LIMIT 50`)
			var selCount = await con.query(`SELECT COUNT(*) AS count 
											FROM 
												leads 
											WHERE 
												pipeline_id = ${p_id} 
											AND 
												is_deleted IS NULL 
											OR
												is_deleted = 0`)
			var selSumm = await con.query(`SELECT SUM(budget) sumBudget 
											FROM 
												leads 
											WHERE 
												pipeline_id = ${p_id} 
											AND 
												is_deleted IS NULL 
											OR
												is_deleted = 0`)
			selCount = selCount[0].count;
			selSumm = selSumm[0].sumBudget;
			res.status(200).json({select, selCount, selSumm});
			
		}else if(!s_id && !list){
			var selectStep = await con.query(`SELECT 
												s.id id, 
												s.name name,
												s.position position,
												cl.id color_id,
												cl.name color_name
											FROM 
												step s
											LEFT JOIN
												color cl
											ON
												s.color_id = cl.id
											WHERE 	
												pipeline_id = ${p_id}`)
			for(var i=0; i<selectStep.length; i++){
				console.log(selectStep[i]);
				s_id = selectStep[i].id
				var selectLead = await con.query(`SELECT 
													L.id leads_id, 
													L.name leads_name,
													L.budget budget,
													L.created_at leads_created_at,
													L.main_contact_id main_contact,
													L.leads_company_id leads_company,
													C.id main_contact_id,
													C.name contact_name,
													LC.id leads_company_id,
													LC.name company_name,
													P.id pipeline_id,
													P.name  pipeline_name,
													P.pos pipeline_position,
													S.id step_id,
													S.name step_name,
													S.position step_position,
													CL.id color_id,
													CL.name color_name
												FROM 
													leads L
												LEFT JOIN 
													contacts C 
												ON 
													L.main_contact_id = C.id
												LEFT JOIN 
													leads_company LC 
												ON 
													L.leads_company_id = LC.id
												LEFT JOIN 
													pipelines P 
												ON 
													L.pipeline_id = P.id
												LEFT JOIN 
													step S 
												ON 
													L.status = S.id 
												LEFT JOIN 
													color CL
												ON 
													S.color_id = CL.id 
												WHERE 
													P.id = ${p_id} 
												AND
													status = ${s_id}
												AND
													L.is_deleted IS NULL 
												OR 
													L.is_deleted = 0
												ORDER BY 
													L.updated_at DESC 
												LIMIT 20`)
				
				var selCount = await con.query(`SELECT COUNT(*) AS count 
												FROM 
													leads 
												WHERE 	
													pipeline_id = ${p_id} 
												AND 
													status = ${s_id}
												AND 
													is_deleted IS NULL 
												OR 
													is_deleted = 0`)
				var selSumm = await con.query(`SELECT SUM(budget) sumBudget 	
												FROM 
													leads 
												WHERE 
													pipeline_id = ${p_id} 
												AND 
													status = ${s_id}
												AND 
													is_deleted IS NULL 
												OR 
													is_deleted = 0`)
				selectStep[i].leads = selectLead;
				selectStep[i].selCount = selCount[0].count;
				selectStep[i].selSumm = selSumm[0].sumBudget;

			}
			res.status(200).json({selectStep})
			
			return;
		}else{
			var select = await con.query(`SELECT 
											L.id leads_id, 
											L.name leads_name,
											L.budget budget,
											L.created_at leads_created_at,
											L.main_contact_id main_contact,
											L.leads_company_id leads_company,
											C.id main_contact_id,
											C.name contact_name,
											LC.id leads_company_id,
											LC.name company_name,
											P.id pipeline_id,
											P.name  pipeline_name,
											P.pos pipeline_position,
											S.id step_id,
											S.name step_name,
											S.position step_position,
											CL.id color_id,
											CL.name color_name
										FROM 
											leads L
										LEFT JOIN 
											contacts C 
										ON 
											L.main_contact_id = C.id
										LEFT JOIN 
											leads_company LC 
										ON 
											L.leads_company_id = LC.id
										LEFT JOIN 
											pipelines P 
										ON 
											L.pipeline_id = P.id
										LEFT JOIN 
											step S 
										ON 
											L.status = S.id 
										LEFT JOIN 
											color CL
										ON 
											S.color_id = CL.id 
										WHERE 
											P.id = ${p_id} 
										AND
											status = ${s_id}
										AND
											L.is_deleted IS NULL 
										OR 
											L.is_deleted = 0
										ORDER BY 
											L.updated_at DESC 
										LIMIT 20`)
			
			var selCount = await con.query(`SELECT COUNT(*) AS count 
											FROM 
												leads 
											WHERE 	
												pipeline_id = ${p_id} 
											AND 
												status = ${s_id}
											AND 
												is_deleted IS NULL 
											OR 
												is_deleted = 0`)
			var selSumm = await con.query(`SELECT SUM(budget) sumBudget 	
											FROM 
												leads 
											WHERE 
												pipeline_id = ${p_id} 
											AND 
												status = ${s_id}
											AND 
												is_deleted IS NULL 
											OR 
												is_deleted = 0`)
			selCount = selCount[0].count;
			selSumm = selSumm[0].sumBudget;
			res.status(200).json({select, selCount, selSumm});
			
		}
		/*select.forEach(z => {
			z.select = JSON.parse(z.select)
		})*/
		
	} catch(err){
		console.log(err);
		res.status(500).send();
	}
});

//select all pipelines
router.get('/api/select/pipeline', async function(req, res){
	try{
		var select = await con.query(`SELECT 
										id, 
										name 
									FROM 
										pipelines 
									ORDER BY 
										pos`);
		res.send(select)
	}catch(e){
		console.log(e);
		res.status(500).send();
	}
});

//select all steps by pipeline
router.get('/api/select/step/:p_id', async function(req, res){
	var p_id = req.params.p_id;
	
	try{
		var select = await con.query(`SELECT 
										s.id id, 
										s.name name,
										s.position position,
										cl.id color_id,
										cl.name color_name
									FROM 
										step s
									LEFT JOIN
										color cl
									ON
										s.color_id = cl.id
									WHERE 	
										pipeline_id = ${p_id}`)
		res.send(select);
	}catch(e){
		console.log(e);
		res.status(500).send(e);
	}
});

//select all pipelines with steps
router.get('/api/select/pipe_step', async function(req, res){
	try{
		var select = await con.query(`SELECT 
										p.id, 
										p.name,
										JSON_ARRAYAGG(JSON_OBJECT('id',s.id,'name',s.name,'company_id',s.company_id, 'position', s.position, 'color_id', cl.id, 'color_name', cl.name)) steps 
									FROM 
										pipelines p 
									LEFT JOIN 
										step s 
									ON 
										s.pipeline_id=p.id 
									LEFT JOIN 
										color cl
									ON 
										s.color_id = cl.id 
									GROUP BY 
										p.id 
									ORDER BY 
										p.pos`);
		select.forEach(x => {
			x.steps = JSON.parse(x.steps)
		})
		res.send(select);
	}catch(e){
		console.log(e);
		res.status(500).send(e);
	}
});

//update lead step id
router.put('/api/update/step', async function(req, res){
	var id = req.body.lead_id;
	var s_id = req.body.s_id;
	try{
		var update = await con.query(`UPDATE 
										leads 
									SET 
										status = ${s_id},
										updated_at = NOW()
									WHERE 	
										id = ${id}`)
		console.log(update)
		res.send(update);
	}catch(e){
		res.status(500).send(e);
	}
});

//delete lead, give is_deleted 1
router.delete('/api/delete/lead/:id', async function(req, res){
	var id = req.params.id;
	try{
		var update = await con.query(`UPDATE 
										leads 
									SET 
										is_deleted = 1 
									WHERE 
										id = ${id}`);
		res.send(update)
	}catch(e){
		console.log(e);
		res.status(500).send(e);
	}
});

//select lead card 
router.get('/api/select/lead/:id', async function(req, res){
	var id = req.params.id;
	try{
		var selectLead = await con.query(`SELECT 
											l.id id, 
											l.name lead_name, 
											l.budget budget, 
											l.created_at created_at,
											l.updated_at updated_at,
											l.pipeline_id pipe_id,
										 	l.status step_id,
										 	p.name pipe_name,
										 	s.name step_name,
										 	l.resp_user_id resp_user_id,
										 	u.name resp_user_name,
										 	l.created_by created_by_id,
										 	us.name created_by_name,
										 	l.group_id group_id,
										 	l.amo_id amo_id,
										 	l.main_contact_id main_contact_id,
										 	l.leads_company_id leads_company_id,
										 	cl.id color_id,
											cl.name color_name,
										 	JSON_ARRAYAGG(JSON_OBJECT('cf_id', cf.id, 'name', cf.name, 'value_id', lv.id, 'value', lv.value)) custom_fields
										FROM 
											leads l
										LEFT JOIN
											leads_value lv
										ON
											lv.leads_id = l.id
										LEFT JOIN
											users u
										ON
											u.id = l.resp_user_id
										LEFT JOIN
											users us
										ON 
											us.id = l.created_by
										LEFT JOIN
										  	custom_fields cf
										ON
										  	cf.id = lv.field_id
										LEFT JOIN
											pipelines p 
										ON 
											l.pipeline_id = p.id
										LEFT JOIN 
											step s 
										ON 
											l.status = s.id
										LEFT JOIN 
											color cl
										ON 
											s.color_id = cl.id 
										WHERE
										  	l.id = ${id}
										GROUP BY
										   l.id`)
		var selectContact = await con.query(`SELECT 
												ANY_VALUE(c.id) AS contact_id,
												ANY_VALUE(c.name) AS contact_name,
												ANY_VALUE(c.created_at) AS created_at,
												ANY_VALUE(c.updated_at) AS updated_at,
												ANY_VALUE(c.created_by) AS created_by,
												ANY_VALUE(c.amo_id) AS amo_id,
												ANY_VALUE(c.resp_user_id) AS resp_user_id,
												ANY_VALUE(c.group_id) AS group_id,
												ANY_VALUE(lcom.name) AS company_name,
												JSON_ARRAYAGG(JSON_OBJECT('cf_id', cf.id, 'name', cf.name, 'value_id', cv.id, 'value', cv.value, 'cf_type', cfl.name)) custom_fields
											FROM
												leads_contacts lc
											LEFT JOIN
												leads l
											ON
												lc.leads_id = l.id
											LEFT JOIN 
												contacts c
											ON
												c.id = lc.contact_id
											LEFT JOIN
												contacts_value cv
											ON
												c.id = cv.contact_id
											LEFT JOIN 
												leads_company_contacts lcc
											ON
												lc.contact_id = lcc.contact_id
											LEFT JOIN
												leads_company lcom
											ON
												lcc.leads_company_id = lcom.id
											LEFT JOIN
												custom_fields cf
											ON
												cf.id = cv.field_id
											LEFT JOIN 
												custom_fields_list cfl 
											ON 
												cfl.id = cv.list_id
											WHERE 
												l.id = ${id}
											AND
												cf.lcc_id = 2
											GROUP BY
									   			lc.contact_id`)
		var selectCompany = await con.query(`SELECT
												lc.id company_id,
												lc.name company_name,
												lc.created_at created_at,
												lc.updated_at updated_at,
												lc.created_by created_by,
												lc.amo_id amo_id, 
												lc.resp_user_id resp_user_id,
												lc.group_id group_id, 
												JSON_ARRAYAGG(JSON_OBJECT('cf_id', cf.id, 'name', cf.name, 'value_id', lcv.id, 'value', lcv.value, 'cf_type', cfl.name)) custom_fields
											FROM
												leads_company lc
											LEFT JOIN 
												leads l
											ON
												lc.id = l.leads_company_id
											LEFT JOIN 
												leads_company_value lcv
											ON
												lcv.leads_company_id = lc.id
											LEFT JOIN 
												custom_fields cf
											ON 
												cf.id = lcv.field_id
											LEFT JOIN 
												custom_fields_list cfl 
											ON 
												cfl.id = lcv.list_id
											WHERE 
												l.id = ${id}
											GROUP BY 
												lc.id
											`)
		
		var selectUser = await con.query(`SELECT 
											ug.name user_group,
											JSON_ARRAYAGG(JSON_OBJECT('user_id', u.id, 'name', u.name)) users
										FROM 
											users u
										LEFT JOIN 
											users_group ug
										ON 
											u.group_id = ug.id
										WHERE NOT
											u.group_id = 9
										GROUP 
											BY ug.id`)
		var selectCardGroups = await con.query(`SELECT
													cg.id id,
													cg.name name,
													JSON_ARRAYAGG(JSON_OBJECT('id', cf.id, 'name', cf.name, 'type', ft.name)) custom_fields_list
												FROM 
													custom_fields cf 
												LEFT JOIN
													card_groups cg 
												ON 
													cg.id = cf.group_id
												LEFT JOIN 
													field_type ft 
												ON 
													ft.id = cf.field_type
												LEFT JOIN 
													detail_type dt 
												ON
													cf.lcc_id = dt.id
												WHERE NOT 
													cf.lcc_id = 2
												AND NOT
													cf.lcc_id = 3
												GROUP BY 
													cg.id`)
		var selectContactCF = await con.query(`SELECT 
												cg.id,
												cg.name,
												JSON_ARRAYAGG(JSON_OBJECT('id', cf.id, 'name', cf.name, 'type', ft.name)) custom_fields_list
											FROM
												custom_fields cf
											LEFT JOIN 
												card_groups cg
											ON
												cg.id = cf.group_id
											LEFT JOIN 
												field_type ft 
											ON 
												ft.id = cf.field_type
											WHERE
												cf.lcc_id = 2
											GROUP BY 
												cg.id`)
		var selectCompanyCF = await con.query(`SELECT 
												cg.id,
												cg.name,
												JSON_ARRAYAGG(JSON_OBJECT('id', cf.id, 'name', cf.name, 'type', ft.name)) custom_fields_list
											FROM
												custom_fields cf
											LEFT JOIN 
												card_groups cg
											ON
												cg.id = cf.group_id
											LEFT JOIN 
												field_type ft 
											ON 
												ft.id = cf.field_type
											WHERE
												cf.lcc_id = 3
											GROUP BY 
												cg.id`)
		selectLead.forEach(l => {
			l.custom_fields = JSON.parse(l.custom_fields)
		});
		selectContact.forEach(c => {
			c.custom_fields = JSON.parse(c.custom_fields)
		});
		selectCompany.forEach(c => {
			c.custom_fields = JSON.parse(c.custom_fields)
		});
		selectUser.forEach(c => {
			c.users = JSON.parse(c.users)
		});
		selectCardGroups.forEach(c => {
			c.custom_fields_list = JSON.parse(c.custom_fields_list)
		});
		selectContactCF.forEach(c => {
			c.custom_fields_list = JSON.parse(c.custom_fields_list)
		});
		selectCompanyCF.forEach(c => {
			c.custom_fields_list = JSON.parse(c.custom_fields_list)
		});
		if(selectCardGroups){
			selectCardGroups.forEach(c=> {
				c.custom_fields_list.forEach(x => {
					let i = selectLead[0].custom_fields.map(y => {return y.cf_id}).indexOf(x.id);
					x.value = selectLead[0].custom_fields[i] || {"name": null,
											                    "cf_id": null,
											                    "value": null,
											                    "cf_type": null,
											                    "value_id": null};
				})
			});
		}
		if(selectContactCF){
			selectContactCF.forEach(c=> {
				c.custom_fields_list.forEach(x => {
					if(selectContact[0]){
						let i = selectContact[0].custom_fields.map(y => {return y.cf_id}).indexOf(x.id);
						x.value = selectContact[0].custom_fields[i] || {"name": null,
													                    "cf_id": null,
													                    "value": null,
													                    "cf_type": null,
													                    "value_id": null};
					}
				});
			});
		}
		if(selectCompanyCF){
			selectCompanyCF.forEach(c=> {
				c.custom_fields_list.forEach(x => {
					if(selectCompany[0]){
						let i = selectCompany[0].custom_fields.map(y => {return y.cf_id}).indexOf(x.id);
						x.value = selectCompany[0].custom_fields[i] || {"name": null,
													                    "cf_id": null,
													                    "value": null,
													                    "cf_type": null,
													                    "value_id": null};
					}
				});
			});
		}
		res.status(200).json({
			selectLead:selectLead[0],
			selectContact:selectContact[0],
			selectCompany:selectCompany[0],
			selectUser,
			selectCardGroups,
			selectContactCF,
			selectCompanyCF
		})
	}catch(e){
		console.log(e)
		res.status(500).send(e);
	}
});


//create new card
router.get('/api/select/newlead', async function(req, res){
	try{
		var selectPipe = await con.query(`SELECT 
										p.id, 
										p.name,
										JSON_ARRAYAGG(JSON_OBJECT('id',s.id,'name',s.name,'company_id',s.company_id, 'position', s.position, 'color_id', cl.id, 'color_name', cl.name)) steps 
									FROM 
										pipelines p 
									LEFT JOIN 
										step s 
									ON 
										s.pipeline_id=p.id 
									LEFT JOIN 
										color cl
									ON 
										s.color_id = cl.id 
									GROUP BY 
										p.id 
									ORDER BY 
										p.pos`);
		
		var selectUser = await con.query(`SELECT 
											ug.name user_group,
											JSON_ARRAYAGG(JSON_OBJECT('user_id', u.id, 'name', u.name)) users
										FROM 
											users u
										LEFT JOIN 
											users_group ug
										ON 
											u.group_id = ug.id
										WHERE NOT
											u.group_id = 9
										GROUP BY ug.id`)
		var selectCardGroups = await con.query(`SELECT
													cg.id id,
													cg.name name,
													JSON_ARRAYAGG(JSON_OBJECT('id', cf.id, 'name', cf.name)) custom_fields_list
												FROM 
													custom_fields cf 
												LEFT JOIN
													card_groups cg 
												ON 
													cg.id = cf.group_id
												GROUP BY 
													cg.id`)
		selectPipe.forEach(c => {
			c.steps = JSON.parse(c.steps)
		});
		selectUser.forEach(c => {
			c.users = JSON.parse(c.users)
		});
		selectCardGroups.forEach(c => {
			c.custom_fields_list = JSON.parse(c.custom_fields_list)
		});
		selectCardGroups.forEach(c=> {
			c.custom_fields_list.forEach(x => {
				x.value = {"value":''};
			})
		});
		res.status(200).json({
			selectPipe,
			selectCardGroups,
			selectUser
		})
	}catch(e){
		console.log(e);
		res.status(500).send(e);
	}
});

router.put('/api/update/lead/:id', async function(req, res){
	var lead_id = req.params.id;
	var data = req.body;
	var dateLead = {};
	var dateContact = {};
	var dateCompany = {};
	try{
		if(data.selectLead){
			dateLead = new Date(data.selectLead.created_at).valueOf();
			var updateLead = await con.query(`UPDATE 
													leads l
												SET
													l.name = '${data.selectLead.lead_name}',
													l.budget = '${data.selectLead.budget}',
													l.created_at = FROM_UNIXTIME(${dateLead}),
													l.updated_at = NOW(),
													l.pipeline_id = '${data.selectLead.pipe_id}',
													l.status = '${data.selectLead.step_id}',
													l.resp_user_id = '${data.selectLead.resp_user_id}',
													l.created_by = '${data.selectLead.created_by_id}',
													l.group_id = '${data.selectLead.group_id}',
													l.main_contact_id = '${data.selectLead.main_contact_id}',
													l.leads_company_id = '${data.selectLead.leads_company_id}',
													l.amo_id = '${data.selectLead.amo_id}'
												WHERE
													l.id = ${lead_id}`);
			for(let i = 0; i < data.selectCardGroups.length; i++){
				for(let x = 0; x < data.selectCardGroups[i].custom_fields_list.length; x++){
					if(data.selectLead.custom_fields.find(k =>{
						return k.value_id == data.selectCardGroups[i].custom_fields_list[x].value.value_id
					})){
						var updateLeadCF = await con.query(`UPDATE 
																leads_value
															SET
																value = '${data.selectCardGroups[i].custom_fields_list[x].value.value}'
															WHERE 
																leads_id = ${lead_id}
															AND
																field_id = ${data.selectCardGroups[i].custom_fields_list[x].id}`)
						console.log(updateLeadCF)
					}else{
						var insertLeadCF = await con.query(`INSERT INTO 
																leads_value (value, field_id, leads_id)
															VALUES(?, ?, ?)`, [data.selectCardGroups[i].custom_fields_list[x].value.value,
																				data.selectCardGroups[i].custom_fields_list[x].id,
																				lead_id])
						console.log(insertLeadCF)
					}
				}
			}
		}
		if(data.selectContact){
			dateContact = new Date(data.selectContact.created_at).valueOf();
			var updateContact = await con.query(`UPDATE 
													contacts c 
												LEFT JOIN 
													leads_contacts lc 
												ON 
													c.id = lc.contact_id
												LEFT JOIN 
													leads l 
												ON 
													l.id = lc.leads_id
												SET
													c.name = '${data.selectContact.contact_name}',
													c.created_at = FROM_UNIXTIME(${dateContact}),
													c.updated_at = NOW(),
													c.created_by = ${data.selectContact.created_by},
													c.amo_id = ${data.selectContact.amo_id},
													c.resp_user_id = ${data.selectContact.resp_user_id},
													c.group_id = ${data.selectContact.group_id}
												WHERE 
													l.id = ${lead_id}`);
			for(let i = 0; i < data.selectContactCF.length; i++){
				for(let x = 0; x < data.selectContactCF[i].custom_fields_list.length; x++){
					if(data.selectContact.custom_fields.find(k =>{
						return k.value_id == data.selectContactCF[i].custom_fields_list[x].value.value_id
					})){
						var updateContactCF = await con.query(`UPDATE 
																	contacts_value
																SET
																	value = '${data.selectContactCF[i].custom_fields_list[x].value.value}'
																WHERE 
																	contact_id = ${data.selectContact.contact_id}
																AND
																	field_id = ${data.selectContactCF[i].custom_fields_list[x].id}`)
						console.log(updateContactCF)
					}else{
						var insertContactCF = await con.query(`INSERT INTO 
																	contacts_value (field_id, value, contact_id)
																VALUES(?, ?, ?)`, [data.selectContactCF[i].custom_fields_list[x].value.value,
																					data.selectContactCF[i].custom_fields_list[x].id,
																					data.selectContact.contact_id])
						console.log(insertContactCF)
					}
				}
			}
		}
		if(data.selectCompany){
			dateCompany = new Date(data.selectCompany.created_at).valueOf();
			var updateCompany = await con.query(`UPDATE
													leads_company lc
												LEFT JOIN 
													leads l
												ON
													l.leads_company_id = lc.id
												SET 
													lc.name = '${data.selectCompany.company_name}',
													lc.created_at = FROM_UNIXTIME(${dateCompany}),
													lc.updated_at = NOW(),
													lc.created_by = ${data.selectCompany.created_by},
													lc.amo_id = ${data.selectCompany.amo_id},
													lc.resp_user_id = ${data.selectCompany.resp_user_id},
													lc.group_id = ${data.selectCompany.group_id}
												WHERE 
													l.id = ${lead_id}`);
			for(let i = 0; i < data.selectCompanyCF.length; i++){
				for(let x = 0; x < data.selectCompanyCF[i].custom_fields_list.length; x++){
					if(data.selectCompany.custom_fields.find(k =>{
						return k.value_id == data.selectCompanyCF[i].custom_fields_list[x].value.value_id
					})){
						var updateCompanyCF = await con.query(`UPDATE 
																	leads_company_value
																SET
																	value = '${data.selectCompanyCF[i].custom_fields_list[x].value.value}'
																WHERE 
																	leads_company_id = ${data.selectCompany.company_id}
																AND
																	field_id = ${data.selectCompanyCF[i].custom_fields_list[x].id}`)
						console.log(updateCompanyCF)
					}else{
						var insertCompanyCF = await con.query(`INSERT INTO
																	leads_company_value(field_id, value, leads_company_id)
																VALUES(?, ?, ?)`, [data.selectCompanyCF[i].custom_fields_list[x].value.value,
																					data.selectCompanyCF[i].custom_fields_list[x].id,
																					data.selectCompany.company_id])
						console.log(insertCompanyCF)
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

/*router.post('/api/insert/newlead', async function(req, res){
	try{
		var insertLead = await con.query(`INSERT INTO
											leads (name, budget, resp_user_id, created_at, updated_at, group_id, status, pipeline_id)`)
		res.status(200).send();
	}catch(e){
		console.log(e);
		res.status(500).send(e);
	}
});*/

//select all leads
router.get('/api/select/all', async function(req, res){
	try{
		var select = await con.query(`SELECT 
											L.id leads_id, 
											L.name leads_name,
											L.budget budget,
											L.created_at leads_created_at,
											L.main_contact_id main_contact,
											L.leads_company_id leads_company,
											C.id main_contact_id,
											C.name contact_name,
											LC.id leads_company_id,
											LC.name company_name,
											P.id pipeline_id,
											P.name  pipeline_name,
											P.pos pipeline_position,
											S.id step_id,
											S.name step_name,
											S.position step_position,
											CL.id color_id,
											CL.name color_name
										FROM 
											leads L
										LEFT JOIN 
											contacts C 
										ON 
											L.main_contact_id = C.id
										LEFT JOIN 
											leads_company LC 
										ON 
											L.leads_company_id = LC.id
										LEFT JOIN 
											pipelines P 
										ON 
											L.pipeline_id = P.id
										LEFT JOIN 
											step S 
										ON 
											L.status = S.id
										LEFT JOIN 
											color CL
										ON 
											S.color_id = CL.id 
										WHERE
											L.is_deleted IS NULL 
										OR 
											L.is_deleted = 0
										ORDER BY 
											L.created_at DESC 
										LIMIT 40`)
			var selCount = await con.query(`SELECT COUNT(*) AS count 
											FROM 
												leads 
											WHERE
												is_deleted IS NULL 
											OR 
												is_deleted = 0`)
			var selSumm = await con.query(`SELECT SUM(budget) sumBudget 
											FROM 
												leads 
											WHERE
												is_deleted IS NULL 
											OR 
												is_deleted = 0`)
		selCount = selCount[0].count;
		selSumm = selSumm[0].sumBudget;
		res.status(200).json({
			select, 
			selCount, 
			selSumm
		});
	}catch(e){
		console.log(e);
		res.status(500).send(e);
	}
});

//select all custom fields
router.get('/api/select/custom_fields', async function(req, res){
	try{
		var select = await con.query(`SELECT
										cf.id id,
										cf.name field_name
									FROM 
										custom_fields cf`)
		res.status(200).json({select})
	}catch(e){
		console.log(e);
		res.status(500).send(e);
	}
});

//fast insert
router.post('/api/insert/fast', async function(req, res){
	try{
		var lead_contact = req.body.lead_contact;
		var lead_phone = req.body.lead_phone;
		var lead_email = req.body.lead_email;
		var pipe = req.body.p_id;
		var step = req.body.s_id;
		var date = new Date();
		var insertLead = await con.query(`INSERT INTO 
											leads (name, budget, created_at, updated_at, pipeline_id, status)
										VALUES(?, ?, ?, ?, ?, ?)`, [req.body.lead_title, req.body.lead_const, date, date, pipe, step])
		insertLead = insertLead.insertId.toString();

		if(lead_contact){
			var insertContact = await con.query(`INSERT INTO
												contacts (name, created_at, updated_at)
											VALUES(?, ?, ?)`, [lead_contact, date, date])
			insertContact = insertContact.insertId.toString();			
		}

		if(insertContact){
			var insertDir = await con.query(`INSERT INTO
												leads_contacts (leads_id, contact_id)
											VALUES(?, ?)`, [insertLead, insertContact])
		}
		console.log(insertContact)
		if(lead_phone){
			var insertPhone = await con.query(`INSERT INTO
			 									contacts_value (value, field_id, contact_id)
			 								VALUES(?, 58, ?)`, [lead_phone, insertContact])
			console.log(insertPhone)
		}
		if(lead_email){
			var insertEmail = await con.query(`INSERT INTO
			 									contacts_value (value, field_id, contact_id)
			 								VALUES(?, 59, ?)`, [lead_email, insertContact])
		}
		res.status(200).json({
			insertLead,
			insertContact,
			insertPhone,
			insertEmail
		});
	}catch(e){
		console.log(e)
		res.status(500).send(e);
	}
});

//select tasks
router.get('/api/select/task', async function (req, res) {
	try{
		var select = await con.query(`SELECT 
										ts.id step_id,
										ts.name step_name,
										cl.id color_id,
										cl.name color_name,
										JSON_ARRAYAGG(JSON_OBJECT('task_id', t.id, 'text', t.comment, 'created_at', t.created_at, 
											'updated_at', t.updated_at, 'complete_till', t.complete_till, 'user_name', u.name, 
											'resp_user_id', t.resp_user_id, 'lead_id', l.id, 'lead_name', l.name, 'company_name', lcom.name, 
											'contact_name', c.name)) tasks 
									FROM
										task_step ts
									LEFT JOIN 
										task t
									ON
										t.status = ts.id
									LEFT JOIN 
										leads l 
									ON
										l.amo_id = t.element_id
									LEFT JOIN
										leads_company lcom
									ON
										l.leads_company_id = lcom.id
									LEFT JOIN 
										contacts c
									ON
										c.id = l.main_contact_id
									LEFT JOIN 
										users u 
									ON
										u.id = t.resp_user_id
									LEFT JOIN 
										color cl 
									ON
										cl.id = ts.color_id
									WHERE 
										t.is_completed = 0
									GROUP BY
										ts.id`)

		select.forEach(x => {
			x.tasks = JSON.parse(x.tasks)
		})
		res.status(200).json({
			select
		})
	}catch(e){
		console.log(e);
		res.status(500).send();
	}
});

router.post('/api/like/:table', async function(req, res){
	var table = req.params.table;
	var like = req.body.like;
	var sql = '';
	try{
		let sql = `SELECT * FROM ${table} WHERE `;
		var count = false;
		var pre_select = await query.select({table: table, limit: {from: 0, number: 1}});
		pre_select = pre_select[0];
		for(var key in pre_select){
			if(key !='created_at' || key !='updated_at' || key !='complete_till'){
				if(!count){
					sql = sql + `${key} LIKE '%${like}%'`;
					count = true;
				} else {
					sql = sql + ` OR ${key} LIKE '%${like}%'`;
				}
			}
		}
		sql = sql + ' LIMIT 0, 20';
		console.log('asdasdadsasd', sql)
		var select = await con.query(sql)
		res.send(select);
	} catch(e){
		console.log(e);
		res.status(500).send(e);
	}
});

router.post('/api/where/:table/:from', async function(req, res){
	var table = req.params.table;
	var from = req.params.from;
	var where = req.body.where;
	var orderby = req.body.orderby;
	try{
		if(table=='leads'){
			var select = await query.select({table: table, where: where, limit: {from: from, number: 20}, orderby: orderby});
		} else if(table=='contacts' || table == 'leads_company' || table== 'leads_company_contacts'){
			var select = await query.select({table: table, where: where, limit: {from: from, number: 40}, orderby: orderby});
		} else if(table=='users'){
			var select = await query.select({table: 'users', where: where, keys: ['name']})
		} else {
			var select = await query.select({table: table, where: where, limit: {from: from, number: 20}});
		}	
		res.send(select);
	} catch(e){
		console.log(e)
		res.send(e);
	}
});

router.post('/api/updat/:table', async function(req, res){
	var table = req.params.table;
	var data = req.body;
	for(var key in data){
		if(key == 'created' || key == "changed" || key == 'finished'){
			delete data[key]
		}
	}
	try{
		if(table == 'leads' || table == 'contacts' || table == 'leads_company'){
			var select = await query.select({table: table, where: {id: data.id}});
			select = select[0];

			for(var key in select){
				if(key == 'created_at' || key == 'updated_at' || key == 'comlete_till'){
					delete data[key]
				}
			}
			data.updated_at = new Date();
			var update = await query.update({table: table, where: {id: data.id}, data: data});
		} else {
			var update = await query.update({table: table, where: {id: data.id}, data: data});
		}
		
		res.send();
	} catch(e){
		res.status(500).send();
		throw new Error(e);
	}
})

router.post('/api/count/:table', async function(req, res){
	var table = req.params.table;
	var where = req.body;
	try{
		if(where !== 'undefined'){
			var select = await query.select({table: table, count: 'id', where: where})
			console.log(select)
			res.send(select)
		} else {
			var select = await query.select({table: table, count: 'id'})
			console.log(select)
			res.send(select)
		}
		
	} catch(e){
		console.log(e)
	}
});

router.post('/api/pos/:table/:id', async function(req, res){
	var table = req.params.table;
	var id = req.body.id;
	try{
		//for(var key )
		res.send();
	}catch(e){
		console.log(e);
	}
})

router.post('/api/test', async function(req, res){
	try{

		var select = await query.select({table: 'leads'});
		console.log(select)
		res.send();
	} catch(e){
		console.log(e)
	}
})

module.exports = router;
