var name, connectedUser;
var connection = new WebSocket("ws://localhost:8888");

var loginPage = $('#login-page'),
	usernameInput = $('#username'),
	loginButton = $('#login'),
	callPage = $('#call-page'),
	theirUsernameInput = $('#theirusername'),
	callButton = $('#call'),
	hangUpButton = $('#hang-up');
callPage.css('display','none');
var yourVideo = document.querySelector('#yours'),theirVideo = document.querySelector('#theirs'),yourConnection,theirConnection;


$('#login').click(function(event) {
	name = usernameInput.val();
	if(name.length > 0){
		send({
			type :"login",
			name :name
		});
	}
});
connection.onopen = function(){
	console.log("connected");
};
//通过回调函数处理所有的消息
connection.onmessage = function(message){
	console.log("get message", message.data);

	var data = JSON.parse(message.data);

	switch(data.type){
		case "login":
			onLogin(data.success);
			break;
		case "offer":
			onoffer(data.offer, data.name);
			break;
		case "candidate":
			onCandidate(data.candidate);
			break;
		case "leave":
			onLeave();
			break;
		default:
			break;
	}
};

connection.onerror = function(err){
	console.log("got error",err);
}

function send(message){
	if(connectedUser){
		message.name = connectedUser;
	}

	connection.send(JSON.stringify(message));
}




function onLogin(success){
	if(success == false){
		alert("login fail, please try a different name");
	} else {
		loginPage.css('display', 'none');
		callPage.css('display','block');

		//准备好通话的通道,webrtc连接的第一步
		//1、获取音频或者视频流；2、验证用户是否支持webrtc；3、创建RtcPeerConnection对象
		startConnection();
	}
};

$('#call').click(function(event) {
	var theirUsername = theirUsernameInput.val();

	if(theirUsername.length > 0){
		startPeerConnection(theirUsername);
	}
});

 $('#hang-up').click(function(){
 	send({
 		type: "leave"
 	});
 	onLeave();
 });

 function onOffer(offer, name){
 	connectedUser = name;
 	yourConnection.setRemoteDescription(new RTCSessionDescription(offer));
 	yourConnection.createAnswer(function (answer){
 		yourConnection.setLocalDescription(answer);
 		send({
 			type: "answer",
 			answer: answer
 		});
 	}, function(error){
 		alert("an error has occurred");
 	});
 }

 function onAnswer(answer){
 	yourConnection.setRemoteDescription(new RTCSessionDescription(answer));
 }

 function onCandidate(candidate){
 	yourConnection.addIceCandidate(new RTCIceCandidate(candidate));
 }

 function onLeave(){
 	connectedUser = null;
 	theirVideo.src = null;
 	yourConnection.close();
 	yourConnection.onicecandidate = null;
 	yourConnection.onaddstream = null;
 	setupPeerConnection(stream);
 }

	function hasUserMedia(){
		navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
		return !!navigator.getUserMedia;
	}

	function hasRTCPeerConnection(){
		window.RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
		window.RTCSessionDescription = window.RTCSessionDescription || window.webkitRTCSessionDescription || window.mozRTCSessionDescription;
		window.RTCIceCandidate = window.RTCIceCandidate || window.webkitRTCIceCandidate || window.mozRTCIceCandidate;
		return !!window.RTCPeerConnection;
	}


	function startConnection(){
		if(hasUserMedia()){
			navigator.getUserMedia({video: true, audio: false},
				function(stream){
					yourVideo.src = window.URL.createObjectURL(stream);

					if(hasRTCPeerConnection()){
						setupPeerConnection(stream);
					} else {
						alert("sorry, your browser does not support webrtc");
					}
				}, function(error){
					console.log(error);
				});
		}else{
				alert("sorry, your browser does not support webrtc");
		}
	}

	function setupPeerConnection(stream){
		var configuration = {
			"iceServers": [{"url":"stun:stun.1.google.com:19302"}]
		};
		yourConnection = new RTCPeerConnection(configuration);

		//设置流的监听
		yourConnection.addStream(stream);
		yourConnection.onaddstream = function(e){
			theirVideo.src = window.URL.createObjectURL(e.stream);
		};

		yourConnection.onicecandidate = function(event){
			if(event.candidate){
				send({
					type: "candidate",
					candidate: event.candidate
				});
			}
		};
	}




		function startPeerConnection(user){
			connectedUser = user;

			//开始创建offer

			yourConnection.createOffer(function(offer){
				send({
					type: "offer",
					offer: offer
				});
				yourConnection.setLocalDescription(offer);
			}, function(error){
				alert("an error has occurred.");
			});
		};