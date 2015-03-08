var util = require('util'),
    request = require('request'),

    express = require('express'),
    bodyParser = require('body-parser'),
    csvParse = require('csv-parse'),
    app = express();

app.use(bodyParser.urlencoded({ extended: true }));

function message(message) {
    return {
        text: message,
        mrkdown: true
    };
}

function lookupAndSend(symbol, res) {
    // symbol,name,last,change,percent,previous close
    var yahoo = 'http://download.finance.yahoo.com/d/quotes.csv?s=%s&f=snl1c1p2p',
        requestUrl = util.format(yahoo, symbol);

    console.log('sending request to ' + requestUrl);

    request(requestUrl, function(error, response, body) {
        if (error || response.statusCode !== 200) {
            console.log('an error!', error);
            res.send(message('Yahoo failed to look up quote information for ' + symbol));
        } else {
            csvParse(body, function(error, output) {
                if (error) {
                    console.log('weird csv error!', error);
                    res.send(message('Yahoo returned weird data for ' + symbol));
                } else {
                    var row = output[0],
                        symbol = row[0],
                        name = row[1],
                        current = row[2],
                        change = row[3],
                        percent = row[4],
                        lastClose = row[5];

                    var quoteMessage = util.format(
                        '*%s (%s)* is currently at %s (%s / %s)',
                        name, symbol, current, change, percent
                    );

                    res.send(message(quoteMessage));
                }
            });
        }
    });
}

app.get('/', function(req, res) {
    res.send('OK');
});

app.post('/message', function(req, res) {
    if (req.body.text) {
        var match = req.body.text.match(/\$(\^?[A-Za-z\-]{1,5})/);

        if (match) {
            lookupAndSend(match[1], res);
        } else {
            res.send('');
        }
    }
});

var server = app.listen(process.env.PORT || 3000, function() {
    var host = server.address().address,
        port = server.address().port;

    console.log('App running at http://%s:%s', host, port);
});
