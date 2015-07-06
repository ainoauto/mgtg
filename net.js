var g_net= { 	pid: null,
				type: null, // "host" or "client"
				peers: {},
				reliable: true, // Make sure that every packet is delivered (@todo: only for certain packets)
				enabled: false,
				deliverQueue: [], // Packets that needs to be delivered
				optimalInterval: 0.1, 
				peerTimeout: 3.0
};

function netInit(){
	g_net.pid= getQueryVar("pid");
	
	var connect= getQueryVar("connect");
	if (connect){
		g_net.connPid= new String(connect);
		connect= true;
	}
	
	g_net.enabled= g_net.pid || connect;
	if (!g_net.enabled)
		return;
	
	if (g_net.pid != null)
		g_net.peer= new Peer(g_net.pid, {key: 'qlu6d618b4rnewmi'});
	else
		g_net.peer= new Peer({key: 'qlu6d618b4rnewmi'});
		
	g_net.peer.on('open', function(id){ g_net.pid= id; });
	
	if (connect){
		// Start connection
		g_net.type= "client";
		var conn= g_net.peer.connect(g_net.connPid, { reliable: g_net.reliable });
		conn.on('open', function(){
			netOnConnect(conn);
		});
	}
	else {
		// Receive connection
		g_net.type= "host";
		g_net.peer.on('connection', function(c){
			// Wait for connection to open
			var id= setInterval(function(){
				if (c.open && g_net[c.peer] == undefined){
					clearInterval(id);
					netOnConnect(c);
				}
			}, 100);
		});
	}
	
	setInterval(netDeliver, g_net.optimalInterval*1000.0);
}

function netEnabled(){
	return g_net.enabled;
}

function netConnected(){
	return Object.keys(g_net.peers).length > 0;
}

function netUpdate(){
	if (!netConnected())
		return;

	for (pid in g_net.peers){
		var peer= g_net.peers[pid];
		
		if (Date.now()/1000.0 - peer.lastContact > g_net.peerTimeout)
			netDropPeer(pid);
 	}
	
	gsNetUpdate();
}

/// Send msg to all peers
function netSend(msg){
	netQueuePacket(netCreatePacket(msg));
}

// Implementation

function netCreatePacket(msg){
	return {
		"pid": g_net.pid,
		"time": Date.now()/1000.0,
		"msg": msg };
}

function netOnConnect(c){
	g_net.peers[c.peer]= {conn: c};
	c.on("data", netOnReceive);
	gsNetOnPeerConnect(c.peer);
	
	if (g_net.type == "host")
		netInitPeerState(c.peer);
}

function netInitPeerState(pid){
	var peer= g_net.peers[pid];
	var init_msgs= gsNetGetInitMsgs();
	for (var i= 0; i < init_msgs.length; ++i){
		peer.conn.send(netCreatePacket(init_msgs[i]));
	}
}

function netDropPeer(pid){
	tassert(pid != g_net.pid, "can't touch this");
	
	var peer= g_net.peers[pid];
	if (peer.conn)
		peer.conn.close();
	
	delete g_net.peers[pid];
	
	gsNetOnPeerDrop(pid);
}

function netQueuePacket(packet){
	g_net.deliverQueue.push(packet);
}

function netOnReceive(packet){
	tassert(packet.pid !== undefined, "invalid packet");
	tassert(packet.msg !== undefined, "invalid msg in packet");
	tassert(packet.pid != g_net.pid, "got own packet back");
	
	if (g_net.peers[packet.pid] == undefined){
		g_net.peers[packet.pid]= {}; // New peer (routed by host)
		gsNetOnPeerConnect(packet.pid);
	}
	
	var packet_peer= g_net.peers[packet.pid];
	packet_peer.lastContact= Date.now()/1000.0;
	
	if (g_net.type == "host"){
		// Send packet to other peers
		netQueuePacket(packet);
	}
	
	var from_host= g_net.type == "client" && packet_peer.conn;
	gsNetOnReceive(packet.pid, packet.time, packet.msg, from_host);
}

function netDeliver(){
	if (!netConnected())
		return;
	
	netSend(gsNetOptimalDelivery());
	
	for (var i= 0; i < g_net.deliverQueue.length; ++i){
		var packet= g_net.deliverQueue[i];
		
		for (pid in g_net.peers){
			if (pid == packet.pid)
				continue; // No need to return mail to sender
			
			var peer= g_net.peers[pid];
			if (peer.conn) // Clients have connection only to host
				peer.conn.send(packet);
		}
	}
	g_net.deliverQueue= [];
}
		
