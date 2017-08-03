var MongoClient = require('mongodb').MongoClient;
var path = require('path');
var express = require('express');
var app = express();
var dburl = "mongodb://localhost:27017/urldb";

function randomString(len){
    var chars = "abcdefghijklmnopqrstuvwxyzABCDE" + 
    "FGHIJKLMNOPQRSTUVWXYZ0123456789";
    var str = "";
    for(var i = 0; i < len; i++){
        str += chars[Math.floor(Math.random() * chars.length)];
    }
    return str;
}

app.listen(8080);
console.log("Listening on port 8080.");

app.get("/", function(request, response){
    response.writeHead(200, {"content-type":"text/html"});
    response.write("<h1>This is my url-shortener!</h1>");
    response.write(`<p>You can send a url to have it shortened. 
    This will return a JSON object with the url and the shortened url.</p>`);
    response.end();
});

app.get("/*", function(request, response, next){
    next();
});

app.get(/\/new\/https?:\/\/.+\..+/, function(request, response){
    response.writeHead(200, {"content-type":"application/json"});
    
    
    var qUrl = request.url.slice(5);
    
    console.log("GET request for " + request.url);
    
    MongoClient.connect(dburl, function(err, db){
        if(err) throw err;
        db.collection("urls").createIndex({urlShort: 1});
        db.collection("urls").findOne({urlOriginal: qUrl}, function(err, result){
            if(err) throw err;
            if(result === null){
                
                var urlString = request.protocol + "://" + request.hostname + "/";
                
                var newEntry = {
                    urlOriginal: qUrl,
                    urlShort: urlString + randomString(6)
                };
                db.collection("urls").findOne({urlShort:newEntry.urlShort}, function(err, result){
                    if(err) throw err;
                    if(result === null){
                        db.collection("urls").insertOne(newEntry, function(err, result){
                            if(err) throw err;
                            console.log("New Entry: " + newEntry.urlOriginal + ", " + newEntry.urlShort);
                            response.end(JSON.stringify({
                                urlOriginal: newEntry.urlOriginal, 
                                urlShort: newEntry.urlShort
                            }));
                            //db.close();
                        });
                    }else{
                        result.urlOriginal = newEntry.urlOriginal;
                        response.end(JSON.stringify({
                            urlOriginal: result.urlOriginal, 
                            urlShort: result.urlShort
                        }));
                        //db.close();
                    }
                });
            }else{
                response.end(JSON.stringify({
                        urlOriginal: result.urlOriginal, 
                        urlShort: result.urlShort
                    }));
                //db.close();
            }
        });
    });
});

app.get(/\/\w+/, function(request, response){
    
    var q = request.protocol + "://" + request.hostname + request.url;
    console.log("GET request for " + request.url);
    
    MongoClient.connect(dburl, function(err, db){
        if(err) throw err;
        db.collection("urls").findOne({urlShort: q}, function(err, result){
            if(err) throw err;
            if(result === null){
                response.writeHead(200, {"content-type":"application/json"});
                response.end(q + " not found in database.");
                //db.close();
            }else{
                //db.close();
                response.redirect(result.urlOriginal);
            }
        });
    });
});

/*
MongoClient.connect(dburl, function(err, db){
   if(err) throw err; 
});
*/