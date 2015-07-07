// Sammakko 
var frog_x= 0.0; // Paikka x-suunnassa
var frog_vx= 0.0; // Nopeus
var frog_ax= 0.0; // Kiihtyvyys x-suunnassa
var frog_y= -0.8;
var frog_vy= 0.0; // Nopeus y-suunnassa
var frog_ay= 0.0; // Kiihtyvyys y-suunnassa
var frog_grounded= false;
var jumpTimer= 0.0;

var ground= -0.8;
var mapdata;
var white= [1.0, 1.0, 1.0, 1.0];


function drawMap() {
	var positions = [];
	var x= 0, y= 0;
	
	// TODO: use mapTilePositions()
	for (var i = 0; i < mapdata.length; i++){
		if (mapdata[i] == '\n'){
			x = 0;
			--y;
			continue;
		}
		if (mapdata[i] != ' ' && mapdata[i] != '	'){
			drawText(mapdata[i], [x, y], "right", [1.0, 1.0, 0.5, 0.5]);
			//drawTexture("grass", [x, y], [0.6, 0.6], 0.0, white);
		}
		++x;
		if (mapdata[i] == '	')
			x += 3;
	}
}

function mapTilePositions(){
	var positions = [];
	var x= 0, y= 0;
	
	for (var i = 0; i < mapdata.length; i++){
		if (mapdata[i] == '\n'){
			x = 0;
			--y;
			continue;
		}
		if (mapdata[i] != ' ' && mapdata[i] != '	'){
			positions.push([x, y]);
		}
		++x;
		if (mapdata[i] == '	')
			x += 3;
	}
	return positions;
}

function collisionCheck() {
	frog_grounded = false;
	
	var positions = mapTilePositions();
	for (var i = 0; i < positions.length; i++){
		var collision_result= rectRectCollision([frog_x, frog_y], [0.2, 0.2], positions[i], [0.5, 0.5]);
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
		frog_x = 0;
		frog_y = 0;
}
// Kutsutaan kun peli alkaa
function gameInit(){
		loadTexture("tex/background.png", "background");
		loadTexture("tex/sammakko.png", "sammakko");
		loadTexture("tex/earth.png", "earth");
		loadTexture("tex/grass.png", "grass");
		loadTexture("tex/oceanpatch.png", "oceanpatch");
		loadSound("audio/dev_beep0_1.ogg", "jump");
		loadSound("audio/mums.ogg", "mums");
		loadMap("game.js");
}
// Kutsutaan kun nappi painuu alas (ja joillain selaimilla kun nappia pidetään pohjassa)
function onKeyPress(keyCode){
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
	if (keyCode == keyCodes.d){
		frog_vx = 10.0;
	}
	if (keyCode == keyCodes.a){
		frog_vx = -10.0;
	}
}

// Kutsutaan kun nappi nousee ylös
function onKeyRelease(keyCode){
	if ((keyCode == keyCodes.a && frog_vx < 0.0) ||
		(keyCode == keyCodes.d && frog_vx > 0.0)){
		//frog_vx *= 0.5;
	}
	if (keyCode == keyCodes.w){
		// vy = -1.0;
		
	}
}


// Kutsutaan n. 60 kertaa sekunnissa
// dt on framen aika
function gameUpdate(time, dt){
	clearScreen();

	frog_vx *= 0.7;
	// Paikka muuttuu nopeuden ja aika-askeleen mukaisesti
	frog_x += frog_vx*dt;
	frog_vx += frog_ax*dt;
	
	frog_y += frog_vy*dt;
	frog_vy += frog_ay*dt;
	
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
	
	drawMap();
	drawTexture("sammakko",[frog_x, frog_y], [0.6, 0.6], 0.0, [1.0, 4.0, 0.9, 0.8]);
	drawTexture("earth", [], [0.6, 0.6], 0.0, [1.0, 4.0, 0.9, 0.8]);
	//drawTexture("background",[0.0, 0.0], [0.0, 0.0], 0.0, [0.0]);
}
