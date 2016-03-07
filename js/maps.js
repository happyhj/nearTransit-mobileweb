

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
	
	Maps.prototype.setCenter = function(position) {
		if(!position) return;
		if(!this.oMap) {
			this.oMap = new google.maps.Map(this.$map[0], {
				center: {lat: position.latitude, lng: position.longitude},
				zoom: 16,
				disableDefaultUI: true,
				noClear: true
			});
			this.initEvents();
		} else {
			this.oMap.panTo({
				lat: position.latitude,
				lng: position.longitude
			});			
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
		
		// there is 'load' event
		imagesLoaded( this.$map[0], function() {
			$(self).trigger('load');
		});

		this.oMap.addListener('dragend', function() {
			var center = self.oMap.getCenter();			
			$(self).trigger('dragend', [{
				latitude : center.lat(),
				longitude : center.lng()
			}]);
		});

		this.oMap.addListener('dragstart', function() {
			$(self).trigger('dragstart');
		});


/*
		this.oMap.addListener('idle', function() {
			console.log("idle");
		});	
*/	
		
			
	
/*
				getCurrentCenterAddress(map, {
				    success: function(address){
					    $('.query').html(address);
				    }
				});
*/
			/*		
		this.oMap.attach("move", function(data){
			$(self).trigger('move', data.center);
		});
		
		this.oMap.attach("dragstart", function(data){
			$(self).trigger('dragstart', data.point);
		});

		this.oMap.attach("dragend", function(data){
			$(self).trigger('dragend', data.point);
		});
		*/
	};

	Maps.prototype.dimCenter = function () {
		this.$center.css("opacity", 0.6);
	};

	Maps.prototype.undimCenter = function () {
		this.$center.css("opacity", 1);
	};

	Maps.prototype.pinCenter = function () {
		//this.$center.css("opacity", 1);
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
}(window));