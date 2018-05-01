// var fileSrc="images/"+Math.floor(Math.random()*10%8)+"/";
// var src=fileSrc+Math.floor(Math.random()*100%49)+".jpg";
var src="images/2/"+Math.floor(Math.random()*100%49)+".jpg";
document.getElementById("code").src=src;
//设置canvas宽高
window.onload=function(){
  document.getElementById('myCanvasElt').width=document.getElementById("code").width;
  document.getElementById('myCanvasElt').height=document.getElementById("code").height;
  document.getElementById('myCanvasDenoise').width=document.getElementById("code").width;
  document.getElementById('myCanvasDenoise').height=document.getElementById("code").height;
  document.getElementById('myCanvasThreshold').width=document.getElementById("code").width;
  document.getElementById('myCanvasThreshold').height=document.getElementById("code").height;
  document.getElementById('aBtn').addEventListener("click",allProcess);
  document.getElementById('processBtn').addEventListener("click",ProcessToGrayImage);
  document.getElementById('denoiseBtn').addEventListener("click",Denoise);
  document.getElementById('thresholdBtn').addEventListener("click",OTSUAlgorithm);
  document.getElementById('segBtn').addEventListener("click",Segmentation);
  document.getElementById('staBtn').addEventListener("click",Standard);
  document.getElementById('recBtn').addEventListener("click",recognizeOCR);
  document.getElementById("import").addEventListener("click", function(){
  document.getElementById("files").click();;
  });
};
function allProcess(){
  ProcessToGrayImage();
  OTSUAlgorithm();
  Denoise();
  Segmentation();
  Standard();
}
function ProcessToGrayImage(){
  var canvas = document.getElementById('myCanvasElt');
  var ctx = canvas.getContext('2d');
  // var img=document.getElementById("code");
  var img=new Image();
  img.src=src;
  ctx.drawImage(img,0,0);
  var canvasData = ctx.getImageData(0, 0, document.getElementById("code").width, document.getElementById("code").height);
  for (var x = 0; x < canvasData.width; x++) {
    for (var y = 0; y < canvasData.height; y++){
      // Index of the pixel in the array
      var idx = (x + y * canvas.width) * 4;
      // The RGB values
      var r = canvasData.data[idx + 0];
      var g = canvasData.data[idx + 1];
      var b = canvasData.data[idx + 2];
      // Update the values of the pixel;
      var gray = CalculateGrayValue(r , g , b);
      canvasData.data[idx + 0] = gray;
      canvasData.data[idx + 1] = gray;
      canvasData.data[idx + 2] = gray;
    }
  }
  ctx.putImageData(canvasData, 0, 0);
}
//计算图像的灰度值,公式为：Gray = R*0.299 + G*0.587 + B*0.114
function CalculateGrayValue(rValue,gValue,bValue){
 return parseInt(rValue * 0.299 + gValue * 0.587 + bValue * 0.114);
} 
 //一维OTSU图像处理算法
