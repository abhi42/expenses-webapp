var mongo = require('mongodb');

var Server = mongo.Server,
    Db = mongo.Db,
    BSON = mongo.BSONPure;

var dbName = 'test';
var collectionName = 'expensesColl';
var categoriesCollectionName = 'categoriesColl';

var server = new Server('localhost', 27017, {auto_reconnect: true});
db = new Db(dbName, server);

db.open(function(err, db){
    if (!err) {
        console.log("Connected to " + dbName + " database");
        db.collection(collectionName, {strict:true}, function(err, collection){
            if (err) {
              console.log("The collection " + collectionName + " does not exist");
            }
        });
    }
});

exports.getAllCategories = function(req, res) {
	db.collection(categoriesCollectionName, function(err, collection){
		if (!err) {
			collection.find().toArray(function(err, categories) {
				console.log('categories: ' + categories);
				res.send(categories);
			});
		}
	});
}

exports.findById = function(req, res) {
    var id = req.params.id;    
    var filter = {};
    filter['_id'] = id;
    db.collection(collectionName).findOne(filter, function(err, doc){		
		if (!err && doc != null) {
		  res.send(doc.expenses);
		} else if (doc == null) {
			console.log("no documents found with id " + id + " in collection");
			res.status(404).send("No such document");
		} else {				
		  console.log('Error in retrieving document for id ' + id + ' in collection.');
		  res.status(500).end();
		}
	  });	
}

exports.findAll = function(req, res) {
  db.collection(collectionName, function(err, collection){
    if (!err) {
      collection.find().toArray(function(err, items){
        if (!err) {
          res.send(items);
        } else {
          console.log("Error in retrieving items in collection.");
        }
      });
    } else {
      console.log("Error in obtaining collection from db");
    }
  });
}

exports.updateExpense = function(req, res) {
	var docId = req.params.id;
	console.log('document id: ' + docId);
	console.log(req.body);
	
	var categoryId = req.body.index;
	var newValue = req.body.amount;
	var descValue = req.body.desc;
	
	var fieldToUpdateTemplate = 'expenses.' + categoryId;
	var amountFieldToUpdate = fieldToUpdateTemplate + '.Amount';
	var descFieldToUpdate = fieldToUpdateTemplate + '.Description';
	var modifier = {$set: {} };
	modifier.$set[amountFieldToUpdate] = newValue;
	modifier.$set[descFieldToUpdate] = descValue;
	db.collection(collectionName).updateOne({'_id': docId}, modifier, function(err, result) {
			console.log('result of update: ' + result);
	});
	res.send('ok');
}

exports.createMonthlyExpense = function(req, res) {
	var docId = req.params.id;
	
	var item = {'_id': docId, 'expenses': {}};
	var categories = getCategoryIds(function(categories){
		console.log("%j", categories);
		for (var offset in categories) {
			var key = categories[offset]['_id'];
			var catEntry = {'Description': '', 'Amount': 0};			
			item.expenses[key] = catEntry;
		}
		console.log('item entry about to be inserted: %j', item);
		db.collection(collectionName).insertOne(item, {safe:true}, function(err, result) {
		console.log('result of creation for document with id ' + docId + ': ' + result);
		if (err) {
			res.status(500).end();
		} else {
			// http status code : created
			res.status(201);
			res.send(item);			
		}
	});
	});
	
}

getCategoryIds = function(codeToExecute) {
	var categoriesToReturn = {};
	db.collection(categoriesCollectionName, function(err, collection){
		if (!err) {
			collection.find().toArray(function(err, categories) {
				codeToExecute(categories);
			});			
		}
	});
}

