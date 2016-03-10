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
	function RouteView(template) {
		var self = this;

		this.$openRouteBtn = $('.routeBtn');
		this.$closeRouteBtn = $('.routeView .nav .cancel');

		this.$start = $('.startInputContainer');
		this.$end = $('.endInputContainer');
		this.$locationContainer = $('.locationContainer');
		this.$exchangeBtn = $('.exchangeBtn');
	
		this._$pendingPlace;
		
		this.$timelineContainer = $('.timelineContainer');

		(new Hammer(this.$exchangeBtn[0])).on('tap', function(ev) {
			self.$locationContainer.toggleClass("flip");
			if(self.$start.attr('data-lat').length > 0 && self.$end.attr('data-lat').length > 0) {
				var start = self.getStart();
				var end = self.getEnd();

				if(self.$locationContainer.hasClass('flip')) {
					end = self.getStart();
					start = self.getEnd();
				};
				console.log("루트 를 검색할 준비가 되었어요!!");
				$(self).trigger('needToGetRoute', [{
					start: start,
					end: end
				}]);
			}
		});
				
		(new Hammer(this.$openRouteBtn[0])).on('tap', function(ev) {
			$(self).trigger('openRouteView');
			//self.openRouteView();
		});

		(new Hammer(this.$closeRouteBtn[0])).on('tap', function(ev) {
			self.closeRouteView();
		});

		(new Hammer(this.$timelineContainer[0])).on('tap', function(ev) {
			console.log($(ev.target).closest('.searchResultItem'));
			var $resultItem = $(ev.target).closest('.searchResultItem');
			var isSearchResultClicked = $resultItem.length > 0;
			
			if(isSearchResultClicked) {
				if(self._$pendingPlace[0] === self.$end[0]) {
					self.setEnd({
						lat: $resultItem.attr('data-lat'),
						lng: $resultItem.attr('data-lng'),
						address: $resultItem.attr('data-address'),
						name: $resultItem.attr('data-name')
					}, false);
					// 	self._$pendingPlace = self.$end; 입력대기 플래그 undefined 로 리셋하고
					self._$pendingPlace = undefined;
					// this.$timelineContainer 깨끗하게 비운 후에
					self.$timelineContainer.html('');
					// 둘 다 비어있지 않다면 루트를 보여줄 준비가 되었다는 이벤트를 트리거한다.
					if(self.$start.attr('data-lat').length > 0 && self.$end.attr('data-lat').length > 0) {
						// 루트 를 검색할 준비가 되었어요!!
						// 근데 flip 이 붙어있다면 순서를 바꿔야함 
						var start = self.getStart();
						var end = self.getEnd();

						if(self.$locationContainer.hasClass('flip')) {
							end = self.getStart();
							start = self.getEnd();
						};
						console.log("루트 를 검색할 준비가 되었어요!!");
						$(self).trigger('needToGetRoute', [{
							start: start,
							end: end
						}]);
					}
				} else if (self._$pendingPlace[0] === self.$start[0]){
					self.setStart({
						lat: $resultItem.attr('data-lat'),
						lng: $resultItem.attr('data-lng'),
						address: $resultItem.attr('data-address'),
						name: $resultItem.attr('data-name')
					}, false);
					// 	self._$pendingPlace = self.$end; 입력대기 플래그 undefined 로 리셋하고
					self._$pendingPlace = undefined;
					// this.$timelineContainer 깨끗하게 비운 후에
					self.$timelineContainer.html('');
					// 둘 다 비어있지 않다면 루트를 보여줄 준비가 되었다는 이벤트를 트리거한다.
					if(self.$start.attr('data-lat').length > 0 && self.$end.attr('data-lat').length > 0) {
						// 루트 를 검색할 준비가 되었어요!!
						console.log("루트 를 검색할 준비가 되었어요!!");
						var start = self.getStart();
						var end = self.getEnd();

						if(self.$locationContainer.hasClass('flip')) {
							end = self.getStart();
							start = self.getEnd();
						};
						$(self).trigger('needToGetRoute', [{
							start: start,
							end: end
						}]);
					}					
				}
			}
/*

	
	RouteView.prototype.setEnd = function (param, isMylocation) {
		this.$end.attr('data-lat', param.lat);
		this.$end.attr('data-lng', param.lng);
		this.$end.attr('data-address', param.address);
		this.$end.find('input').val(param.address);
		if(isMylocation) {
			this.$end.addClass('isCurrentLocation');
		} else {
			this.$end.removeClass('isCurrentLocation');
		}
	};
		
		*/			
			//self.closeRouteView();
		});
		(new Hammer(this.$start[0])).on('tap', function(ev) {
			console.log('스타트 탭!');
			self.$start.find('input').focus();
		});
		
		this.$start.find('input').on('focus', function() {
			console.log("[스타트] 포커스 발생!");
			self.$start.removeClass('isCurrentLocation');

		});				

		(new Hammer(this.$end[0])).on('tap', function(ev) {
			console.log('엔드 탭!');
			self.$end.find('input').focus();
		});
				
		this.$end.find('input').on('focus', function() {
			console.log("[엔드] 포커스 발생!");
			// 햔재위치 태그가 활성화 되어있다면 관련 클래스 제거 -> 
			self.$end.removeClass('isCurrentLocation');
		});

		this.$end.find('input').on('keyup', $.debounce( 400, function(evt) {
				self._$pendingPlace = self.$end;
				
				$(self).trigger('endSearchQueryChange', [$(this)[0].value]);
				console.log("[엔드] 키업 발생!", $(this)[0].value);
				// endinput 이 대기중
			})
		);
		
		this.$start.find('input').on('keyup', $.debounce( 400, function(evt) {
				self._$pendingPlace = self.$start;
				
				$(self).trigger('startSearchQueryChange', [$(this)[0].value]);
				console.log("[스타트] 키업 발생!", $(this)[0].value);
				// endinput 이 대기중
			})
		);

		(new Hammer($('.reverseMarkingPlaceholder')[0])).on('tap', function(ev) {
			$('.timeSlider').addClass('reverse');
			$('.timelineContainer').addClass('reverse');
			// reverse 의 경우는 화면 폭 만큼 시간을 더해준다.
			var nowMin = (($('.timeSlider').scrollLeft()+ window.innerWidth) / $('.scroller').width()) * 24 * 60;
			$('.focusedTimeLabel').html(parseInt(nowMin/60) + ":" + parseInt(nowMin%60));
			$('.focusedTimeLabel').attr("data-min", nowMin);				
		});
		(new Hammer($('.markingPlaceholder')[0])).on('tap', function(ev) {
			$('.timeSlider').removeClass('reverse');
			$('.timelineContainer').removeClass('reverse');
			// reverse 의 경우는 화면 폭 만큼 시간을 더해준다.
			var nowMin = (($('.timeSlider').scrollLeft()+4) / $('.scroller').width()) * 24 * 60;
			$('.focusedTimeLabel').html(parseInt(nowMin/60) + ":" + parseInt(nowMin%60));
			$('.focusedTimeLabel').attr("data-min", nowMin);
		});			
		
/*

		this.$end.find('input').on('keydown', function(evt, data) {
			$(self).trigger('endSearchQueryChange', [$(this)[0].value]);
			$('input.text').keyup( $.debounce( 250, text_2 ) ); // This is the line you want!
			console.log("[엔드] 키다운 발생!", $(this)[0].value);
		});
*/
				
		this.$end.find('input').on('blur', function() {
			console.log("[엔드] 블러 발생!");
		});
		
		// 해머로 제스춰 핸들러 등록 
		//// 제스춰 발생시 model 의 데이터와 인터렉션 필요하면 -> 이벤트 발생시켜서 컨트롤러에서 핸들링
		//// 화면조작만 하면 된다면 내부적으로 핸들링


/*
		(new Hammer($('.routeView .nav .cancel')[0])).on('tap', function(ev) {
			self.closeRouteView();
		});
*/

/*
		this.setStart({
			address: "주소주소중"
		});
*/	
		//this.oTimeScroll = new IScroll('#timeScroll', { scrollX: true, scrollY: false, mouseWheel: true });

/*
		this.setStart({
			address: "주소주소중"
		});
*/
		
		
	}
	