function OTSUAlgorithm(){
  var m_pFstdHistogram = new Array();//表示灰度值的分布点概率
  var m_pFGrayAccu = new Array();//其中每一个值等于m_pFstdHistogram中从0到当前下标值的和
  var m_pFGrayAve = new Array();//其中每一值等于m_pFstdHistogram中从0到当前指定下标值*对应的下标之和
  var m_pAverage=0;//值为m_pFstdHistogram【256】中每一点的分布概率*当前下标之和
  var m_pHistogram = new Array();//灰度直方图
  var i,j;
  var temp=0,fMax=0;//定义一个临时变量和一个最大类间方差的值
  var nThresh = 0;//最优阀值
  //获取灰度图像的信息
  var imageInfo = GetGrayImageInfo("myCanvasElt" );
  if(imageInfo == null){
    window.alert("图像还没有转化为灰度图像！");
    return;
  }
  //初始化各项参数
  for(i=0; i<256; i++){
    m_pFstdHistogram[i] = 0;
    m_pFGrayAccu[i] = 0;
    m_pFGrayAve[i] = 0;
    m_pHistogram[i] = 0;
  }
  //获取图像信息
  var canvasData = imageInfo[0];
  //获取图像的像素
  var pixels = canvasData.data;
  //下面统计图像的灰度分布信息
  for(i=0; i<pixels.length; i+=4){
    //获取r的像素值，因为灰度图像，r=g=b，所以取第一个即可
    var r = pixels[i];
    m_pHistogram[r]++;
  }
  //下面计算每一个灰度点在图像中出现的概率
  var size = canvasData.width * canvasData.height;
  for(i=0; i<256; i++){
    m_pFstdHistogram[i] = m_pHistogram[i] / size;
  }
  //下面开始计算m_pFGrayAccu和m_pFGrayAve和m_pAverage的值
  for(i=0; i<256; i++){
    for(j=0; j<=i; j++){
      //计算m_pFGaryAccu[256]
      m_pFGrayAccu[i] += m_pFstdHistogram[j];
      //计算m_pFGrayAve[256]
      m_pFGrayAve[i] += j * m_pFstdHistogram[j];
    }
    //计算平均值
    m_pAverage += i * m_pFstdHistogram[i];
  }
   //下面开始就算OSTU的值，从0-255个值中分别计算ostu并寻找出最大值作为分割阀值
   for (i = 0 ; i < 256 ; i++){
    temp = (m_pAverage * m_pFGrayAccu[i] - m_pFGrayAve[i]) 
    * (m_pAverage * m_pFGrayAccu[i] - m_pFGrayAve[i]) 
    / (m_pFGrayAccu[i] * (1 - m_pFGrayAccu[i]));
    if (temp > fMax)
    {
      fMax = temp;
      nThresh = i;
    }
  }
   //下面执行二值化过程 
   for(i=0; i<canvasData.width; i++){
    for(j=0; j<canvasData.height; j++){
         //取得每一点的位置
         var ids = (i + j*canvasData.width)*4;
         //取得像素的R分量的值
         var r = canvasData.data[ids];
         //与阀值进行比较，如果小于阀值，那么将改点置为0，否则置为255
         var gray = r>nThresh?255:0;
         canvasData.data[ids+0] = gray;
         canvasData.data[ids+1] = gray;
         canvasData.data[ids+2] = gray;
       }
     }
   //显示二值化图像
   var newImage = document.getElementById('myCanvasThreshold').getContext('2d');
   newImage.putImageData(canvasData,0,0);
}  
//图像去除边框及一次降噪
function Denoise(){
  //获取灰度图像的信息
  var imageInfo = GetGrayImageInfo("myCanvasThreshold");
  if(imageInfo == null){
    window.alert("图像还没有转化为灰度图像！");
    return;
  }
  //获取图像信息
  var canvasData = imageInfo[0];
  //获取图像的像素
  var pixels = canvasData.data;
  var x=document.getElementById("code").width;
  var y=document.getElementById("code").height;
  //去除边框
  for(i=0; i<x*4; i+=4){
    //上边
    pixels[i]=255;
    pixels[i+1]=255;
    pixels[i+2]=255;
  }
  for(i=x*y*4-4*x; i<x*y*4; i+=4){
    //下边
    pixels[i]=255;
    pixels[i+1]=255;
    pixels[i+2]=255;
  }
  for(i=0; i<x*y*4-4*x; i+=4*x){
    //左边
    pixels[i]=255;
    pixels[i+1]=255;
    pixels[i+2]=255;
  }
  for(i=x*4-4; i<x*y*4; i+=4*x){
    //右边
    pixels[i]=255;
    pixels[i+1]=255;
    pixels[i+2]=255;
  }
  //8邻域降噪
  var num=0;
   for(j=0;j<(y-1)*4*x;j+=4*x){
    for(i=4*x+4+j;i<x*8-4+j;i+=4){
      if(pixels[i]!=255){
        var aroundPoint=(pixels[i-4]==255?0:1)+(pixels[i+4]==255?0:1)+(pixels[i-4*x]==255?0:1)+(pixels[i+4*x]==255?0:1)+(pixels[i-4*x-4]==255?0:1)+(pixels[i+4*x+4]==255?0:1)+(pixels[i-4*x+4]==255?0:1)+(pixels[i+4*x-4]==255?0:1);
        if(aroundPoint<2){
          num++;
          pixels[i]=255;
          pixels[i+1]=255;
          pixels[i+2]=255;
        }
      }
    }
  }
  canvasData.data=pixels;
  var arr=new Array();
  for(var i=0;i<y;i++){
    arr[i]=new Array();
    for(var j=0;j<x;j++){
      if(pixels[4*j+i*4*x]==0)
      arr[i][j]=pixels[4*j+i*4*x];
    else arr[i][j]=1;
    }
  }
  console.log(arr);
  //显示一次降噪图像
  var newImage = document.getElementById('myCanvasDenoise').getContext('2d');
  newImage.putImageData(canvasData,0,0);
}
//获取图像的信息
function GetGrayImageInfo(canvasID){
  var canvas = document.getElementById(canvasID);
  var ctx = canvas.getContext('2d');
  var canvasData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  if(canvasData.data.length==0){
    return null;
  }
  return [canvasData,ctx];
}
//下面对灰度图像进行处理，将目标信息分割出来
// function DividedTarget(){
//   //读取降噪图像信息
//   var imageInfo = document.getElementById('myCanvasDenoise');
//   if(imageInfo == null){
//     window.alert("没有发现降噪图像信息！");
//     return;
//   }
//   //取得上下文
//   var ctx = imageInfo.getContext('2d');
//   //获取图像数据
//   var canvasData = imageInfo.getImageData(0, 0, ctx.width, ctx.height);
//   var newVanvasData = canvasData;
//   //取得图像的宽和高
//   var width = canvasData.width;
//   var height = canvasData.height;
//   //算法开始
//   var cursor = 2;
//   for(var x=0; x<width; x++){
//     for(var y=0; y<height; y++){
//       //取得每一点的位置
//       var ids = (x + y*canvasData.width)*4;
//       //取得像素的R分量的值
//       var r = canvasData.data[ids];
//       //如果是目标点
//       if(r==0){

