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
		
		this._$pendingPlace;
		
		this.$timelineContainer = $('.timelineContainer');
		
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
						console.log("루트 를 검색할 준비가 되었어요!!");
						$(self).trigger('needToGetRoute', [{
							start: self.getStart(),
							end: self.getEnd()
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
						$(self).trigger('needToGetRoute', [{
							start: self.getStart(),
							end: self.getEnd()
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
		this.setStart({
			address: "주소주소중"
		});
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

	RouteView.prototype.renderTimeline = function (data) {

	};	
	
/*
	param.lng 
	param.lat
	param.address
*/	


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
