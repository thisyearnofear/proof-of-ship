const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BuilderCreditCore", function () {
  let HackathonRegistry;
  let BuilderCreditCore;
  let MockUSDC;
  let hackathonRegistry;
  let builderCreditCore;
  let mockUSDC;
  
  let owner;
  let treasury;
  let hackathonHost;
  let developer1;
  let developer2;
  let verifier1;
  let verifier2;
  let verifier3;
  let nonVerifier;

  // Test variables
  const hackathonName = "Test Hackathon";
  const requiredSignatures = 2;
  let hackathonId;
  let startDate;
  let endDate;

  // For milestone testing
  let projectId;
  const projectName = "Test Project";
  const githubUrl = "https://github.com/test/project";
  const milestoneDescriptions = [
    "Complete the UI design",
    "Implement core functionality",
    "Deploy to testnet"
  ];
  const milestoneAmounts = [
    ethers.utils.parseUnits("100", 6), // 100 USDC
    ethers.utils.parseUnits("200", 6), // 200 USDC
    ethers.utils.parseUnits("300", 6)  // 300 USDC
  ];
  const totalAmount = ethers.utils.parseUnits("600", 6); // 600 USDC
  const initialFunding = ethers.utils.parseUnits("10000", 6); // 10,000 USDC

  beforeEach(async function () {
    // Get signers
    [owner, treasury, hackathonHost, developer1, developer2, verifier1, verifier2, verifier3, nonVerifier] = await ethers.getSigners();
    
    // Set dates
    const currentTime = Math.floor(Date.now() / 1000);
    startDate = currentTime;
    endDate = currentTime + (30 * 24 * 60 * 60); // 30 days later
    
    // Deploy contracts
    const HackathonRegistryFactory = await ethers.getContractFactory("HackathonRegistry");
    hackathonRegistry = await HackathonRegistryFactory.deploy();
    await hackathonRegistry.deployed();
    
    const MockUSDCFactory = await ethers.getContractFactory("MockUSDC");
    mockUSDC = await MockUSDCFactory.deploy();
    await mockUSDC.deployed();
    
    const BuilderCreditCoreFactory = await ethers.getContractFactory("BuilderCreditCore");
    builderCreditCore = await BuilderCreditCoreFactory.deploy(
      hackathonRegistry.address,
      mockUSDC.address
    );
    await builderCreditCore.deployed();
    
    // Setup hackathon
    const initialVerifiers = [verifier1.address, verifier2.address, verifier3.address];
    
    await hackathonRegistry.createHackathon(
      hackathonName,
      hackathonHost.address,
      initialVerifiers,
      requiredSignatures,
      startDate,
      endDate
    );
    
    // Get hackathon ID (it starts at 1)
    hackathonId = 1;
    
    // Mint USDC to BuilderCreditCore for funding developers
    await mockUSDC.mint(builderCreditCore.address, initialFunding);
    
    // Grant treasury role to treasury account
    await builderCreditCore.grantRole(await builderCreditCore.TREASURY_ROLE(), treasury.address);
    // Grant scorer role to owner to set reputation
    await builderCreditCore.grantRole(await builderCreditCore.SCORER_ROLE(), owner.address);
  });

  describe("Deployment", function () {
    it("Should set the correct registry and token addresses", async function () {
      expect(await builderCreditCore.registry()).to.equal(hackathonRegistry.address);
      expect(await builderCreditCore.usdcToken()).to.equal(mockUSDC.address);
    });
    
    it("Should set the correct roles", async function () {
      expect(await builderCreditCore.hasRole(await builderCreditCore.DEFAULT_ADMIN_ROLE(), owner.address)).to.equal(true);
      expect(await builderCreditCore.hasRole(await builderCreditCore.PLATFORM_ADMIN_ROLE(), owner.address)).to.equal(true);
      expect(await builderCreditCore.hasRole(await builderCreditCore.TREASURY_ROLE(), treasury.address)).to.equal(true);
    });
  });

  describe("Project Funding", function () {
    it("Should allow a developer to request funding", async function () {
      const verifiedScore = 600; 
      await builderCreditCore.connect(owner).setReputation(developer1.address, verifiedScore);
      
      await expect(
        builderCreditCore.connect(developer1).requestFunding(
          [hackathonId],
          githubUrl,
          projectName,
          milestoneDescriptions,
          milestoneAmounts
        )
      ).to.emit(builderCreditCore, "ProjectCreated");
      
      projectId = 1;
      
      // Check project details
      const project = await builderCreditCore.projects(projectId);
      expect(project.developer).to.equal(developer1.address);
      expect(project.name).to.equal(projectName);
      expect(project.fundingAmount).to.equal(totalAmount);
      expect(project.isActive).to.equal(true);
    });

    it("Should fail if total amount exceeds credit limit", async function () {
      const verifiedScore = 400; // Max funding is 500 USDC
      await builderCreditCore.connect(owner).setReputation(developer1.address, verifiedScore);
      
      const largeAmount = ethers.utils.parseUnits("1000", 6); 
      
      await expect(builderCreditCore.connect(developer1).requestFunding(
        [hackathonId],
        githubUrl,
        projectName,
        ["One big milestone"],
        [largeAmount]
      )).to.be.revertedWith("Requested amount exceeds credit limit");
    });
  });

  describe("Milestone Approvals", function () {
    beforeEach(async function () {
      const verifiedScore = 600;
      await builderCreditCore.connect(owner).setReputation(developer1.address, verifiedScore);
      await builderCreditCore.connect(developer1).requestFunding(
        [hackathonId],
        githubUrl,
        projectName,
        milestoneDescriptions,
        milestoneAmounts
      );
      projectId = 1;
    });

    it("Should complete milestone when threshold is reached", async function () {
      const milestoneId = 0;
      const initialDevBalance = await mockUSDC.balanceOf(developer1.address);
      
      await builderCreditCore.connect(verifier1).approveMilestone(projectId, milestoneId);
      
      // Second approval reaches threshold of 2
      await expect(builderCreditCore.connect(verifier2).approveMilestone(projectId, milestoneId))
        .to.emit(builderCreditCore, "MilestoneCompleted")
        .withArgs(projectId, milestoneId, milestoneAmounts[milestoneId], developer1.address);
        
      const finalDevBalance = await mockUSDC.balanceOf(developer1.address);
      expect(finalDevBalance.sub(initialDevBalance)).to.equal(milestoneAmounts[milestoneId]);
    });
  });

  describe("Loan Repayment", function () {
    const loanAmount = ethers.utils.parseUnits("500", 6);

    beforeEach(async function () {
      const verifiedScore = 400;
      await builderCreditCore.connect(owner).setReputation(developer1.address, verifiedScore);
      
      // Request exactly 500 USDC
      await builderCreditCore.connect(developer1).requestFunding(
        [hackathonId],
        githubUrl,
        projectName,
        ["Initial funding"],
        [loanAmount]
      );
      
      // Mint USDC to developer for repayment
      await mockUSDC.mint(developer1.address, loanAmount);
      // Approve core to spend developer's USDC
      await mockUSDC.connect(developer1).approve(builderCreditCore.address, loanAmount);
    });

    it("Should allow developer to repay loan and increase reputation", async function () {
      const repayAmount = ethers.utils.parseUnits("200", 6);
      const initialReputation = (await builderCreditCore.creditLines(developer1.address)).reputation;

      await expect(builderCreditCore.connect(developer1).repayLoan(repayAmount))
        .to.emit(builderCreditCore, "LoanRepaid")
        .withArgs(developer1.address, repayAmount);

      const creditLine = await builderCreditCore.creditLines(developer1.address);
      expect(creditLine.usedAmount).to.equal(loanAmount.sub(repayAmount));
      // Repaying 200 should give +2 reputation
      expect(creditLine.reputation).to.equal(initialReputation.add(2));
    });

    it("Should fail if repayment exceeds used amount", async function () {
      const tooMuch = loanAmount.add(1);
      await expect(builderCreditCore.connect(developer1).repayLoan(tooMuch))
        .to.be.revertedWith("Repayment exceeds used amount");
    });
  });
});
