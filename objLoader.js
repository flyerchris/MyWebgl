function objLoader(){
	this.v=null;
	this.vt=null;
	this.vn=null;
	this.fv=null;
	this.load=function(data){
		var tempv=[],tempvn=[],tempvt=[],tempfv=[],tempfn=[],tempft=[];
		if(typeof data!="string"){
			console.log("Input type error.Type should be string but you input "+typeof data+".");
			return false;
		}
		//parse data from input string
		var dataline=data.split('\n');
		for(i in dataline){
			var spw=dataline[i].split(' ');
			if(spw[0]=="v"){
				tempv.push(parseFloat(spw[1]),parseFloat(spw[2]),parseFloat(spw[3]));
			}else if(spw[0]=="vt"){
				tempvt.push(parseFloat(spw[1]),parseFloat(spw[2]));
			}else if(spw[0]=="vn"){
				tempvn.push(parseFloat(spw[1]),parseFloat(spw[2]),parseFloat(spw[3]));
			}else if(spw[0]=="f"){
				for(j=2;j<=spw.length-2;j++){
					var fspw1=spw[1].split('/');
					var fspw2=spw[j].split('/');
					var fspw3=spw[j+1].split('/');
					tempfv.push(parseInt(fspw1[0])-1,parseInt(fspw2[0])-1,parseInt(fspw3[0])-1);
					if(fspw1.length>1 && fspw1[1]!=""){
						tempft.push(parseInt(fspw1[1])-1,parseInt(fspw2[1])-1,parseInt(fspw3[1])-1);
					}
					if(fspw1.length==3 && fspw1[2]!=""){
						tempfn.push(parseInt(fspw1[2])-1,parseInt(fspw2[2])-1,parseInt(fspw3[2])-1);
					}
				}
			}
		}
		//arrange data so that point and normal are one to one maping
		var tempvn2=[],tempv2=[],tempfv2=[],tempvt2=[];
		if(tempfn.length!=0){
			for(i in tempfv){
				tempfv2.push(i);
				tempvn2.push(tempvn[tempfn[i]*3],tempvn[tempfn[i]*3+1],tempvn[tempfn[i]*3+2]);
				tempv2.push(tempv[tempfv[i]*3],tempv[tempfv[i]*3+1],tempv[tempfv[i]*3+2]);
				if(tempft.length!=0){
					tempvt2.push(tempvt[tempft[i]*2],tempvt[tempft[i]*2+1]);
				}else if(tempvt.length!=0){
					tempvt2.push(tempvt[tempfv[i]*2],tempvt[tempfv[i]*2+1]);
				}
			}
		}else{
			//if there is no built-in normal, calculate by self.
			if(tempvn.length==0){
				for(i in tempfv){
					tempfv2.push(i);
					tempv2.push(tempv[tempfv[i]*3],tempv[tempfv[i]*3+1],tempv[tempfv[i]*3+2]);
					if(i%3==2){
						var p1=vec3.create(),p2=vec3.create(),p3=vec3.create(),nor=vec3.create();
						p1[0]=tempv[tempfv[i-2]*3];p1[1]=tempv[tempfv[i-2]*3+1];p1[2]=tempv[tempfv[i-2]*3+2];
						p2[0]=tempv[tempfv[i-1]*3];p2[1]=tempv[tempfv[i-1]*3+1];p2[2]=tempv[tempfv[i-1]*3+2];
						p3[0]=tempv[tempfv[i]*3];p3[1]=tempv[tempfv[i]*3+1];p3[2]=tempv[tempfv[i]*3+2];
						vec3.sub(p1,p1,p2);
						vec3.sub(p3,p3,p2);
						vec3.cross(nor,p3,p1);
						tempvn2.push(nor[0],nor[1],nor[2],nor[0],nor[1],nor[2],nor[0],nor[1],nor[2]);
					}
					if(tempft.length!=0){
						tempvt2.push(tempvt[tempft[i]*2],tempvt[tempft[i]*2+1]);
					}else if(tempvt.length!=0){
						tempvt2.push(tempvt[tempfv[i]*2],tempvt[tempfv[i]*2+1]);
					}
				}
			}else{
			//if there is built-in normal, save data directly.
				tempv2=tempv;tempfv2=tempfv;tempvt2=tempvt;tempvn2=tempvn;
			}
		}
		this.v=new Float32Array(tempv2);
		this.vt=new Float32Array(tempvt2);
		this.vn=new Float32Array(tempvn2);
		this.fv=new Uint16Array(tempfv2);
		console.log(this.v.length/3+" vertices");
		console.log(this.vt.length/2+" texture points");
		console.log(this.fv.length+" face points");
	}
	//for debug
	this.print=function(){
		console.log("v:");
		for(i=0;i<this.v.length/3;i++){
			console.log(this.v[i*3]+","+this.v[i*3+1]+","+this.v[i*3+2]);
		}
		console.log("f:");
		for(i=0;i<this.fv.length/3;i++){
			console.log(this.fv[i*3]+","+this.fv[i*3+1]+","+this.fv[i*3+2]);
		}
	}
}