const { mat4 }  = require('gl-matrix');
const Shaders   = require('./shaders');

class WebGLCanvas {
  constructor(_canvasElement) {
    var canvasElement = _canvasElement;

    if (typeof canvasElement === 'string')
      canvasElement = document.getElementById(canvasElement);

    var canvasConfig = {
      alpha: true,
      depth: true,
      stencil: true,
      desynchronized: true,
      antialias: true,
      preserveDrawingBuffer: true,
    };

    var gl = canvasElement.getContext("webgl", canvasConfig);
    // Only continue if WebGL is available and working
    if (gl == null)
      throw new Error("Unable to initialize WebGL. Your browser or machine may not support it.");

    Object.defineProperties(this, {
      'gl': {
        writable:     true,
        enumberable:  false,
        configurable: true,
        value:        gl,
      },
      'renderFrameMethod': {
        writable:     true,
        enumberable:  false,
        configurable: true,
        value:        this.renderFrame.bind(this),
      },
      'width': {
        writable:     true,
        enumberable:  false,
        configurable: true,
        value:        canvasElement.width,
      },
      'height': {
        writable:     true,
        enumberable:  false,
        configurable: true,
        value:        canvasElement.height,
      },
    });

    var quadCount   = 1;
    var vertexCount = quadCount * 6;

    Object.defineProperties(this, {
      'quadCount': {
        writable:     true,
        enumberable:  false,
        configurable: true,
        value:        quadCount,
      },
      'vertexCount': {
        writable:     true,
        enumberable:  false,
        configurable: true,
        value:        vertexCount,
      },
      'vertexBuffer': {
        writable:     true,
        enumberable:  false,
        configurable: true,
        value:        this._generateVertecies(quadCount),
      },
      'shaderProgram': {
        writable:     true,
        enumberable:  false,
        configurable: true,
        value:        this.buildShaderProgram(Shaders.vertexShader, Shaders.fragmentShader),
      },
    });

    this.initialize();

    window.requestAnimationFrame(this.renderFrameMethod);
  }

  _generateVertecies(count) {
    var template = [
      0.0, 1.0,
      1.0, 1.0,
      1.0, 0.0,
      0.0, 1.0,
      1.0, 0.0,
      0.0, 0.0,
    ];

    template = template.map((point) => {
      return point * 100.0;
    });

    var templateArrayLen = template.length;
    var vertexArray = new Float32Array(templateArrayLen * count);
    for (var i = 0, il = vertexArray.length; i < il; i++) {
      var item = template[i % templateArrayLen];
      vertexArray[i] = item;
    }

    return this.getContext((gl) => {
      var vertexBuffer = gl.createBuffer();

      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertexArray, gl.STATIC_DRAW);

      return vertexBuffer;
    });
  }

  getContext(cb) {
    return cb.call(this, this.gl);
  }

  compileShader(gl, type, source) {
    let shader = gl.createShader(type);

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(`Error compiling ${type === gl.VERTEX_SHADER ? "vertex" : "fragment"} shader:`);
      console.error(gl.getShaderInfoLog(shader));
    }

    return shader;
  }

  buildShaderProgram(_vertexShader, _fragmentShader) {
    return this.getContext((gl) => {
      var program = gl.createProgram();

      if (_vertexShader) {
        var vertexShader = this.compileShader(gl, gl.VERTEX_SHADER, _vertexShader);
        if (vertexShader)
          gl.attachShader(program, vertexShader);
      }

      if (_fragmentShader) {
        var fragmentShader = this.compileShader(gl, gl.FRAGMENT_SHADER, _fragmentShader);
        if (fragmentShader)
          gl.attachShader(program, fragmentShader);
      }

      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("Error linking shader program:");
        console.error(gl.getProgramInfoLog(program));
      }

      return program;
    });
  }

  initialize() {
    this.getContext((gl) => {
      gl.viewport(0, 0, this.width, this.height);
      gl.useProgram(this.shaderProgram);

      // Set orthographic projection matrix
      var P_MAT   = gl.getUniformLocation(this.shaderProgram, "P_MAT");
      var ratio   = this.width / this.height;
      var pMatrix = mat4.ortho(mat4.create(), 0.0, this.width, this.height, 0.0, 0.0, -1000.0);
      gl.uniformMatrix4fv(P_MAT, false, pMatrix);

      // Set model matrix
      var M_MAT   = gl.getUniformLocation(this.shaderProgram, "M_MAT");
      var pMatrix = mat4.identity(mat4.create());
      gl.uniformMatrix4fv(M_MAT, false, pMatrix);

      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);

      var VERTEX = gl.getAttribLocation(this.shaderProgram, "VERTEX");
      gl.enableVertexAttribArray(VERTEX);
      gl.vertexAttribPointer(VERTEX, 2, gl.FLOAT, false, 0, 0);
    });
  }

  renderFrame(delta) {
    this.getContext((gl) => {

      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.drawArrays(gl.TRIANGLES, 0, this.vertexCount);
    });

    //window.requestAnimationFrame(this.renderFrameMethod);
  }
}

window.WebGLCanvas = WebGLCanvas;
