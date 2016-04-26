var frisby = require('frisby');

frisby.create('Get full config state')
  .get('http://localhost:8000/GetTestConfig')
  .expectStatus(200)
  .expectHeaderContains('Content-Type', 'application/json')
  .expectJSONTypes('configs.?', 
  {
    application: String,
    key: String, 
    value: String,
    id: String
  })
  .expectJSON('configs.?', 
  {
    application: "test",
    key: "firstkey", 
    value: "firstvalue",
    id: "11111111-d465-40ca-a5f1-3b6c759e91b4"
  })
  .inspectJSON()
.toss();

frisby.create('Add test config')
  .post('http://localhost:8000/AddTestConfig', 
  {
    application: "test",
    key: "testKey",
    value: "testValue",
    id: "11111112-d465-40ca-a5f1-3b6c759e91b4"
  }, {json : true})
  .expectStatus(200)
  .expectHeaderContains('Content-Type', 'application/json')
  .inspectJSON()
  .after(function(err, res, body)
  {
    frisby.create('Delete test config')
      .delete('http://localhost:8000/DeleteTestConfig/11111112-d465-40ca-a5f1-3b6c759e91b4')
      .expectStatus(200)
      .expectHeaderContains('Content-Type', 'application/json')
    .toss();
  })
.toss();

