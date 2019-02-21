var nodemailer = require('nodemailer');
var iconv = require('iconv')
var MailParser = require('mailparser').MailParser;
var bcrypt = require('bcrypt-nodejs');
var imaps = require('imap-simple');
var fs = require('fs');
var path = require('path');
var Imap = require('imap'),
	inspect = require('util').inspect;
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
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
	var mail_id = req.body.id;
	console.log(req.body)
	try{
		/*await jwt.verify(req.cookies.token, config.jwtSecret, function(err, decoded){
				if(err){
					res.status(401).send('Unauthorized user');
				} else {
					data.user_id = decoded.mail_id;
				}
			});*/
		var select = await query.select({table: 'mail', where: {id: mail_id}})
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
			console.log(mo)
			var iData = {toloh: mo.to, subject: mo.subject, text: mo.text, mail_id: select[0].id};
			console.log(iData)
			var insertData = await query.insert({table: 'messages', data: iData});

				const mailOptions = {
  				from: `${select[0].email}`, // sender address
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

function apos(a){
	if(typeof a == 'string'){
		if(a.includes("'")){
			var splited = a.split("'");
			splited[0] = splited[0] + "\\'";
			a = splited.join('');
			
			return a;
		} else {
			return a;
		}
	} else {
		return a;
	}
}

function toUTF8(body) {
  // convert from iso-8859-1 to utf-8
  var ic = new iconv.Iconv('iso-8859-1', 'utf-8');
  var buf = ic.convert(body);
  return buf.toString('utf-8');
}

router.post('/refresh', async function(req, res){
	var mail_id = req.body.id;
	try{
		/*await jwt.verify(req.cookies.token, config.jwtSecret, function(err, decoded){
				if(err){
					res.status(401).send('Unauthorized user');
				} else {
					data.user_id = decoded.mail_id;
				}
			});*/
		var select = await query.select({table: 'mail', where: {id: mail_id}})
		console.log(select)
		for (var a = 0; a < select.length; a++) {

		var imap = new Imap({
			user: select[a].email,
       		password: select[a].password,
       		host: select[a].imap_host,
       		port: select[a].imap_port,      	
       		tls: true,
   			authTimeout: 3000		
		});

		imap.once("ready", execute);
		imap.once("error", async function(err) {
    		log.error("Connection error: " + err.stack);
		});
		imap.connect();
			var delay = 900 * 1000;
	        var mins = new Date();
	       	mins.setTime(Date.now() - delay);
	        mins = new Date(mins).toString(); 
	        console.log('---------------------------', mins)
			function execute() {
    		imap.openBox("INBOX", false, async function(err, mailBox) {
        	if (err) {
            	console.error(err);
            	return;
        	}
        	imap.search(['UNSEEN', ['SINCE', mins] ], async function(err, results) {
            	if(!results || !results.length){console.log("No unread mails");
            	imap.end();
            	return;
            }
           
            var f = imap.fetch(results, { bodies: "" });
            f.on("message", processMessage);
            f.once("error", function(err) {
                return Promise.reject(err);
            });
            f.once("end",async function() {
                console.log("Done fetching all unseen messages.");
                imap.end();
            });

        });
    });
}
			async function magicFunction(parser, uid){
				
				parser.on("headers", async function(headers) {
					var subj = apos(headers.get('subject'));
					var froms = headers.get('from').value[0].address;
					var tos = headers.get('to').value[0].address;
					var name  = headers.get('from').value[0].name;
					var date = new Date(headers.get('date')).valueOf();
					try{
						var select = await query.select({table: 'messages', where: {date: date}});
						if(select.length == 0){
							let iData = {mail_id: mail_id, froms: froms, tos: tos, subject: subj, date: date, name: name, uid: uid}
							console.log(iData)			 
							var insert = await query.insert({table: 'messages', data: iData})	
		  					ins = insert.insertId;
							var data = await parser.on('data', async function(data) {
								if (data.type === 'text'){
			    					var iData1 = {text: apos(data.text), message_id: ins}
			    					var insert1 = await query.insert({table: 'messages_text', data: iData1})	     					
								}
								return data
							});		
						}else{
							select = select[0];
							//console.log(select)
						}
					}catch(err){
						console.log(err)
					};	
				});
			}
			async function processMessage(msg, seqno) {
    			// console.log("Processing msg #" + seqno);
    			var parser = new MailParser();
    			msg.on("body", async function(stream) {
        			stream.on("data", async function(chunk) {

            			parser.write(chunk.toString("utf8"));
        			});
    			});
    			msg.on('attributes', async function(attrs) {
  					let uid = attrs.uid;
  					await magicFunction(parser, attrs.uid);
  					
				});
				msg.once("end",async function() {
        			parser.end();
    			});
			}
		}
		res.send()
	} catch(e){
		console.log(e); 
	}


});

router.post('/inbox', async function(req, res){
	var mail_id = req.body.id;
	try{
		/*await jwt.verify(req.cookies.token, config.jwtSecret, function(err, decoded){
				if(err){
					res.status(401).send('Unauthorized user');
				} else {
					data.user_id = decoded.mail_id;
				}
			});*/
		var select = await query.select({table: 'mail', where: {id: mail_id}})
		console.log(select)
		for (var a = 0; a < select.length; a++) {

		var imap = new Imap({
			user: select[a].email,
       		password: select[a].password,
       		host: select[a].imap_host,
       		port: select[a].imap_port,      	
       		tls: true,
   			authTimeout: 3000		
		});

		imap.once("ready", execute);
		imap.once("error", async function(err) {
    		log.error("Connection error: " + err.stack);
		});
		imap.connect();

			function execute() {
    		imap.openBox("INBOX", false, async function(err, mailBox) {
        	if (err) {
            	console.error(err);
            	return;
        	}
        	imap.search(['UNSEEN'], async function(err, results) {
            	if(!results || !results.length){console.log("No unread mails");
            	imap.end();
            	return;
            }
           
            var f = imap.fetch(results, { bodies: "" });
            f.on("message", processMessage);
            f.once("error", function(err) {
                return Promise.reject(err);
            });
            f.once("end",async function() {
                console.log("Done fetching all unseen messages.");
                imap.end();
            });

        });
    });
}
			async function magicFunction(parser, uid){
				
				parser.on("headers", async function(headers) {
					var subj = apos(headers.get('subject'));
					var froms = headers.get('from').value[0].address;
					var tos = headers.get('to').value[0].address;
					var name  = headers.get('from').value[0].name;
					var date = new Date(headers.get('date')).valueOf();
					try{
						console.log('date', date)
						var select = await query.select({table: 'messages', where: {date: date}});
						if(select.length == 0){
							let iData = {mail_id: mail_id, froms: froms, tos: tos, subject: subj, date: date, name: name, uid: uid}
							console.log(iData)			 
							var insert = await query.insert({table: 'messages', data: iData})	
		  					ins = insert.insertId;
							var data = await parser.on('data', async function(data) {
								if (data.type === 'text'){
			    					var iData1 = {text: apos(data.text), message_id: ins}
			    					var insert1 = await query.insert({table: 'messages_text', data: iData1})	     					
								}
								return data
							});		
						}else{
							select = select[0];
						}
					}catch(err){
						console.log(err)
					};	
				});
			}
			async function processMessage(msg, seqno) {
    			// console.log("Processing msg #" + seqno);
    			var parser = new MailParser();
    			msg.on("body", async function(stream) {
        			stream.on("data", async function(chunk) {

            			parser.write(chunk.toString("utf8"));
        			});
    			});
    			msg.on('attributes', async function(attrs) {
  					let uid = attrs.uid;
  					await magicFunction(parser, attrs.uid);
  					
				});
				msg.once("end",async function() {
        			parser.end();
    			});
			}
		}
		res.send()
	} catch(e){
		console.log(e); 
	}


});


router.post('/attachments', async function(req, res){
	var mail_id = req.body.id;
	try{
		/*await jwt.verify(req.cookies.token, config.jwtSecret, function(err, decoded){
				if(err){
					res.status(401).send('Unauthorized user');
				} else {
					data.user_id = decoded.mail_id;
				}
			});*/
		var select = await query.select({table: 'mail', where: {id: mail_id}})
		console.log(select)
		for(var a=0; a<select.length; a++){
			var config = {
				imap: {
					user: select[a].email,
       				password: select[a].password,
        			host: select[a].imap_host,
        			port: select[a].imap_port,
        			tls: true,
        			authTimeout: 3000
				}
			};
			imaps.connect(config).then(async function (connection) {
 				connection.openBox('INBOX').then(function () {
        			var searchCriteria = ['UNSEEN'];
        			var fetchOptions = { bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)'], struct: true };
        			return connection.search(searchCriteria, fetchOptions);
    			}).then(async function (messages) {
 					
        			var attachments = [];
        			messages.forEach(async function (message, seqno) {
        		    	var parts = imaps.getParts(message.attributes.struct);
            			attachments = attachments.concat(parts.filter( function (part) {
                		return part.disposition && part.disposition.type.toUpperCase() === 'ATTACHMENT';
                	}).map(async function (part) {
                	return connection.getPartData(message, part).then(async function (partData) {
                    	let name = part.disposition.params.filename.split('.');
                    	name[name.length - 2] += new Date().valueOf();
                    	let nani = '';	
                    	for (var i = 0; i < name.length; i++) {
                    		if(i === name.length - 1) nani += '.'
                    		nani += name[i];
                    	}
                    	name = nani;
                    	nani = '';
                    	for (let i = 0; i < name.length; i++) {
                    		if(name[i] != '?' && name[i] != '=') {
                    			nani += name[i];
                    		}
                    	}
                   		name = nani;
                    	console.log(name)
                    	var normalPath = path.normalize(__dirname + '/../attachments/');
                    	console.log(normalPath)
                    	fs.writeFileSync(normalPath + name, partData);
                    	var uid = message.attributes.uid;
						var insert = 	await con.query(`INSERT INTO amocrm.mail_attachments 
														(mail_id, att_name, uid, path) VALUES (?, ?, ?, ?)`, 
														[mail_id, name, uid, normalPath]);
						console.log(insert)
                    	return {
                    		path: normalPath,
                    		seqno: seqno,
                        	filename: name,
                        	data: partData
                        	};
                    	});
            	}));
        	});
 
        	return Promise.all(attachments);
    	}).then(function (attachments) {
        	console.log(attachments);
   		});
	})
		
	}
		res.send()
	} catch(e){
		res.send(e)
	}
})

module.exports = router;
