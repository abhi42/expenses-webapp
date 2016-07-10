var express = require('express'),
    expenses = require('./routes/expenses');
var bodyParser = require('body-parser');	

var app = express();

app.use(express.static(__dirname + '/public/'));
app.use(bodyParser.json()); // parse application/json

app.get('/categories', expenses.getAllCategories);
app.get('/expenses', expenses.findAll);
app.get('/expenses/:id', expenses.findById);

app.put('/expenses/:id', expenses.updateExpense);
app.post('/expenses/:id', expenses.createMonthlyExpense);

app.listen(3000, function() {
  console.log('Listening on port 3000...');
});
