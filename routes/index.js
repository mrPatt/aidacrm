var mysql = require('mysql');
var express = require('express');
var Query = require('node-mysql-ejq');
var config = require('../config/config');
var con = mysql.createConnection(config.db);

var query = new Query(con);

var router = express.Router();

router.post('/api/select', async function(req, res){
	let p_id = req.body.p_id;
	let s_id = req.body.s_id;
	try{
		if(!s_id){
			let select = await con.query(`SELECT L.id leads_id, L.name leads_name, L.budget, L.created_at leads_created_at, 
										L.main_contact_id main_contact, L.leads_company_id leads_company,
										C.id main_contact_id, C.name contact_name,
										LC.id leads_company_id, LC.name company_name, 
										P.id pipeline_id, P.name pipeline_name, P.pos pipeline_position,
										S.id step_id, S.name step_name, S.position step_position
										FROM leads L
										LEFT JOIN contacts C ON L.main_contact_id = C.id
										LEFT JOIN leads_company LC ON L.leads_company_id = LC.id
										LEFT JOIN pipelines P ON L.pipeline_id = P.id
										LEFT JOIN step S ON L.status = S.id WHERE P.id = ${p_id}
										ORDER BY L.created_at DESC`)
			let selCount = await con.query(`SELECT COUNT(*) AS count FROM leads WHERE pipeline_id = ${p_id}`)
			let selSumm = await con.query(`SELECT SUM(budget) sumBudget FROM leads WHERE pipeline_id = ${p_id}`)
		}else{
			let select = await con.query(`SELECT L.id leads_id, L.name leads_name, L.budget, L.created_at leads_created_at, 
										L.main_contact_id main_contact, L.leads_company_id leads_company,
										C.id main_contact_id, C.name contact_name,
										LC.id leads_company_id, LC.name company_name, 
										P.id pipeline_id, P.name pipeline_name, P.pos pipeline_position,
										S.id step_id, S.name step_name, S.position step_position
										FROM leads L
										LEFT JOIN contacts C ON L.main_contact_id = C.id
										LEFT JOIN leads_company LC ON L.leads_company_id = LC.id
										LEFT JOIN pipelines P ON L.pipeline_id = P.id
										LEFT JOIN step S ON L.status = S.id WHERE P.id = ${p_id} AND S.id = ${s_id} 
										ORDER BY L.created_at DESC LIMIT 20`)
			let selCount = await con.query(`SELECT COUNT(*) AS count FROM leads WHERE pipeline_id = ${p_id} AND status = ${s_id}`)
			let selSumm = await con.query(`SELECT SUM(budget) sumBudget FROM leads WHERE pipeline_id = ${p_id} AND status = ${s_id}`)
		}
		
		selCount = selCount[0].count;
		selSumm = selSumm[0].sumBudget;
		res.status(200).json({select, selCount, selSumm});
	} catch(err){
		console.log(err);
		res.status(500).send();
	}
});

router.get('/api/select/pipeline', async function(req, res){
	try{
		let select = await con.query(`SELECT id, name FROM pipelines`);
		res.send(select)
	}catch(e){
		console.log(e);
		res.status(500).send();
	}
});

router.post('/api/select/step', async function(req, res){
	let p_id = req.body.p_id;
	try{
		let select = await con.query(`SELECT id, name FROM step WHERE pipeline_id = ${p_id}`)
		res.send(select);
	}catch(e){
		console.log(e);
		res.status(500).send(e);
	}
})

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

router.post('/api/update/:table', async function(req, res){
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
