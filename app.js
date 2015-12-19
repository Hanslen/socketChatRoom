
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path');

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);
app.get('/users', user.list);

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

var io = require('socket.io')(server);
//add
var sockets = {};
var user = new Array();
user.push("everyone");
//add ends

io.on('connection', function(client){
	client.emit("usersfirst", user);
	client.on('disconnect', function(){
		console.log(client.nickname+" disconnected:-(");
		for(var i = 0; i < user.length; i++){
			if(user[i] == client.nickname){
				user.splice(i, 1);
				break;
			}
		}
		client.broadcast.emit("users", user);
		client.broadcast.emit("chat message", client.nickname+" has left our chatRoom..:-(");
	});
	client.on('join', function(name){
		client.nickname=name;
		console.log(client.nickname+" has connected!");
		//add
		sockets[name] = client;
		user.push(name);
		client.broadcast.emit("users", user);
		client.emit("users", user);
		client.broadcast.emit("chat message", client.nickname + " has joined our chatRoom..:-)");
		client.emit("chat message", client.nickname+" has joined our chatRoom..:-)");
		//add ends

	});
	client.on('chat message', function(msg, to){
		var nickname = client.nickname;
		// client.broadcast.emit("chat message",nickname+": "+msg);
		if(to == "everyone"){
			console.log(nickname+": "+msg+" (This is a public message)");
			client.broadcast.emit("chat message", nickname+": "+msg+" (This is a public message)");
			client.emit("chat message", nickname+": "+ msg+" (You send a message to everyone)");
		}else{
			console.log(nickname+": "+ msg+" ("+nickname+" send a private message to "+to+")")
			sockets[to].emit("chat message", nickname+": "+msg+"(This is a private message)");
			client.emit("chat message", nickname+": "+ msg+" (You send a private message to "+to+")");
		}
		client.broadcast.emit("users", user);
		client.emit("users", user);
	});


});
