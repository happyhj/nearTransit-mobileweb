(function (window) {
	'use strict';

	function Model(api) {
		this.api = api;
		this._data = {};
	}
	
	Model.prototype.update = function (updateCmd, parameter, callback) {
		var self = this;
		var updateCommands = {
			position: function() {
 				if(!parameter) {				
					// 위치값이 주어지지 않은 경우 브라우저에서 현재위치를 받아온 뒤에 저장하고 callback을 실행한다.
					navigator.geolocation.getCurrentPosition(function(position){
						self._data[updateCmd] = {
							latitude: position.coords.latitude,
							longitude: position.coords.longitude
						};
						self.api.saveLocation(self._data[updateCmd], function(location) {
							self._data[updateCmd].location = location;
							self._data[updateCmd].longitude = location.xpos;
							self._data[updateCmd].latitude = location.ypos;
							
							callback(self._data[updateCmd]);				
						});
					});					
				} else {
					// 위치 값이 주어진 경우 가져온 위치값 사용 
					self._data[updateCmd] = parameter;
					self.api.saveLocation(self._data[updateCmd], function(location) {
						self._data[updateCmd].location = location;
							console.log(self._data[updateCmd])
						callback(self._data[updateCmd]);				
					});
				}
			},
			transitInfo: function() {
				self.api.getTransitInfo(function(transitInfo) {
					// 현재 좌표와 비교해서 가까운 순으로  재정렬한다.
					var info = JSON.parse(JSON.stringify(transitInfo));
					info.sort(function(a, b) {
						var position = {
							x: self.getPosition().longitude,
							y: self.getPosition().latitude
						};
						
						function getDistance(a, b) {
							var a_ = JSON.parse(JSON.stringify(a));
							var b_ = JSON.parse(JSON.stringify(b));
							return Math.sqrt( (b_.x-=a_.x)*b_.x + (b_.y-=a_.y)*b_.y );
						}

						return getDistance(position, a.stationInfo) - getDistance(position, b.stationInfo);
					});
					self._data['transitInfo'] = info;
					callback(self._data['transitInfo']);		
				});
			}
		};	
		updateCommands[updateCmd]();
	};

	Model.prototype.getPosition = function () {
		return this._data.position;
	}
	
	Model.prototype.setPosition = function (position) {
		this._data.position = position;
	}

	Model.prototype.getCurrentCenterAddress = function (callback) {
		var geocoder = new google.maps.Geocoder;
		 
		var latlng = {lat: this._data.position.latitude, lng: this._data.position.longitude};

		geocoder.geocode({'location': latlng}, function(results, status) {
			if (status === google.maps.GeocoderStatus.OK) {
				if (results[1]) {
					callback(results[1].formatted_address.split(' ').splice(2).join(' '));
				} else {
					window.alert('No results found');
  				}
		    } else {
		      window.alert('Geocoder failed due to: ' + status);
		    }
		});				
	}
		
	// Export to window
	window.app = window.app || {};
	window.app.Model = Model;
}(window));
