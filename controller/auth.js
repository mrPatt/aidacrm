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
		let [users] = await conn.query(`SElECT * FROM amocrm.users WHERE login = ?`, [req.body.login]);
		users != undefined ?
			{} : next(new Error('user is not found'))
		if (!bcrypt.compareSync(req.body.password, users.password)) {
			return next(new Error('wrong password'))
		}
		const payload = {
			id: users.id,
			login: users.login
		}
		let token = jwt.sign(payload, config.jwtSecret, {expiresIn: 144000	});
		res.status(200).cookie('token', token).send({token: token});
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