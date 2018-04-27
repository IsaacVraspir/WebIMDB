"use strict";

let https = require('https');
let url = require('url');

function GetPosterFromNameId(name_id, callback) {
    let req_url = {
        host: 'www.imdb.com',
        path: '/name/' + name_id + '/'
    };
    let req = https.request(req_url, (res) => {
        let body = '';
        res.on('data', (chunk) => {
            body += chunk;
        });
        res.on('end', () => {
            let poster_link_pos = body.indexOf('<a href="/name/' + name_id + '/mediaviewer/');
            let poster_img_pos = body.indexOf('<img', poster_link_pos);
            let poster_src_pos = body.indexOf('src=', poster_img_pos) + 5;
            let poster_end_pos = body.indexOf('"', poster_src_pos);
            let poster_url = url.parse(body.substring(poster_src_pos, poster_end_pos));
            if (poster_url.host !== null)
                callback && callback(null, {host: poster_url.host, path: poster_url.pathname});
            else
                callback && callback('poster not found', null);
        });
    });

    req.on('error', (err) => {
        callback && callback(err, null);
    });

    req.on('timeout', () => {
        callback && callback('timeout', null);
        req.abort();
    });

    req.setTimeout(5000);
    req.end();

}

function GetPosterFromTitleId(title_id, callback) {
    let req_url = {
        host: 'www.imdb.com',
        path: '/title/' + title_id + '/'
    };
    let req = https.request(req_url, (res) => {
        let body = '';
        res.on('data', (chunk) => {
            body += chunk;
        });
        res.on('end', () => {
            let poster_link_pos = body.indexOf('<a href="/title/' + title_id + '/mediaviewer/');
            let poster_img_pos = body.indexOf('<img', poster_link_pos);
            let poster_src_pos = body.indexOf('src=', poster_img_pos) + 5;
            let poster_end_pos = body.indexOf('"', poster_src_pos);
            let poster_url = url.parse(body.substring(poster_src_pos, poster_end_pos));
            if (poster_url.host !== null)
                callback && callback(null, {host: poster_url.host, path: poster_url.pathname});
            else
                callback && callback('poster not found', null);
        });
    });

    req.on('error', (err) => {
        callback && callback(err, null);
    });

    req.on('timeout', () => {
        callback && callback('timeout', null);
        callback = null;
        req.abort();
    });

    req.setTimeout(5000);
    req.end();
}

module.exports = {};
module.exports.GetPosterFromNameId = GetPosterFromNameId;
module.exports.GetPosterFromTitleId = GetPosterFromTitleId;
