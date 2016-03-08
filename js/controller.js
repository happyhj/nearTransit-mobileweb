(function (window) {
	'use strict';

	/**
	 * Takes a model and view and acts as the controller between them
	 *
	 * @constructor
	 * @param {object} model The model instance
	 * @param {object} view The view instance
	 */
	function Controller(model, view) {
		var self = this;
		
		self.model = model;
		self.view = view;
		
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
			
			//self.model.setPosition(center);
			self.model.update("position", center, function (position) {
				self.view.render('updateAddressLabel', position);
				self.model.update("transitInfo", undefined, function (transitList, favMap) {
					self.view.render('updateTransitList', transitList, favMap);
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
			self.view.render('openDetailView', {
				transitArr: selectedGroup,
				idx: idx,
				el: el
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
	}
	
	/**
	 *  position 을 받아서 현재 포커스를 올린 위치와 해당위치에서의 정보를 업데이트 해오고
	 *  view 의 각 부분을 업데이트하는 render 메서드를 정보를 담은 parameter 와 함께 호출한다.
	 */
	Controller.prototype.update = function () {
		var self = this;
		
		var p1 = new Promise(function(resolve, reject) {			
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
			});
		});
	};
	
	// Export to window
	window.app = window.app || {};
	window.app.Controller = Controller;
})(window);
