/**
 * */
var Camera, Stage, Display, Shape, Rect, fn;

Display = function(){},
fn = Display.prototype,
fn.render = function(gl) {
	this._render(gl);
},
fn._render = null;
Camera = function Camera() { };
Stage = function Stage () { 
	var el = document.createElement("canvas");
	el.setAttribute("width", 800);
	el.setAttribute("height", 600);
	document.body.appendChild(el);

	this.gl = el.getContext("webgl") || el.getContext("experimental-webgl");
	this.gl.w = this.width = el.width; 
	this.gl.h = this.height = el.height;
	this.viewRate = this.width / this.height;

	this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
	this.gl.enable(this.gl.DEPTH_TEST);

	this.perspective = mat4.create();
	mat4.perspective( 45, this.viewRate, 0.1, 100.0, this.perspective);

	this.shaders = {};
	this.children = [];
};

fn = Stage.prototype = new Display();
fn._render = function() {
	var gl = this.gl, i, j;
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	for ( i = 0, j = this.children.length; i < j ; i++ ) {
		this.children[i].render(gl);
	}
},
fn.shader = function (key, shaderKey){
	var gl, shader;
	if (shaderKey) {
		gl = this.gl;
		var shaderConstant = { "fragment":gl.FRAGMENT_SHADER, "vertex":gl.VERTEX_SHADER }[shaderKey];
		var shaderStr = {
			"fragment":[
				"precision mediump float;",
				"void main(void) {",
					"gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);",
				"}"
			].join("\n"),
			"vertex":[
				"attribute vec3 aVertexPosition;",
				"uniform mat4 uMVMatrix;",
				"uniform mat4 uPMatrix;",
				"void main(void) {",
					"gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);",
				"}"
			].join("\n")
		}[shaderKey];
		shader = gl.createShader(shaderConstant);

		gl.shaderSource(shader, shaderStr);
		gl.compileShader(shader);

		this.shaders[key] = shader;
	}
	return this.shaders[key];
},
fn.program = function() {
	var gl = this.gl, shaders = this.shaders, program, i, j;
	program = gl.createProgram();
	for( i = 0, j = arguments.length ; i < j ; i++ ) {
		gl.attachShader( program, shaders[arguments[i]] );
	}
	gl.linkProgram(program);

	gl.useProgram(program);
	program.position = gl.getAttribLocation(program, "aVertexPosition") 
	gl.enableVertexAttribArray(program.position );

	program.perspective = gl.getUniformLocation(program, "uPMatrix");
	program.translate = gl.getUniformLocation(program, "uMVMatrix");
	return program;
},
// TODO ì¼ê°íì´ ìëê²½ì°ì indexBufferObject ë ì´ê¸°í í´ì¤ì¼ëë¤. 
fn.initBuffer = function(verticies) {
	var gl, buffer;
	gl = this.gl;
	buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verticies), gl.STATIC_DRAW);
	buffer.size = 3;
	buffer.num = verticies.length / buffer.size;
	return buffer;
},
fn.setPerspective = function(program) {
	this.gl.uniformMatrix4fv(program.perspective, false, this.perspective);
},
fn.setTranslate = function(program, translate) {
	this.gl.uniformMatrix4fv(program.translate, false, translate);
},

Shape = function() {
	this.x = this.y = this.z = 0;
	this.translate = mat4.create();
},
fn = Shape.prototype = new Display();
fn.program = function(program) {
	this.program = program;
},
fn._render = function(gl) {
	gl.viewport(0, 0, gl.w, gl.h);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	mat4.perspective( 45, this.viewRate, 0.1, 100.0, this.perspective);

	mat4.identity( this.translate );
	mat4.translate( this.translate, [this.x , this.y, this.z] );
	gl.bindBuffer( gl.ARRAY_BUFFER, this.buffer );
	gl.vertexAttribPointer( this.program.position, this.buffer.size, gl.FLOAT, 	false, 0, 0 );
	this.parent.setPerspective( this.program );
	this.parent.setTranslate( this.program , this.translate);
	gl.drawArrays( gl.TRIANGLE_STRIP, 0, this.buffer.num );
},
Tri = function(stage) {
	Shape.call(this);
	this.parent = stage;
	this.buffer = stage.initBuffer( [
		 0.0,  1.0, 0.0,
		-1.0, -1.0, 0.0,
		 1.0, -1.0, 0.0
	]);
	this.parent.children.push(this);
},
fn = Tri.prototype = new Shape(),
Rect = function(stage) {
	Shape.call(this);
	//  x,y,z ë íë ¬ ë³í -> í¬ììì ì¬ì©ëëë° zê°ì´ 0ë³´ë¤ í¬ë©´ ìì ìë³´ì´ê² ëë¤. 
	//  ì ì í ê°ì ì¤ì  íì.
	this.z = -10;
	this.parent = stage;
	this.buffer = stage.initBuffer( [
		 0.0,  1.0, 0.0,
		-1.0, -1.0, 0.0,
		 1.0, -1.0, 0.0,
		-1.0, -1.0, 0.0
	]);
	this.parent.children.push(this);
},
fn = Rect.prototype = new Shape();

window.onload = function() {
	var stage, rect;
	stage = new Stage();
	stage.shader( 'v0', "vertex");
	stage.shader( 'f0', "fragment");

	rect = new Rect(stage);
	rect.program( stage.program("v0", "f0") );

	stage.render();
};
