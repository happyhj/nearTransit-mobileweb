/*global app, $on */
(function () {
	'use strict';

	/**
	 *  Initialize Transit app
	 */
	function Transit(position) {

		this.api = new app.Api();
				
		this.model = new app.Model(this.api);


//		this.view = new app.View(this.template, this.maps);
		this.routeView = new app.RouteView(undefined);

		this.view = new app.View(undefined);

//		this.controller = new app.Controller(this.model, this.view);

		this.controller = new app.Controller(this.model, this.view, this.routeView);
		
//		this.storage = new app.Store(name);
/*	
		this.model = new app.Model(this.storage);
		this.template = new app.Template();
*/
	}

	window.transit = new Transit();

/*
	// 현재 위치를 받아온 후에 좌표를 통해 맵을 초기화	
	navigator.geolocation.getCurrentPosition(function(position){
		window.transit = new Transit(position);
	});
*/	
//	window.addEventListener('load', setView);
//	$on(window, 'load', setView);
//	$on(window, 'hashchange', setView);
})();
