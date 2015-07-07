var g_lastFrameTimeMs= 0;
var g_gameTime= 0.0;
var g_experimental= false;

function initExperimental(){
}

function init(){
	g_experimental= getQueryVar("experimental");
	
	glInit();
	inputInit();
	//netInit();
	
	if (g_experimental){
		initExperimental();
	}
	
	// Start game
	g_lastFrameTimeMs= Date.now();
	gameInit();
	setInterval(frame, 1000.0/60.0);
}

function frame(){
	var cur_time_ms= Date.now();
	var dt= (cur_time_ms - g_lastFrameTimeMs)/1000.0;
	
	// Not allowing less than 10 fps
	if (dt > 0.05)
		dt= 0.05;
	
	inputUpdate();
	
	gameUpdate(g_gameTime, dt);
	
	g_gameTime += dt;
	g_lastFrameTimeMs= cur_time_ms;
}
