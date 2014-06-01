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
// TODO 삼각형이 아닌경우에 indexBufferObject 도 초기화 해줘야된다. 
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
	//  x,y,z 는 행렬 변환 -> 투영시에 사용되는데 z값이 0보다 크면 아예 안보이게 된다. 
	//  적절한 값을 설정 했음.
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
function initGL(c) {
	gl = c.getContext("webgl")|| c.getContext("experimental-webgl");
	if (!gl) return alert("지원안되는 브라우저라능 !");
	gl.w = c.width, gl.h = c.height;
}

function getShader(gl, id) {
	var shaderStr = {
		"fragment":[
			"precision mediump float;",
			"varying lowp vec4 vColor;",
			"void main(void) {",
				"gl_FragColor = vColor;",
			"}"
		].join("\n"),
		"vertex":[
			"attribute vec3 aVertexPosition;",
			"attribute vec4 aVertexColor;",
			"uniform mat4 uMVMatrix;",
			"uniform mat4 uPMatrix;",
			"varying lowp vec4 vColor;",
			"void main(void) {",
				"gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 2.0);",
				"vColor = aVertexColor;",
			"}"
		].join("\n")
	}[id];
	if (!shaderStr) return null;

	// 쉐이더 만들기
	var shaderConstant = { "fragment":gl.FRAGMENT_SHADER, "vertex":gl.VERTEX_SHADER }[id];
	var shader = gl.createShader(shaderConstant);

	// GPU한테 shader code 와 shader 를 컴파일해달라고 요청~ 
	gl.shaderSource(shader, shaderStr);
	gl.compileShader(shader);

	// GPU한테 컴퐈일 제대로 됐는지 물어봄 ~ 잘못됐으면 메시지 받아다가 알럿
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		alert(gl.getShaderInfoLog(shader));
		return null;
	}
	return shader;
}

var shaderProgram;
function initShaders() {
	// 컴퐈일된 shader객체를 얻어옴 
	var fragmentShader = getShader(gl, "fragment");
	var vertexShader = getShader(gl, "vertex");

	// 쉐이더를 사용하기위해 프로그램 만들기
	shaderProgram=gl.createProgram();
	
	// 프로그램에서 쓸 쉐이더를 쉐이더를 붙입니다. 
	gl.attachShader(shaderProgram, vertexShader);	
	gl.attachShader(shaderProgram, fragmentShader);	

	// GPU한테 프로그램 링크해달라고 요청 
	gl.linkProgram(shaderProgram);

	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)){
		alert("문제있음 " );
	}

	// GPU에게 요 쉐이더 프로그램 쓸거라고 선언합니다. 
	gl.useProgram(shaderProgram);

	// 비디오 메모리(VRAM) 내의 attributePosition 을 얻어옵니다.
	shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
	
	// 지퓨한데 담당할 버텍스 정보를 알려줍니다~
	gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
	
	// shader 에 상수 알려줌
	shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
	shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");

	shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
	gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);
}

var mvMatrix = mat4.create();
var pMatrix = mat4.create();
function setMatrixUniforms() {
	gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
	gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

var squareVertexPositionBuffer;
var squareVerticesColorBuffer;
function initBuffers() {
	// GPU한테 버퍼만들어달라고 요청
	squareVertexPositionBuffer = gl.createBuffer();
	// 만든담에 요런 타입의 버퍼라고 GPU한테 알려줌 
	gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
	// 점 데이터. 이게 사실상 사각형 
	// item 3개짜리 배열 4개를 쓸수도 있지만 GPU의 세계에서는 1차원 배열로 주는게 GPU가 처리하기 수월함.
	var verticies = [
		1.0, 1.0, 0.0,
		-1.0, 1.0, 0.0,
		1.0, -1.0, 0.0,
		-1.0, -1.0, 0.0
	];

	// 버퍼에다가 지오메트리 점(버텍스)정보를 꽂아준다. 
	// ArrayType은 GPU가 사용하는 타입으로 재변환해서 적정수준의 부동소수점타입을 담을수있는 배열형태로 
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verticies), gl.STATIC_DRAW);

	// 평면 인식을 x,y,z 3개씩 끊어서 인식한다고 알려주기 
	squareVertexPositionBuffer.itemSize=3;
	// 점(버텍스) 갯수는 4개라고 알려줌 
	squareVertexPositionBuffer.numItems=4;

	// 칼라 설정 
	var colors = [ 
		1.0, 1.0, 1.0, 1.0,
		1.0, 0.0, 0.0, 1.0,
		0.0, 1.0, 0.0, 1.0,
		0.0, 0.0, 1.0, 1.0
	];
	squareVerticesColorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesColorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
}

var time = 0;
function drawScene() {
	gl.viewport(0, 0, gl.w, gl.h);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	mat4.perspective(45, gl.w / gl.h, 0.1, 100.0, pMatrix);

	// MBO 초기화 
	mat4.identity(mvMatrix);
	mat4.translate(mvMatrix, [Math.sin(time) * 2, Math.cos(time) * 2, -10]);

	time += 0.01

	// 회전 
	mat4.rotateY(mvMatrix, time)
	mat4.rotateX(mvMatrix, time)
	mat4.rotateZ(mvMatrix, time)

	gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesColorBuffer); 
	gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);

	setMatrixUniforms(); 
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, squareVertexPositionBuffer.numItems);
}

function glStart() {
	var el = document.createElement("p");
	el.appendChild(document.createTextNode("WebGL 로 사각형그리고 쉐이더로 칠해보기"));
	document.body.appendChild(el);

	el = document.createElement("canvas");
	el.setAttribute("width", 800);
	el.setAttribute("height", 600);
	document.body.appendChild(el);

	initGL(el);
	initBuffers();
	initShaders();

	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.enable(gl.DEPTH_TEST);

	setInterval(drawScene, 16);
}

window.onload = function() {
	var stage, rect;
	stage = new Stage();
	stage.shader( 'v0', "vertex");
	stage.shader( 'f0', "fragment");

	rect = new Rect(stage);
	rect.program( stage.program("v0", "f0") );

	stage.render();
};

// window.onload = glStart;
