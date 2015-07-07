var gl;
var glProg= {};
var glTextures= [];
var glCam= {};
var glCanvasCtx;
var glFontInfo= {	fontName: "Comic Sans MS",
					fontSize: 60,
					chars: g_input.allowedChars,
					charSizes: {}, // In pixels
					charUvs: {} // ll: lower_left, ur: upper_right
};

/// Pixel to world size
function pixelToWorldSize(px){
	return [px[0]/glCam.pixSize[0]/glCam.scale*2.0, px[1]/glCam.pixSize[1]/glCam.scale*2.0];
}

function pixelToScreenSize(px){
	return [px[0]/glCam.pixSize[0]*2.0, px[1]/glCam.pixSize[1]*2.0];
}

function screenToWorldCoords(scrn){
	return [glCam.pos[0] + scrn[0]/glCam.scale, glCam.pos[1] + scrn[1]/glCam.scale];
}

// Not tested
function worldToPixelCoords(world){
	return [(world[0] - glCam.pos[0])*glCam.scale*glCam.pixSize[0] + glCam.pixSize[0],
			(world[1] - glCam.pos[1])*glCam.scale*glCam.pixSize[1] + glCam.pixSize[1]];
}

function pixelToWorldCoords(px){
	return [(px[0] - glCam.pixSize[0])/glCam.scale/glCam.pixSize[0] + glCam.pos[0],
			(px[1] - glCam.pixSize[1])/glCam.scale/glCam.pixSize[1] + glCam.pos[1]];
}
/*
function matchWorldToPixels(world){
	var px= worldToPixelCoords(world);
	px[0]= Math.floor(px[0]);
	px[1]= Math.floor(px[1]);
	return pixelToWorldCoords(px);
}*/

function textSizeInPixels(str){
	var measurement= glCanvasCtx.measureText(str);
	if (measurement.height === undefined){
		measurement.height= glFontInfo.fontSize;
	}
	return [measurement.width, measurement.height];
}

function handleLoadedTexture(texture, image) {
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.bindTexture(gl.TEXTURE_2D, null);
}

function shaderProgram(gl, vs, fs) {
	var prog = gl.createProgram();
	var addshader = function(type, source) {
		var s = gl.createShader((type == 'vertex') ?
			gl.VERTEX_SHADER : gl.FRAGMENT_SHADER);
		gl.shaderSource(s, source);
		gl.compileShader(s);
		if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
			throw "Could not compile "+type+
				" shader:\n\n"+gl.getShaderInfoLog(s);
		}
		gl.attachShader(prog, s);
	};
	addshader('vertex', vs);
	addshader('fragment', fs);
	gl.linkProgram(prog);
	if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
		throw "Could not link the shader program!";
	}
	return prog;
}

function attributeSetFloats(gl, prog, attr_name, rsize, arr) {
	gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arr),
		gl.STATIC_DRAW);
	var attr = gl.getAttribLocation(prog, attr_name);
	gl.enableVertexAttribArray(attr);
	gl.vertexAttribPointer(attr, rsize, gl.FLOAT, false, 0, 0);
}

function glFontCacheInit(font_info){
	var canvas= document.getElementById('fontCacheCanvas');
	var ctx= canvas.getContext('2d');
	
	ctx.fillStyle= "#FFFFFF";
	ctx.textAlign= "left";
	ctx.textBaseline= "top";
	ctx.font= font_info.fontSize + "px " + font_info.fontName;
	glCanvasCtx= ctx;
	
	var tex_w= canvas.width;
	var tex_h= canvas.height;
	glCam.pixelSize = [tex_w, tex_h];
	
	var bounding= 3;
	
	// Draw chars to canvas
	var x= 0.0, y= 0.0;
	for (var i= 0; i < font_info.chars.length; ++i){
		if (x + font_info.fontSize >= tex_w){
			x= 0.0;
			y += font_info.fontSize + bounding;
		}
		
		var ch= font_info.chars[i];
		ctx.fillText(ch, x, y);

		var char_size= textSizeInPixels(ch);;
		
		font_info.charSizes[ch]= char_size;
		font_info.charUvs[ch]= {
			ll: [x/tex_w, 1.0 - (y + char_size[1])/tex_h],
			ur: [(x + char_size[0])/tex_w, 1.0 - y/tex_h]
		};
		
		x += char_size[0] + bounding;
	}
	
	// Create texture from canvas
	var texname= "__font_cache";
	glTextures[texname]= {};
	glTextures[texname].tex= gl.createTexture();
	
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    gl.bindTexture(gl.TEXTURE_2D, glTextures[texname].tex);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
		gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);
}

