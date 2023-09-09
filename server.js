const express = require('express');
const app = express();
const fs = require('fs');
const port = 3000;
const searchFunction= require('./index.js')
// Set EJS as the view engine
app.set('view engine', 'ejs');

// Define a route for the root URL ("/")
app.get('/', (req, res) => {
  const message = 'Hello, Express and EJS!';
  res.render('index', { message });
});
 app.use('/',(req, res) => {
    
    console.log(req.query)
  searchFunction([req.query.keyword.toString(),"",req.query.condition],[req.query.startDay,req.query.endDay],[req.query.startTime,req.query.endTime]).then(() => {
    setTimeout(() => {
        fs.readFile('filtereditems.json', 'utf8', (err, data) => {  
    res.send(JSON.parse(data))
    });
      }, 200);

});
  });

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
