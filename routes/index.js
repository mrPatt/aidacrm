var mysql = require('mysql');
var express = require('express');
var Query = require('node-mysql-ejq');
var config = require('../config/config');
var con = mysql.createConnection(config.db);

var query = new Query(con);

var router = express.Router();

//select all leads by pipeline or pipeline with step limit 20
router.post('/api/select', async function(req, res){
	var p_id = req.body.p_id;
	var s_id = req.body.s_id;
	try{
		if(!s_id){
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
										LIMIT 20`)
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
			
		}
		/*select.forEach(z => {
			z.select = JSON.parse(z.select)
		})*/
		selCount = selCount[0].count;
		selSumm = selSumm[0].sumBudget;
		res.status(200).json({select, selCount, selSumm});
	} catch(err){
		console.log(err);
		res.status(500).send();
	}
});

//select all pipelines
router.get('/api/select/pipeline', async function(req, res){
	try{
		var select = await con.query(`SELECT id, name FROM pipelines ORDER BY pos`);
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
										status = ${s_id} 
									WHERE 	
										id = ${id}`)
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
										 	u.id resp_user_id,
										 	u.name resp_user_name,
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
												lc.contact_id contact_id,
												c.name contact_name,
												JSON_ARRAYAGG(JSON_OBJECT('cf_id', cf.id, 'name', cf.name, 'value_id', cv.id, 'value', cv.value)) custom_fields
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
												custom_fields cf
											ON
												cf.id = cv.field_id
											WHERE 
												l.id = ${id}
											GROUP BY
									   			lc.id`)
		var selectCompany = await con.query(`SELECT
												lc.id company_id,
												lc.name comapny_name,
												JSON_ARRAYAGG(JSON_OBJECT('cf_id', cf.id, 'name', cf.name, 'value_id', lcv.id, 'value', lcv.value)) custom_fields
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
											WHERE 
												l.id = ${id}
											GROUP BY 
												lc.id
											`)
		var selectUser = await con.query(`SELECT 
											ug.name user_group,
											JSON_ARRAYAGG(JSON_OBJECT('name', u.name)) users
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
		console.log(selectLead[0].custom_fields);
		selectCardGroups.forEach(c=> {
			c.custom_fields_list.forEach(x => {
				let i = selectLead[0].custom_fields.map(y => {return y.cf_id}).indexOf(x.id);
				x.value = selectLead[0].custom_fields[i] || {"value":''};
			})
		})
		res.status(200).json({
			selectLead:selectLead[0],
			selectContact,
			selectCompany:selectCompany[0],
			selectUser,
			selectCardGroups
		})
	}catch(e){
		console.log(e)
		res.status(500).send(e);
	}
});

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
											cl.id color_id,
											cl.name color_name
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

/*router.put('/api/update/lead', async function(req, res){
	try{
		var updateLead = await con.query(`INSERT INTO
											leads ()`)
		res.status(200).send();
	}catch(e){
		console.log(e);
		res.status(500).send(e);
	}
});*/

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
