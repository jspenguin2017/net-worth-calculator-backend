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

router.post('/get', async function(req, res, next) {
    const data = await stateManager.getData(req.body);
    res.json(data);
});

router.post('/set', async function(req, res, next) {
    const data = await stateManager.setData(req.body);
    res.json(data);
});

module.exports = router;
