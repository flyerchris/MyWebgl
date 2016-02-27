var gl;
var program;
var tmat=mat4.create();//transform matrix
var pmat=mat4.create();//projection matrix
var rx=0,ry=0,rz=0,objzoff=-5;//rotation about x,y,z in degree and z offset
var vbf=[],vnbf=[],idbf=[],hasTexArray=[],txbuf=[],tximgbuf=[],facelen=[];//webglbuf
var objsel=[];//judge if you select the object

function displayMousePos(){
	var canvas2d=document.getElementById("canvas2d");
	var cv2d=canvas2d.getContext("2d");
	cv2d.font="15px Arial";
	canvas2d.addEventListener("mousemove",function(evt){
		var rect = canvas2d.getBoundingClientRect();
		var mousex=evt.clientX-rect.left;
		var mousey=evt.clientY-rect.top;
		cv2d.clearRect(0, 0, canvas2d.width, canvas2d.height);
		cv2d.fillText(mousex+","+mousey,5,15);
	},false);
}

window.onload=function(){
	var canvas =document.getElementById("glCnavas");
	displayMousePos();
	if(canvas && canvas.getContext){
		gl=canvas.getContext("webgl") || canvas.getContext("webkit-3d") ||
		canvas.getContext("experimental-webgl") || canvas.getContext("moz-3d");
		if(gl){
			//init
			gl.clearColor(0.0,0.0,0.0,0.0);
			gl.enable(gl.DEPTH_TEST);
			gl.depthFunc(gl.LEQUAL);
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
			gl.viewport(0,0,gl.canvas.width,gl.canvas.height);
			
			//program and shader
			program=gl.createProgram();
			$(document).load("vs.txt",function(rs,status,xm){
				setshader("vs",rs);
				loadfs();
			});
		}
	}
}

function setshader(type,tx){
	var shader;
	if(type=="vs"){
		shader=gl.createShader(gl.VERTEX_SHADER);
	}else if(type=="fs"){
		shader=gl.createShader(gl.FRAGMENT_SHADER);
	}
	gl.shaderSource(shader,tx);
	gl.compileShader(shader);
	
	if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS) && !gl.isContextLost()){
		var infoLog=gl.getShaderInfoLog(shader);
		if(infoLog.length>0){
			console.log(type+" shader compile error: "+infoLog);
		}
		return null;
	}
	gl.attachShader(program,shader);
}

function loadfs(){
	$(document).load("fs.txt",function(rs,status,xm){
		setshader("fs",rs);
		gl.linkProgram(program);
		gl.useProgram(program);
		loadObjs();
	});
}

function loadObjs(){
	$(document).load("cup.obj.txt",function(rs,status,xm){
		setupObj(rs,"cattex",0);
		objsel[0]=0;
		
		$(document).load("ground.obj.txt",function(rs,status,xm){
			setupObj(rs,"groundtex",1);
			objsel[1]=0;
			drawAllObj();
		});
	});
}

//send data to shader
function setupObj(objdata,tex,objind){
	var tb=new objLoader();
	tb.load(objdata);
	mat4.perspective(pmat,45*3.1415926/180,gl.drawingBufferWidth/gl.drawingBufferHeight,0.1,4000.0);
	//transfer data
	vbf[objind]=gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER,vbf[objind]);
	gl.bufferData(gl.ARRAY_BUFFER,tb.v,gl.STATIC_DRAW);
	var p=gl.getAttribLocation(program,"p");
	gl.enableVertexAttribArray(p);
	gl.vertexAttribPointer(p,3,gl.FLOAT,false,0,0);
	
	vnbf[objind]=gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER,vnbf[objind]);
	gl.bufferData(gl.ARRAY_BUFFER,tb.vn,gl.STATIC_DRAW);
	var np=gl.getAttribLocation(program,"normal");
	gl.enableVertexAttribArray(np);
	gl.vertexAttribPointer(np,3,gl.FLOAT,false,0,0);
		
	idbf[objind]=gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,idbf[objind]);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,tb.fv,gl.STATIC_DRAW);
	
	var hastex=gl.getUniformLocation(program,"hastex");
	if(tb.vt.length>0){
		gl.uniform1i(hastex,1);
		hasTexArray.push(1);
		var tximg=imgData(tex);
		var htmlimg=document.getElementById(tex);
		tximgbuf[objind]=gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, tximgbuf[objind]);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, htmlimg.width,htmlimg.height,0,gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(tximg));
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
		gl.generateMipmap(gl.TEXTURE_2D);
		
		txbuf[objind]=gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, txbuf[objind]);
		gl.bufferData(gl.ARRAY_BUFFER,tb.vt,gl.STATIC_DRAW);
		var txloc=gl.getAttribLocation(program,"txuv");
		gl.enableVertexAttribArray(txloc);
		gl.vertexAttribPointer(txloc,2,gl.FLOAT,false,0,0);
	}else{
		gl.uniform1i(hastex,0);
		hasTexArray.push(0);
		txbuf[objind]=-1;
	}
	facelen[objind]=tb.fv.length;
	//end of transfer data
}