/*
	RouteView.prototype. = function() {
		
	};
*/
//	RouteView.prototype. = function () {
	RouteView.prototype.renderSearchResult = function (list) {
		$('.timelineContainer').html('');

		var result = '';
		list.forEach(function(v){
			var address = v.roadAddress.length > 0 ? v.roadAddress : v.address;
			result += '<div class="searchResultItem" data-lat="'+v.y+'" data-lng="'+v.x+'" data-name="' +v.name + '" data-address="'+v.roadAddress+'">'+
				'<div class="name">' +v.name + '</div><div class="address">'+address+'</div></div>';
		});
		$('.timelineContainer').html(result);
		$('.timeSlider').hide();
	}
	
	RouteView.prototype.setFocusOnEmptyInput = function () {
		var isStartEmpty = !(this.$start.attr('data-lat').length > 0);
		var isEndEmpty = !(this.$end.attr('data-lat').length > 0);
		
		if(isStartEmpty) {
			this.$start.find('input').focus();
		} 
		if(isEndEmpty) {
			this.$end.find('input').focus();
		}
	};
	
	// 이건 서버를 통해야 하지만 일단 가라로 넣는다.
	RouteView.prototype.__fetchRemaingTime = function (data) {
		return data.map(function(v){
			v.remaining = parseInt(Math.random() * 16);
			return v;
		});
	};
	
	RouteView.prototype.renderTimeline = function (data) {
		var self = this;
		var timelineData = this.refineTimelineData(data);
		
		// 첫 수단 remaining [5, 10] 를 가져온다
			// -> 늦게 나가도 되는지 확인하기 
		timelineData = this.__fetchRemaingTime(timelineData);
			 
		// 시간대별로 걸리는 시간 보정
		//timelineData[0]
		var longestTime = 0;
		var longestIdx;
		timelineData.forEach(function(v, idx){
			var totalTime = parseInt(v.totalTime);
			if(longestTime < totalTime) {
				longestTime = totalTime;
				longestIdx = idx;
			}
		});
		
		this.$timelineContainer.html(timelineData.map(function(v){
			return self.getTimeStreamHTML(v,longestTime);
		}).join(''));
		
		// 좁은 걷는구간에는 아이콘 없애자
		$('.pathSection svg').each(function(idx, el) {
			if(parseInt($(el).closest('.pathSection').css('width')) < 18) {
				$(el).hide();
			}			
		});
		
		
		// 스크롤러 사이즈를 정하고 내부 눈금의 사이즈도 정해준다
		var scrollerWidth = $($('.pathStream').get(longestIdx)).width() / longestTime * 24 * 60
		$('.scroller').css('width', scrollerWidth + "px");
		
		var scaleHTML = '';
		for(var i=0;i<24;i++) {
			scaleHTML += '<div class="scale" style="width:'+(1/24*100)+'%"><div class="hour">'+ i +'H</div>' +
			'<div class="quater"><span>15</span></div>' +
			'<div class="quater"><span>30</span></div>' +
			'<div class="quater"><span>45</span></div>' +
			'</div>';
		}
		/// 20:00 도착
		$('.scroller').html(scaleHTML);
		
		// 스크롤러를 현재 시간에 맞게 위치시킨다.
		var nowHHMM = (new Date).HHMM();
		var nowMin = parseInt(nowHHMM.substr(0,2)) * 60 + parseInt(nowHHMM.substr(2,2));
		
		console.log($('.scroller').width() * nowMin / (24 * 60));
		$('.focusedTimeLabel').html(nowHHMM.substr(0,2) + ":" + nowHHMM.substr(2,2));
		$('.focusedTimeLabel').attr('data-min', parseInt(nowHHMM.substr(0,2)) * 60 + parseInt(nowHHMM.substr(2,2)));

		$('.timeSlider').show();
		$('.timeSlider').scrollLeft(parseInt($('.scroller').width() * nowMin / (24 * 60)));

		$('.timeSlider').on('scroll', function() {
			// reverse 의 경우는 화면 폭 만큼 시간을 더해준다.
			if(!$('.timeSlider').hasClass('reverse')) {
				var nowMin = (($(this).scrollLeft()+4) / $('.scroller').width()) * 24 * 60;
				$('.focusedTimeLabel').html(parseInt(nowMin/60) + ":" + parseInt(nowMin%60));				
			} else {
				var nowMin = (($(this).scrollLeft()+ window.innerWidth) / $('.scroller').width()) * 24 * 60;
				$('.focusedTimeLabel').html(parseInt(nowMin/60) + ":" + parseInt(nowMin%60));				
			}
			$('.focusedTimeLabel').attr('data-min', nowMin);
			
			self.updateArrivalTime();
		});
		
		// 기본 stream 을 만들어 보자 
		console.log("timelineData",timelineData);
	};
	
	RouteView.prototype.getTimeStreamHTML = function (data, longestTime) {
		console.log(data);
		var self = this;
		var totalTime = parseInt(data.totalTime); 		
		var innerHTML = data.subPath.map(function(v){
			var sectionTime = parseInt(v.sectionTime);
			var widthRatio = ( sectionTime / totalTime ) * 100;
			// TODO 색상테마를 넣는다.
			var colorClass = self.getThemeClasses(v);
			// 퍼센트 조정
			
			var content;
			switch( v.trafficType ) {
				case "1": // 지하철 버스					
				case "2":
					content = v.name;
					break;
				case "3": // 도보 
					content = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" x="0px" y="0px" viewBox="0 0 100 100" enable-background="new 0 0 100 100" xml:space="preserve"><circle cx="55.66" cy="9.146" r="8.48"/><path d="M78.847,45.643l-12.228-5.408L58.84,24.224c-0.205-0.548-0.459-1.072-0.759-1.565l-0.185-0.379  c-0.463-0.95-1.19-1.657-2-2.054c-0.933-0.708-2.019-1.23-3.225-1.496c-0.706-0.155-1.412-0.205-2.109-0.177  c-0.62-0.02-1.279,0.073-1.942,0.309c-1.068,0.303-2.074,0.813-2.971,1.5l-18.264,9.66c-0.33,0.173-0.622,0.378-0.898,0.595  c-0.894,0.481-1.578,1.333-1.78,2.408l-2.853,15.118c-0.357,1.891,0.887,3.714,2.779,4.072c1.891,0.355,3.713-0.889,4.069-2.781  l2.677-14.182l9.81-5.19L36.872,49.66c-0.132,0.593-0.18,1.158-0.165,1.696l-3.272,20.436c-0.073,0.098-0.153,0.182-0.221,0.287  L20.342,91.926c-1.611,2.48-1.299,5.543,0.693,6.834c1.993,1.291,4.911,0.328,6.522-2.154L40.434,76.76  c0.405-0.629,0.689-1.293,0.854-1.953c0.151-0.35,0.278-0.715,0.341-1.109l2.428-15.17c0.297,0.084,0.595,0.156,0.896,0.221  c1.014,0.227,1.9,0.574,2.689,0.934l13.435,16.043l4.153,19.805c0.529,2.512,2.842,4.156,5.166,3.672  c2.323-0.492,3.784-2.924,3.253-5.441L69.43,73.652c-0.166-0.795-0.525-1.486-0.993-2.068c-0.158-0.275-0.341-0.545-0.556-0.801  L53.869,54.055l3.824-17.344l3.328,6.849c0.1,0.206,0.218,0.394,0.342,0.58c0.226,0.942,0.823,1.755,1.732,2.158l12.932,5.721  c1.617,0.719,3.56-0.129,4.339-1.89C81.145,48.367,80.467,46.361,78.847,45.643z"/></svg>';
					break;
				case "4": // 택시 
					content = '<i class="fa fa-taxi"></i>';
					break;
				
			}

			return '<div class="pathSection '+colorClass+'" style="width:'+widthRatio+'%">'+content+'</div>';
		}).join('');
		// 전체 컨테이너 제작 & 컨테이너 길이 절대값 세팅 
		
		// 가격 && 걸리는 시간 && 도착시각 표기
		var timeExp; 
		if(totalTime >= 60) {
			timeExp = parseInt(totalTime / 60) + 'h ' + totalTime % 60 + 'min'
		} else {
			timeExp = totalTime + 'min'
		}
		
		var focusTime = $('.focusedTimeLabel').html().replace(':','');		
		var endTime = totalTime + parseInt(focusTime.substr(0,2)) * 60 + parseInt(focusTime.substr(2,2))
		endTime = parseInt(endTime/60) + ':' + parseInt(endTime%60);
				
		innerHTML += '<div class="totalTime" data-min="'+ totalTime +'"><span>'+timeExp+'</span> / '+endTime+' 도착</div>'
		var widthPixel = (window.innerWidth - 16) * totalTime / longestTime;
		console.log(totalTime, longestTime);
		return '<div class="pathStream" style="width:' + widthPixel + 'px">' + innerHTML + '</div>';
	};

	RouteView.prototype.updateArrivalTime = function () {
		// 현재 포커스 시간을 가져온다.
		var focusTime = parseInt($('.focusedTimeLabel').attr("data-min"));
		
		// 각 타임라인의 totalTime 을 data attr 를 통해 얻어온다.
		$('.totalTime').each(function(idx, el) {
			var totalTime = parseInt($(el).attr('data-min'));
			var timeExp = $(el).find('span').text();

			// 더해서 각 타임의 도착 OR 출발 시간으로 추가한다.
			var isReverse = $('.timelineContainer').hasClass('reverse');
			// 도착인지 출발인진 reverse 클래스를 보고 판단한다.
			if(isReverse) {
				var departureTime = focusTime - totalTime;
				var departureExp = parseInt(departureTime/60) + ":" + parseInt(departureTime%60);
				$(el).html(departureExp + ' 출발  / <span>'+timeExp+'</span>');
			} else {
				var arrivalTime = focusTime + totalTime;
				var arrivalExp = parseInt(arrivalTime/60) + ":" + parseInt(arrivalTime%60);
				$(el).html('<span>'+timeExp+'</span> / ' + arrivalExp + ' 도착');
			}
		});
	};
	
	RouteView.prototype.getThemeClasses = function (transit) {
		// trafficType: "4" : 택시 라고 내가 정의한다 ㅋㅋ
		// trafficType: "3" : 도보
		// trafficType: "2" : 버스
		// trafficType: "1" : 지하철

		// busType: "6" : 8100
		// "14" : "M4102"
		// '4' : "5500"
		switch(transit.busType) {
			case '간선':
				return 'BG_INDIGO_500';
			case '지선':
				return 'BG_GREEN_700';
			case '1':
			case '마을':
			case '외곽':
			case '농어촌':
				return 'BG_LIGHT_GREEN_700';
			case '순환':
				return 'BG_YELLOW_600 invert';
			case '공항':
				return 'BG_BLUE_500';
			case '4':
			case '6':
			case '14':
			case '시외':
			case '직행좌석':
			case '간선급행':
				return 'BG_RED_700';
		}

		switch(transit.name) {
			case '4호선':
				return 'BG_LIGHT_BLUE_600';
			case '1호선':
				return 'BG_INDIGO_700';
			case '6호선':
				return 'BG_SAND_800';
			case '공항철도':
				return 'BG_BLUE_200 invert';
				
			case '2호선':
				return 'BG_GREEN_600';
			case '9호선':
				return 'BG_SAND_700';
			case '7호선':
				return 'BG_KHAKI_800';
			case '3호선':
				return 'BG_ORANGE_800';
			case '신분당선':
				return 'BG_RED_900';
			case '경의중앙선':
				return 'BG_TEAL_500';
			case '5호선':
				return 'BG_DEEP_PURPLE_500';
				
				
			case '8호선':
				return 'BG_PINK_500';
				
			case '분당선':
				return 'BG_AMBER_800 invert';
			case '1호선':
				return 'BG_BLUE_100 invert';
				
			case '에버라인':
				return 'BG_GREEN_300 invert';
		}


		switch(transit.trafficType) {
			case '1':
				return 'BG_DEEP_PURPLE_500';
			case '2':
				return 'BG_GREEN_700';
			case '3':
				return 'BG_GREY_300';
			case '4':
				return 'BG_YELLOW_600 invert';
		}

		return '';
	}
	
	RouteView.prototype.refineTimelineData = function (data) {
		var publicTransit = data[0]; // 추천 4개로 
		var taxiTransit = data[1];
		
		// 대중교통 정리
		var publicPath = publicTransit && publicTransit.path.splice(0, 4);
		publicPath = publicPath.map(function(v){
			return {
				totalTime: v.info.totalTime,
				payment: v.info.payment,
				subPath: v.subPath.map(function(traffic){
					if(traffic.trafficType == 1) { // 지하철
						return {
							trafficType: traffic.trafficType,
							sectionTime: traffic.sectionTime,
							name : traffic.lane.name
						};
					} else if(traffic.trafficType == 2) { // 버스
						return {
							trafficType: traffic.trafficType,
							sectionTime: traffic.sectionTime,
							name : traffic.lane[0].busNo,
							busType: traffic.lane[0].type
						};
					} else if(traffic.trafficType == 3) { // 도보
						return {
							trafficType: traffic.trafficType,
							sectionTime: traffic.sectionTime
						};						
					}
				}).filter(function(v){
					return v !== undefined;
				})
			};
		});
		
		var taxiTime = String(parseInt(taxiTransit.summary.duration / 60));
		publicPath.push({
			totalTime: taxiTime,
			payment: String(taxiTransit.summary.taxi_fare),
			subPath: [{
				trafficType: '4', // 택시
				sectionTime: taxiTime
			}]
		});
		
		/*
				 [{
					sectionTime : "1",
					trafficType : '3'
				}, {			
					sectionTime: "16",
					trafficType : '2',
					busNo: "390",
					busType: '1'
				}, {
					sectionTime: "9",
					trafficType : '1',
					subwayName: "신분당선"	
				}]
*/
		// trafficType: "4" : 택시 라고 내가 정의한다 ㅋㅋ
		// trafficType: "3" : 도보
		// trafficType: "2" : 버스
		// trafficType: "1" : 지하철
/*
		{
			totalTime: "19",
			payment: '1250',
			subPath: [{
				sectionTime : "1",
				trafficType : '3'
			}, {			
				sectionTime: "16",
				trafficType : '2',
				busNo: "390",
				busType: '1'
			}, {
				sectionTime: "9",
				trafficType : '1',
				subwayName: "신분당선"	
			}]
		}
*/
		// 시작시간을 알아야함
		
		
		return publicPath;
	};	
	
	
