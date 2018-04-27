let express = require('express');
let bodyParser = require('body-parser');
let sqlite = require('sqlite3').verbose();
let poster = require('./imdb_poster');

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
            sql = "SELECT * FROM Names WHERE primary_name LIKE ? LIMIT 100";
            params.push('%' + search + '%');
            break;
        default:
            sql = "SELECT * FROM Titles WHERE primary_title LIKE ? AND title_type is ? LIMIT 100";
            params.push('%' + search + '%');
            params.push(type);
            break;
    }

    db.all(sql, params, (err, rows) => {
        if (err) return err;

        if (rows.length === 0 || rows === null) {
            res.render('results', {searchTitle: search, results: [{'name': "No results found!"}]});
            res.end();
            return;
        }
        let data = [];
        rows.forEach((row) => {
            /** @namespace row.primary_name */
            /** @namespace row.primary_profession */
            /** @namespace row.primary_title */
            /** @namespace row.genres */
            /** @namespace row.nconst */
            /** @namespace row.tconst */

            // Search was for actors, else media
            if (row.primary_name !== undefined) {
                let item = {
                    'name': row.primary_name,
                    'subtitle': row.birth_year + " - " + (row.death_year || "present"),
                    'description': row.primary_profession.replace(',', ', '),
                    'link': '/people/' + row.nconst,
                };
                data.push(item);
            } else {
                let item = {
                    'name': row.primary_title,
                    'subtitle': row.start_year + " - " + (row.end_year || "present"),
                    'description': (row.genres || "").replace(',', ', '),
                    'link': '/media/' + row.tconst,
                };
                data.push(item);
            }
        });
        res.render('results', {searchTitle: search, results: data});
        res.end();
    })
});

app.get('/people/*', (req, res) => {

});

app.get('/titles/*', (req, res) => {

});

// Send all other requests to homepage
app.get('*', (req, res) => {
    res.redirect('/');
    res.end();
});

app.listen(port);