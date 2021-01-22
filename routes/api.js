var express = require('express');
var stateManager = require('../src/stateManager');
var router = express.Router();

router.use((req, res, next) => {
    res.set('Access-Control-Allow-Headers', 'content-type');
    res.set('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    next();
});

router.get('/', function(req, res, next) {
  res.redirect('http://localhost:3000/');
});

router.post('/get', function(req, res, next) {
    console.log(req.body)

    const data = stateManager.getData(req.body);
    res.json(data);
});

router.post('/setValue', function(req, res, next) {
    const data = stateManager.setData(req.body);
    res.json(data);
});

router.post('setCurrency', async function(req, res, next) {
    const data = await stateManager.changeCurrency(req.body.currency);
    res.json(data);
});

module.exports = router;