/*
	param.lng 
	param.lat
	param.address
*/	

	RouteView.prototype.emptyContainer = function () {
		this.$timelineContainer.empty();
		$('.timeSlider').hide();
	};
	
	RouteView.prototype.resetStart = function () {
		this.$start.attr('data-lat', '');
		this.$start.attr('data-lng', '');
		this.$start.attr('data-address', '');
		this.$start.attr('data-name', '');
		this.$start.find('input').val('');
		this.$start.removeClass('isCurrentLocation');

	};
	RouteView.prototype.resetEnd = function () {
		this.$end.attr('data-lat', '');
		this.$end.attr('data-lng', '');
		this.$end.attr('data-address', '');
		this.$end.attr('data-name', '');
		this.$end.find('input').val('');
		this.$end.removeClass('isCurrentLocation');
	};	
	RouteView.prototype.setStart = function (param, isMylocation) {
		this.$start.attr('data-lat', param.lat);
		this.$start.attr('data-lng', param.lng);
		this.$start.attr('data-address', param.address);
		param.name && this.$start.attr('data-name', param.name);
		this.$start.find('input').val( param.name || param.address);
		if(isMylocation) {
			this.$start.addClass('isCurrentLocation');
		} else {
			this.$start.removeClass('isCurrentLocation');
		}
	};

	RouteView.prototype.getStart = function () {
		return { 
			lat: this.$start.attr('data-lat'),
			lng: this.$start.attr('data-lng'),
			address: this.$start.attr('data-address'),
			name: this.$start.attr('data-name')
		};
	};
	
	RouteView.prototype.getEnd = function () {
		return { 
			lat: this.$end.attr('data-lat'),
			lng: this.$end.attr('data-lng'),
			address: this.$end.attr('data-address'),
			name: this.$end.attr('data-name')
		};
	};
	
	RouteView.prototype.setEnd = function (param, isMylocation) {
		this.$end.attr('data-lat', param.lat);
		this.$end.attr('data-lng', param.lng);
		this.$end.attr('data-address', param.address);
		param.name && this.$end.attr('data-name', param.name);
		this.$end.find('input').val(param.name || param.address);
		if(isMylocation) {
			this.$end.addClass('isCurrentLocation');
		} else {
			this.$end.removeClass('isCurrentLocation');
		}
	};
		
	RouteView.prototype.openRouteView = function (param) {
		$(document.body).addClass('routeShow')		
	};

	RouteView.prototype.closeRouteView = function (param, isMylocation) {
		// 현재 위치를 출발점으로 해서 라우트 뷰를 보여준다.
		$(document.body).removeClass('routeShow')
				
	};

	// Export to window
	window.app = window.app || {};
	window.app.RouteView = RouteView;
}(window));
