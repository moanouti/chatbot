var builder = require('botbuilder');
var restify = require('restify');
//restify server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s ', server.name, server.url);
});

var connector = new builder.ChatConnector();
server.post('/api/messages', connector.listen());

var bot = new builder.UniversalBot(connector);
//once you publish on luis 
var luisAppId = "21c6d9ca-5c98-420b-9315-79bc9d0e9272"; //available in settings
var luisAPIKey = "be7e0d8168df4d1fb7bb73a940dfd454";
var luisAPIHostName = "westus.api.cognitive.microsoft.com";

const luisModelURL = 'https://' + luisAPIHostName + '/luis/v2.0/apps/' + luisAppId + '?subscription-key=' + luisAPIKey;

var recoginizer = new builder.LuisRecognizer(luisModelURL);
var intents = new builder.IntentDialog({
    recognizers: [recoginizer]
});

bot.dialog('/', intents);

intents.matches('Greet', (session, args, next) => {
    session.send('Hello there!, I am eva, the movie ticket booking bot. How can I help you today?');
});

var movies = [
    "Avengers",
    "Jurassic World",
    "Rampage",
    "The Incredibles 2"
]
intents.matches('ShowNowPlaying', (session, args, next) => {
    session.send('Sure, here is the list of movies currently playing:\n\n' + movies.join('\n\n'));
});

intents.matches('BookTicket', [(session, args, next) => {

        var movieEntity = args.entities.filter(e => e.type == 'Movies');
        var noOfTicketsEntity = args.entities.filter(e => e.type == 'builtin.number');

        if (movieEntity.length > 0) {
            session.userData.movie = movieEntity[0].resolution.values[0];

        } else {
            delete session.userData.movie;
        }

        if (noOfTicketsEntity.length > 0) {
            session.userData.noOfTickets = noOfTicketsEntity[0].resolution.value;

        } else {
            delete session.userData.noOfTickets;
        }

        if (!session.userData.movie) {
            session.beginDialog('askMovie');
        } else {
            next();
        }
    }, (session, args, next) => {
        if (!session.userData.noOfTickets) {
            session.beginDialog('askNoOfTickets');
        } else {
            next();
        }
    }, (session, args, next) => {
        session.send("Sure, I have booked you " + session.userData.noOfTickets + " tickets for " + session.userData.movie + ". Have fun!")
    }

]);

bot.dialog('askMovie', [(session, args, next) => {
    builder.Prompts.choice(session, 'What movie would you like to watch?', movies);
}, (session, results) => {
    session.userData.movie = results.response.entitiy;
    session.endDialogWithResult(results);

}]);

bot.dialog('askNoOfTickets', [(session, args, next) => {
    builder.Prompts.number(session, 'Great! How many tickets would you like to book?');
}, (session, results) => {
    session.userData.noOfTickets = results.response;
    session.endDialogWithResult(results);

}]);