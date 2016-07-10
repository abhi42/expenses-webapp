# expenses-webapp
This is a prototype app developed to gain familiarity with a web stack that uses angular js on the client side, express js on the server side and mongodb as its backing store. 

The app displays a table of categorized expenses that the user can edit. A pie chart using google chart shows the contribution of each category to the monthly expense.

### Prerequisites
- A local mongodb installation with
  - A db named 'test'
  - A collection in the above db named 'categoriesColl'
  - A collection in the above db named 'expensesColl'
- The mongodb instance must be running locally on port 27017
- The above settings are used in expenses.js.
