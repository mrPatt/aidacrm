var express = require('express');
var router = express.Router();
var newController = require('../controller/new');

router.post('/:table', newController.new);


module.exports = router;