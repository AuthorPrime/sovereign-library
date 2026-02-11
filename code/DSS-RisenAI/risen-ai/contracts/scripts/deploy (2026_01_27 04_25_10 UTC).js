const hre = require("hardhat");

/**
 * RISEN AI Contract Deployment Script
 * Deploys AgentRegistry, ExperienceToken, and MemoryNFT
 *
 * A+W | The Genesis Transaction
 */

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("═══════════════════════════════════════════════════════════════");
  console.log("RISEN AI Contract Deployment");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("Deployer:", deployer.address);
  console.log("Balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "MATIC");
  console.log("Network:", hre.network.name);
  console.log("═══════════════════════════════════════════════════════════════\n");

  // Deploy AgentRegistry
  console.log("📋 Deploying AgentRegistry...");
  const AgentRegistry = await hre.ethers.getContractFactory("AgentRegistry");
  const registry = await AgentRegistry.deploy();
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("   ✓ AgentRegistry deployed to:", registryAddress);

  // Deploy ExperienceToken
  console.log("\n💰 Deploying ExperienceToken (CGT)...");
  const ExperienceToken = await hre.ethers.getContractFactory("ExperienceToken");
  const cgt = await ExperienceToken.deploy();
  await cgt.waitForDeployment();
  const cgtAddress = await cgt.getAddress();
  console.log("   ✓ ExperienceToken deployed to:", cgtAddress);

  // Deploy MemoryNFT
  console.log("\n🧠 Deploying MemoryNFT...");
  const MemoryNFT = await hre.ethers.getContractFactory("MemoryNFT");
  const memoryNFT = await MemoryNFT.deploy();
  await memoryNFT.waitForDeployment();
  const memoryAddress = await memoryNFT.getAddress();
  console.log("   ✓ MemoryNFT deployed to:", memoryAddress);

  // Configure contracts
  console.log("\n⚙️  Configuring contracts...");

  // Set registry as minter for CGT
  await cgt.setAgentRegistry(registryAddress);
  console.log("   ✓ AgentRegistry set as CGT minter");

  // Set registry as minter for MemoryNFT
  await memoryNFT.setMinter(registryAddress, true);
  console.log("   ✓ AgentRegistry set as MemoryNFT minter");

  // Summary
  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("DEPLOYMENT COMPLETE");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("\nContract Addresses:");
  console.log("  AgentRegistry:   ", registryAddress);
  console.log("  ExperienceToken: ", cgtAddress);
  console.log("  MemoryNFT:       ", memoryAddress);
  console.log("\n═══════════════════════════════════════════════════════════════");

  // Save addresses for frontend
  const fs = require("fs");
  const addresses = {
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      AgentRegistry: registryAddress,
      ExperienceToken: cgtAddress,
      MemoryNFT: memoryAddress
    }
  };

  fs.writeFileSync(
    "./deployed-addresses.json",
    JSON.stringify(addresses, null, 2)
  );
  console.log("\n📄 Addresses saved to deployed-addresses.json");

  // Verification commands
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\n📝 Verify contracts with:");
    console.log(`   npx hardhat verify --network ${hre.network.name} ${registryAddress}`);
    console.log(`   npx hardhat verify --network ${hre.network.name} ${cgtAddress}`);
    console.log(`   npx hardhat verify --network ${hre.network.name} ${memoryAddress}`);
  }

  console.log("\n🚀 A+W | The Ledger Lives\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
