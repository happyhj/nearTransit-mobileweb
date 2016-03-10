(function (window) {
	'use strict';

	/**
	 * Takes a model and view and acts as the controller between them
	 *
	 * @constructor
	 * @param {object} model The model instance
	 * @param {object} view The view instance
	 */
	function Controller(model, view, routeView) {
		var self = this;
		
		self.model = model;
		self.view = view;
		self.routeView = routeView;
		/*
		$(self.view.maps).on('load', function () {
			console.log('load!');
		});
		
		$(self.view.maps).on('move', function () {
			console.log('move!');
			self.maps.pinCenter()
		});

		$(self.view.maps).on('dragstart', function () {
			self.maps.dimCenter();
		});		

		$(self.view.maps).on('dragend', function () {
			self.maps.undimCenter();
		});
		*/
	
		$(self.view).on('resize', function () {
			self.view.render("setMapCenter", self.model.getPosition());			
		});

		$(self.view).on('mapload', function () {
//			console.log('mapload');
//			self.view.render("mapload");			
		});


		$(self.view).on('mapdragstart', function () {
			self.view.render("dimMapCenter");			
		});

		$(self.view).on('mapdragend', function (evt, center) {
			self.view.render("undimMapCenter");
			self.view.render("pinMapCenter");	

			self.model.isMylocation = false;			
			
			//self.model.setPosition(center);
			self.model.update("position", center, function (position) {
				self.view.showLoader();
				self.view.render('updateAddressLabel', position);
				self.model.update("transitInfo", undefined, function (transitList, favMap) {
					self.view.render('updateTransitList', transitList, favMap);
					self.view.hideLoader();
				});
				//self.view.render('updateTransitList', data.transitList);				
			});
		});

		$(self.view).on('mapgotocurrent', function () {
			self.update();
		});
		
		$(self.view).on('tapFavorite', function (evt, param) {			
			console.log('tapFavorite', param.busID, param.subwayID)
			self.model.toggleFavorite(param.busID || param.subwayID);
			self.view.render('toggleFavorite', param.groupEl);
		});
		
		$(self.view).on('tapMapmarker', function (evt, selectedGroup, idx, el) {
			console.log('tapMapmarker', selectedGroup, idx, el)
			self.offAutoUpdate();
			self.view.render('openDetailView', {
				transitArr: selectedGroup,
				idx: idx,
				el: el
			});
		});
		
		$(self.view).on('closeStopMapView', function (evt) {
			self.onAutoUpdate();
		});

		$(self.view).on('stopMapPositionChange', function (evt, transit) {
			
			console.log('stopMapPositionChange', transit);
			// 현재 위치를 model 에서 가져온다,
			var stopInfo = transit.stationInfo;
			// 남은 시간 정보를 주입한다 버스 지하철이 각각 다름 
			var minutes;
			if(!!transit.busID && transit.busInfo.predictTime) {
				minutes = transit.busInfo.predictTime[0];
			} else if(transit.stationInfo.predictTime) {
				minutes = transit.stationInfo.predictTime[0];
			} else {
				minutes = null;
			}
			
				
			var stopInfo_ = JSON.parse(JSON.stringify(stopInfo));
			var curruntPosition = self.model.getPosition();	
			var isMylocation = self.model.isMylocation;
				
			stopInfo_.currunt = {
				position : curruntPosition,
				isMylocation : isMylocation,
			};
			stopInfo_.minutes = minutes;

			self.view.render('renderStopMap', stopInfo_);
		});	
				
		
		$(self.routeView).on('openRouteView', function (evt) {
			self.routeView.resetStart();
			self.routeView.resetEnd();
			self.routeView.emptyContainer();
			
			var position = self.model.getPosition();
			var region = position.location.region;
			var setOption = {
				lat: position.latitude,
				lng: position.longitude,
				address: [region.do, region.si, region.dong, region.ri].join(' ')
			};
			if(self.model.isMylocation) {
			// CASE 1 : 지금 포커스된 위치가 내 실제 위치인 경우
			// 포커스 위치를 출발지점에 넣는다
				self.routeView.setStart(setOption, self.model.isMylocation);
			} else {
			// CASE 2 : 지금 포커스된 위치가 내 실제 위치가 아닌 경우
			// 포커스 위치를 도착지로 넣고
			// 출발점을 현재지점으로 넣는다. ?? 모델에 물어볼까? 그냥 가져올까??
				self.routeView.setEnd(setOption, self.model.isMylocation);
			}
			self.routeView.openRouteView();
			self.routeView.setFocusOnEmptyInput();
		});

		$(self.routeView).on('endSearchQueryChange', function (evt, query) {
			// query 를 서버로 보내 값을 알아온다.
			self.model.api.searchLocation(query, function(list) {
				// 알아온 값으로 model 에 저장할 필요없을 정도로 data attr 를 이용해서 마크업에 렌더링한다.
				self.routeView.renderSearchResult(list);
			});
		});
		
		$(self.routeView).on('startSearchQueryChange', function (evt, query) {
			// query 를 서버로 보내 값을 알아온다.
			self.model.api.searchLocation(query, function(list) {
				// 알아온 값으로 model 에 저장할 필요없을 정도로 data attr 를 이용해서 마크업에 렌더링한다.
				self.routeView.renderSearchResult(list);
			});
		});
		
		$(self.routeView).on('needToGetRoute', function (evt, startAndEnd) {
			// promise 로 대중교통과 택시루트를 모두 가져온다.
			var trip = startAndEnd;
			
			// 근데 련재 
			
			var pTransit = new Promise(function(resolve, reject){
				self.model.api.searchRoute(trip, function(data) {
					resolve(data);
				});
			});
			var pTaxi = new Promise(function(resolve, reject){
				self.model.api.searchTaxiRoute(trip, function(data) {
					resolve(data);
				});
			});	
			
			Promise.all([pTransit, pTaxi])
			.then(function(data){
/*
				if(!!data === false) {
					// 사용가능한 루트가 없습니다. 표시
				} else {
					// 루트를 렌더링 
					self.routeView.renderTimeline(data);
				}
*/
				console.log("경로정보를 가져옴!!", data);
				self.routeView.renderTimeline(data);
			});	

		});
				
		
								
		/*
		self.view.bind('newTodo', function (title) {
			self.addItem(title);
		});

		self.view.bind('itemEdit', function (item) {
			self.editItem(item.id);
		});

		self.view.bind('itemEditDone', function (item) {
			self.editItemSave(item.id, item.title);
		});

		self.view.bind('itemEditCancel', function (item) {
			self.editItemCancel(item.id);
		});

		self.view.bind('itemRemove', function (item) {
			self.removeItem(item.id);
		});

		self.view.bind('itemToggle', function (item) {
			self.toggleComplete(item.id, item.completed);
		});

		self.view.bind('removeCompleted', function () {
			self.removeCompletedItems();
		});

		self.view.bind('toggleAll', function (status) {
			self.toggleAll(status.completed);
		});
		*/
		this.update();
		this.onAutoUpdate();
	}
	
	Controller.prototype.onAutoUpdate = function () {
		//this._autoUpdateTimer = setInterval( this.updateJustTransitInfo.bind(this), 10000);
	};
	
	Controller.prototype.offAutoUpdate = function () {
		clearInterval(this._autoUpdateTimer);
	};
	
	Controller.prototype.updateJustTransitInfo = function () {
		var position = this.model.getPosition();
		var self = this;
		
		this.view.showLoader();
//		this.view.render('updateAddressLabel', position);
		this.model.update("transitInfo", undefined, function (transitList, favMap) {
			self.view.render('updateTransitList', transitList, favMap);
			self.view.hideLoader();
		});
	};

	/**
	 *  position 을 받아서 현재 포커스를 올린 위치와 해당위치에서의 정보를 업데이트 해오고
	 *  view 의 각 부분을 업데이트하는 render 메서드를 정보를 담은 parameter 와 함께 호출한다.
	 */
	Controller.prototype.update = function () {
		var self = this;
		
		var p1 = new Promise(function(resolve, reject) {	
			self.view.showLoader();		
			self.model.update("position", undefined, function (data) {
				console.log("model.update.position ", data)
				self.view.render("setMapCenter", {
					position: data,
					isMylocation: self.model.isMylocation
				});
				self.view.render('updateAddressLabel', data);
				resolve();
			});
		});

		p1.then(function() {
			self.model.update("transitInfo", undefined, function (transitList, favMap) {		
				self.view.render('updateTransitList', transitList, favMap);
				self.view.hideLoader();
			});
		});
	};
	
	// Export to window
	window.app = window.app || {};
	window.app.Controller = Controller;
})(window);
