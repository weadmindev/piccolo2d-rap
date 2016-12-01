// fish eye calendar component
;(function(cxt){
	var FishEyeCalendar = function(){
	    this.init.apply(this, arguments);
	};
	FishEyeCalendar.prototype = {
	    /**
	     *options: {

	     	 }
	     */
	    init: function(options){
        this.zr = null;
        this.width=0;
        this.height=0;
        this.xBoxNum = 7; //the number of days of one week.
        this.yBoxNum = 6;  //the number of row of one month.
        this.boxWidthEnlargeRatio = 0.6;
        this.boxHeightEnlargeRatio = 0.6;
        this.year = options.year;
        this.month = options.month;
        this.basePath = options.basePath;
				this.container = options.container;
				this.dataObj = options.dataObj;
        this.detailContainer = options.detailContainer; //dom container of detail chart
        this.xStart = options.xStart || 10;  //鏁翠釜鍥惧舰鐨剎璧风偣銆�
        this.yStart = options.yStart || 50; //鏁翠釜鍥惧舰鐨剏璧风偣
        this.enlargeBox = {xIndex:-1,yIndex:-1}; //
				this.headerTextList = []; //
				this.leftTopPointArr = []; //the left and top point of each box ,and the day number of the month.
				this.animationTime = 1000; // millisecond.
				this.echarts = null;  //
				this.detailCurveCharts = null;
				this.todayDate = new Date();
				this.todayIndex = {xIndex:-1,yIndex:-1};
        this.initPathsConfig();
        this.initElement();
	    },
      initPathsConfig:function(){
        var _this = this;
        require.config({
            paths:{
							zrender:this.basePath+'zrender',
							echarts:this.basePath+'echarts.min',
                'echarts/component/tooltip':this.basePath+'echarts.min',
								'echarts/chart/line':this.basePath+'echarts.min',
								'echarts/component/legend':this.basePath+'echarts.min',
								'echarts/component/grid':this.basePath+'echarts.min',
								'echarts/component/dataZoomInside':this.basePath+'echarts.min',
                'zrender/shape/Rectangle' : this.basePath+'zrender',
                'zrender/shape/Line' : this.basePath+'zrender',
                'zrender/shape/Text' : this.basePath+'zrender'
            }
        });
      },
	    initElement:function(){
        var _this = this;
        require(['zrender',
            'zrender/shape/Rectangle',
            'zrender/shape/Line',
            'zrender/shape/Text',
						'echarts',
            'echarts/chart/line',
            'echarts/component/legend',
            'echarts/component/grid',
            'echarts/component/tooltip'
          ],function(zrender,RectangleShape,LineShape,TextShape,echarts) {
								_this.echarts = echarts;
                _this.zr = zrender.init(_this.container);
                _this.color = require('zrender/tool/color');
                _this.guid = require('zrender/tool/guid');
                _this.RectangleShape = RectangleShape;//require('zrender/shape/Rectangle');
                _this.LineShape = LineShape;//require('zrender/shape/Line');
                _this.TextShape = TextShape;//require('zrender/shape/Text');
                var colorIdx = 0;
                var color=_this.color;
                var guid=_this.guid;
                var zr=_this.zr,xBoxNum = _this.xBoxNum, yBoxNum = _this.yBoxNum;
                var xStart=_this.xStart,yStart=_this.yStart;
                _this.initParamsConfig();
								_this.initCalendarHeader();

								_this.detailCurveCharts = new DetailCurveCharts({
										dataObj:_this.dataObj,
										xBoxNum:_this.xBoxNum,
										yBoxNum:_this.yBoxNum,
										xStart:_this.xStart,
										yStart:_this.yStart,
										width:_this.width,
										height:_this.height,
										zrender:zrender,
										echarts:echarts,
										container:_this.detailContainer,
										enlargeBox:_this.enlargeBox,
										firstDayWeekIndex:_this.firstDayWeekIndex,
										todayIndex:_this.todayIndex,
										leftTopPointArr:_this.leftTopPointArr,
										refreshAllOnClick:function(clickXIndex,clickYIndex){
											_this.refreshAllOnClick(clickXIndex,clickYIndex);
										}
									});
								// _this.detailCurveCharts.setPosition(_this.leftTopPointArr,true);
								_this.addEvent();
                _this.zr.render(function(){
                  // after render callback!!
                });
            }
        )
	    },
			initParamsConfig:function(){
        this.width = Math.ceil(this.zr.getWidth())-10;
        this.height = Math.ceil(this.zr.getHeight())-10;
				this.updateParamsAboutSize();
        this.updateparamsAboutDate();
				this.setCoordinateAndDayNum();
				this.detailContainer.setAttribute('id','detailChartContainers');
				this.detailContainer.style.position = 'absolute';
				// this.detailContainer.style.border = 'solid 1px #7848F1';
				this.detailContainer.style.width = (this.width-this.xStart)+'px';
				this.detailContainer.style.height = (this.height-this.yStart)+'px';
				this.detailContainer.style.left = this.xStart+'px';
				this.detailContainer.style.top = this.yStart+'px';
      },
			updateParamsAboutSize:function(){
				this.enlargeBoxWidth = (this.boxWidthEnlargeRatio * this.width); //the width of the enlarged box
        this.enlargeBoxHeight = (this.boxHeightEnlargeRatio * this.height); //the height of the enlarged box
        this.xDivision = ((this.width-this.xStart)/this.xBoxNum);
        this.yDivision = ((this.height-this.yStart)/this.yBoxNum);
        this.xDivisionHasEnlarge = ((this.width-this.enlargeBoxWidth-this.xStart)/this.xBoxNum);
        this.yDivisionHasEnlarge = ((this.height-this.enlargeBoxHeight-this.yStart)/this.yBoxNum);
			},
			updateparamsAboutDate:function(){
				this.prevMonthDays = this.getSumDaysOfMonth(this.year,this.month-1); //the total number of days of one month.
				this.monthDays = this.getSumDaysOfMonth(this.year,this.month); //the total number of days of one month.
        this.firstDayWeekIndex = this.getWeekDayByDate(this.year,this.month,1); //the first day of one month is day of the week.
			},
			setCoordinateAndDayNum:function(){
				var todayInFlag = '';
				var todayNum = this.todayDate.getDate();
				if(this.todayDate.getFullYear() == this.year){
					if(this.todayDate.getMonth() == this.month-1){
						todayInFlag = 'current';
					}else if(this.todayDate.getMonth()-(this.month-1) ==1){ //今天所在月份如果只比当前显示的月份大一个月，则表示今天就在next month.
						todayInFlag = 'next';
					}
				}
				var i=0,j=0,days=0,dayObj={};
        for(i = 0; i < this.yBoxNum; i++) {
          this.leftTopPointArr.push([]);
          for(j=0;j< this.xBoxNum;j++){
						dayObj = this.getBoxNumText(i,j,days);
						days = dayObj.flag=='current'? dayObj.text : days;
						if(todayInFlag==dayObj.flag && todayNum==dayObj.text ){ //判断今天是否在当前显示日历里。
							this.todayIndex = {xIndex:i,yIndex:j};
						}
            this.leftTopPointArr[i][j] = {
							x:this.getBoxXStart(j),
							y:this.getBoxYStart(i),
							flag:dayObj.flag,
							text:dayObj.text
						};
          }
        }
				console.log("leftTopPointArr0000:",this.leftTopPointArr);
			},
			initCalendarHeader:function(){
				var firstRowPointArr = this.leftTopPointArr[0];
				var calendarHeaderDescArr = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
				for(var i = 0; i < firstRowPointArr.length; i++){
					var endPoint = (i==firstRowPointArr.length-1) ? this.width : firstRowPointArr[i+1]['x'];
					var offsetX = (endPoint-firstRowPointArr[i]['x'])/2;
					this.headerTextList[i] = this.drawTextShape({
						x:firstRowPointArr[i]['x'] + offsetX,
						y:firstRowPointArr[i]['y']-15,
						text: calendarHeaderDescArr[i],
						textAlign:'center',
						textFont:'normal 14px verdana'
					});
					this.zr.addShape(this.headerTextList[i]);
				}
			},
      addEvent:function(){
				var _this = this;
				this.zr.on('click', function(params) {
					// _this.zr.refresh();
				});
      },
			getBoxNumText:function(i,j,days){ //get the day number in some box.
				if(i==0 && this.firstDayWeekIndex>j){
					return {flag:'prev',text:this.prevMonthDays-this.firstDayWeekIndex+j+1};
				}
				if((i==0 && this.firstDayWeekIndex<=j) || (i!=0 && days < this.monthDays)){
					return {flag:'current',text:i*this.xBoxNum+j-this.firstDayWeekIndex+1};
				}
				if(i!=0 && days >= this.monthDays){
					return {flag:'next',text:i*this.xBoxNum+j+1-this.firstDayWeekIndex-this.monthDays};
				}
				return {flag:'',text:''};
			},
			setEnlargeBoxIndex:function(xIndex,yIndex){ //set the xIndex and yIndex of being enlarged box
				if(xIndex == this.enlargeBox.xIndex && yIndex == this.enlargeBox.yIndex){ //鍒ゆ柇鏄惁鏄偣鍑荤殑褰撳墠姝ｅ湪鏀惧ぇ鐨勯偅涓柟妗�
					this.enlargeBox.xIndex = -1;
					this.enlargeBox.yIndex = -1;
				}else{
					this.enlargeBox.xIndex = xIndex;
					this.enlargeBox.yIndex = yIndex;
				}
			},
      hasEnlargeBox:function(){ //Whether has the enlarged box.
        return (this.enlargeBox.xIndex >= 0 && this.enlargeBox.yIndex >= 0) ? true : false;
      },
      getBoxXStart:function(index){ //get the box x axis start point by box index.
        var boxXStart = 0;
        if(this.hasEnlargeBox()){
          if(index <= this.enlargeBox.yIndex){
            boxXStart = this.xDivisionHasEnlarge*index+this.xStart;
          }else{
            boxXStart = this.xDivisionHasEnlarge*index+this.xStart+this.enlargeBoxWidth;
          }
        }else{
          boxXStart = this.xDivision*index+this.xStart;
        }
        return boxXStart;
      },
      getBoxYStart:function(index){ //寰楀埌灏忔柟妗嗙殑y杞寸殑璧风偣銆�
        var boxYStart = 0;
        if(this.hasEnlargeBox()){
          if(index <= this.enlargeBox.xIndex){
            boxYStart = this.yDivisionHasEnlarge*index+this.yStart;
          }else{
            boxYStart = this.yDivisionHasEnlarge*index+this.yStart+this.enlargeBoxHeight;
          }
        }else{
          boxYStart = this.yDivision*index+this.yStart;
        }
        return boxYStart;
      },
			refreshAllOnClick:function(clickXIndex,clickYIndex){
				var _this = this;
				_this.setEnlargeBoxIndex(clickXIndex,clickYIndex);
				_this.refreshTextShape();
				_this.detailCurveCharts.setPosition(_this.leftTopPointArr);
			},
			refreshTextShape:function(){
				var _this = this;
				var i=0, j=0, days=0, dayObj={flag:'',text:''};
				for(i = 0; i < this.yBoxNum; i++) {  //update the box x and y coordinate point.
					for(var j=0;j< this.xBoxNum;j++){
						dayObj = this.getBoxNumText(i,j,days);
						days = dayObj.flag=='current'? dayObj.text : days;
						this.leftTopPointArr[i][j]['x'] = this.getBoxXStart(j);
						this.leftTopPointArr[i][j]['y'] = this.getBoxYStart(i);
						this.leftTopPointArr[i][j]['flag'] = dayObj.flag;
						this.leftTopPointArr[i][j]['text'] = dayObj.text;
					}
				}
				//refresh calendar header's position of week text.
				var firstRowPointArr = this.leftTopPointArr[0];
				for(i = 0; i < firstRowPointArr.length; i++){
					var endPoint = (i==firstRowPointArr.length-1) ? this.width : firstRowPointArr[i+1]['x'];
					var offsetX = (endPoint-firstRowPointArr[i]['x'])/2;
					var xPoint = firstRowPointArr[i]['x'] + offsetX;
					(function(index,xPoint,animationTime){
						var headerText = _this.headerTextList[index];
						_this.zr.animate(headerText.id,'style').when(animationTime,{
							x:xPoint
						}).start();
					})(i,xPoint,_this.animationTime);
				}
			},
			updateCalendarByDateAndData:function(year,month,dataObj){  //change the calendar shape by change the year/month and data.
				this.dataObj = dataObj;
				this.year = +year;
				this.month = +month;
				this.enlargeBox.xIndex = -1;
				this.enlargeBox.yIndex = -1;
				this.updateparamsAboutDate();
				this.refreshTextShape();
				this.detailCurveCharts.setPosition(this.leftTopPointArr,dataObj);
			},
			refreshBySize:function(size){
				size.width = size.width<800 ? 800 : size.width;
				size.height = size.height<400 ? 400 : size.height;
				this.width = size.width-10;
				this.height = size.height-10;
				this.updateParamsAboutSize();
				this.refreshTextShape();
				this.detailCurveCharts.updateOptions({
					width:this.width,
					height:this.height
				});
				this.detailContainer.style.width = (this.width-this.xStart)+'px';
				this.detailContainer.style.height = (this.height-this.yStart)+'px';
				this.detailCurveCharts.setPosition(this.leftTopPointArr);
			},

			// draw the base line shape.
			drawLineShape:function(config){
				return new this.LineShape({
						id : this.guid(),
						style : {
							xStart:config.xStart,
							yStart:config.yStart,
							xEnd:config.xEnd,
							yEnd:config.yEnd,
							strokeColor: this.color.getColor(5),
							lineType :'solid',
							zlevel:1,
							lineWidth:1
						}
				});
			},
      drawTextShape:function(config){
        return new this.TextShape({
					hoverable : false,
          style:{
            x:config.x,
            y:config.y,
            color:'blue',
            text:config.text,
            textAlign:config.textAlign || 'left',
						textFont:config.textFont||null,
						// brushType:'stroke',
						// strokeColor:'red',
            textBaseLine:'bottom'
          },
          // hoverable:true,
          zlevel:2
        });
      },
      drawRectangleShape:function(config){
				var _this=this;
				return new this.RectangleShape({
					clickable : true,
					// hoverable:false,
            style : {
                x : config.x,
                y : config.y,
                width : config.width,
                height: config.height,
								text:config.text,
                brushType : 'stroke',
                // color : 'white',
								lineWidth : 1,
                strokeColor : '#7848F1',
                // lineJoin : 'round',
                zlevel:3
            },
						highlightStyle:{
							shadowBlur:1,
							shadowColor:'#DAA520',
							lineWidth : 0.7,
	            strokeColor : '#FFD700'
	          },
            draggable : false
        });
      },
      //鏍规嵁鏌愬勾鏌愭湀鏌愭棩绠楀嚭杩欏ぉ鏄槦鏈熷嚑銆傛瘡鍛ㄤ粠鍛ㄦ棩寮�濮嬶紝绱㈠紩index涓�0.
      getWeekDayByDate:function(year,month,day){
        var w=0,y=0,c=0,m=0,d=0;
        if(month<3){
          m = month + 12;
          year = year-1;
        }else{
          m = month;
        }
        y = (year%100);
        c = parseInt(year/100);
        d = day;
        w=y+(y/4)+(c/4)-2*c+(26*(m+1)/10)+d-1;
        return w<0 ? (7+w) : Math.floor(w%7)%7;
      },
      getSumDaysOfMonth:function(year,month){ //鑾峰彇鏌愬勾鏌愭湀鐨勫綋鏈堟�诲ぉ鏁般
        var  tempDate = new Date(year,month,0);
        return tempDate.getDate();
      }


	};
	cxt.FishEyeCalendar = FishEyeCalendar;
})(window);