//////////////////////////////////////choose the buf to be bound
function setupBuf(v,vn,hasvt,vt,img,f,issel){
	gl.bindBuffer(gl.ARRAY_BUFFER,v);
	var p=gl.getAttribLocation(program,"p");
	gl.vertexAttribPointer(p,3,gl.FLOAT,false,0,0);
	
	gl.bindBuffer(gl.ARRAY_BUFFER,vn);
	var np=gl.getAttribLocation(program,"normal");
	gl.vertexAttribPointer(np,3,gl.FLOAT,false,0,0);
	
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,f);
	
	var hastex=gl.getUniformLocation(program,"hastex");
	gl.uniform1i(hastex,hasvt);
	
	var selloc=gl.getUniformLocation(program,"sel");
	gl.uniform1i(selloc,issel);
	
	if(hasvt==1){
		gl.bindTexture(gl.TEXTURE_2D,img);
		gl.bindBuffer(gl.ARRAY_BUFFER, vt);
		var txloc=gl.getAttribLocation(program,"txuv");
		gl.enableVertexAttribArray(txloc);
		gl.vertexAttribPointer(txloc,2,gl.FLOAT,false,0,0);
	}else{
		var txloc=gl.getAttribLocation(program,"txuv");
		gl.disableVertexAttribArray(txloc);
	}
}


///////////////////////////////////////////draw
function drawObj(objind){
	var i=objind;
	setupBuf(vbf[i],vnbf[i],hasTexArray[i],txbuf[i],tximgbuf[i],idbf[i],objsel[i]);
	var pmatloc=gl.getUniformLocation(program,"projmat");
	gl.uniformMatrix4fv(pmatloc,false,pmat);
	var tmatloc=gl.getUniformLocation(program,"transmat");
	gl.uniformMatrix4fv(tmatloc,false,tmat);
	var zofloc=gl.getUniformLocation(program,"zoffset");
	gl.uniform1f(zofloc,objzoff);
	gl.drawElements(gl.TRIANGLES,facelen[objind],gl.UNSIGNED_SHORT,0);
}

function drawAllObj(){
	var i;
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	for(i=0;i<vbf.length;i++)drawObj(i);
}

//////////////////////////////////////////below are gui functions
function rotX(deg){
	var rxt=document.getElementById("rxtext");
	rxt.innerHTML=deg+"&#176";
	deltarx=deg-rx;
	rx=deg;
	var nm=mat4.create();
	mat4.rotateX(nm,nm,3.1415926*deltarx/180);
	mat4.mul(tmat,nm,tmat);
	drawAllObj();
}

function rotY(deg){
	var ryt=document.getElementById("rytext");
	ryt.innerHTML=deg+"&#176";
	deltary=deg-ry;
	ry=deg;
	var nm=mat4.create();
	mat4.rotateY(nm,nm,3.1415926*deltary/180);
	mat4.mul(tmat,nm,tmat);
	drawAllObj();
}

function rotZ(deg){
	var rzt=document.getElementById("rztext");
	rzt.innerHTML=deg+"&#176";
	deltarz=deg-rz;
	rz=deg;
	var nm=mat4.create();
	mat4.rotateZ(nm,nm,3.1415926*deltarz/180);
	mat4.mul(tmat,nm,tmat);
	drawAllObj();
}
function zoff(value){
	var zot=document.getElementById("zoffset");
	zot.innerHTML=value;
	objzoff=value;
	drawAllObj();
}

function selObj(s,state){
	if(state)objsel[s]=1;
	else objsel[s]=0;
	drawAllObj();
}

function imgData(sel){
	var mycanvas=document.createElement('canvas');
	var timg=document.getElementById(sel);
	mycanvas.width=timg.width;
	mycanvas.height=timg.height;
	var cvcon=mycanvas.getContext("2d");
	cvcon.translate(0, timg.height);
	cvcon.scale(1,-1);
	cvcon.drawImage(timg,0,0);
	//document.body.appendChild(mycanvas);
	return cvcon.getImageData(0,0,timg.width,timg.height).data;
}