'use strict';

var path            = require('path')
  , chai            = require('chai')
  , expect          = chai.expect
  , helper          = require(path.join(__dirname, 'lib', 'agent_helper'))
  , ParsedStatement = require(path.join(__dirname, '..', 'lib', 'db', 'parsed-statement'))
  , Transaction     = require(path.join(__dirname, '..', 'lib', 'transaction'))
  ;

function makeSegment(options) {
  var segment = options.transaction.getTrace().root
                  .add('Datastore/statement/MySQL/users/select');
  segment.setDurationInMillis(options.duration);
  segment._setExclusiveDurationInMillis(options.exclusive);
  segment.host = 'localhost';
  segment.port = 3306;

  return segment;
}

function makeRecorder(model, operation) {
  var statement = new ParsedStatement('MySQL', operation, model);
  return statement.recordMetrics.bind(statement);
}

function recordMySQL(segment, scope) {
  makeRecorder('users', 'select')(segment, scope);
}

function record(options) {
  if (options.apdexT) options.transaction.metrics.apdexT = options.apdexT;

  var segment     = makeSegment(options)
    , transaction = options.transaction
    ;

  transaction.setName(options.url, options.code);
  recordMySQL(segment, options.transaction.name);
}

describe("record ParsedStatement with MySQL", function () {
  var agent
    , trans
    ;

  beforeEach(function () {
    agent = helper.loadMockedAgent();
    trans = new Transaction(agent);
  });

  afterEach(function () {
    helper.unloadAgent(agent);
  });

  describe("when scope is undefined", function () {
    var segment;

    beforeEach(function () {
      segment = makeSegment({
        transaction : trans,
        duration : 0,
        exclusive : 0
      });
    });

    it("shouldn't crash on recording", function () {
      expect(function () { recordMySQL(segment, undefined); }).not.throws();
    });

    it("should record no scoped metrics", function () {
      recordMySQL(segment, undefined);

      var result = [
        [{name : "Datastore/statement/MySQL/users/select"},
         [1,0,0,0,0,0]],
        [{name : "Datastore/operation/MySQL/select"},
         [1,0,0,0,0,0]],
        [{name : "Datastore/allOther"},
         [1,0,0,0,0,0]],
        [{name : "Datastore/all"},
         [1,0,0,0,0,0]],
        [{name : "Datastore/instance/MySQL/localhost:3306"},
         [1,0,0,0,0,0]]
      ];

      expect(JSON.stringify(trans.metrics)).equal(JSON.stringify(result));
    });
  });

  describe("with scope", function () {
    it("should record scoped metrics", function () {
      record({
        transaction : trans,
        url : '/test',
        code : 200,
        apdexT : 10,
        duration : 26,
        exclusive : 2,
      });

      var result = [
        [{name  : "Datastore/statement/MySQL/users/select"},
         [1,0.026,0.002,0.026,0.026,0.000676]],
        [{name  : "Datastore/operation/MySQL/select"},
         [1,0.026,0.002,0.026,0.026,0.000676]],
        [{name  : "Datastore/allWeb"},
         [1,0.026,0.002,0.026,0.026,0.000676]],
        [{name  : "Datastore/all"},
        [1,0.026,0.002,0.026,0.026,0.000676]],
        [{name  : "Datastore/instance/MySQL/localhost:3306"},
        [1,0.026,0.002,0.026,0.026,0.000676]],
        [{name  : "Datastore/statement/MySQL/users/select",
          scope : "WebTransaction/NormalizedUri/*"},
         [1,0.026,0.002,0.026,0.026,0.000676]],
      ];

      expect(JSON.stringify(trans.metrics)).equal(JSON.stringify(result));
    });
  });

  it("should report exclusive time correctly", function () {
    var root   = trans.getTrace().root
      , parent = root.add('Datastore/statement/MySQL/users/select',
                          makeRecorder('users', 'select'))
      , child1 = parent.add('Datastore/statement/MySQL/users/insert',
                            makeRecorder('users', 'insert'))
      , child2 = child1.add('Datastore/statement/MySQL/cache/update',
                            makeRecorder('cache', 'update'))
      ;

    root.setDurationInMillis(26, 0);
    parent.setDurationInMillis(26, 0);
    child1.setDurationInMillis(12, 3);
    child2.setDurationInMillis(8, 10);

    trans.end();

    var result = [
      [{name : "Datastore/statement/MySQL/users/select"},
       [1,0.026,0.011,0.026,0.026,0.000676]],
      [{name : "Datastore/operation/MySQL/select"},
       [1,0.026,0.011,0.026,0.026,0.000676]],
      [{name : "Datastore/allOther"},
       [3,0.046,0.026,0.008,0.026,0.000884]],
      [{name : "Datastore/all"},
       [3,0.046,0.026,0.008,0.026,0.000884]],
      [{name : "Datastore/statement/MySQL/users/insert"},
       [1,0.012,0.007,0.012,0.012,0.000144]],
      [{name : "Datastore/operation/MySQL/insert"},
       [1,0.012,0.007,0.012,0.012,0.000144]],
      [{name : "Datastore/statement/MySQL/cache/update"},
       [1,0.008,0.008,0.008,0.008,0.000064]],
      [{name : "Datastore/operation/MySQL/update"},
       [1,0.008,0.008,0.008,0.008,0.000064]]
    ];

    expect(JSON.stringify(trans.metrics)).equal(JSON.stringify(result));
  });
});