const router = require('express').Router();
const auth = require('../controller/auth');


router.post('/signup', auth.signup);
router.post('/signin',  auth.signin);
router.post('/compreg/:table', auth.compreg)

module.exports = router;