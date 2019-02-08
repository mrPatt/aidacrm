var imaps = require('imap-simple');
var fs = require('fs');
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
 
var config = {
    imap: {
        user: 'space.walrus@mail.ru',
        password: 'gjyxbr1998',
        host: 'imap.mail.ru',
        port: 993,
        tls: true,
        authTimeout: 3000
    }
};
imaps.connect(config).then(function (connection) {
 
    return connection.openBox('INBOX').then(function () {
        var delay = 24 * 3600 * 1000;
        var yesterday = new Date();
        yesterday.setTime(Date.now() - delay);
        yesterday = yesterday.toISOString();
        var searchCriteria = ['ALL'];
        
 
        var fetchOptions = {
            bodies: ['HEADER', 'TEXT'],
            markSeen: false
        };
 
        return connection.search(searchCriteria, fetchOptions).then(function (results) {
            var subjects = results.map(function (res) {
                return res.parts.filter(function (part) {
                    return part.which === 'HEADER';
                })[0].body.subject[0];
            });
 
            console.log(subjects);
            // =>
            //   [ 'Hey Chad, long time no see!',
            //     'Your amazon.com monthly statement',
            //     'Hacker Newsletter Issue #445' ]
        });
    });
});

/*imaps.connect(config).then( function (connection) {
 
    connection.openBox('INBOX').then(function () {
 
        // Fetch emails from the last 24h
        var delay = 24 * 3600 * 1000;
        var yesterday = new Date();
        yesterday.setTime(Date.now() - delay);
        yesterday = yesterday.toISOString();
        var searchCriteria = ['ALL'];
        var fetchOptions = { bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)'], struct: true };
 
        // retrieve only the headers of the messages
        return connection.search(searchCriteria, fetchOptions);
    }).then(function (messages) {
 
        var attachments = [];
 
        messages.forEach( function (message) {
            var parts = imaps.getParts(message.attributes.struct);
            attachments = attachments.concat(parts.filter( function (part) {
                return part.disposition && part.disposition.type.toUpperCase() === 'ATTACHMENT';
                
            }).map( function (part) {
                
                // retrieve the attachments only of the messages with attachments
                return connection.getPartData(message, part)
                    .then(async function (partData) {
                        let name = part.disposition.params.filename.split('.');
                        name[0] += new Date().valueOf();
                        if(name[1] == '') name[1] = 'txt';
                        name = name[0] + '.' + name[1];
                        fs.writeFileSync('../attachments/' + name, partData)
                        return {
                            filename: part.disposition.params.filename,
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
})*/
//sniwsaohmkncqdic