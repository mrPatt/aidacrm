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
											S.position step_position
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
											S.position step_position
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
												status = ${s_id}`)
			var selSumm = await con.query(`SELECT SUM(budget) sumBudget 	
											FROM 
												leads 
											WHERE 
												pipeline_id = ${p_id} 
											AND 
												status = ${s_id}`)
			
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
router.post('/api/select/step', async function(req, res){
	var p_id = req.body.p_id;
	try{
		var select = await con.query(`SELECT id, name FROM step WHERE pipeline_id = ${p_id}`)
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
										JSON_ARRAYAGG(JSON_OBJECT('id',s.id,'name',s.name,'company_id',s.company_id)) steps 
									FROM 
										pipelines p 
									LEFT JOIN 
										step s 
									ON 
										s.pipeline_id=p.id 
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
										 	u.name resp_user_name,
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
										GROUP BY ug.id`)
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
		res.status(200).json({
			selectLead:selectLead[0],
			selectContact,
			selectCompany:selectCompany[0],
			selectUser
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
											S.position step_position
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

router.put()

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
		if(where != 'undefined'){
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
