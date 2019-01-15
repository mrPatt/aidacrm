var express = require('express');
var router = express.Router();
var newController = require('../controller/new');

router.post('/contact/:table', newController.newcontact);
router.post('/company/:table', newController.newcompany);

module.exports = router;