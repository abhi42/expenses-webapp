var app = angular.module('expensesApp', []);

var controller = app.controller('ExpensesController', function($http) {		
	this.expensesCategories = {};
	this.total = 0;
	this.yr = '';
	this.month = '';
	this.userMsg = '';
	
	var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	this.monthsData = [12];
	var MonthsMetadata = function(id, isInFocus) {
		this.name = monthNames[id];
		this.isInFocus = isInFocus;
		this.monthIndex = id;
		var tempMonthId = id + 1;
		if (id < 10) {
			this.id = "0" + tempMonthId;
		} else {
			this.id = "" + tempMonthId;	
		}						
	}
	
	for (monthIndex = 0; monthIndex < 12; monthIndex++) {
		var mData = new MonthsMetadata(monthIndex, false);
		this.monthsData[monthIndex] = mData;
	}	
	
	var ExpenseCategory = function(catIndex, catName) {
		this.index = catIndex;
		this.category = catName;
		this.desc = '';
		this.amount = 0;
		this.oldDesc = this.desc;
		this.oldAmount = this.amount;
	};

	// get from server
	var self = this; // 'this' is not defined within the callback function.
	this.init = function() {
		$http({
		method: 'GET',
		url: '/categories'
		}).then(function(res) {
			for (i = 0; i < res.data.length; i++) {
				self.initCategoryFromServer(res.data[i]);
			}
			self.getExpensesFromServer();			
		}, function(res) {
			console.log("error occurred while retrieving categories from the server");
		});
				
		this.initCategoryFromServer = function(categoryFromServer) {
			var category = new ExpenseCategory(categoryFromServer._id, categoryFromServer.name);
			self.expensesCategories[categoryFromServer._id] = category;
		}
		
		this.initExpensesFromServer = function(expensesFromServer) {
			/*
			 * {"1":{"Description":"","Amount":12.45},"2":{"Description":"team lunch","Amount":40.75}}
			 */
			for (var key in expensesFromServer) {
				var categoryIndex = parseInt(key);				
				var item = expensesFromServer[key];
								
				this.expensesCategories[categoryIndex].desc = item["Description"];
				this.expensesCategories[categoryIndex].amount = item["Amount"];
				this.expensesCategories[categoryIndex].oldAmount = this.expensesCategories[categoryIndex].amount;
			}
			this.userMsg = '';
			this.doTotal();
			this.updateGraphic();
			this.updateMonthsUI(this.month - 1);				
		}
		
		this.setIdOfDocumentToRetrieve = function() {
			var dateObj = new Date();
			var yr = dateObj.getUTCFullYear();
			var month = dateObj.getUTCMonth() + 1; 
			
			this.yr = yr;
			this.month = month;
			if (month < 10) {
				this.month = "0" + month;
			} 			
		}
	}
	
	this.updateMonthsUI = function(selectedMonthIndex) {
		for (counter = 0; counter < 12; counter++) {
			var flag = false;
			if (selectedMonthIndex == counter) {
				this.monthsData[counter].isInFocus = true;
			} else {
				this.monthsData[counter].isInFocus = false;
			}			
		}
	}
	
	this.getExpensesFromServer = function() {
		self.setIdOfDocumentToRetrieve();
		var id = this.yr + this.month;
		this.getExpensesFromServerFor(id);		
	}
	
	this.getExpensesFromServerForMonth = function(monthId, monthIndex) {
		var id = this.yr + monthId;
		this.month = monthIndex + 1;
		this.getExpensesFromServerFor(id);
	}
	
	this.getExpensesFromServerFor = function(id) {
		$http({
			method: 'GET',
			url: '/expenses/' + id
		}).then(function(res) {
			self.initExpensesFromServer(res.data);	
		}, function(res) {			
			console.log("error occurred while retrieving expenses from the server for " + id);
			if (id.startsWith(self.yr)) {
				self.createDocumentOnServer(id);
				// self.userMsg = 'In future, a new document will be created on the server for this request';
				
			} else {				
				self.userMsg = 'Unable to retrieve data from the server';
			}
		});
	}
	
	this.onClickMonth = function(monthId) {
		console.log(monthId);
		var id = self.yr + monthId;
		this.getExpensesFromServerFor(id);
	}
	
	// end get from server
	
	// send data to server
	this.updateOnServer = function(item) {
		var id = this.yr + this.month;
		$http.put('/expenses/' + id, item).then(function(res) {
			console.log("successfully sent request to update monthly expenses to server. " + res.body);			
		}, function(res) {
			console.log("request to update monthly expenses to server failed. " + res.body);
		});
	}
	
	this.createDocumentOnServer = function(docId) {
		// TODO		
		$http.post('/expenses/' + docId, {}).then(function(res) {
			console.log("successfully sent request to create monthly expenses to server. " + res.body);			
		}, function(res) {
			console.log("request to create monthly expenses on server failed. " + res.body);
		});
	}
	
	createNewItem = function(docId) {
		/* Using the same format as used when creating an item when data is obtained from the server
		 * {"1":{"Description":"","Amount":12.45},"2":{"Description":"team lunch","Amount":40.75}}
		*/
		for (var key in expensesFromServer) {
			var categoryIndex = parseInt(key);				
			var item = expensesFromServer[key];
			
			this.expensesCategories[categoryIndex].desc = item["Description"];
			this.expensesCategories[categoryIndex].amount = item["Amount"];
			this.expensesCategories[categoryIndex].oldAmount = this.expensesCategories[categoryIndex].amount;
		}
	}
	// end send data to server

	this.doTotal = function() {
		temp = 0;
		angular.forEach(this.expensesCategories, function(value, key) {
			temp = temp + value.amount;
		});
		this.total = temp;
	}

	this.handleAmountInput = function(item) {
		this.doTotal();
		this.updateGraphic();
	}
	
	this.handleAmountFocusLost = function(item) {
		if (this.hasAmountChanged(item)) {
			this.updateOnServer(item);
		}
	}
	
	this.handleDescFocusLost = function(item) {
		if (this.hasDescChanged(item)) {
			this.updateOnServer(item);
		}
	}
	
	this.hasAmountChanged = function(item) {
		if (item.oldAmount != item.amount) {
			return true;
		}
		return false;
	}
	
	this.hasDescChanged = function(item) {
		if (item.oldDesc != item.desc) {
			return true;
		}
		return false;
	}
	
	this.handleKeyPress = function(item, clickEvent) {
		if(event.which === 13 && (this.hasAmountChanged(item) || this.hasDescChanged(item))) { // enter key has been pressed
			this.updateOnServer(item);			
		}		
	}
		
	this.updateGraphic = function() {		
		var data = new google.visualization.DataTable();
		data.addColumn('string', 'Category');
		data.addColumn('number', 'Expenses');

		var size = Object.keys(this.expensesCategories).length;
		data.addRows(size);
		var i = 0;
		angular.forEach(this.expensesCategories, function(value, key) {
			data.setCell(i, 0, value.category);
			data.setCell(i, 1, value.amount);
			i++;
		});

		// Set chart options
		var options = {'title':'Monthly expenses break-up',
					   'width':800,
					   'height':600};

		// Instantiate and draw our chart, passing in some options.
		var chart = new google.visualization.PieChart(document.getElementById('chart_div'));
		chart.draw(data, options);
	}
	
	//****** call the init method when bootstrapping is complete
	this.init();
});
/*
angular.element(document).ready(function() {
	google.charts.load('current', {packages: ['corechart']});
	google.charts.setOnLoadCallback(function() {
		angular.bootstrap(document, ['expensesApp']);
	});
});*/
