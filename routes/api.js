var express = require('express');
var stateManager = require('../src/stateManager');
var router = express.Router();

router.get('/', function(req, res, next) {
  res.redirect('http://localhost:3000/');
});

router.post('/get', function(req, res, next) {
    const data = stateManager.getData(req.body);
    res.end(data);
});

router.post('/setValue', function(req, res, next) {
    const data = stateManager.setData(req.body);
    res.end(data);
});

router.post('setCurrency', async function(req, res, next) {
    const data = await stateManager.changeCurrency(req.body.currency);
    res.end(data);
});

module.exports = router;
