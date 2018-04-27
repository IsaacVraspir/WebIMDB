let express = require('express');
let bodyParser = require('body-parser');
let sqlite = require('sqlite3').verbose();

let port = 8009;
let app = express();
let urlParser = bodyParser.urlencoded({extended: true});
let db = new sqlite.Database('imdb.sqlite3', (err) => {
    if (err) {
        return console.error(err.message);
    } else {
        console.log("Connected to DB");
    }
});

app.set('view engine', 'pug');
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.render('index', {
        pageTitle: "Welcome to WebIMDB!",
        subtitle: "(It's like IMDB but on the web)"
    });
});

app.post('/search', urlParser, (req, res) => {
    if (!req.body) return res.sendStatus(400);
    let search = req.body.q;
    let type = req.body.type;

    let sql = null;
    let params = [];

    switch (type) {
        case 'actor':
            sql = "SELECT * FROM Names WHERE primary_name LIKE ?";
            params.push(search);
            break;
        default:
            sql = "SELECT * FROM Titles WHERE primary_title LIKE ? AND title_type is ?";
            params.push(search);
            params.push(type);
    }

    db.all(sql, params, (err, rows) => {
        if (err) return err;

        if (rows.length === 0) {
            res.render('results', {searchTitle: search, results: "nothing!"})
        }

        let data = [];
        rows.forEach((row) => {
            let item = {
                'name': row.primary_title || row.primary_name
            };
            data.push(item);
        });
        res.render('results', {searchTitle: search, results: data})
    })
});

// Send all other requests to homepage
app.get('*', (req, res) => {
    res.redirect('/');
});

app.listen(port);