// Game specific functionality

var g_peerCache= {};
var g_chatQueue= [];

function gsNetOnPeerConnect(pid){
	g_peerCache[pid]= {
		prevState: {},
		curState: {}
	};
}

// Messages required to initialize new peer
function gsNetGetInitMsgs(){
	var msgs= [];
	for (var i= 0; i < flycount; ++i){
		if (flydead[i]){
			msgs.push(gsNetCreateFlyDeadMsg(i));
		}
	}
	return msgs;
}

function gsNetOnPeerDrop(pid){
	delete g_peerCache[pid];
}

function gsNetOptimalDelivery(){
	return { 	type: "upd",
				gTime: g_gameTime,
				frogPos: [frog_x, frog_y] };
}

function gsNetCreateFlyDeadMsg(fly_id){
	return { type: "flydead", id: fly_id };
}

function gsNetSendChatMsg(text){
	if (!netConnected())
		return;
	
	filtered_text= filterIllegalChars(text);
	netSend({ type: "chatmsg", text: filtered_text });
	gsNetQueueChatMsg(g_net.pid, filtered_text);
}

function gsNetQueueChatMsg(pid, text){
	g_chatQueue.push({ pid: pid, text: text, time: Date.now()/1000.0 });
}

function gsNetOnReceive(pid, timestamp, msg, from_host){
	var peer= g_peerCache[pid];
	
	if (msg.type == "upd"){
		peer.prevState= clone(peer.curState);
		
		var state= peer.curState;
		state.frogPos= msg.frogPos;
		state.recvTime= Date.now()/1000.0;
		
		if (from_host){
			// Host sets time
			g_gameTime= msg.gTime;
		}
	}
	else if (msg.type == "flydead"){
		flydead[msg.id]= true;
	}
	else if (msg.type == "chatmsg"){
		gsNetQueueChatMsg(pid, msg.text);
	}
}

function gsNetUpdate(){
	for (pid in g_peerCache){
		var peer= g_peerCache[pid];
		if (isEmptyObject(peer.curState) || isEmptyObject(peer.prevState))
			continue;
		
		var prev_pos= peer.prevState.frogPos;
		var next_pos= peer.curState.frogPos;
		
		// Linear interpolation
		var t= (Date.now()/1000.0 - peer.curState.recvTime)/g_net.optimalInterval;
		var pos= [	prev_pos[0]*(1-t) + next_pos[0]*t,
					prev_pos[1]*(1-t) + next_pos[1]*t ];
		
		drawTexture("sammakko", pos, [0.6, 0.6], 0.0, [1.0, 4.0, 0.5, 0.8]);
		drawText(pid, [pos[0], pos[1] + 1.0], "center", [0.5, 0.5, 0.5, 1.0]);
	}
	
	var player_count= Object.keys(g_peerCache).length + 1;
	drawText(	"Player count: " + player_count,
				screenToWorldCoords([-0.98, 0.95]),
				"right",
				[1.0, 1.0, 1.0, 0.5]);
	
	drawText(g_net.pid, [frog_x, frog_y + 1.0], "center", [0.5, 1.0, 0.3, 1.0]);
	
	// Draw chat messages
	var row_height= pixelToScreenSize(glFontInfo.charSizes["I"])[1];
	var y= -0.96 + row_height;
	for (var i= g_chatQueue.length - 1; i >= 0; --i){
		var msg= g_chatQueue[i];
		var str= msg.pid + ": " + msg.text;
		drawText(str, screenToWorldCoords([-0.98, y]), "right", [1.0, 1.0, 0.5, 0.5]);
		y += row_height;
	}
	
	// Draw message being currently written
	if (isTextInput()){
		drawText(filterIllegalChars(getWrittenText()), screenToWorldCoords([-0.98, -0.97]), "right", [1.0, 1.0, 0.5, 0.8]);
	}
	
	// Remove old chat message
	if (g_chatQueue.length > 0 && Date.now()/1000.0 - g_chatQueue[0].time > 10.0){
		g_chatQueue.shift();
	}

}
