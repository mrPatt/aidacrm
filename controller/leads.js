const mysql = require('mysql');
const bcrypt = require('bcrypt-nodejs');
const jwt = require('jsonwebtoken');
var express = require('express');
var Query = require('node-mysql-ejq');

const conn = mysql.createConnection(config.db);
const secret = require('../config/config');

var query = new Query(conn);

var router = express.Router();

exports.lcc = async (req, res, next) => {
	var data = req.body;
	var table = req.params.table;
	try{
		await jwt.verify(req.cookies.token, config.jwtSecret, function(err, decoded){
				if(err){
					res.status(401).send('Unauthorized user');
				} else {
					data.created_by = decoded.id;
				}
			});
		var insert = await query.insert({table: table, data: data});
		res.status(200).send();
		console.log(insert);
	} catch(e){
		console.log(e.message);
		next(e);
	}
}

exports.select = async (req, res, next) => {
	var where = req.body.where;
	var table = req.params.table;
	var id = req.params.id;
	try{
		await jwt.verify(req.cookies.token, config.jwtSecret, function(err, decoded){
				if(err){
					res.status(401).send('Unauthorized user');
				}
			});
		var select = await query.select({table: table, data: data});
		res.send(select);
	} catch(e){
		console.log(e.message);
		next(e);
	}
}

exports.update = async (req, res, next) => {
	var data = req.body;
	var table = req.params.table;
	for(var key in data){
		if(key == 'updated_at'){
			delete data[key]
		}
	}
	try{
		await jwt.verify(req.cookies.token, config.jwtSecret, function(err, decoded){
				if(err){
					res.status(401).send('Unauthorized user');
				} else{
					data.created_by = decoded.id;
				}
			});
		var update = await query.update({table: table, where: {id: data.id}, data: data});
		
		res.status(200).send('updated')
	} catch(e){
		console.log(e.message);
		next(e);
	}
}