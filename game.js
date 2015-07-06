// Sammakko 
var frog_x= 0.0; // Paikka x-suunnassa
var frog_vx= 0.0; // Nopeus
var frog_y= -0.8;
var frog_vy= 0.0; // Nopeus y-suunnassa
var frog_ay= 0.0; // Kiihtyvyys y-suunnassa
var frog_grounded= false;
var jumpTimer= 0.0;

var flydead= []; // Kuollut kärpänen
var flyx= []; // Kärpäsen paikka x-suunnassa
//var flyvx= []; //Kärpäsen nopeus
var flyy= [];
//var flyvy= []; // Kärpäsen nopeus y-suunnassa
var flycount= 50;
var ground= -0.8;
var mapdata;
var white= [1.0, 1.0, 1.0, 1.0];

// Kärpäsen sijainti sen järjestysluvun, alkusijainnin ja nykyisen ajanhetken perusteella
function flyPos(i, pos, time){
	var osc= Math.sin(time*30.0 + i*0.7)*0.02; // Väpätys
	return [	pos[0] + Math.cos(time + i*i)*(1 + osc),
				pos[1] + Math.cos(time + i*i*2)*Math.sin(time + i)*(1 + osc)];
}

function drawMap() {
	var positions = mapTilePositions("#");
	for (var i = 0; i < positions.length; i++){
		drawTexture("earth", positions[i], [0.6, 0.6], 0.0, white);
	}
	var positions = mapTilePositions("G");
	for (var i = 0; i < positions.length; i++){
		drawTexture("grass", positions[i], [0.6, 0.6], 0.0, white);
	}
	var positions = mapTilePositions("-");
	for (var i = 0; i < positions.length; i++){
		drawTexture("oceanpatch", positions[i], [0.6, 0.6], 0.0, white);
	}
}

function mapTilePositions(symbol){
	var positions = [];
	var x= 0, y= 0;
	
	for (var i = 0; i < mapdata.length; i++){
		if (mapdata[i] == '\n'){
			x = 0;
			--y;
			continue;
		}
		if (mapdata[i] == symbol){
			positions.push([x, y]);
		}
		++x;
	}
	return positions;
}

function collisionCheck() {
	frog_grounded = false;
	
	var positions = mapTilePositions("G").concat(mapTilePositions("#")).concat(mapTilePositions("-"));
	for (var i = 0; i < positions.length; i++){
		var collision_result= rectRectCollision([frog_x, frog_y], [0.4, 0.4], positions[i], [0.5, 0.5]);
		if (collision_result.side != collisionSide.none){
			frog_x = collision_result.touchingPos[0];
			frog_y = collision_result.touchingPos[1];
		}
		if (frog_vy <= 0 && collision_result.side == collisionSide.down){
			frog_grounded= true;
		}
		if (frog_vy > 0 && collision_result.side == collisionSide.up){
			frog_vy = 0;
		}
	}
}

function loadMap(mapName) {
		mapdata = readFile(mapName);
		var positions = mapTilePositions("@");
		frog_x = positions[0][0];
		frog_y = positions[0][1];
		
		var positions = mapTilePositions("+");
		for (var i = 0; i < positions.length*10; i++){	
			flydead[i] = false;
			if (i > 0){
				flydead[i] = true;
			}
			flyx[i] = positions[i%positions.length][0];
			flyy[i] = positions[i%positions.length][1]; 
		}
}
// Kutsutaan kun peli alkaa
function gameInit(){
		loadTexture("tex/background.png", "background");
		loadTexture("tex/sammakko.png", "sammakko");
		loadTexture("tex/karba.png", "karba");
		loadTexture("tex/earth.png", "earth");
		loadTexture("tex/grass.png", "grass");
		loadTexture("tex/oceanpatch.png", "oceanpatch");
		loadSound("audio/dev_beep0_1.ogg", "jump");
		loadSound("audio/mums.ogg", "mums");
		loadMap("map1");
}
// Kutsutaan kun nappi painuu alas (ja joillain selaimilla kun nappia pidetään pohjassa)
function onKeyPress(keyCode){
	if (keyCode == keyCodes.d){
		frog_vx = 10.0;
	}
	if (keyCode == keyCodes.a){
		frog_vx = -10.0;
	}
	if (keyCode == keyCodes.w && jumpTimer > 0){ //hyppy
		frog_vy = 20.0;
		playSound("jump");
		jumpTimer = 0;
	}
	
	// Chat controls
	if (keyCode == keyCodes.enter){
		if (isTextInput()){
			stopTextInput();
			
			var text= getWrittenText();
			if (text.length > 0){
				gsNetSendChatMsg(text);
			}
		}
		else if (netConnected()) {
			startTextInput(keyCodes.enter);
		}
	}
	
}