function glInit(){
	var canvas= document.getElementById("webgl");
	glCam.pixSize= [canvas.width, canvas.height];
	
	try {
		gl = canvas.getContext("experimental-webgl", {alpha:false});
		if (!gl) { throw "x"; }
	} catch (err) {
		throw "Your web browser does not support WebGL!";
	}
	
	glProg.program = shaderProgram(gl,
		readFile("shaders/tex_vertex"),
		readFile("shaders/tex_fragment")
	);
	gl.useProgram(glProg.program);
	
	attributeSetFloats(gl, glProg.program, "vpos", 2, [
		-1.0, -1.0,
		1.0, -1.0,
		1.0, 1.0,
		-1.0, 1.0
	]);
	
	glFontCacheInit(glFontInfo);
	
	glProg.posUniformLoc= gl.getUniformLocation(glProg.program, "pos");
	glProg.scaleUniformLoc= gl.getUniformLocation(glProg.program, "scale");
	glProg.colorUniformLoc= gl.getUniformLocation(glProg.program, "color");
	glProg.rotUniformLoc= gl.getUniformLocation(glProg.program, "rot");
	glProg.texUniformLoc= gl.getUniformLocation(glProg.program, "tex");
	glProg.camPosUniformLoc= gl.getUniformLocation(glProg.program, "camPos");
	glProg.camScaleUniformLoc= gl.getUniformLocation(glProg.program, "camScale");
	glProg.uvLowerLeftUniformLoc= gl.getUniformLocation(glProg.program, "uvLowerLeft");
	glProg.uvUpperRightUniformLoc= gl.getUniformLocation(glProg.program, "uvUpperRight");
	
	
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
	gl.enable(gl.BLEND);
	
	gl.activeTexture(gl.TEXTURE0);
	
	loadTexture("tex/white.png", "white");
	
	setCamera([0.0, 0.0], 1.0);
}

function loadTexture(src, name){
	glTextures[name]= {};
	glTextures[name].tex= gl.createTexture();
	glTextures[name].img= new Image();
	glTextures[name].img.onload= function() {
		handleLoadedTexture(glTextures[name].tex, glTextures[name].img);
	}
    glTextures[name].img.src= src;
}

function clearScreen(){
	gl.clearColor(0.0, 0.0, 0.1, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT);
}

function drawRect(pos, rad, rot, color){
	drawTexture("white", pos, rad, rot, color);
}

function drawTextureImpl(name, pos, rad, rot, color, uv){
	tassert(glTextures[name] !== undefined, "texture doesn't exist: " + name);
	
	var ppos = worldToPixelCoords(pos);
	if (	ppos[0] < 0 || ppos[1] < 0 ||
			pos[0] > glCam.pixelSize[0] || pos[1] > glCam.pixelSize[1])
		return;
	
	gl.uniform2f(glProg.posUniformLoc, pos[0], pos[1]);
	gl.uniform2f(glProg.scaleUniformLoc, rad[0], rad[1]);
	gl.uniform1f(glProg.rotUniformLoc, rot);
	gl.uniform4f(glProg.colorUniformLoc, color[0], color[1], color[2], color[3]);
	
	gl.uniform2f(glProg.uvLowerLeftUniformLoc, uv.ll[0], uv.ll[1]);
	gl.uniform2f(glProg.uvUpperRightUniformLoc, uv.ur[0], uv.ur[1]);
	
	gl.bindTexture(gl.TEXTURE_2D, glTextures[name].tex);
	gl.uniform1i(glProg.texUniformLoc, 0);
	
	gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
}


function drawTexture(name, pos, rad, rot, color){
	drawTextureImpl(name, pos, rad, rot, color, { ll: [0.0, 0.0], ur: [1.0, 1.0] });
}

// y centered, xalign can be "center", "right" or "left"
function drawText(str, pos, xalign, color){
	var p= pos.slice();
	
	if (xalign == "left" || xalign == "center"){
		var text_size= pixelToWorldSize(textSizeInPixels(str));
		
		if (xalign == "left"){
			p[0] -= text_size[0];
		}
		else {
			p[0] -= text_size[0]*0.5;
		}
	}
	
	for (var i= 0; i < str.length; ++i){
		var ch= str[i];
		
		tassert(glFontInfo.charSizes[ch] != undefined, "illegal character: " + ch);
		
		var char_size= pixelToWorldSize([glFontInfo.charSizes[ch][0], glFontInfo.charSizes[ch][1]]);
		var char_rad= [char_size[0]*0.5, char_size[1]*0.5];
		
		if (i == 0){
		
			p[0] += char_rad[0];
			//p[1] -= char_rad[1];
		}
		else {
			p[0] += char_rad[0];
		}
		
		drawTextureImpl("__font_cache", p, char_rad, 0.0, color, glFontInfo.charUvs[ch]);
	
		p[0] += char_rad[0];
	}
}

function setCamera(pos, scale){
	glCam.pos= pos.slice();
	glCam.scale= scale;
	
	gl.uniform2f(glProg.camPosUniformLoc, glCam.pos[0], glCam.pos[1]);
	gl.uniform1f(glProg.camScaleUniformLoc, glCam.scale);
}

