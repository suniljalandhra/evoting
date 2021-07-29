var Evoting = artifacts.require("Evoting");

module.exports = function(deployer) {
    deployer.deploy(Evoting);
};