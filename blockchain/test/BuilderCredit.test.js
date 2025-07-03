/**
 * BuilderCredit Smart Contract Tests
 * Tests the core functionality of the BuilderCredit contract system
 */

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BuilderCredit Contract System", function () {
  let mockUSDC;
  let coreContract;
  let storageContract;
  let securityContract;
  let scoringContract;
  let factoryContract;
  
  let owner;
  let developer1;
  let developer2;
  let verifier1;
  let verifier2;
  
  const VERIFIER_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("VERIFIER_ROLE"));
  const ADMIN_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ADMIN_ROLE"));
  
  // Test project data
  const projectName = "Test Project";
  const githubUrl = "https://github.com/developer/test-project";
  const milestoneDescriptions = [
    "Complete smart contract implementation",
    "Build frontend integration",
    "Deploy to testnet"
  ];
  const milestoneRewards = [
    ethers.utils.parseUnits("500", 6), // 500 USDC
    ethers.utils.parseUnits("700", 6), // 700 USDC
    ethers.utils.parseUnits("300", 6)  // 300 USDC
  ];
  
  beforeEach(async function () {
    // Get signers
    [owner, developer1, developer2, verifier1, verifier2] = await ethers.getSigners();
    
    // Deploy mock USDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    mockUSDC = await MockUSDC.deploy("USD Coin", "USDC", 6);
    await mockUSDC.deployed();
    
    // Deploy Storage contract
    const BuilderCreditStorage = await ethers.getContractFactory("BuilderCreditStorage");
    storageContract = await BuilderCreditStorage.deploy();
    await storageContract.deployed();
    
    // Deploy Security contract
    const BuilderCreditSecurity = await ethers.getContractFactory("BuilderCreditSecurity");
    securityContract = await BuilderCreditSecurity.deploy();
    await securityContract.deployed();
    
    // Deploy Scoring contract
    const BuilderCreditScoring = await ethers.getContractFactory("BuilderCreditScoring");
    scoringContract = await BuilderCreditScoring.deploy();
    await scoringContract.deployed();
    
    // Deploy Core contract
    const BuilderCreditCore = await ethers.getContractFactory("BuilderCreditCore");
    coreContract = await BuilderCreditCore.deploy(mockUSDC.address);
    await coreContract.deployed();
    
    // Deploy Factory contract
    const BuilderCreditFactory = await ethers.getContractFactory("BuilderCreditFactory");
    factoryContract = await BuilderCreditFactory.deploy(
      coreContract.address,
      scoringContract.address,
      storageContract.address,
      securityContract.address
    );
    await factoryContract.deployed();
    
    // Initialize contracts
    await storageContract.initialize(coreContract.address);
    await securityContract.initialize(owner.address);
    await coreContract.initialize(storageContract.address, securityContract.address, scoringContract.address);
    await scoringContract.initialize(coreContract.address, securityContract.address);
    
    // Add credit factors
    await scoringContract.addCreditFactor("Github Reputation", 30);
    await scoringContract.addCreditFactor("Repayment History", 40);
    await scoringContract.addCreditFactor("Project Completion", 30);
    
    // Add verifier roles
    await securityContract.grantRole(VERIFIER_ROLE, verifier1.address);
    await securityContract.grantRole(VERIFIER_ROLE, verifier2.address);
    
    // Mint USDC to owner for funding
    await mockUSDC.mint(owner.address, ethers.utils.parseUnits("100000", 6));
    
    // Approve USDC transfer to core contract
    await mockUSDC.approve(coreContract.address, ethers.utils.parseUnits("100000", 6));
    
    // Mint USDC to developers for repayment
    await mockUSDC.mint(developer1.address, ethers.utils.parseUnits("10000", 6));
    await mockUSDC.mint(developer2.address, ethers.utils.parseUnits("10000", 6));
  });
  
  describe("Contract Initialization", function () {
    it("Should correctly initialize contracts", async function () {
      expect(await coreContract.usdc()).to.equal(mockUSDC.address);
      expect(await securityContract.hasRole(ADMIN_ROLE, owner.address)).to.be.true;
      expect(await securityContract.hasRole(VERIFIER_ROLE, verifier1.address)).to.be.true;
      expect(await securityContract.hasRole(VERIFIER_ROLE, verifier2.address)).to.be.true;
    });
    
    it("Should have credit factors set up", async function () {
      const factors = await scoringContract.getAllCreditFactors();
      expect(factors.names.length).to.equal(3);
      expect(factors.names[0]).to.equal("Github Reputation");
      expect(factors.weights[0]).to.equal(30);
    });
  });
  
  describe("Funding Requests", function () {
    it("Should allow developers to request funding", async function () {
      // Set initial credit score for developer1
      const creditScore = 700;
      
      // Request funding
      const requestTx = await coreContract.connect(developer1).requestFunding(
        creditScore,
        githubUrl,
        projectName,
        milestoneDescriptions,
        milestoneRewards
      );
      
      // Wait for transaction to be mined
      const receipt = await requestTx.wait();
      
      // Find FundingProvided event
      const fundingEvent = receipt.events.find(e => e.event === "FundingProvided");
      expect(fundingEvent).to.not.be.undefined;
      
      // Extract project ID from event
      const projectId = fundingEvent.args.projectId;
      
      // Check project was created
      const project = await coreContract.projects(projectId);
      expect(project.developer).to.equal(developer1.address);
      expect(project.githubUrl).to.equal(githubUrl);
      expect(project.name).to.equal(projectName);
      expect(project.isActive).to.be.true;
      
      // Check total funding amount
      const totalFunding = milestoneRewards.reduce((a, b) => a.add(b), ethers.BigNumber.from(0));
      expect(project.fundingAmount).to.equal(totalFunding);
      
      // Check developer credit profile was created
      const profile = await coreContract.creditProfiles(developer1.address);
      expect(profile.creditScore).to.equal(creditScore);
      expect(profile.activeLoanAmount).to.equal(totalFunding);
      expect(profile.isActive).to.be.true;
      
      // Check milestones were created
      for (let i = 0; i < milestoneDescriptions.length; i++) {
        const milestone = await coreContract.getMilestoneDetails(projectId, i);
        expect(milestone.description).to.equal(milestoneDescriptions[i]);
        expect(milestone.reward).to.equal(milestoneRewards[i]);
        expect(milestone.completed).to.be.false;
      }
      
      // Check developer's projects list
      const developerProjects = await coreContract.getDeveloperProjects(developer1.address);
      expect(developerProjects.length).to.equal(1);
      expect(developerProjects[0]).to.equal(projectId);
    });
    
    it("Should calculate funding amount based on credit score", async function () {
      // Test different credit scores
      const lowScore = 400;
      const mediumScore = 600;
      const highScore = 800;
      
      const lowAmount = await coreContract.calculateFundingAmount(lowScore);
      const mediumAmount = await coreContract.calculateFundingAmount(mediumScore);
      const highAmount = await coreContract.calculateFundingAmount(highScore);
      
      // Higher credit scores should get higher funding amounts
      expect(lowAmount).to.be.lt(mediumAmount);
      expect(mediumAmount).to.be.lt(highAmount);
    });
    
    it("Should reject funding requests with too low credit score", async function () {
      // Try with a very low credit score
      const lowScore = 300;
      
      await expect(
        coreContract.connect(developer1).requestFunding(
          lowScore,
          githubUrl,
          projectName,
          milestoneDescriptions,
          milestoneRewards
        )
      ).to.be.revertedWith("Credit score too low");
    });
  });
  
  describe("Milestone Completion", function () {
    let projectId;
    
    beforeEach(async function () {
      // Request funding to create a project
      const creditScore = 700;
      const requestTx = await coreContract.connect(developer1).requestFunding(
        creditScore,
        githubUrl,
        projectName,
        milestoneDescriptions,
        milestoneRewards
      );
      
      const receipt = await requestTx.wait();
      const fundingEvent = receipt.events.find(e => e.event === "FundingProvided");
      projectId = fundingEvent.args.projectId;
    });
    
    it("Should allow developers to mark milestones as complete", async function () {
      // Complete the first milestone
      const milestoneIndex = 0;
      
      await coreContract.connect(developer1).completeMilestone(projectId, milestoneIndex);
      
      // Check milestone status
      const milestone = await coreContract.getMilestoneDetails(projectId, milestoneIndex);
      expect(milestone.completed).to.be.false; // Still needs verification
      
      // Verify the milestone by verifier1
      await coreContract.connect(verifier1).verifyMilestone(projectId, milestoneIndex);
      
      // Check milestone status after verification
      const milestoneAfter = await coreContract.getMilestoneDetails(projectId, milestoneIndex);
      expect(milestoneAfter.confirmations).to.equal(1);
      
      // Verify the milestone by verifier2
      await coreContract.connect(verifier2).verifyMilestone(projectId, milestoneIndex);
      
      // Check milestone status after second verification
      const milestoneAfterFinal = await coreContract.getMilestoneDetails(projectId, milestoneIndex);
      expect(milestoneAfterFinal.confirmations).to.equal(2);
      expect(milestoneAfterFinal.completed).to.be.true; // Should be completed now
      
      // Check that developer's USDC balance increased
      const developerBalance = await mockUSDC.balanceOf(developer1.address);
      expect(developerBalance).to.equal(ethers.utils.parseUnits("10500", 6)); // 10000 initial + 500 reward
      
      // Check that developer's active loan amount decreased
      const profile = await coreContract.creditProfiles(developer1.address);
      const totalFunding = milestoneRewards.reduce((a, b) => a.add(b), ethers.BigNumber.from(0));
      expect(profile.activeLoanAmount).to.equal(totalFunding.sub(milestoneRewards[0]));
    });
    
    it("Should prevent non-developers from completing milestones", async function () {
      // Try to complete the first milestone as someone other than the developer
      const milestoneIndex = 0;
      
      await expect(
        coreContract.connect(developer2).completeMilestone(projectId, milestoneIndex)
      ).to.be.revertedWith("Not the project developer");
    });
    
    it("Should prevent non-verifiers from verifying milestones", async function () {
      // Complete the first milestone
      const milestoneIndex = 0;
      await coreContract.connect(developer1).completeMilestone(projectId, milestoneIndex);
      
      // Try to verify the milestone as a non-verifier
      await expect(
        coreContract.connect(developer2).verifyMilestone(projectId, milestoneIndex)
      ).to.be.revertedWith("Must have verifier role");
    });
  });
  
  describe("Loan Repayment", function () {
    let projectId;
    let totalFunding;
    
    beforeEach(async function () {
      // Request funding to create a project
      const creditScore = 700;
      const requestTx = await coreContract.connect(developer1).requestFunding(
        creditScore,
        githubUrl,
        projectName,
        milestoneDescriptions,
        milestoneRewards
      );
      
      const receipt = await requestTx.wait();
      const fundingEvent = receipt.events.find(e => e.event === "FundingProvided");
      projectId = fundingEvent.args.projectId;
      
      totalFunding = milestoneRewards.reduce((a, b) => a.add(b), ethers.BigNumber.from(0));
    });
    
    it("Should allow developers to repay loans", async function () {
      // Approve USDC for repayment
      const repayAmount = ethers.utils.parseUnits("500", 6);
      await mockUSDC.connect(developer1).approve(coreContract.address, repayAmount);
      
      // Repay part of the loan
      await coreContract.connect(developer1).repayLoan(repayAmount);
      
      // Check developer's credit profile was updated
      const profile = await coreContract.creditProfiles(developer1.address);
      expect(profile.activeLoanAmount).to.equal(totalFunding.sub(repayAmount));
      expect(profile.totalRepaid).to.equal(repayAmount);
      
      // Repay the rest of the loan
      const remainingAmount = totalFunding.sub(repayAmount);
      await mockUSDC.connect(developer1).approve(coreContract.address, remainingAmount);
      await coreContract.connect(developer1).repayLoan(remainingAmount);
      
      // Check loan is fully repaid
      const finalProfile = await coreContract.creditProfiles(developer1.address);
      expect(finalProfile.activeLoanAmount).to.equal(0);
      expect(finalProfile.totalRepaid).to.equal(totalFunding);
      
      // Check developer's reputation increased
      expect(finalProfile.reputation).to.be.gt(0);
    });
    
    it("Should prevent repaying more than the active loan", async function () {
      // Try to repay more than the active loan
      const tooMuchRepay = totalFunding.add(ethers.utils.parseUnits("1000", 6));
      await mockUSDC.connect(developer1).approve(coreContract.address, tooMuchRepay);
      
      await expect(
        coreContract.connect(developer1).repayLoan(tooMuchRepay)
      ).to.be.revertedWith("Repayment exceeds active loan");
    });
  });
  
  describe("Credit Scoring", function () {
    it("Should link GitHub accounts to developer addresses", async function () {
      const githubUsername = "testdev";
      const timestamp = Math.floor(Date.now() / 1000);
      
      // Create message hash
      const messageHash = ethers.utils.solidityKeccak256(
        ["address", "string", "uint256"],
        [developer1.address, githubUsername, timestamp]
      );
      
      // Sign message
      const messageHashBinary = ethers.utils.arrayify(messageHash);
      const signature = await developer1.signMessage(messageHashBinary);
      
      // Link GitHub account
      await scoringContract.linkGithubAccount(
        developer1.address,
        githubUsername,
        signature,
        timestamp
      );
      
      // Check GitHub username was linked
      const linkedUsername = await scoringContract.getGithubUsername(developer1.address);
      expect(linkedUsername).to.equal(githubUsername);
    });
    
    it("Should calculate credit score based on multiple factors", async function () {
      // Request funding to create a credit profile
      const initialCreditScore = 700;
      
      await coreContract.connect(developer1).requestFunding(
        initialCreditScore,
        githubUrl,
        projectName,
        milestoneDescriptions,
        milestoneRewards
      );
      
      // Get initial credit score
      const initialScoreResult = await scoringContract.getCreditScore(developer1.address);
      expect(initialScoreResult.creditScore).to.equal(initialCreditScore);
      expect(initialScoreResult.isVerified).to.be.false;
      
      // Link GitHub account to increase score
      const githubUsername = "testdev";
      const timestamp = Math.floor(Date.now() / 1000);
      
      const messageHash = ethers.utils.solidityKeccak256(
        ["address", "string", "uint256"],
        [developer1.address, githubUsername, timestamp]
      );
      
      const messageHashBinary = ethers.utils.arrayify(messageHash);
      const signature = await developer1.signMessage(messageHashBinary);
      
      await scoringContract.linkGithubAccount(
        developer1.address,
        githubUsername,
        signature,
        timestamp
      );
      
      // Get updated credit score
      const updatedScoreResult = await scoringContract.getCreditScore(developer1.address);
      expect(updatedScoreResult.isVerified).to.be.true;
      // Score should increase due to GitHub verification
      expect(updatedScoreResult.creditScore).to.be.gt(initialCreditScore);
    });
  });
  
  describe("Security Features", function () {
    it("Should enforce role-based access control", async function () {
      // Try to add a credit factor as a non-admin
      await expect(
        scoringContract.connect(developer1).addCreditFactor("Test Factor", 10)
      ).to.be.revertedWith("Must have admin role");
      
      // Try to grant a role as a non-admin
      await expect(
        securityContract.connect(developer1).grantRole(VERIFIER_ROLE, developer2.address)
      ).to.be.revertedWith("AccessControl: account");
    });
    
    it("Should allow admin to add and remove roles", async function () {
      // Grant admin role to developer1
      await securityContract.grantRole(ADMIN_ROLE, developer1.address);
      
      // Check role was granted
      expect(await securityContract.hasRole(ADMIN_ROLE, developer1.address)).to.be.true;
      
      // Developer1 should now be able to grant verifier role
      await securityContract.connect(developer1).grantRole(VERIFIER_ROLE, developer2.address);
      
      // Check verifier role was granted
      expect(await securityContract.hasRole(VERIFIER_ROLE, developer2.address)).to.be.true;
      
      // Revoke verifier role
      await securityContract.revokeRole(VERIFIER_ROLE, developer2.address);
      
      // Check role was revoked
      expect(await securityContract.hasRole(VERIFIER_ROLE, developer2.address)).to.be.false;
    });
  });
});
