(function (window) {
	'use strict';

    Date.prototype.YYYYMMDDHHMMSS = function () {
        var yyyy = this.getFullYear().toString();
        var MM = pad(this.getMonth() + 1,2);
        var dd = pad(this.getDate(), 2);
        var hh = pad(this.getHours(), 2);
        var mm = pad(this.getMinutes(), 2)
        var ss = pad(this.getSeconds(), 2)

	    function pad(number, length) {
	        var str = '' + number;
	        while (str.length < length) {
	            str = '0' + str;
	        }
		    return str;
	    }
        return yyyy + MM + dd+  hh + mm + ss;
    };
 
     Date.prototype.HHMM = function () {
        var hh = pad(this.getHours(), 2);
        var mm = pad(this.getMinutes(), 2)

	    function pad(number, length) {
	        var str = '' + number;
	        while (str.length < length) {
	            str = '0' + str;
	        }
		    return str;
	    }
        return hh + mm;
    };
       
	function Api() {
		this._jsonp_idx = 0;
	}

	$.ajaxPrefilter( function( options, originalOptions, jqXHR ) {
	  options.crossDomain ={
	    crossDomain: true
	  };
	  options.xhrFields = {
	    withCredentials: true
	  };
	});

	// 이 요청은 자주 호출하면 서버가 죽으므로, 자주 하지 않도록 한다.
	Api.prototype.saveLocation = function (position, callback) {
		var locationCache = JSON.parse(sessionStorage.getItem("locationCache"));

		if(locationCache === "null") locationCache = null;

		var isChanged = locationCache && !(locationCache.xpos === position.longitude && locationCache.ypos === position.latitude);

		if(!locationCache || isChanged) {
			$.ajax({
				type: 'GET',
				url: "/api/setLocationInfoAjax.nhn?lat="+position.latitude+"&lng="+position.longitude,
				cache: false,
				success: function(data, status, xhr) {
					var location = JSON.stringify(JSON.parse(data).result.location.currentLocation);
					if(location !== "null") {
						sessionStorage.setItem("locationCache", location);

						callback(JSON.parse(location));
					} else if(locationCache) {
						callback(locationCache);
					}
	    		}
			});			
		} else {
			console.log(locationCache)
			callback(locationCache);
		}
	};

	Api.prototype.getTransitInfo = function (callback) {
		var self= this;

		var busPromise = new Promise(function(busPromiseResolve, reject){
			self.getNearByBusStation(function(BusStations){
				// BusStations 는 가까운 순으로 정렬된 버스정류장 정보
				// 	 stationDisplayName 
				//   stationID 
				//   x, y 정도 이용하면 될듯 
				console.log("근처버스 정보 주새여")
				
				// liveUpdate / stationClass / type / cityCode 는 아직 쓸일 없을듯?			
				Promise.all(
					BusStations.map(function(station) {
						return new Promise(function(resolve, reject){
							self.getBusStationInfo(station.stationID, function(stationInfo) {
								resolve(stationInfo)
							});
						});
					})
				).then(function(BusStations){
					console.log("근처버스 정보 받았네여")

					// BusStations 를 이용해 각 버스의 next stop 이 어디인지 정보를 얻어온다
					var stationID = BusStations[0].stationID;
					var busID = BusStations[0].lane[0].busID;
					
					var tuple = [];
					
					BusStations.forEach(function(station) {
						var stationID = station.stationID;
						station.lane.forEach(function(lane) {
							var busID = lane.busID;
							tuple.push({
								stationID: stationID,
								busID: busID
							});
						});
					});
					
					var laneList = {};
					tuple.forEach(function(t){
						laneList[t.busID] = true;
					});
					laneList = Object.keys(laneList);
	
					Promise.all(
						laneList.map(function(busId) {
							return new Promise(function(resolve, reject){
								self.getBusLaneInfo(busId, function(busLaneInfo) {
									resolve(busLaneInfo);
								});
							});						
						})
					).then(function(buslaneInfos){
						console.log("모든 버스라인 정보 받았네여")

						// 버스레인 정보들을 BusStations 정보에 버무린 다음, callback 호출 
						var buslaneInfoMap = {};
						buslaneInfos.forEach(function(laneInfo) {
							buslaneInfoMap[laneInfo.busID] = laneInfo;
						});
						
						BusStations = BusStations.map(function(station){
							station.lane = station.lane.map(function(lane){
								lane.routeInfo = buslaneInfoMap[lane.busID];
								return lane;
							});
							return station;
						});
						
						var transitInfo = [];
						
						BusStations = BusStations.forEach(function(station){
							var stationID = station.stationID;
							
							var stationInfo = {
								stationID: station.stationID,
								stationName: station.stationName || station.stationDisplayName,
								x: station.x,
								y: station.y,
								liveUpdate: station.liveUpdate
							};
							
							var busInfo;
							station.lane = station.lane.forEach(function(lane){	
								var stopIdx;
								for(var i in lane.routeInfo.graphBusStopList) {
									if(lane.routeInfo.graphBusStopList[i].stationID === stationID) {
										stopIdx = i;
										break;
									}
								}
								
								var curStop = lane.routeInfo.graphBusStopList[stopIdx];
								if(stopIdx > 0) {
									var prevStop = lane.routeInfo.graphBusStopList[Number(stopIdx) - 1];
								}
								if(stopIdx < lane.routeInfo.graphBusStopList.length - 1) {
									var nextStop = lane.routeInfo.graphBusStopList[Number(stopIdx) + 1];
								}
	
								busInfo = {
									busID: lane.busID,
									busNo: lane.busNo || lane.routeNo,
									typeName: lane.typeName,
									predictTime: lane.arrivalList ? [ parseInt(lane.arrivalList.predictTime1 /60), parseInt(lane.arrivalList.predictTime2/ 60) ] : null,
									cityName: lane.cityName || lane.busCityName,
									liveUpdate: lane.liveUpdate,
									busStartPoint: lane.busStartPoint,
									busEndPoint: lane.busEndPoint
								};
								
								var direction;
								if(lane.routeInfo.hasTurningPoint) {
									direction = (stopIdx < lane.routeInfo.beforeTurnBusStopList.length) ? busInfo.busEndPoint : busInfo.busStartPoint;
								} else {
									direction = busInfo.busEndPoint;
								}

								if(!lane.currentStationLastTime) {
									lane.currentStationLastTime = lane.busLastTime;
								}
								
								var time = (new Date());
								var nowHours = time.getHours() < 3 ? time.getHours() + 24 : time.getHours();
								var now = nowHours + ":" + time.getMinutes();
								var lastTime = lane.currentStationLastTime;
	
								if(lastTime.split(':')[0] < 10) {
									lastTime = (parseInt(lastTime.split(':')[0]) + 24) + ':' + lastTime.split(':')[1];
								}
								var isInactive = now > lane.currentStationLastTime;			
								if(lane.arrivalList && (!!lane.arrivalList.predictTime1 && !!lane.arrivalList.predictTime2)) {
									isInactive = false;
								}
								//console.log(now, lane.currentStationLastTime)
								transitInfo.push({
									stationID: stationID,
									busID: lane.busID,
									busInfo: busInfo,
									curStop: curStop,
									prevStop: prevStop,
									nextStop: nextStop,
									stationInfo: stationInfo,
									currentStationLastTime: lane.currentStationLastTime,
									direction: direction,
									isInactive: isInactive
								});					
							});
						});
											
						// 한번더 정제한 후 주력 데이터 용으로 내벹자 transitInfo
						console.log("busPromiseResolve resolved")
						busPromiseResolve(transitInfo);
					});
				});	
			});
		});
					
		var subwayPromise = new Promise(function(subwayPromiseResolve, reject){
			self.getNearBySubwayStation(function(SubwayList){
				Promise.all(
					SubwayList.map(function getSubwayPromise(subwayStation){
						return new Promise(function(resolve, reject){
							self.getSubwayInfo(subwayStation.stationID, function(subwayInfo) {
								// subwayStation 의 일반정보와 합쳐서 보낸다..
								resolve({
									stationID: subwayStation.stationID,
									stationName: subwayStation.stationName,
									cityCode: subwayStation.cityCode,
									type: subwayStation.type, // "SUBWAY_STATION_수도권_8호선"
									location: subwayStation.location,
									arrivalInfo: subwayInfo.result
								});
							});
						});	
					})
				).then(function(subwayStationInfos){
					// 한번더 버스쪽과 포멧을 맞춰서 보낸다.				
					// 역 하나당 아이템 2개씩 만들어야함 
					var resolvedSubwayTransitInfo = subwayStationInfos.reduce(function(prev, curr) {
						function getStationItem(curr, isUp){
							var arrivalInfo = curr.arrivalInfo;
							var timeSlots = arrivalInfo.downwayTimeSlots;
							var direction = arrivalInfo.downDirection;
							
							if(isUp) {
								timeSlots = arrivalInfo.upwayTimeSlots;
								direction = arrivalInfo.upDirection;
							}

							return {
								stationID: curr.stationID,
								stationInfo: {
									stationName:  curr.arrivalInfo.stationName,
									stationID: curr.stationID,
									lineName: curr.type.split('_')[3], // 분당선
									typeName: '지하철',
									cityName: curr.type.split('_')[2],// 수도권
									subwayStartPoint: curr.arrivalInfo.downDirection,
									subwayEndPoint: curr.arrivalInfo.upDirection,
									predictTime: timeSlots.map(function(v){
										var now = (new Date()).HHMM();
										var nowHours = parseInt(now.substr(0, 2));
										var nowMin = parseInt(now.substr(2, 2));
										var departureHours = parseInt(v.departureTime.substr(0, 2));
										var departureMin = parseInt(v.departureTime.substr(2, 2));
										
										// 시간이 3 이하일 경우 24를 더해서 계산한다.
//										if(nowHours < 3) nowHours += 24;
										if(departureHours < 5 && nowHours < 3) nowHours += 24;
										if(departureHours < 3) departureHours += 24;
										
										var nowSum = nowHours * 60 + nowMin;
										var departureSum = departureHours * 60 + departureMin;
										if(departureSum - nowSum < 0) {
											console.log(nowHours,nowMin, departureHours, departureMin)
										}
										return {
											minutes: departureSum - nowSum,
											arrivalStationName: v.arrivalStationName,
											isExpress: v.isExpress
										};
									}),
									x: curr.location.xPos,
									y: curr.location.yPos
								},
								direction: direction,
								curStop: curr,
								prevStop: undefined,
								nextStop: undefined,
								currentStationLastTime: undefined,
								isInactive: undefined				
							}
						}
						
						return prev.concat(
							[getStationItem(curr, true), getStationItem(curr, false)].filter(function(v){
								return v.direction !== '';	
							})
						);
					}, []);

					// 역 1개당 하나의 요청만 보내면 됨.
					Promise.all(
						subwayStationInfos.map(function(subwayStationInfo){
							return new Promise(function(resolve, reject) {
								self.getSubwayDetailInfos(subwayStationInfo.stationID, function(subwayDetailInfo){
									resolve(subwayDetailInfo);
								});
							});
						})
					).then(function(subwayDetailInfos){
						// subwayDetailInfos 의 정보를 이용해서 resolvedSubwayTransitInfo 에 빈 정보를 채워넣고						
						resolvedSubwayTransitInfo = resolvedSubwayTransitInfo.map(function(info) {
							// info.stationID 를 이용해 대응하는 detail info 를 뽑는다
							var subwayDetailInfo = subwayDetailInfos.filter(function(v){
								return v.stationID === info.stationID;
							})[0];
							
							// info.direction 을 이용해 upward 인지 downward 인지 판단한다.
							var isUpward = (info.direction === subwayDetailInfo.upDirectionName);
							if(isUpward) {
								info.nextStop = subwayDetailInfo.upwardStop;
								info.prevStop = subwayDetailInfo.downwardStop;							
								info.currentStationLastTime = subwayDetailInfo.upwardLast;
							} else {
								info.prevStop = subwayDetailInfo.upwardStop;
								info.nextStop = subwayDetailInfo.downwardStop;	
								info.currentStationLastTime = subwayDetailInfo.downwardLast;							
							}
							
							// isInactive // currentStationLastTime 의 가장늦은 시간보다 현재시간이 늦고. 
							// predictTime 값이 존재하지않을 떄 (이 때 어떤상태의 데이터가 들어올 지는 모른다 ;;)
							//// currentStationLastTime 의 가장 늦은 시간을 구하자
							if(info.currentStationLastTime) {
								var lastTime = "10:10";

								info.currentStationLastTime.forEach(function(lst){
									// 만약에 새벽 시간이라면 시간에 24 를 더한다.
									var lt = lst.lastTime;
									if(lt.split(":")[0] < 3) {
										lt = (parseInt(lt.split(":")[0]) + 24) + ":" + lt.split(":")[1];
									}
									if(lastTime < lt) {
										lastTime = lt;
									}
								});
								lastTime = lastTime.replace(':','');
		
								var now = (new Date()).HHMM();
								var nowHours = parseInt(now.substr(0, 2));
								var nowMin = parseInt(now.substr(2, 2));
	
								var lastHours = parseInt(lastTime.substr(0, 2));
								var lastMin = parseInt(lastTime.substr(2, 2));
											
								// 시간이 3 이하일 경우 24를 더해서 계산한다.
								if(nowHours < 3) nowHours += 24;
								
								var isInactive = ((nowHours * 60) + nowMin) > (lastHours * 60) + lastMin;
								info.isInactive = isInactive;
							} else {
								info.isInactive = true;
								if(isUpward && info.curStop.arrivalInfo.upwayTimeSlots.length > 0) {
									info.isInactive = false
								}
								if(!isUpward && info.curStop.arrivalInfo.downwayTimeSlots.length > 0) {
									info.isInactive = false
								}
							}
							
							return info;
						});
						
						// 병합하러 보낸다.
									console.log("subwayPromiseResolve resolved")

						subwayPromiseResolve(resolvedSubwayTransitInfo)						
					});
				});
			});
		});
		
		Promise.all([busPromise, subwayPromise]).then(function(transitInfos){
			var resolvedTransitInfos = transitInfos[0].concat(transitInfos[1]);
			// transitInfos 의 버스 & 지하철 정보를 나눠서 라인 단위의 1차원 배열로 만들고
			// 현재위치에서 가까운 순으로 재배열 한 후 callback으로 넘긴다.
			console.log("busPromise && subwayPromise resolved")
			callback(resolvedTransitInfos);					
		});
	};
	
	Api.prototype.getNearByBusStation = function (callback) {
		$.ajax({
			url: "/api/bus/lbsStation.nhn",
			cache: false
		})
		.done(function( data ) {
			var result = data.split("var busStationOutput = {")[1].split("var busStationData = busStationOutput.busStopList || [];")[0];
			result = result.replace('"busStopList": ', "");
			result = result.replace("};", "");
			
			callback(JSON.parse(result));
		});
	};

	Api.prototype.getNearBySubwayStation = function (callback) {
		$.ajax({
			url: "/api/pubtrans/getNearSubway.nhn?radius=2000",
			cache: false,
			error: function() {
				callback([]);
			}, 
			success: function(data) {
				callback(JSON.parse(data).result.subwayList);
			}
			
		});
	};
	
	Api.prototype.searchLocation = function (query, callback) { 
		$.ajax({
			url: "/api/routeSearchAjax.nhn",
			type: "get", //send it through get method
			data:{
				query: query,
				page: "1"				
			}
		})
		.done(function( data ) {
			callback(JSON.parse(data).result.site.list);
		});		
	};

	Api.prototype.searchTransitPath = function (query, callback) { 
		var param = query;
		param = {
			start : {
				lat : 37.3948050,
				lng : 127.1111489,
				name : "판교역 신분당선"
			},
			end : {
				lat : 37.4943066,
				lng : 127.0143944,
				name : "자연별곡교대점"
			}
		};
		$.ajax({
			url: "/api/findroute2/searchPubtransPath.nhn",
			type: "get", //send it through get method
			data:{
				apiVersion: "3",
				searchType: "0",
				start: [param.start.lng, param.start.lat, param.start.name].join(','),
				destination: [param.end.lng, param.end.lat, param.end.name].join(',')				
			}
		})
		.done(function( data ) {
			callback(JSON.parse(data).result);
		});	
	};
	
	Api.prototype.getAutoCompletedQueries = function (query, callback) {
		if(!callback) {
			console.warn('콜백함수가 없습니다');
			return;
		}
		
		var jsonpName =  "jsonp_" + this._jsonp_idx++;
		window[jsonpName] = callback;
		
		$.ajax({
			url: "http://ac.map.naver.com/mobilePlaceAddress/ac",
			type: "get", //send it through get method
			// Tell jQuery we're expecting JSONP
			dataType: "jsonp",
			data:{
				q: query,
				st: "10",
				r_lt: "10",
				r_format: "json",
				t_koreng: "1",
				q_enc: "UTF-8",
				r_enc: "UTF-8",
				r_unicode: "0",
				r_escape: "1",
				frm: "mobileweb",
				_callback: jsonpName				
			}
		});
	};
	
	Api.prototype.getSubwayDetailInfos = function (stationID, callback) {
		$.ajax({
			url: "/api/subway/subwayStation.nhn?stationId=" + stationID,
			cache: false
		})
		.done(function( data ) {
			var resolvedData = data;
			
			if(data.split("prv_station")[1].split("nxt_station")[0].indexOf('station_ells') !== -1)
			var prv_station = data.split("prv_station")[1].split('<div class="station_ells">')[1].split('</div>')[0].trim();
			
			if(data.split("nxt_station")[1].split("subsl _departureInfo")[0].indexOf('station_ells') !== -1)			
			var nxt_station = data.split("nxt_station")[1].split('<div class="station_ells">')[1].split('</div>')[0].trim();

			if(prv_station) {
				var prv_stationId = $(prv_station).attr("data-station_id");
				var prv_stationName = $(prv_station).attr("data-station_name");
				var prv_direction = $(data.split('<div class="tmtb_t tmtb_t2">')[1].split('</div>')[0].trim()).html();		
				var prv_direction_last = data.split('<div class="tmtb_t tmtb_t2">')[1].split('</table>')[0].split('<ul>')[2].split('</ul>')[0].trim();
				var prv_direction_last_info = [];
				$(prv_direction_last).each(function(idx, el){
					var isExpress = false;
					var lastStation;
					var lastTime;
					if(el.nodeType === 1) {
						if(el.innerHTML.indexOf('급행') != -1) {
							isExpress = true;
						}
						
						var token = el.innerHTML.split('</span>');
						token = isExpress ? token[1] : token[0];
						var token = token.trim().split('(<span>');

						lastTime = token[0];
						lastStation = token[1];
						
						prv_direction_last_info.push({
							isExpress: isExpress,
							lastStationName: lastStation,
							lastTime: lastTime
						});
					}
				});
			}
			
			if(nxt_station) {
				var nxt_stationId = $(nxt_station).attr("data-station_id");
				var nxt_stationName = $(nxt_station).attr("data-station_name");
				var nxt_direction = $(data.split('<div class="tmtb_t tmtb_t2">')[2].split('</div>')[0].trim()).html();
				var nxt_direction_last = data.split('<div class="tmtb_t tmtb_t2">')[2].split('</table>')[0].split('<ul>')[2].split('</ul>')[0].trim();
				var nxt_direction_last_info = [];
				$(nxt_direction_last).each(function(idx, el){
					var isExpress = false;
					var lastStation;
					var lastTime;
					if(el.nodeType === 1) {
						if(el.innerHTML.indexOf('급행') != -1) {
							isExpress = true;
						}
						
						var token = el.innerHTML.split('</span>');
						token = isExpress ? token[1] : token[0];
						var token = token.trim().split('(<span>');

						lastTime = token[0];
						lastStation = token[1];
						
						nxt_direction_last_info.push({
							isExpress: isExpress,
							lastStationName: lastStation,
							lastTime: lastTime
						});
					}
				});				
			}		

			callback({
				stationID: stationID,
				upDirectionName: nxt_direction && nxt_direction.replace('행', ''),
				downDirectionName: prv_direction && prv_direction.replace('행', ''),
				downwardLast: prv_direction_last_info,
				upwardLast: nxt_direction_last_info,
				upwardStop: prv_station ? {
					stationID: prv_stationId,
					stationName: prv_stationName
				} : null,
				downwardStop: nxt_station ? {
					stationID: nxt_stationId,
					stationName: nxt_stationName
				} : null
			});
		});
	};
	

	Api.prototype.getSubwayInfo = function (stationID, callback) {
		var inquiryDateTime = (new Date()).YYYYMMDDHHMMSS();
		var url = "/api/pubtrans/inquireSubwayDepartureInfo.nhn?stationID=" + stationID + 
		"&inquiryDateTime=" + inquiryDateTime +
		"&count=3&caller=mobile_naver_map&output=json";
		
		$.ajax({
			url: url,
			cache: false
		})
		.done(function( data ) {
			var resolvedData = data;
			callback(JSON.parse(resolvedData));
		});
	};
	
	Api.prototype.getBusStationInfo = function (stationID, callback) {
		$.ajax({
			url: "/api/bus/station.nhn?stationID=" + stationID,
			cache: false
		})
		.done(function( data ) {
			// station.lane : 라인 별 정보 
			// realArrivalInfo : 실시간 도착정보 
			// 를 얻어올 수 있다.
			var stationInfo = JSON.parse(
				data.split('var station = ')[1]
					.split("	var historyItem = $.extend({}, station)")[0]
					.replace('};', "}")
			);

			if(data.indexOf('station.realArrivalInfo = ') !== -1) {
				var busArrivalList = JSON.parse(
					data.split('station.realArrivalInfo = ')[1]
						.split('var windowLoadEventName = "load";')[0]
						.replace('};', "}")
				).message;
				
				busArrivalList = (busArrivalList.result && busArrivalList.result.busArrivalList) || [];				
			} else {
				busArrivalList = [];
			}

			
			// arrivalInfo.busArrivalList array 를 
			// stationInfo.lane 의  liveUpdate 가 true 인 lane 에 할당해주기 
			stationInfo.lane.map(function(lane) {
				if(lane.liveUpdate) {
					var arrivalList = busArrivalList.shift();
					lane.arrivalList = arrivalList;
				}
				return lane;
			});
			callback(stationInfo);
		});
	};	
	
	Api.prototype.getBusLaneInfo = function (busID , callback) {
		$.ajax({
			url: "/api/bus/lane.nhn?busID=" + busID,
			cache: false
		})
		.done(function( data ) {
			var busLaneInfo = JSON.parse(
				data.split('var item = ')[1]
					.split("var historyItem = $.extend({}, item);")[0]
					.replace('};', "}")
			);

			callback(busLaneInfo);
		});
	};	
	
	// Export to window
	window.app = window.app || {};
	window.app.Api = Api;
}(window));
