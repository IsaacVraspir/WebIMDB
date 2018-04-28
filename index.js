'use strict';

let express = require('express');
let bodyParser = require('body-parser');
let sqlite = require('sqlite3').verbose();
let poster = require('./public/js/imdb_poster');

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
            /** @namespace row.death_year */
            /** @namespace row.birth_year */

            // Search was for actors, else titles
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
                    'link': '/titles/' + row.tconst,
                };
                data.push(item);
            }
        });
        res.render('results', {searchTitle: search, results: data});
        res.end();
    })
});

app.get('/people/*', (req, res) => {
    let id = req.path.split('/')[2];
    db.get("SELECT * FROM Names WHERE nconst LIKE ?", id, (err, row) => {
        if (err) return err;

        /** @namespace row.primary_professions */
        /** @namespace row.known_for_titles */

        if (!row) {
            res.render('404');
            res.end();
            return;
        }

        let data = {
            "id": row.nconst,
            "year": row.birth_year + " - " + (row.death_year || "present"),
            "profession": row.primary_profession.replace(/,/g, ', '),
            "img": poster.GetPosterFromNameId(id)
        };

        let knownFor = row.known_for_titles.split(',');

        res.render('people', {pageTitle: row.primary_name, person: data, movies: knownFor});
    });
});

app.get('/titles/*', (req, res) => {
    let id = req.path.split('/')[2];

    db.get("SELECT * FROM Titles WHERE tconst LIKE ?", id, (err, row) => {
        if (err || !row) return err;

        /** @namespace row.genres */

        let year = (row.start_year);

        if (row.end_year) year += " - " + row.end_year;

        let data = {
            "id": row.tconst,
            "Type": row.title_type,
            "PrimaryTitle": row.primary_title,
            "OriginalTitle": row.orignal_title,
            "Release": year,
            "Length": row.runtime_minutes,
            "img": poster.GetPosterFromTitleId(id)
        };
        let genre_list = row.genres.split(',');
        let primary_title = row.primary_title;

        let ratings_list = [];
        db.get("SELECT * FROM Ratings WHERE tconst LIKE ?", id, (err, row) => {
            if (err) return err;

            if (!row) {
                let ratings_list = {
                    "ave": "?",
                    "votes": "?"
                }
            } else {
                let ratings_list = {
                    ave: row.average_rating,
                    votes: row.num_votes
                };
            }

            let principles_list = {};
            db.get("SELECT * FROM Principals WHERE tconst LIKE ? ORDER BY ordering", id, (err, row) => {

                principles_list = {
                    "order": row.ordering,
                    "number": row.nconst,
                    "job": row.category,
                    "characters": row.characters
                }
                db.get("SELECT * FROM Names WHERE nconst LIKE ?", row.nconst, (err, row) => {
                    if (err) return err;
                    principles_list["name"] = row.primary_name;


                    db.get("SELECT * FROM Crew WHERE tconst LIKE ?", id, (err, row) => {
                        let crew_directors = row.directors.split(',');
                        let crew_writers = row.writers.split(',');

                        res.render('titles', {
                            pageTitle: primary_title,
                            titles: data,
                            genres: genre_list,
                            ratings: ratings_list,
                            principles: principles_list,
                            directors: crew_directors,
                            writers: crew_writers
                        });
                    });
                });
            });
        });
    });
});

app.get('/edit/people/*', (req,res) => {
    let id = req.path.split('/')[3];
    db.get("SELECT * FROM Names WHERE nconst LIKE ?", id, (err, row) => {
        if (err) return err;

        /** @namespace row.primary_professions */
        /** @namespace row.known_for_titles */

        if (!row) {
            res.render('404');
            res.end();
            return;
        }

        let data = {
            "id": row.nconst,
            "birth_year": row.birth_year,
            "death_year": (row.death_year || ""),
            "profession": row.primary_profession.replace(/,/g, ', '),
            "img": poster.GetPosterFromNameId(id)
        };

        let knownFor = row.known_for_titles.split(',');

        res.render('edit_people', {pageTitle: row.primary_name, person: data, movies: knownFor});
    });
});

app.post('/edit/people/*', urlParser, (req, res) => {
    let id = req.path.split('/')[3];
    let birth = parseInt(req.body.birth);
    let death = parseInt(req.body.death);
    let professions = [];
    req.body.jobs.forEach((item) => {
        professions.push(item);
    });

    if (birth) {
        db.run("UPDATE Names SET birth_year = ? WHERE nconst == ?", birth, id);
    }
    if (death) {
        db.run("UPDATE Names SET death_year = ? WHERE nconst == ?", death, id);
    }
    if (professions) {
        db.run("UPDATE Names SET primary_profession = ? WHERE nconst == ?", professions.toString(), id);
    }
});

app.get('/edit/title/*', (req,res) => {

});

app.get('/json/title/*', (req, res) => {
    let id = req.path.split('/')[3];
    db.get("SELECT * FROM Titles WHERE tconst == ?", id, (err, row) => {
        res.json(row);
    })
});

app.get('/json/person/*', (req, res) => {
    let id = req.path.split('/')[3];
    db.get("SELECT * FROM Names WHERE nconst == ?", id, (err, row) => {
        res.json(row);
    })
});

app.get('/image/person/*', (req, res) => {
    let id = req.path.split('/')[3];
    poster.GetPosterFromNameId(id, (err, data) => {
        if (err) console.error(err);
        res.json(data);
    })
});

app.get('/image/title/*', (req, res) => {
    let id = req.path.split('/')[3];
    poster.GetPosterFromTitleId(id, (err, data) => {
        if (err) console.error(err);
        res.json(data);
    })
});

app.get('/about*', (req, res) => {
    let reqPath = req.path.substring(6);
    if (reqPath) {
        res.sendFile(__dirname + "/public/about-pages" + reqPath);
    } else {
        res.sendFile(__dirname + "/public/about-pages/index.html");
    }
});

// Send all other requests to homepage
app.get('*', (req, res) => {
    res.redirect('/');
    res.end();
});

app.listen(port);
