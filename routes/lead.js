var express = require('express');
var router = express.Router();
var leads = require('../controller/leads');

router.post('/lead/:table', leads.newlead);
router.post('/contact/:table', leads.newcontact);
router.post('/company/:table', leads.newcompany);
router.post('/select/:table', leads.select);
router.post('/update/:table', leads.update)

module.exports = router;
