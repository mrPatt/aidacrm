const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt-nodejs');
const jwt = require('jsonwebtoken');
var express = require('express');
var router = express.Router();

exports.regup = async (req, res, next) => {
	const conn = await mysql.createConnection(config.db);
	try {
		let hash = bcrypt.hashSync(req.body.password);
		let insert = await conn.query(`INSERT INTO amocrm.registration (email, password, phone) VALUES (?, ?, ?)`, [req.body.email, hash, req.body.phone]);
		res.status(200).send('successfully inserted');
	} catch (ex) {
		console.log(ex.message);
		next(ex)
	}
}
