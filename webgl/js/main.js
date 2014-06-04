(function(W) {
	W = W || window;

	var Stage, Display, Shape, Rect, fn, time;
	Display = function(){},
	fn = Display.prototype,
	fn.render = function(gl) {
		this._render(gl);
	},
	fn._render = null,
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
						"gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);",
						"vColor = aVertexColor;",
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
		program.position = gl.getAttribLocation(program, "aVertexPosition");
		gl.enableVertexAttribArray(program.position);

		program.color = gl.getAttribLocation(program, "aVertexColor");
		gl.enableVertexAttribArray(program.color);

		program.perspective = gl.getUniformLocation(program, "uPMatrix");
		program.translate = gl.getUniformLocation(program, "uMVMatrix");
		return program;
	},
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
	time = 0,
	fn._render = function(gl) {
		gl.viewport(0, 0, gl.w, gl.h);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		mat4.perspective( 45, this.viewRate, 0.1, 100.0, this.perspective);

		time += 0.01;

		mat4.identity( this.translate );
		mat4.translate( this.translate, [this.x , this.y, this.z] );

		mat4.rotateX( this.translate , time );
		mat4.rotateY( this.translate , time );
		mat4.rotateZ( this.translate , time );

		gl.bindBuffer( gl.ARRAY_BUFFER, this.buffer );
		gl.vertexAttribPointer( this.program.position, this.buffer.size, gl.FLOAT, 	false, 0, 0 );

		gl.bindBuffer( gl.ARRAY_BUFFER, this.colorBuffer);
		gl.vertexAttribPointer( this.program.color, 4, gl.FLOAT, false, 0, 0);

		this.parent.setPerspective( this.program );
		this.parent.setTranslate( this.program , this.translate);

		gl.drawArrays( gl.TRIANGLE_STRIP, 0, this.buffer.num );

		for(var i=0;i<100;i++) {
			mat4.identity(this.translate);
			mat4.translate(this.translate, [Math.sin(time+i)*10, Math.cos(time+i)*10, -10 - i]);
			gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
			gl.vertexAttribPointer(this.program.position, this.buffer.size, gl.FLOAT, false, 0, 0);
			this.parent.setPerspective( this.program );
			this.parent.setTranslate( this.program , this.translate);
			gl.drawArrays( gl.TRIANGLE_STRIP, 0, this.buffer.num);
		}
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
		this.parent = stage;
		this.buffer = stage.initBuffer( [
			 1.0,  1.0, 0.0,
			-1.0, 1.0, 0.0,
			 1.0, -1.0, 0.0,
			-1.0, -1.0, 0.0
		]);
		this.colorBuffer = stage.initBuffer ( [
			1.0, 1.0, 1.0, 1.0, 
			1.0, 0.0, 0.0, 1.0, // r
			0.0, 1.0, 0.0, 1.0, // g
			0.0, 0.0, 1.0, 1.0  // b
		]);
		this.parent.children.push(this);
	},
	fn = Rect.prototype = new Shape();

	W.onload = function() {
		var stage;
		stage = new Stage();
		stage.shader( 'v0', "vertex");
		stage.shader( 'f0', "fragment");

		rect = new Rect(stage);
		rect.program( stage.program("v0", "f0") );
		rect.z = -20;

		setInterval(function() { stage.render(); }, 16);
	};
})(this);