//       }
//     }
//   }  
// }
//字符分割函数
function Segmentation(){
  //读取二值化图像信息
  var imageInfo = GetGrayImageInfo("myCanvasDenoise");
  if(imageInfo == null){
    window.alert("图像还没有转化为降噪图像！");
    return;
  }
  //获取图像信息
  var canvasData = imageInfo[0];
  //获取图像的像素
  var pixels = canvasData.data;
  var x=document.getElementById("code").width;
  var y=document.getElementById("code").height;
  var arr=pixels2array(pixels,x,y);
  //边缘检测分割算法
  var pArr=new Array();
  var flag=0,K=0,i=0,j=0,point1,point2,point3,point4;
  while(j<x){
    while(flag==0){
      if(arr[i][j]==0){
        flag=1;
        point1=j;
      }
      else if(i==y-1&&j<x-1){
        j++;
        i=0;
      }
      else if(i<y-1){
        i++;
      }
      else if(i==y-1&&j==x-1){
        flag=1;
        j=x;
      }
    }
    if(j==x)break;
    flag=0;
    i=0;
    j++;
    while(flag==0){
      if(arr[i][j]==255){
        K++;
      }
      if(i==y-1&&K<y){
        j++;
      i=0;
      K=0;
      }
      else if(i==y-1&&K==y){
        point2=j;
        flag=1;
      }
      else{
        i++;
      }
    }
    flag=0;
    i=0;
    j=point1;
    K=0;
    while(flag==0){
      if(arr[i][j]==0){
        flag=1;
        point3=i;
      }
      else {
        if(j==point2){
          i++;
          j=point1;
        }
        else{
          j++;
        }
      }
    }
    flag=0;
    i++;
    j=point1;
    while(flag==0){
      if(arr[i][j]==255){
        K++;
      }
      if(j==point2&&K<point2-point1+1){
        i++;
        j=point1;
        K=0;
      }
      else if(j==point2&&K==point2-point1+1){
        point4=i;
        flag=1;
      }
      else{
        j++;
      }
    }
    flag=0;
    K=0;
    // var num=0,newPix=new Array();
    // for(var q=point3;q<=point4;q++){
    //  for(var w=point1;w<=point2;w++){
    //    newPix[num]=arr[q][w];
    //    newPix[num+1]=arr[q][w];
    //    newPix[num+2]=arr[q][w];
    //    newPix[num+3]=arr[q][w];
    //    num+=4;
    //  }
    // }

    // document.getElementById('myCanvasSeg').width=point2-point1;
    // document.getElementById('myCanvasSeg').height=point4-point3;
    // var c=document.getElementById("myCanvasThreshold");
    // var ctx=c.getContext("2d");
    // var imgData=ctx.getImageData(point1,point3,point2,point4);
    // var newImage = document.getElementById('myCanvasSeg').getContext('2d');
    // newImage.putImageData(imgData,0,0);
    j=point2;
    pArr.push([point1,point2,point3,point4]);
    // console.log(pArr);  
  }
  console.log(pArr);
  // debugger;
  if(pArr.length==1){
    var po=pArr[0];
    pArr[0]=[po[0],po[0]+(po[1]-po[0])/4,po[2],po[3]];
    pArr.push([po[0]+(po[1]-po[0])/4,po[0]+(po[1]-po[0])/2,po[2],po[3]]);
    pArr.push([po[0]+(po[1]-po[0])/2,po[0]+(po[1]-po[0])/4*3,po[2],po[3]]);
    pArr.push([po[0]+(po[1]-po[0])/4*3,po[1],po[2],po[3]]);
  }
  if(pArr.length==2){
    var p1=pArr[0],p2=pArr[1];
    if(Math.abs((pArr[0][1]-pArr[0][0])/(pArr[1][1]-pArr[1][0])-1)<0.2){
      pArr[0]=[p1[0],p1[0]+(p1[1]-p1[0])/2,p1[2],p1[3]];
      pArr[1]=[p1[0]+(p1[1]-p1[0])/2,p1[1],p1[2],p1[3]];
      pArr.push([p2[0],p2[0]+(p2[1]-p2[0])/2,p2[2],p2[3]]);
      pArr.push([p2[0]+(p2[1]-p2[0])/2,p2[1],p2[2],p2[3]]);
    }
    else{
      if((pArr[0][1]-pArr[0][0])/(pArr[1][1]-pArr[1][0])<1){
        pArr[1]=[p2[0],p2[0]+(p2[1]-p2[0])/3,p2[2],p2[3]];
        pArr.push([p2[0]+(p2[1]-p2[0])/3,p2[0]+(p2[1]-p2[0])/3*2,p2[2],p2[3]]);
        pArr.push([p2[0]+(p2[1]-p2[0])/3*2,p2[1],p2[2],p2[3]]);
      }
      else{
        pArr[0]=[p1[0],p1[0]+(p1[1]-p1[0])/3,p1[2],p1[3]];
        pArr[1]=[p1[0]+(p1[1]-p1[0])/3,p1[0]+(p1[1]-p1[0])/3*2,p1[2],p1[3]];
        pArr.push([p1[0]+(p1[1]-p1[0])/3*2,p1[1],p1[2],p1[3]]);
        pArr.push(p2);
      }
    }
  }
  if(pArr.length==3){
    p1=pArr[0],p2=pArr[1];
    var p3=pArr[2];
    if(Math.abs((pArr[0][1]-pArr[0][0])/(pArr[1][1]-pArr[1][0])-1)<0.2){
      pArr[0]=p1;
      pArr[1]=p2;
      pArr[2]=[p3[0],p3[0]+(p3[1]-p3[0])/2,p3[2],p3[3]];
      pArr.push([p3[0]+(p3[1]-p3[0])/2,p3[1],p3[2],p3[3]]);
    }
    else if(Math.abs((pArr[0][1]-pArr[0][0])/(pArr[2][1]-pArr[2][0])-1)<0.2){
      pArr[0]=p1;
      pArr[1]=[p2[0],p2[0]+(p2[1]-p2[0])/2,p2[2],p2[3]];
      pArr[2]=[p2[0]+(p2[1]-p2[0])/2,p2[1],p2[2],p2[3]];
      pArr.push(p3);
    }
    else if(Math.abs((pArr[1][1]-pArr[1][0])/(pArr[2][1]-pArr[2][0])-1)<0.2){
      pArr[0]=[p1[0],p1[0]+(p1[1]-p1[0])/2,p1[2],p1[3]];
      pArr[1]=[p1[0]+(p1[1]-p1[0])/2,p1[1],p1[2],p1[3]];
      pArr[2]=p2;
      pArr.push(p3);
    }
  }
  console.log(pArr);
  for(var i=1;i<=pArr.length;i++){
    document.getElementById('myCanvasSeg'+i).width=pArr[i-1][1]-pArr[i-1][0];
    document.getElementById('myCanvasSeg'+i).height=pArr[i-1][3]-pArr[i-1][2];
    var c=document.getElementById("myCanvasThreshold");
    var ctx=c.getContext("2d");
    var imgData=ctx.getImageData(pArr[i-1][0],pArr[i-1][2],pArr[i-1][1],pArr[i-1][3]);
    var newImage = document.getElementById('myCanvasSeg'+i).getContext('2d');
    newImage.putImageData(imgData,0,0);
    // if(document.getElementById('te').childNodes<4){
      document.getElementById('te').appendChild(CanvasToImage(document.getElementById('myCanvasSeg'+i)));
    // }
  }
}

