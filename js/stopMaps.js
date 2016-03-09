

/*global qs, qsa, $on, $parent, $delegate */

(function (window) {
	'use strict';
  
	/**
	     * View that abstracts away the browser's DOM completely.
	     * It has two simple entry points:
	     *
	     *   - bind(eventName, handler)
	     *     Takes a todo application event and registers the handler
	     *   - render(command, parameterObject)
	     *     Renders the given command with the options
	     */
	function StopMaps(container) {
		
/*
 		var latitude = (position && position.latitude) || 37.3595913;
 		var longitude = (position && position.longitude) || 127.105179;
 	
*/	 		
//        var oPoint = new nhn.api.map.LatLng(position.coords.latitude, position.coords.longitude); 
		this.oMap;
		this._aStopMarker = [];
        var self = this;
        this.$map = $(container);
 /*
 //       nhn.api.map.setDefaultPoint('LatLng');


        this.oMap = new nhn.api.map.Map('map' ,{
            point : oPoint,
            zoom : 10,
            enableWheelZoom : true,
            enableDragPan : true,
            enableDblClickZoom : false,
            mapMode : 0,
            activateTrafficMap : false,
            activateBicycleMap : false,
            minMaxLevel : [ 1, 14 ],
            size : new nhn.api.map.Size($(window).innerWidth(), $(window).innerHeight())
	    });
*/

//		this.initSpring();
	}	
	StopMaps.prototype.destroyMap = function() {
		this.isNeedToRefesh = true;
		console.log("destroyMap",this.isNeedToRefesh, this)
		//this.$map.html('');
		//this.oMap.destroy();
	};
	StopMaps.prototype.renderMap = function(stopInfo) {
		console.log("[StopMaps.prototype.render]" , stopInfo);
				
		// 현재 위치 와 stop 정보를 둘다 넘겨준다.
//			var oPosition = new naver.maps.LatLng(stopInfo.currunt.position.latitude, stopInfo.currunt.position.longitude);
		var bound = new naver.maps.LatLngBounds(
		    new naver.maps.LatLng(stopInfo.y, stopInfo.x),
		    new naver.maps.LatLng(stopInfo.currunt.position.latitude, stopInfo.currunt.position.longitude)
		);
		console.log("this.isNeedToRefesh", this.isNeedToRefesh);
		if(!this.oMap) {
			this.oMap = new naver.maps.Map(this.$map[0], {
			    center: new naver.maps.LatLng(stopInfo.y, stopInfo.x),
			    bounds: bound,
			    zoom: 11,
			    disableKineticPan: false,
			    minZoom: 3,
			    maxZoom: 12
			});			
		} else if(!!this.isNeedToRefesh) {
			this.oMap.fitBounds(bound, { top: 60, right: 30, bottom: 30, left: 10 } );
			this.isNeedToRefesh = false;	
		} else {
			var oPosition = new naver.maps.LatLng(stopInfo.y, stopInfo.x);
			//this.oMap.morph(bound); // 중심 좌표 이동
			// panToBounds // fitBounds
			this.oMap.panToBounds(bound, { top: 60, right: 30, bottom: 30, left: 10 } );
		}
		
		this._aStopMarker.forEach(function(marker){
			marker = undefined;
		});
		
		this._aStopMarker.forEach(function(marker){
			marker.setVisible( false );
		});

		var minHtml = ''
		if(stopInfo.minutes !== null) {
			var minHtml = (typeof stopInfo.minutes === 'object') ? stopInfo.minutes.minutes : stopInfo.minutes;
			var stopName = stopInfo.stationName;
	
			var hhmm = (new Date()).HHMM();
			var hhmm_min = parseInt(hhmm.substr(0,2)) * 60 + parseInt(hhmm.substr(2,2)) + parseInt(minHtml);
			hhmm = String(parseInt(hhmm_min / 60)) + String(hhmm_min % 60) ;		
			minHtml = hhmm.substr(0,2)+':'+ hhmm.substr(2,2) +'('+minHtml+'분 후)에 출발'
		} else {
			minHtml = '도착정보 없음';
		}

		// morph 애니메이션이 끝나고 마커가 세팅되도록 하자
		
		var oStopMarker = new naver.maps.Marker({
		    position: new naver.maps.LatLng(stopInfo.y, stopInfo.x),
		    map: this.oMap,
		    icon: {
		        content: '<div class="stopMarker" style="background-color:'+$('.stopMapView .nav').css('background-color')+'"></div>'
		        	+ '<div class="stopNameContainer"><div class="stopName">'+stopName+'</div><div class="min">'+minHtml +'</div></div>'
		        //size: new naver.maps.Size(22, 35),
		    }
		});
		
		// 현재 위치 마커도 세팅한다
		var oCurruntMarker = new naver.maps.Marker({
		    position: new naver.maps.LatLng(stopInfo.currunt.position.latitude, stopInfo.currunt.position.longitude),
		    map: this.oMap,
		    icon: {
		        content: '<div class="curruntPositionMarker" style="background-color:'+$('.center').css('background-color')+'"></div>'
		    }
		});		
		
		this._aStopMarker.push(oStopMarker);
		this._aStopMarker.push(oCurruntMarker);
		
		// 지도 위에 현재위치 (보라 or 파랑) 와 정류소 위치 ( 테마색 ) 를 표시한다
		
		// 정류소 위치 위에는 "역 이름과, 몇 분후 도착" 이라는 안내 툴팁을 띄운다. 
				
	};	
	
	StopMaps.prototype.setCenter = function(position, isMylocation) {
		if(!position) return;
		if(!this.oMap) {
			this.oMap = new naver.maps.Map(this.$map[0], {
			    center: new naver.maps.LatLng(position.latitude, position.longitude),
			    zoom: 11,
			    disableKineticPan: false,
			    minZoom: 3,
			    maxZoom: 12
			});

			this.initEvents();
		} else {
			var oPosition = new naver.maps.LatLng(position.latitude, position.longitude);
			this.oMap.morph(oPosition, 11); // 중심 좌표 이동
		}
		
		// isMylocation 에 따라 DOT 의 색상을 바꾼다.
		if(isMylocation) {
			this.$center.addClass('mylocation');
			$(".compass").removeClass('ready');					
		} else {
			this.$center.removeClass('mylocation');
			$(".compass").addClass('ready');			
		}
	};
	
	StopMaps.prototype.initSpring = function ($el) {
		var self = this;
		var springSystem = new rebound.SpringSystem();
		var spring = createSpring(springSystem, 80, 6);
		spring.addListener({
			el: null,
			onSpringUpdate: function(spring) {
				var val = spring.getCurrentValue();
				val = mapValueFromRangeToRange(val, 0, -1, 1, 0.5);
				self.$center.css('zoom', val);
				self.$center.css('margin-top', self.$center.attr('data-margin-top')+'px');
			}
		});
		$el.data('spring', spring);	
	};
	
	StopMaps.prototype.initEvents = function () {
		var self = this;
		
        this.moveendTracker = new MoveendTracker($('#map > div:first > div > div'), function(){
	        console.log("moveend!!");
			var center = self.oMap.getCenter();			
			$(self).trigger('dragend', [{
				latitude : center.lat(),
				longitude : center.lng()
			}]);
        });

		// there is 'load' event
		imagesLoaded( this.$map[0], function() {
			$(self).trigger('load');
		});

		naver.maps.Event.addListener(this.oMap, 'dragstart', function(e) {
			$(self).trigger('dragstart');
			console.log('dragstart')
			self.moveendTracker.touchStarted();
		});
/*
		naver.maps.Event.addListener(this.oMap, 'drag', function(e) {
			console.log('drag')
		});
*/
		naver.maps.Event.addListener(this.oMap, 'dragend', function(e) {
			console.log('dragend')
			self.moveendTracker.touchEnded();
		});
	};

	StopMaps.prototype.dimCenter = function () {
		this.$center.css("opacity", 0.6);
		this.$center.removeClass('mylocation');
		$(".compass").addClass('ready');		
	};

	StopMaps.prototype.undimCenter = function () {
		this.$center.css("opacity", 1);
	};

	StopMaps.prototype.pinCenter = function () {
		this.$center.data('spring').setCurrentValue(-1);
		this.$center.data('spring').setEndValue(0);
	};
			
	StopMaps.prototype.render = function (viewCmd, parameter) {
		var self = this;
		var viewCommands = {
			showEntries: function () {
				self.$todoList.innerHTML = self.template.show(parameter);
			},
			removeItem: function () {
				self._removeItem(parameter);
			},
			dimmCenter: function () {
				
			}
		};

		viewCommands[viewCmd]();
	};
	
	// Export to window
	window.app = window.app || {};
	window.app.StopMaps = StopMaps;
	
	

	function MoveendTracker(element, callback) {
		this.element = element;	
		this.callback = callback;
		this._matrix;
		this.moveEndTimer;
	}
	
	MoveendTracker.prototype.touchEnded = function() {
		this._matrix = $(this.element).css("transform");
		this.setMoveendObserver();
	};
	
	MoveendTracker.prototype.touchStarted = function() {
		this._matrix = null;
		clearInterval(this.moveEndTimer);
	};
	
	MoveendTracker.prototype.setMoveendObserver = function() {
		var self = this;
		this.moveEndTimer = setInterval(function() {
			var newTransform =  $(self.element).css("transform");
			if(self._matrix === newTransform) {
				// 이벤트를 트리거하고 타이머를 없앤다
				clearTimeout(self.moveEndTimer);
				self.callback(); // 인자로 맵의 중앙 좌표를 넘긴다.
			} else {
				self._matrix = newTransform;
			} 
		}, 100);
	};	
	
}(window));