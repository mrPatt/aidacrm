var nodemailer = require('nodemailer');
const bcrypt = require('bcrypt-nodejs');
var imap = require('imap');
var mysql = require('mysql');
var express = require('express');
var Query = require('node-mysql-ejq');
var config = require('../config/config');
var con = mysql.createConnection(config.db);

var query = new Query(con);

var router = express.Router();

router.post('/add', async function(req, res){
	var data = req.body;
	try{
		var insert = await query.insert({table: 'mail', data: data});
		res.status(200).send(insert);
	} catch(e){
		console.log(e.message);
		res.send()
	}
});

router.post('/send', async function(req, res){
	var id = req.body.id;
	console.log('//////////////////////////////////////', req.body)
	try{
		var select = await query.select({table: 'mail', where: {id: id}})
		console.log(select)
		for(var a=0; a<select.length; a++){

			var transporter = nodemailer.createTransport({
			host: select[a].smtp_host,
			port: select[a].smtp_port,
			secure: false,
			auth: {
				user: select[a].email,
				pass: select[a].password
			},
			tls: {
    		// do not fail on invalid certs
    		rejectUnauthorized: false
    		}
    		});
		
			var mo = req.body;
			console.log('asdadasdasdasd', mo)
			var iData = {toloh: mo.to, subject: mo.subject, text: mo.text, mail_id: select[0].id};
			console.log('bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', iData)
			var insertData = await query.insert({table: 'messages', data: iData});

				const mailOptions = {
  				from: `test <${select[0].email}>`, // sender address
  				to: req.body.to, // list of receivers
  				subject: req.body.subject, // Subject line
 				html: req.body.text// plain text body    

				}
				console.log(mailOptions);
			

		

			
			transporter.sendMail(mailOptions, function (err, info) {
				if(err){
					console.log(err)
				}else{
					console.log(info);
				}
			});
		
		}
		res.send(select)
	} catch(e){
		console.log(e.message);
		res.status(500).send();
	};
});



module.exports = router;
