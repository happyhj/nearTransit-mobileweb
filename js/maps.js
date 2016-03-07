

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
	function Maps(container) {
		
/*
 		var latitude = (position && position.latitude) || 37.3595913;
 		var longitude = (position && position.longitude) || 127.105179;
 	
*/	 		
//        var oPoint = new nhn.api.map.LatLng(position.coords.latitude, position.coords.longitude); 
		this.oMap;


        var self = this;
        this.$map = $(container);
        this.$center = $('.center');        
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

		this.initSpring();
	}	
	
	Maps.prototype.setCenter = function(position, isMylocation) {
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
	
	Maps.prototype.initSpring = function () {
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
		this.$center.data('spring', spring);	
	};
	
	Maps.prototype.initEvents = function () {
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

		naver.maps.Event.addListener(this.oMap, 'drag', function(e) {
			console.log('drag')
		});

		naver.maps.Event.addListener(this.oMap, 'dragend', function(e) {
			console.log('dragend')
			self.moveendTracker.touchEnded();
		});
	};

	Maps.prototype.dimCenter = function () {
		this.$center.css("opacity", 0.6);
		this.$center.removeClass('mylocation');
		$(".compass").addClass('ready');		
	};

	Maps.prototype.undimCenter = function () {
		this.$center.css("opacity", 1);
	};

	Maps.prototype.pinCenter = function () {
		this.$center.data('spring').setCurrentValue(-1);
		this.$center.data('spring').setEndValue(0);
	};
			
	Maps.prototype.render = function (viewCmd, parameter) {
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
	window.app.Maps = Maps;
	
	

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