//转化为矩阵
function pixels2array(pixels,x,y){
  var arr=new Array();
  for(var i=0;i<y;i++){
    arr[i]=new Array();
    for(var j=0;j<x;j++){
      arr[i][j]=pixels[4*j+i*4*x];
    }
  }
  return arr;
}
//字符标准化
function Standard(){
  // Segmentation();
  // debugger;
  imgN=document.getElementById("te").childNodes;
  // console.log(imgN[1].nodeName);
  // debugger;
  for(var i=1;i<=4;i++){
    // var c=document.getElementById("myCanvasSeg"+i);
    // var img=new Image();
    // img.src=CanvasToImage(c);
    // // var img=document.getElementById("code");
    // console.log(img);
    if(imgN[i].nodeName=="IMG"){
      var img=imgN[i];
      var newCanvas = document.getElementById('myCanvasSta'+i);
      var newImage=newCanvas.getContext('2d');
      console.log(imgN);
      newImage.drawImage(img,0,0,img.width,img.height,0,0,newCanvas.width,newCanvas.height);
    }
  }
}
// 从canvas提取图片image   
function CanvasToImage(canvas){

  //新Image对象,可以理解为DOM;
  var image = new Image();
  //canvas.toDataURL返回的是一串Base64编码的URL,当然,浏览器自己肯定支持
  //指定格式PNG
  image.src = canvas.toDataURL("imgs/jpg");
  return image;
}
//选择字模库
var txt;
function impor(){
    var selectedFile = document.getElementById("files").files[0];//获取读取的File对象
    var name = selectedFile.name;//读取选中文件的文件名
    var size = selectedFile.size;//读取选中文件的大小
    console.log("文件名:"+name+"大小："+size);

    var reader = new FileReader();//这里是核心！！！读取操作就是由它完成的。
    reader.readAsText(selectedFile);//读取文件的内容

    reader.onload = function(){
        txt=this.result;//当读取完成之后会回调这个函数，然后此时文件的内容存储到了result中。直接操作即可。
    };
    return txt;
}
//字符转二进制串
function PreProcess(canvas,x,y){
  var arr=new Array();
  for(var i=0;i<4*x*y;i+=4){
    if(canvas[i]==255){
      arr.push(0);
    }
    else arr.push(1);
  }
  return arr;
}
//字符识别
function recognizeOCR(img,maxNearPoints,smallPicWidth,smallPicHeight,type=2,charWidth=10){
  var ans="";
  var zimo=txt.split("\n");
  zimo.pop();
  //console.log(zimo);
  // for(var i=0;i<txt.length;i+=604){
  //   zimo.push(txt.slice(i,i))
  // }
  var arr=new Array();
  for(var i=1;i<=4;i++){
    //读取二值化图像信息
    var imageInfo = GetGrayImageInfo("myCanvasSta"+i);
    if(imageInfo == null){
      window.alert("图像还没有转化为标准图像！");
      return;
    }
    //获取图像信息
    var canvasData = imageInfo[0];
    //获取图像的像素
    var pixels = canvasData.data;
    // console.log(PreProcess(pixels,20,30).join(""));
    // console.log(zimo[0].slice(3));
    // debugger;
    arr.push(PreProcess(pixels,20,30));
    //图片--->特征码
    //debugger;
    var rate = 0;
    var subCode = "";
    // console.log(PreProcess(pixels,20,30).join(""));
    // debugger;
    for (var j = 0; j < zimo.length; j++)
    {
        var subZimo = zimo[j].slice(0,1);
        //console.log(PreProcess(pixels,20,30));
        // console.log(zimo[j].slice(3).split(""));
        //2.3计算相似度
        var temp = CalcRate(zimo[j],PreProcess(pixels,20,30));
        //console.log(temp);
        if (temp > rate)
        {
            rate = temp;
            subCode = subZimo;
            // console.log(rate);
            // console.log(subCode);
        }
    }
    //console.log(subZimo);
    // debugger;
    ans+= subCode;
  }
  console.log(ans);
  // //2.0识别
  // if (list.Count > 0)
  // {
  //     //2.1读取字模
  //     string[] zimo = File.ReadAllLines(zimoPath);

  //     for (int i = 0; i < list.Count; i++)
  //     {
  //         //2.2图片--->特征码
  //         string code = GetBinaryCode(list[i]);
  //         int rate = 0;
  //         string subCode = "";
  //         for (int j = 0; j < zimo.Length; j++)
  //         {
          //     string[] subZimo = zimo[j].Split(new string[] { "--" }, StringSplitOptions.None);
          //     //2.3计算相似度
          //     int temp = CalcRate(code, subZimo[1]);
          //     if (temp > rate)
          //     {
          //         rate = temp;
          //         subCode = subZimo[0];
          //     }
          // }
  //         yanzhengma += subCode;

  //     }
  // }
  // return yanzhengma;       
}
//计算相似度
function CalcRate(t1, t2){
  var b1 = t1.slice(3).split("");
  var b2 = t2;
  if (b1.length > 0 && b2.length > 0){
    var cnt = 0;
    for (var i = 0; i < b2.length; i++)
    {
      if (b1[i]==b2[i])
      {
        cnt++;
      }
    }
    return cnt;
  }
  else
      return 0;
}