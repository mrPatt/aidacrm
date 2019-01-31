var nodemailer = require('nodemailer')

var transporter = nodemailer.createTransport({
	host: 'smtp.ethereal.email',
	port: 587,
	secure: false,
	auth: {
		user: 'yci64owxndezz73u@ethereal.email',
		pass: 'reqHR9De1YZrHCcmCu'
	},
	tls: {
    // do not fail on invalid certs
    rejectUnauthorized: false
}
});

const mailOptions = {
  from: 'yci64owxndezz73u@ethereal.email', // sender address
  to: 'sultik98@gmail.com', // list of receivers
  subject: 'Мансур', // Subject line
  html: '<p>чо палишь сука</p>'// plain text body
};

transporter.sendMail(mailOptions, function (err, info) {
	if(err)
		console.log(err)
	else
		console.log(info);
});

