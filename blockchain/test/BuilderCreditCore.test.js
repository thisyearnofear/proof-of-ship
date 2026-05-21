const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

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

  const hackathonName = "Test Hackathon";
  const requiredSignatures = 2;
  let hackathonId;
  let startDate;
  let endDate;

  let projectId;
  const projectName = "Test Project";
  const githubUrl = "https://github.com/test/project";
  const milestoneDescriptions = [
    "Complete the UI design",
    "Implement core functionality",
    "Deploy to testnet"
  ];
  const milestoneAmounts = [
    ethers.utils.parseUnits("100", 6),
    ethers.utils.parseUnits("200", 6),
    ethers.utils.parseUnits("300", 6)
  ];
  const totalAmount = ethers.utils.parseUnits("600", 6);
  const initialFunding = ethers.utils.parseUnits("10000", 6);

  beforeEach(async function () {
    [owner, treasury, hackathonHost, developer1, developer2, verifier1, verifier2, verifier3, nonVerifier] = await ethers.getSigners();
    
    const currentTime = Math.floor(Date.now() / 1000);
    startDate = currentTime;
    endDate = currentTime + (30 * 24 * 60 * 60);
    
    // Deploy HackathonRegistry
    const HackathonRegistryFactory = await ethers.getContractFactory("HackathonRegistry");
    hackathonRegistry = await HackathonRegistryFactory.deploy();
    await hackathonRegistry.deployed();
    
    // Deploy Mock USDC
    const MockUSDCFactory = await ethers.getContractFactory("MockUSDC");
    mockUSDC = await MockUSDCFactory.deploy();
    await mockUSDC.deployed();
    
    // Deploy BuilderCreditCore via UUPS proxy
    const BuilderCreditCoreFactory = await ethers.getContractFactory("BuilderCreditCore");
    builderCreditCore = await upgrades.deployProxy(
      BuilderCreditCoreFactory,
      [hackathonRegistry.address, mockUSDC.address, owner.address],
      { kind: "uups", initializer: "initialize" }
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
    hackathonId = 1;
    
    // Mint USDC to BuilderCreditCore proxy
    await mockUSDC.mint(builderCreditCore.address, initialFunding);
    
    // Grant roles
    await builderCreditCore.grantRole(await builderCreditCore.TREASURY_ROLE(), treasury.address);
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
    
    it("Should be upgradeable by admin", async function () {
      // Deploy a new implementation
      const BuilderCreditCoreFactory = await ethers.getContractFactory("BuilderCreditCore");
      const upgraded = await upgrades.upgradeProxy(builderCreditCore.address, BuilderCreditCoreFactory, {
        kind: "uups",
      });
      expect(upgraded.address).to.equal(builderCreditCore.address);
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
      
      await builderCreditCore.connect(developer1).requestFunding(
        [hackathonId],
        githubUrl,
        projectName,
        ["Initial funding"],
        [loanAmount]
      );
      
      await mockUSDC.mint(developer1.address, loanAmount);
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
      expect(creditLine.reputation).to.equal(initialReputation.add(2));
    });

    it("Should fail if repayment exceeds used amount", async function () {
      const tooMuch = loanAmount.add(1);
      await expect(builderCreditCore.connect(developer1).repayLoan(tooMuch))
        .to.be.revertedWith("Repayment exceeds used amount");
    });
  });
});
