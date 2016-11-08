const express = require('express');
const app = express();
const router = require('./routes/routes');

const PORT = process.env.PORT || 8080;

app.set('view engine', 'ejs');
app.set('views', __dirname + '/public/views/');
app.use(express.static(__dirname + '/public/'));
app.use('/', router);

app.listen(PORT, function() {
    console.log('App is listening on port 8080!');
});
