const mysql = require('mysql');
const bcrypt = require('bcrypt-nodejs');
const jwt = require('jsonwebtoken');
var express = require('express');
var Query = require('node-mysql-ejq');

const conn = mysql.createConnection(config.db);
const secret = require('../config/config');

var query = new Query(conn);

var router = express.Router();

exports.new = async (req, res, next) => {
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
		res.status(200).send(`new inserted`);
		console.log(insert);
	} catch(e){
		console.log(e.message);
		next(e);
	}
}