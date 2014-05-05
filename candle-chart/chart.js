/**
 * StockChart
 * @author : Bohyung kim (dsdgun@gmail.com) DSDSTUDIO.Inc 2013
 **/
;(function(W) {
"use strict";
// polyfills 
Date.now || ( Date.now = function () { return +new Date(); } );
if (!Array.prototype.forEach) {
	Array.prototype.forEach = function(fn, scope) {
		var i, l;
		for (i=0,l=this.length;i<l;++i) {
			if (i in this) fn.call(scope, this[i], i, this);
		}
	};
}
Array.prototype.min = function arrMin($f) {
	var i, o, min;
	i = this.length;
	while (i--) {
		o = this[i][$f];
		if ( !min ) min = o;
		min = min > o ? o : min;
	}
	return min;
};

Array.prototype.max = function arrMax($f) {
	var i, max;
	i = this.length, max = 0;
	while (i--) max = max < this[i][$f] ? this[i][$f] : max;
	return max;
};

function getDeviceRatio (context) {
	var backingStore = context.backingStorePixelRatio ||
	context.webkitBackingStorePixelRatio ||
	context.mozBackingStorePixelRatio ||
	context.msBackingStorePixelRatio ||
	context.oBackingStorePixelRatio ||
	context.backingStorePixelRatio || 1;
	return  (W.devicePixelRatio || 1) / backingStore;
}

function numberWithCommas(x) {
	if (!x || isNaN(x)) return "";
	var parts = x.toString().split("."); parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	return parts.join(".");
}

function rangeLoop($start,$end, $fn) { for (;$start<$end;$start++) $fn($start); }

/**
* canvas +1px render bug 방지
* 어느정도는 잡으나, 특정 케이스일때 아직까지 픽셀이 번져보이는 문제가 있음
*/
function cadapt($n) { return Math.floor($n) + .5; }

function init() {
	var conf = {
		"colortable":{
			"high":"#f00",
			"low":"#16f",
			"gline":"#ddd",
			"text":"#666",
			"fontStyle":"10px Helvetica",
			"avg":{ 5:"#f00", 20:"#fb3", 60:"#3c1" }
		}
	};
	var StockChart = function(c){
		var w,h,ratio;
		c = c.getContext("2d");
		ratio = getDeviceRatio(c);
		// for HiDPi devices 
		var r = (function canvasRenderer(c) {
			function rect($cc, $x, $y, $w, $h) {
				c.save();
					c.fillStyle = $cc;
					c.fillRect(cadapt($x), cadapt($y), cadapt($w), cadapt($h));
				c.restore();
			}
			function line($cc, $x, $y, $tx, $ty) {
				c.save();
					c.beginPath();
					c.moveTo(cadapt($x), cadapt($y));
					c.lineTo(cadapt($tx), cadapt($ty));
					c.strokeStyle = $cc;
					c.stroke();
				c.restore();
			}
			return { rect:rect, line:line };
		})(c);
		this.r = r;
		this.c = c;
		this.clear = function clear(w, h) {
			c.save();
			c.setTransform(1, 0, 0, 1, 0, 0);
			c.clearRect(0, 0, w, h);
			c.restore();
		};
		this.prepare = function prepare(w,h) {
			this.clear(this.w, this.h);
			var ratio = getDeviceRatio(c);
			if ( ratio > 1 ) {
				c.canvas.width = w * ratio;
				c.canvas.height = h * ratio;
				c.canvas.style.width = w + "px";
				c.canvas.style.height = h + "px";
				c.setTransform(ratio,0,0, ratio,0,0);
				// c.canvas.setAttribute("width",w);
				// c.canvas.setAttribute("height",h);
			}
			this.w = w;
			this.h = h;
		};
		this.getDeviceRatio = function () {
			var self = this;
			return getDeviceRatio(self.c);
		};
	};

	StockChart.prototype.render = function(d, start, end, l, posX, posY) {
		var max, min, vmax, vmin, dm, x, c, r, jio, w, h, self, rectInfo, i, n, o, color, olddw;
	    r = this.r;
		c = this.c;
		jio = d.blk;
		d = d.collections, d = d.slice(start, end);
		max = d.max("high"), min = d.min("low"), dm = max - min;
		vmax = d.max("jdiff_volume"), vmin = d.min("jdiff_volume");
		w = this.w - 54, h = this.h - 100;
		x = 0;
		self = this;
		rectInfo = {
			width:(w/l) * .8,
			border:(w/l) * .1,
			fullwidth:(w/l),
			half:(w/l) * .5
		};
		self.rectInfo = rectInfo;

		this.prepare(this.w, this.h);

		// 좌표계 보정, 보정 상태 저장
		c.save();	
		c.translate(0, 10);

		// guideline 
		var scaleRender = function () {
			var cy, hh, vv, v, txt;
			cy = h;
			hh = h / 3;
			vv = dm / 3;
			v = min;
			c.lineWidth = 2;
			r.line(conf.colortable.gline, 0, h, w, h);
			c.lineWidth = 1;
			r.line(conf.colortable.gline, w, 0, w, h);
			rangeLoop(0, 4, function(i) {
				txt = numberWithCommas(Math.round(v))
				r.line(conf.colortable.gline, 0, cy, w, cy);
				c.save();
					c.font = conf.colortable.fontStyle;
					c.fillStyle = conf.colortable.text;
					if (i) c.fillText(txt, (w + 54) - c.measureText(txt).width, cy + 5);
				c.restore();
				cy -= hh, v += vv;
			});
		};
		var volumeScaleRender = function(dm,min) {
			var cy,hh,vv,v,txt;
			min = min/1000, dm = dm/1000;
			cy = 0;
			hh = 80 / 3;
			vv = dm / 3;
			v = min;
			c.lineWidth=1;
			r.line(conf.colortable.gline, w, h, w, h + 90);
			// 좌표계 이동
			c.save();
			c.translate(0, h + 90);
			rangeLoop(0, 4, function(i) {
				var x = w + 54;
				txt = numberWithCommas(Math.round(v))
				r.line(conf.colortable.gline, 0, cy, w, cy);
				c.save();
					c.font = conf.colortable.fontStyle;
					c.fillStyle = conf.colortable.text;
					switch(i) {
						case 0:
							c.fillText("천주", x - c.measureText("천주").width, cy - 2);
							break;
						case 1:
						case 2:
							c.fillText(txt, x - c.measureText(txt).width, cy + 5);
							break;
						case 3:
							c.fillText("거래량", x - c.measureText("거래량").width, cy - 2);
							break;
					}
				c.restore();
				cy -= hh, v += vv;
			});
			c.restore();
		};

		// 오늘 금액 그리기 
		var tgView = (function todayGuideLineView(c,w,h,dm,max,jio) {
			var hh = h - (((dm - (max - jio["close"])) / dm) * h);
			var txt = numberWithCommas(jio["close"]);
			return {
				render: function() {
					c.save();
						r.line("#f0f", 0, hh, w, hh);
						c.fillStyle="#f0f";
						c.beginPath();
						c.moveTo(w,hh);
						c.lineTo(w+5, hh+5);
						c.lineTo(w+5, hh-5);
						c.lineTo(w,hh);
						c.closePath();
						c.fill();
						c.fillStyle="#f00";
						c.font=conf.colortable.fontStyle;
						c.fillRect(w+7, hh-7, c.measureText(txt).width + 2, 12);
						c.fillStyle="#fff";
						c.fillText(txt, w+7, hh+2);
					c.restore();
				}
			};
		})(c,w,h,dm,max,jio);

		var candleView = (function(max, min) {
			var dm = max-min;
			return { 
				render:function renderCandle(o,x) {
					var g = o["open"] < o["close"];
					var color = g ? conf.colortable.high : conf.colortable.low;
					var oh = ((dm - (max - o["open"])) / dm) * h;
					var ch = ((dm - (max - o["close"])) / dm) * h;
					var hh = ((dm - (max - o["high"])) / dm) * h;
					var lh = ((dm - (max - o["low"])) / dm) * h;
					var moveX=x + rectInfo.half, moveY=h - hh;
					var lineX=x + rectInfo.half, lineY=h - lh;
					var rectX=x + rectInfo.border, rectY=h - (g ? oh : ch);
					var rectWidth = rectInfo.width, rectHeight = g ? (h-ch) - (h-oh) : (h-oh) - (h-ch);
					r.line(color, moveX, moveY, lineX, lineY);
					r.rect(color, rectX, rectY, rectWidth, rectHeight);
				}
			};
		})(max, min);
		var volumeChartView = { 
			render:function(x, curVolume, beforeVolume) {
				var vh = 80;
				var height = (curVolume / vmax) * vh
				var g = !beforeVolume ? true : curVolume > beforeVolume;
				var color = g ? conf.colortable.high : conf.colortable.low;
				var dx = x + rectInfo.border;
				var dy = vh + 10 - height;
				c.save();
				c.translate(0, h);
				r.rect(color, dx, dy, rectInfo.width, height);
				c.restore();
			}
		};
		// 5, 20, 60일선
		var avgLineView = (function(){
			function r(avg) {
				var i,x,n,o;
				var v = {	
					render:function render(c,o,x,idx,avg) { 
						var k,dm,dh,y;
						k = "close_avg"+avg;
						dm = max - min;
						dh = ((dm - (max - o[k])) / dm) * h;
						y = h - dh;
						if ( y > h ) return;
						if (idx) c.lineTo(x,y)
						else c.moveTo(x,y);
					}
				};
				x = rectInfo.half;
				c.save();
				c.strokeStyle = conf.colortable.avg[avg];
				c.beginPath();
				for (i=0,n=l;i<n;i++) {
					o = d[i];
					if (o) v.render(c,o,x,i,avg);
					x += rectInfo.fullwidth;
				}
				c.stroke();
				c.restore();
			}
			return {
				render : function(){ 
					r(5), r(20), r(60);
				}
			};
		})();
		var avgLegend = (function avgLegend() {
			function renderAvg(avg,x) {
				var k = "close_avg" + avg;
				var o = d[d.length-1];
				var txt = avg + "(" + numberWithCommas(Math.round(o[k])) + ")";
				if ( !o[k] ) return;

				r.rect(conf.colortable.avg[avg], x, 1, 6, 6);
				c.font=conf.colortable.fontStyle;
				c.fillStyle=conf.colortable.avg[avg];
				c.fillText(txt, x + 10, 8);
				return x + 12 + c.measureText(txt).width
			}
			return {
				render: function() {
					c.save();
						c.translate(0,-10);
						var x = renderAvg(5,0);
						x = renderAvg(20,x);
						x = renderAvg(60,x);
					c.restore();
				}
			};
		})();

		// 호스트코드 
		scaleRender();
		volumeScaleRender(vmax-vmin, vmin);
		avgLineView.render();
		avgLegend.render();
		d.forEach(function(o, i, d) {
			if ( !o ) {
				x+= rectInfo.fullwidth;
				return;
			}
			candleView.render(o,x);
			if ( i % 20  === 0 ) {
				var dx = x - (c.measureText(o["date"]).width *.5);
				if ( dx > 0 ) { 
					c.save();
					c.font = conf.colortable.fontStyle;
					c.fillStyle = conf.colortable.text;
					c.fillText(o["date"], dx, h + 10);
					c.restore();
					r.line(conf.colortable.gline, x, 0, x, h);
				}
			}
			volumeChartView.render(x, o["jdiff_volume"], d[i-1] && d[i-1]["jdiff_volume"]);
			x+= rectInfo.fullwidth;
		});
		// scale 영역 내일때만 현재가를 표시한다. 
		if ( jio["close"] < max  && jio["close"] > min ) tgView.render();

		// 상세보기모드일때 
		// TODO api call 시 판단 flag 를 둬야할듯
		if ( posX || posY ) {
			posY -= (64*this.getDeviceRatio(c));
			(function(){
				var x, y, txt, color, oidx,o, data;
				if ( posX > w ) return; 
				x = w - posX > 150 ? w - 150 : 0, y = 0;
				oidx = Math.round(posX / rectInfo.fullwidth), oidx = isNaN(oidx) ? end : oidx;
				o = d[oidx];
				data = [ 
					{label :"날짜",text:o["date"]}, 
					{label :"시가",text:numberWithCommas(o["open"]) + "원"}, 
					{label :"고가",text:numberWithCommas(o["high"]) + "원", color:conf.colortable.high}, 
					{label :"저가",text:numberWithCommas(o["low"]) + "원", color:conf.colortable.low}, 
					{label :"종가",text:numberWithCommas(o["low"]) + "원"}, 
					{label :"거래량",text:numberWithCommas(Math.round(o["jdiff_volume"]/1000)) +"천주"},
					{label:"5일", text:numberWithCommas(Math.round(o["close_avg5"])), color:conf.colortable.avg[5] },
					{label:"20일", text:numberWithCommas(Math.round(o["close_avg20"])), color:conf.colortable.avg[20] },
					{label:"5일", text:numberWithCommas(Math.round(o["close_avg60"])), color:conf.colortable.avg[60] }
				];
				function render(x,y,data) {
					r.rect("rgba(0, 0, 0, 0.8)", x, y, 150, 150);
					c.save();
					c.font = conf.colortable.fontStyle;
					data.forEach(function(o,i,data) {
						if ( !o["text"] ) return;
						c.fillStyle = o["color"] || "#fff";
						c.fillText(o["label"], x + 2, y += 12);
						c.fillText(o["text"], x + 42 + (43.75 - c.measureText(o["text"]).width), y);
					});
					c.restore();
				}
				render(x,y, data);
			})();
		}
		// 전체에 상대좌표 transform(0,10) 먹여둔것 해제
		c.restore();
	};
	W["StockChart"] = StockChart;
}
init();

})(this);