// Kutsutaan kun nappi on pohjassa
function onKeyDown(keyCode){
	
}

// Kutsutaan kun nappi nousee ylös
function onKeyRelease(keyCode){
	if ((keyCode == keyCodes.a && frog_vx < 0.0) ||
		(keyCode == keyCodes.d && frog_vx > 0.0)){
		frog_vx = 0.0;
	}
	if (keyCode == keyCodes.w){
		// vy = -1.0;
		
	}
}


// Kutsutaan n. 60 kertaa sekunnissa
// dt on framen aika
function gameUpdate(time, dt){
	clearScreen();

	// Paikka muuttuu nopeuden ja aika-askeleen mukaisesti
	frog_x += frog_vx*dt;
	frog_vy += frog_ay*dt;
	frog_y += frog_vy*dt;
	
	collisionCheck();
	
	if (frog_grounded){ // Maassa
		frog_vy = 0.0;
		frog_ay = 0.0;
		jumpTimer = 0.10;
	}
	else {
		frog_ay = -40.0; // Ilmassa
		jumpTimer = jumpTimer -dt;
	}
	if (jumpTimer < 0){
		jumpTimer = 0;
	}
	setCamera([frog_x, frog_y], 0.2);
	
	drawTexture("background",[frog_x/1.1, frog_y/1.1], [5.0, 5.0], 0.0, [1.0, 1.0, 1.0, 0.9]);
	// Paikka muuttuu nopeuden ja aika-askeleen mukaisesti
	for (var i = 0; i < flycount; ++i){
		/*flyx[i] += flyvx[i]*dt;
		flyy[i] += flyvy[i]*dt;
	
		flyvy[i] = flyvy[i] - 0.09*flyvy[i];
		flyvx[i] = flyvx[i] - 0.09*flyvx[i];
	
		flyvy[i] += Math.random() - 0.5;
		flyvx[i] += Math.random() - 0.5;*/
		
		var pos= flyPos(i, [flyx[i], flyy[i]], time);
		
		var distance = Math.sqrt(Math.pow((frog_x-pos[0]),2) + Math.pow((frog_y-pos[1]),2));

		/*if (flyx[i] > 10.0) {
			flyvx[i] -= 1.0;
		}
	
		if (flyx[i] < -10.0) {
			flyvx[i] += 1.0;
		}
	
		if (flyy[i] < -10.0) {
			flyvy[i] += 1.0;
		}
		if (flyy[i] > 10.0) {
			flyvy[i] -= 1.0;
		}*/
		if (distance <= 0.5 && !flydead[i]) {
			netSend(gsNetCreateFlyDeadMsg(i)); // Inform other players
			flydead[i] = true;
			playSound("mums");
		}
		if (flydead[i] == false) {
			drawTexture("karba", pos, [0.2, 0.2], 1.0, [1.0, 1.0, 1.0, 0.8]);
		}

	}
	var deathcounter = 0;
	for (var i = 0; i < flycount; ++i){
		if (flydead[i] === true){
			deathcounter = deathcounter + 1;
		}
		if (deathcounter === flycount){
			loadMap("map2");
		}
	}
	
	drawMap();
	drawTexture("sammakko",[frog_x, frog_y], [0.6, 0.6], 0.0, [1.0, 4.0, 0.9, 0.8]);
	drawTexture("earth", [], [0.6, 0.6], 0.0, [1.0, 4.0, 0.9, 0.8]);
	//drawTexture("background",[0.0, 0.0], [0.0, 0.0], 0.0, [0.0]);

	if (netEnabled())
		netUpdate();
}
