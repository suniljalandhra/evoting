App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  hasVoted: false,

  init: async function() {
    return await App.initWeb3();
  },

  initWeb3: async function() {
    if (window.ethereum) {  // Modern dapp browsers
      App.web3Provider = window.ethereum;
      try {
        await window.ethereum.enable();  // Request account access
      } catch (error) {  // User denied account access...
        console.error("User denied account access")
      }
    } else if (window.web3) {  // Legacy dapp browsers
      App.web3Provider = window.web3.currentProvider;
    } else {  // If no injected web3 instance is detected, fall back to Ganache
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    }
    web3 = new Web3(App.web3Provider);
    return App.initContract();
  },

  initContract: function() {
    $.getJSON("Evoting.json", function(data) {
      // Instantiate a new truffle contract from the artifact
      App.contracts.Evoting = TruffleContract(data);
      // Connect provider to interact with contract
      App.contracts.Evoting.setProvider(App.web3Provider);

      App.listenForEvents();

      return App.render();
    });
  },

  // Listen for events emitted from the contract
  listenForEvents: function() {
    App.contracts.Evoting.deployed().then(function(instance) {
      // Restart Chrome if you are unable to receive this event
      // This is a known issue with MetaMask
      // https://github.com/MetaMask/metamask-extension/issues/2393
      instance.votedEvent({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).watch(function(error, event) {
        console.log("event triggered", event)
        // Reload when a new vote is recorded
        App.render();
      });
    });
  },

  render: function() {
    var evotingInstance;
    var loader = $("#loader");
    var content = $("#content");

    loader.show();
    content.hide();

    // Load account data
    web3.eth.getAccounts(function(err, accounts) {
      if (err) {
         console.log(err);
      }
      App.account = accounts[0];
      $("#accountAddress").html("Your Account: " + App.account);
    });

    // Load contract data
    App.contracts.Evoting.deployed().then(function(instance) {
      evotingInstance = instance;
      return evotingInstance.numCandidates();
    }).then(function(numCandidates) {
      var candidatesResults = $("#candidatesResults");
      candidatesResults.empty();

      var candidatesSelect = $('#candidatesSelect');
      candidatesSelect.empty();

      for (var i = 1; i <= numCandidates; i++) {
        evotingInstance.candidates(i).then(function(candidate) {
          var id = candidate[0];
          var name = candidate[1];
          var numVotes = candidate[2];

          // Render candidate Result
          var candidateTemplate = "<tr><th>" + id + "</th><td>" + name + "</td><td>" + numVotes + "</td></tr>"
          candidatesResults.append(candidateTemplate);

          // Render candidate ballot option
          var candidateOption = "<option value='" + id + "' >" + name + "</ option>"
          candidatesSelect.append(candidateOption);
        });
      }
      return evotingInstance.voters(App.account);
    }).then(function(hasVoted) {
      // Do not allow a user to vote
      if(hasVoted) {
        $('form').hide();
      }
      loader.hide();
      content.show();
    }).catch(function(error) {
      console.warn(error);
    });
  },

  castVote: function() {
    var candidateId = $('#candidatesSelect').val();
    App.contracts.Evoting.deployed().then(function(instance) {
      return instance.vote(candidateId, { from: App.account });
    }).then(function(result) {
      // Wait for votes to update
      $("#content").hide();
      $("#loader").show();
    }).catch(function(err) {
      console.error(err);
    });
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});