var express = require('express');
var router = express.Router();
var fs = require('fs');
var path = require('path');

router.get("/:file*", function (req, res) {
    var file = path.resolve(`${__dirname}/../games/${req.params.file + '/' + req.params[0]}`);
    console.log(file);
    fs.exists(file, function (exists) {
        if (!exists) {
            res.sendStatus(404);
        } else {
            res.sendFile(file);
        }
    });
});

module.exports = router;