var express = require('express');
var router = express.Router();
var fs = require('fs');
var path = require('path');

router.get("/:id", function (req, res) {
    //let room = Room.get(req.param.id);
    res.send('welcome to room ' + req.params.id);
    //res.render('room');
});

module.exports = router;