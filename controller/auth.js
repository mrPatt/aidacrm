const mysql = require('mysql');
const bcrypt = require('bcrypt-nodejs');
const jwt = require('jsonwebtoken');
var express = require('express');
var Query = require('node-mysql-ejq');

const conn = mysql.createConnection(config.db);
const secret = require('../config/config');

var query = new Query(conn);

var router = express.Router();

exports.signup = async (req, res, next) => {
	try {
		let hash = bcrypt.hashSync(req.body.password);
		let insert = await conn.query(`INSERT INTO amocrm.users (name, login, password) VALUES (?, ?, ?)`, [req.body.name, req.body.login, hash]);
		res.status(200).send('successfully inserted');
	} catch (e) {
		console.log(e.message);
		next(e);
	}
}

exports.signin = async (req, res, next) => {
	try {
		let user = await conn.query(`SELECT * FROM amocrm.users WHERE login = '${req.body.login}'`);
		if (!user[0]) {
			res.status(401).send('Not AUTH!');
			return;
		}

		user = user[0];
		if (!bcrypt.compareSync(req.body.password, user.password)) {
			res.status(401).send('Not AUTH!');
			return;
		}
		const payload = {
			id: user.id
		}
		let token = jwt.sign(payload, config.jwtSecret, {expiresIn: 144000	});
		res.status(200).send({token})
		//res.status(200).cookie('Authorization', token, { maxAge: 900000, httpOnly: true }).send({token});
	} catch(e) {
		console.log(e);
		next(e);
	}
}

exports.compreg = async (req, res, next) => {
	console.log('asdf');
	var data = req.body;
	var table = req.params.table;
	try{
		await jwt.verify(req.cookies.token, config.jwtSecret, function(err, decoded){
				if(err){
					res.status(401).send('Unauthorized user');
				} else {
					data.user_id = decoded.id;
				}
			});
		console.log(data)		
		var insert = await query.insert({table: 'company', data: data});
		res.status(200).send();
	} catch(e){
		console.log(e.message);
		next(e);
	}
}

exports.user = async (req, res)=> {
	try{
		res.status(200).send(req.user);
	}catch(e){
		res.status(500).send(e);
	}
}

exports.mid = async (req, res, next) => {
	// console.log(req)
	const authHeader = req.get('Authorization');
	console.log('authHeader',authHeader)
	try{

		var {id} = await jwt.verify(authHeader, config.jwtSecret);
		var select = await conn.query(`SELECT 
										u.id user_id,
										u.name username,
										u.login login,
										u.group_id group_id,
										u.is_free is_free,
										u.is_active is_active,
										u.is_admin is_admin,
										u.amo_id amo_id,
										p.id priv_id,
										p.mail,
										p.incoming_leads,
										p.catalogs,
										p.lead_add,
										p.lead_view,
										p.lead_edit,
										p.lead_delete,
										p.lead_export,
										p.contact_add,
										p.contact_view,
										p.contact_edit,
										p.contact_delete,
										p.contact_export,
										p.company_add,
										p.company_view,
										p.company_edit,
										p.company_delete,
										p.company_export,
										p.task_edit,
										p.task_delete
									FROM
										users u
									LEFT JOIN 
										privileges p 
									ON 
										p.user_id = u.id
									WHERE 
										u.id = ${id}`)
		req.user = select[0];
	}catch(e){
		if(!id){
			res.status(401).send('poshel naxuiy');
			return;
		}
	}
	next();
}
