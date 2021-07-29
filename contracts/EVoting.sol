pragma solidity ^0.5.0;

contract Evoting{
    struct Candidate{
        uint id;
        string name;
        uint numVotes;
    }
    mapping(uint => Candidate) public candidates;

    uint public numCandidates;

    mapping(address => bool) public voters;

    event votedEvent (
        uint indexed _candidateID
    );

    function addCandidate (string memory _name) private {
        ++numCandidates;
        candidates[numCandidates] = Candidate(numCandidates,_name,0);

    }

    constructor() public {
        addCandidate("Alice");
        addCandidate("Bob");
    }

    function vote(uint _candidateID) public {
        require(!voters[msg.sender],"Already voted");

        require(_candidateID >0 && _candidateID <= numCandidates,"invalid CandidateID provided");

        voters[msg.sender] = true;

        ++candidates[_candidateID].numVotes;

        emit votedEvent(_candidateID);
    }
}