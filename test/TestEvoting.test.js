var evoting = artifacts.require("./Evoting.sol");

contract("evoting", function(accounts) {
  var evotingInstance;

  it("initializes with two candidates", function() {
    return evoting.deployed().then(function(instance) {
      return instance.numCandidates();
    }).then(function(count) {
      assert.equal(count, 2);
    });
  });

  it("initializes the candidates with the correct values", function() {
    return evoting.deployed().then(function(instance) {
      evotingInstance = instance;
      return evotingInstance.candidates(1);
    }).then(function(candidate) {
      assert.equal(candidate[0], 1, "contains the correct id");
      assert.equal(candidate[1], "Alice", "contains the correct name");
      assert.equal(candidate[2], 0, "contains the correct votes count");
      return evotingInstance.candidates(2);
    }).then(function(candidate) {
      assert.equal(candidate[0], 2, "contains the correct id");
      assert.equal(candidate[1], "Bob", "contains the correct name");
      assert.equal(candidate[2], 0, "contains the correct votes count");
    });
  });

  it("allows a voter to cast a vote", function() {
    return evoting.deployed().then(function(instance) {
      electionInstance = instance;
      candidateId = 1;
      return electionInstance.vote(candidateId, { from: accounts[0] });
    }).then(function(receipt) {
      assert.equal(receipt.logs.length, 1, "an event was triggered");
      assert.equal(receipt.logs[0].event, "votedEvent", "the event type is correct");
      assert.equal(receipt.logs[0].args._candidateId.toNumber(), candidateId, "the candidate id is correct");
      return electionInstance.voters(accounts[0]);
    }).then(function(voted) {
      assert(voted, "the voter was marked as voted");
      return electionInstance.candidates(candidateId);
    }).then(function(candidate) {
      var numVotes = candidate[2];
      assert.equal(numVotes, 1, "increments the candidate's vote count");
    })
  });

  it("throws an exception for invalid candidates", function() {
    return evoting.deployed().then(function(instance) {
      evotingInstance = instance;
      return evotingInstance.vote(99, { from: accounts[1] })
    }).then(assert.fail).catch(function(error) {
      assert(error.message.indexOf('revert') >= 0, "error message must contain revert");
      return evotingInstance.candidates(1);
    }).then(function(candidate1) {
      var numVotes = candidate1[2];
      assert.equal(numVotes, 1, "Alice did not receive any votes");
      return evotingInstance.candidates(2);
    }).then(function(candidate2) {
      var numVotes = candidate2[2];
      assert.equal(numVotes, 0, "Bob did not receive any votes");
    });
  });

  it("throws an exception for double voting", function() {
    return evoting.deployed().then(function(instance) {
      evotingInstance = instance;
      candidateId = 2;
      evotingInstance.vote(candidateId, { from: accounts[1] });
      return evotingInstance.candidates(candidateId);
    }).then(function(candidate) {
      var numVotes = candidate[2];
      assert.equal(numVotes, 1, "accepts first vote");
      // Try to vote again
      return evotingInstance.vote(candidateId, { from: accounts[1] });
    }).then(assert.fail).catch(function(error) {
      assert(error.message.indexOf('revert') >= 0, "error message must contain revert");
      return evotingInstance.candidates(1);
    }).then(function(candidate1) {
      var numVotes = candidate1[2];
      assert.equal(numVotes, 1, "Alice did not receive any votes");
      return evotingInstance.candidates(2);
    }).then(function(candidate2) {
      var numVotes = candidate2[2];
      assert.equal(numVotes, 1, "Bob did not receive any votes");
    });
  });
});