const express = require('express')
const app = express()
const crossOriginResourcePolicy = require("cross-origin-resource-policy");
app.use(function(req, res, next) {
    res.header("Cross-Origin-Embedder-Policy", "require-corp");
    res.header("Cross-Origin-Opener-Policy", "cross-origin");
    next();
});
  

app.use(crossOriginResourcePolicy({ policy: "cross-origin" }));

app.use(express.static('.'));
 
app.listen(5000)