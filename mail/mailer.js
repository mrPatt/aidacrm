var nodemailer = require('nodemailer');
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
	var id = req.body.id;
	console.log(req.body)
	try{
		/*await jwt.verify(req.cookies.token, config.jwtSecret, function(err, decoded){
				if(err){
					res.status(401).send('Unauthorized user');
				} else {
					data.user_id = decoded.id;
				}
			});*/
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

router.post('/inbox', async function(req, res){
	var insert = {}
	var mail_id = req.body.id;
	try{
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
        	imap.search(['ALL'], async function(err, results) {
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


			async function processMessage(msg, seqno) {
    			console.log("Processing msg #" + seqno);

    			var parser = new MailParser();
    			parser.on("headers", async function(headers) {
        			console.log("Header: ", headers.get('subject'));
        			var subj = apos(headers.get('subject'));
        			console.log("From: ", headers.get('from').value[0]);
        			console.log("To: " , headers.get('to').value[0].address);
        			console.log("Date: ", headers.get('date'));
        			var date = headers.get('date');
        			var iData = {mail_id: mail_id, froms: headers.get('from').value[0].address, tos: headers.get('to').value[0].address, 
        						subject: subj, date: date, seqno: seqno, name: headers.get('from').value[0].name}
        			insert = 	await query.insert({table: 'messages', data: iData})
        			console.log('111111111111111111111111', insert);

    			});
    			ins = insert;
    			parser.on('data', async function(data) {
        			if (data.type === 'text') {
            			console.log(seqno);
            			//console.log(data.text);  /* data.html*/
        			}

        				var iData = {text: apos(data.text), message_id: ins.insertId}
        				var insert = await query.insert({table: 'messages_text', data: iData})
        				console.log('2222222222222222222222' ,insert)
     			});

    			msg.on("body", async function(stream) {
        			stream.on("data", async function(chunk) {
            			parser.write(chunk.toString("utf8"));
        			});
    			});
    			msg.on('attributes', function(attrs) {
  					console.log('uid = ' + attrs.uid);
				});
    			msg.once("end",async function() {
        			await console.log("Finished msg #" + seqno);
        		parser.end();
    		});
		}
	}

		res.send();
	} catch(e){
		console.log(e); 
	}


});


router.post('/attachments', async function(req, res){
	var id = req.body.id;
	try{
		/*await jwt.verify(req.cookies.token, config.jwtSecret, function(err, decoded){
				if(err){
					res.status(401).send('Unauthorized user');
				} else {
					data.user_id = decoded.id;
				}
			});*/
		var select = await query.select({table: 'mail', where: {id: id}})
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
			imaps.connect(config).then( function (connection) {
 				connection.openBox('INBOX').then(function () {
        			var searchCriteria = ['ALL'];
        			var fetchOptions = { bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)'], struct: true };
        			return connection.search(searchCriteria, fetchOptions);
    			}).then(function (messages) {
 					
        			var attachments = [];
        			messages.forEach( function (message, seqno) {
        		    	var parts = imaps.getParts(message.attributes.struct);
            			attachments = attachments.concat(parts.filter( function (part) {
                		return part.disposition && part.disposition.type.toUpperCase() === 'ATTACHMENT';
                	}).map( function (part) {
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
						var insert = 	await con.query(`INSERT INTO amocrm.mail_attachments 
														(mail_id, att_name, seqno, path) VALUES (?, ?, ?, ?)`, 
														[id, name, seqno, normalPath]);
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
        // =>
        //    [ { filename: 'cats.jpg', data: Buffer() },
        //      { filename: 'pay-stub.pdf', data: Buffer() } ]
   		});
	})
		
	}
		res.send()
	} catch(e){
		res.send(e)
	}
})

router.post('/test', async function(req, res){
	try{
		var config = {
    		imap: {
    	    user: 'sptest147@mail.ru',
    	    password: 'gjyxbr147',
    	    host: 'imap.mail.ru',
    	    port: 993,
    	    tls: true,
        	authTimeout: 3000
    	}
	};
	var imap = await imaps.connect(config);
	await imap.openBox('INBOX');
	var search = await imap.search(['ALL'], {bodies: ['TEXT'], markSeen: false});
	search.map(function(results){
		console.log(results[0].parts.body.subject[0])

	})
	}catch(e){
		console.log(e);
	}
})

module.exports = router;
