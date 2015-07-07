var g_input= { 	now: {},
				prev: {},
				allowedChars: 	"abcdefghijklmnopqrstuvwxyzäö"+
								"ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖ"+
								"01234567890.,_:;+-*/<> !\"#¤%&/()=?@£$€{[]}\\'^|\r\n",
				inputMode: "keys", // "keys" or "text"
				textModeExceptionKey: undefined, // A key for which key events are delivered even in text mode
				writtenText: "" // Text written in inputMode == "text"
};

function inputInit(){
	window.addEventListener('keydown', function(e){
		g_input.now[e.keyCode]= true;
	}, false);
	
	window.addEventListener('keypress', function(e){
		if (e.keyCode != g_input.textModeExceptionKey){
			if (e.keyCode == keyCodes.backspace){
				g_input.writtenText= g_input.writtenText.slice(0, -1);
			}
			else {
				g_input.writtenText += String.fromCharCode(e.charCode);
			}
		}
	}, false);
	
	window.addEventListener('keyup', function(e){
		g_input.now[e.keyCode]= false;
	}, false);
}

/// Returns true if in text input mode
function isTextInput(){
	return g_input.inputMode == "text";
}

function startTextInput(exception_key){
	g_input.inputMode= "text";
	g_input.textModeExceptionKey= exception_key;
	g_input.writtenText= "";
}

function stopTextInput(){
	g_input.inputMode= "key";
}

function getWrittenText(){
	return g_input.writtenText;
}

function filterIllegalChars(text){
	var filtered= "";
	for (var i= 0; i < text.length; ++i){
		if (g_input.allowedChars.indexOf(text[i]) != -1)
			filtered += text[i];
	}
	return filtered;
}

function inputUpdate(){
	for (var key in g_input.now){
		var cur_state= g_input.now[key];
		var prev_state= g_input.prev[key];
		
		if (isTextInput() && key != g_input.textModeExceptionKey)
			continue;
		
		if (cur_state && !prev_state)
			onKeyPress(key);
		else if (!cur_state && prev_state)
			onKeyRelease(key);
			
		if (cur_state)
			onKeyDown(key);
	}
	
	g_input.prev= clone(g_input.now);
}

function KeyCodes(){
	this.w= 87;
	this.a= 65;
	this.s= 83;
	this.d= 68;
	this.enter= 13;
	this.backspace= 8;
}

var keyCodes= new KeyCodes();
