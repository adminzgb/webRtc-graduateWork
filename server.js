var WebSocketServer = require("ws").Server, wss = new WebSocketServer({port : 8888}), users = {};

wss.on("connection", function(connection){
	connection.on("message", function(message){
		var data;
		try{
			data = JSON.parse(message);
		} catch(e){
			console.log("error parsing json");
			data = {};
		}

		switch(data.type){
			//识别用户
			case "login":
				console.log("user logined in as",data.name);
				if(users[data.name]){
					sendTo(connection, {
						type: "login",
						success: false
					});
				} else {
					users[data.name] = connection;
					connection.name = data.name;
					sendTo(connection, {
						type: "login",
						success: true
					});
				}
				break;
			//发起通话
			case "offer":
			    console.log("sending offer to ",data.name);
			    var conn = users[data.name];

			    if(conn != null){
			    	connection.otherName = data.name;
			    	sendTo(conn, {
			    		type: "offer",
			    		offer: data.offer,
			    		name: connection.name
			    	});
			    }
			    break;
			//呼叫应答
			case "answer":
				console.log("sending answer to ",data.name);
				var conn = users[data.name];

				if(conn != null){
					connection.otherName = data.name;
					sendTo(conn, {
						type: "answer",
						answer: data.answer
					});
				}
				break;
			//处理ICE候选路径
			case "candidate":
				console.log("sending candidate to ",data.name);
				var conn = users[data.name];

				if(conn != null){
					sendTo(conn, {
						type: "candidate",
						candidate: data.candidate
					});

				}
				break;
			//呼叫挂断
			case "leave":
				console.log("disconnected user from ",data.name);
				var conn = users[data.name];
				conn.otherName = null;

				if(conn != null){
					sendTo(conn, {
						type: "leave"
					});
				}
				break;
			default:
				sendTo(connection, {
					type: "error",
					message: "unrecognized command: " + data.type
				});
				break;
		}

	});

	connection.on('close',  function() {
		if(connection.name){
			delete users[connection.name];

			if(connection.otherName){
				console.log("disconnecting user from ",connection.otherName);
				var conn = users[connection.otherName];
				conn.otherName = null;
				if(conn != null){
					sendTo(conn, {
						type: "leave"
					});
				}
			}
		}
	});
});

	function sendTo(conn, message){
		conn.send(JSON.stringify(message));
	}

	wss.on('listening', function() {
		console.log("server started...");
	});

