var express = require('express');
var router = express.Router();
var leads = require('../controller/leads');

router.post('/:table', leads.lcc);
router.post('/select/:table', leads.select);
router.post('/update/:table', leads.update)

module.exports = router;
