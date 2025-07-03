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
    ethers.parseUnits("100", 6), // 100 USDC
    ethers.parseUnits("200", 6), // 200 USDC
    ethers.parseUnits("300", 6)  // 300 USDC
  ];
  const totalAmount = ethers.parseUnits("600", 6); // 600 USDC
  const initialFunding = ethers.parseUnits("10000", 6); // 10,000 USDC

  beforeEach(async function () {
    // Get signers
    [owner, treasury, hackathonHost, developer1, developer2, verifier1, verifier2, verifier3, nonVerifier] = await ethers.getSigners();
    
    // Set dates
    const currentTime = Math.floor(Date.now() / 1000);
    startDate = currentTime;
    endDate = currentTime + (30 * 24 * 60 * 60); // 30 days later
    
    // Deploy contracts
    HackathonRegistry = await ethers.getContractFactory("HackathonRegistry");
    hackathonRegistry = await HackathonRegistry.deploy();
    
    MockUSDC = await ethers.getContractFactory("MockUSDC");
    mockUSDC = await MockUSDC.deploy();
    
    BuilderCreditCore = await ethers.getContractFactory("BuilderCreditCore");
    builderCreditCore = await BuilderCreditCore.deploy(
      await hackathonRegistry.getAddress(),
      await mockUSDC.getAddress()
    );
    
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
    
    hackathonId = await hackathonRegistry.hackathonsByName(hackathonName);
    
    // Mint USDC to BuilderCreditCore
    await mockUSDC.mint(await builderCreditCore.getAddress(), initialFunding);
    
    // Grant treasury role
    await builderCreditCore.grantRole(await builderCreditCore.TREASURY_ROLE(), treasury.address);
  });

  describe("Deployment", function () {
    it("Should set the correct registry and token addresses", async function () {
      expect(await builderCreditCore.registry()).to.equal(await hackathonRegistry.getAddress());
      expect(await builderCreditCore.usdcToken()).to.equal(await mockUSDC.getAddress());
    });
    
    it("Should set the correct roles", async function () {
      expect(await builderCreditCore.hasRole(await builderCreditCore.DEFAULT_ADMIN_ROLE(), owner.address)).to.equal(true);
      expect(await builderCreditCore.hasRole(await builderCreditCore.PLATFORM_ADMIN_ROLE(), owner.address)).to.equal(true);
      expect(await builderCreditCore.hasRole(await builderCreditCore.TREASURY_ROLE(), treasury.address)).to.equal(true);
    });
    
    it("Should have received the initial funding", async function () {
      const balance = await mockUSDC.balanceOf(await builderCreditCore.getAddress());
      expect(balance).to.equal(initialFunding);
    });
  });

  describe("Project Funding", function () {
    it("Should allow a developer to request funding", async function () {
      const creditScore = 50; // Medium credit score
      
      await expect(
        builderCreditCore.connect(developer1).requestFunding(
          hackathonId,
          creditScore,
          githubUrl,
          projectName,
          milestoneDescriptions,
          milestoneAmounts
        )
      )
        .to.emit(builderCreditCore, "ProjectCreated")
        .withArgs(1, hackathonId, developer1.address, totalAmount, projectName);
      
      projectId = 1;
      
      // Check project details
      const project = await builderCreditCore.projects(projectId);
      expect(project.hackathonId).to.equal(hackathonId);
      expect(project.developer).to.equal(developer1.address);
      expect(project.githubUrl).to.equal(githubUrl);
      expect(project.name).to.equal(projectName);
      expect(project.fundingAmount).to.equal(totalAmount);
      expect(project.isActive).to.equal(true);
      
      // Check milestones
      const milestones = await builderCreditCore.getProjectMilestones(projectId);
      expect(milestones.length).to.equal(3);
      
      for (let i = 0; i < milestones.length; i++) {
        expect(milestones[i].description).to.equal(milestoneDescriptions[i]);
        expect(milestones[i].amount).to.equal(milestoneAmounts[i]);
        expect(milestones[i].completed).to.equal(false);
      }
      
      // Check credit line
      const creditLine = await builderCreditCore.creditLines(developer1.address);
      expect(creditLine.totalAmount).to.be.gt(0);
      expect(creditLine.usedAmount).to.equal(totalAmount);
      expect(creditLine.reputation).to.equal(creditScore);
      expect(creditLine.active).to.equal(true);
    });
    
    it("Should revert if requested amount exceeds credit limit", async function () {
      const creditScore = 0; // Very low credit score
      const largeAmount = ethers.parseUnits("10000", 6); // Way too much for this credit score
      
      await expect(
        builderCreditCore.connect(developer1).requestFunding(
          hackathonId,
          creditScore,
          githubUrl,
          projectName,
          ["Single large milestone"],
          [largeAmount]
        )
      ).to.be.revertedWith("Requested amount exceeds credit limit");
    });
    
    it("Should revert if milestone arrays mismatch", async function () {
      await expect(
        builderCreditCore.connect(developer1).requestFunding(
          hackathonId,
          50,
          githubUrl,
          projectName,
          milestoneDescriptions,
          milestoneAmounts.slice(0, 2) // Only 2 amounts for 3 descriptions
        )
      ).to.be.revertedWith("Mismatched milestone arrays");
    });
  });

  describe("Milestone Approval", function () {
    beforeEach(async function () {
      // Create a project first
      await builderCreditCore.connect(developer1).requestFunding(
        hackathonId,
        50,
        githubUrl,
        projectName,
        milestoneDescriptions,
        milestoneAmounts
      );
      
      projectId = 1;
    });
    
    it("Should allow verifiers to approve milestones", async function () {
      const milestoneId = 0;
      
      // First verifier approves
      await expect(
        builderCreditCore.connect(verifier1).approveMilestone(projectId, milestoneId)
      )
        .to.emit(builderCreditCore, "MilestoneApproved")
        .withArgs(projectId, milestoneId, verifier1.address);
      
      // Check approval status
      const status1 = await builderCreditCore.getMilestoneApprovalStatus(projectId, milestoneId, verifier1.address);
      expect(status1.hasApproved).to.equal(true);
      expect(status1.approvalCount).to.equal(1);
      expect(status1.isCompleted).to.equal(false); // Not yet completed
      
      // Second verifier approves, which should complete the milestone (required: 2)
      await expect(
        builderCreditCore.connect(verifier2).approveMilestone(projectId, milestoneId)
      )
        .to.emit(builderCreditCore, "MilestoneCompleted")
        .withArgs(projectId, milestoneId, milestoneAmounts[0], developer1.address);
      
      // Check milestone is completed
      const milestones = await builderCreditCore.getProjectMilestones(projectId);
      expect(milestones[milestoneId].completed).to.equal(true);
      
      // Check approval status after completion
      const status2 = await builderCreditCore.getMilestoneApprovalStatus(projectId, milestoneId, verifier1.address);
      expect(status2.isCompleted).to.equal(true);
      
      // Check developer received payment
      const developerBalance = await mockUSDC.balanceOf(developer1.address);
      expect(developerBalance).to.equal(milestoneAmounts[0]);
      
      // Check reputation increased
      const creditLine = await builderCreditCore.creditLines(developer1.address);
      expect(creditLine.reputation).to.equal(51); // 50 + 1
    });
    
    it("Should revert if non-verifier tries to approve", async function () {
      await expect(
        builderCreditCore.connect(nonVerifier).approveMilestone(projectId, 0)
      ).to.be.revertedWith("Not an authorized verifier");
    });
    
    it("Should revert if same verifier approves twice", async function () {
      await builderCreditCore.connect(verifier1).approveMilestone(projectId, 0);
      
      await expect(
        builderCreditCore.connect(verifier1).approveMilestone(projectId, 0)
      ).to.be.revertedWith("Already approved by this verifier");
    });
    
    it("Should mark project as inactive when all milestones are completed", async function () {
      // Complete first milestone
      await builderCreditCore.connect(verifier1).approveMilestone(projectId, 0);
      await builderCreditCore.connect(verifier2).approveMilestone(projectId, 0);
      
      // Complete second milestone
      await builderCreditCore.connect(verifier1).approveMilestone(projectId, 1);
      await builderCreditCore.connect(verifier2).approveMilestone(projectId, 1);
      
      // Complete third milestone
      await builderCreditCore.connect(verifier1).approveMilestone(projectId, 2);
      await builderCreditCore.connect(verifier2).approveMilestone(projectId, 2);
      
      // Check project status
      const project = await builderCreditCore.projects(projectId);
      expect(project.isActive).to.equal(false);
      expect(project.milestonesCompleted).to.equal(3);
    });
  });

  describe("Credit Management", function () {
    it("Should calculate credit limit correctly", async function () {
      const creditScore = 50;
      const calculatedAmount = await builderCreditCore.calculateFundingAmount(creditScore);
      
      // Based on default parameters:
      // baseCreditAmount = 100 USDC
      // creditMultiplier = 10 USDC per point
      // maxCreditAmount = 10,000 USDC
      // Formula: baseCreditAmount + (creditScore * creditMultiplier)
      const expectedAmount = ethers.parseUnits("100", 6).add(
        ethers.parseUnits("10", 6).mul(creditScore)
      );
      
      expect(calculatedAmount).to.equal(expectedAmount);
    });
    
    it("Should cap credit at maximum amount", async function () {
      const veryHighScore = 2000; // This would exceed the max
      const calculatedAmount = await builderCreditCore.calculateFundingAmount(veryHighScore);
      
      // Max is 10,000 USDC
      const expectedAmount = ethers.parseUnits("10000", 6);
      
      expect(calculatedAmount).to.equal(expectedAmount);
    });
    
    it("Should allow admin to update credit parameters", async function () {
      const newBase = ethers.parseUnits("200", 6); // 200 USDC
      const newMultiplier = ethers.parseUnits("20", 6); // 20 USDC per point
      const newMax = ethers.parseUnits("20000", 6); // 20,000 USDC
      
      await expect(
        builderCreditCore.connect(owner).updateCreditParameters(newBase, newMultiplier, newMax)
      )
        .to.emit(builderCreditCore, "CreditParametersUpdated")
        .withArgs(newBase, newMultiplier, newMax);
      
      expect(await builderCreditCore.baseCreditAmount()).to.equal(newBase);
      expect(await builderCreditCore.creditMultiplier()).to.equal(newMultiplier);
      expect(await builderCreditCore.maxCreditAmount()).to.equal(newMax);
      
      // Test calculation with new parameters
      const creditScore = 50;
      const calculatedAmount = await builderCreditCore.calculateFundingAmount(creditScore);
      
      const expectedAmount = newBase.add(newMultiplier.mul(creditScore));
      expect(calculatedAmount).to.equal(expectedAmount);
    });
  });

  describe("Admin Functions", function () {
    it("Should allow treasury to withdraw funds", async function () {
      const withdrawAmount = ethers.parseUnits("1000", 6); // 1,000 USDC
      
      await expect(
        builderCreditCore.connect(treasury).withdrawFunds(
          await mockUSDC.getAddress(),
          withdrawAmount
        )
      )
        .to.emit(builderCreditCore, "FundsWithdrawn")
        .withArgs(await mockUSDC.getAddress(), treasury.address, withdrawAmount);
      
      // Check treasury balance
      const treasuryBalance = await mockUSDC.balanceOf(treasury.address);
      expect(treasuryBalance).to.equal(withdrawAmount);
      
      // Check contract balance
      const contractBalance = await mockUSDC.balanceOf(await builderCreditCore.getAddress());
      expect(contractBalance).to.equal(initialFunding.sub(withdrawAmount));
    });
    
    it("Should revert if non-treasury tries to withdraw funds", async function () {
      await expect(
        builderCreditCore.connect(owner).withdrawFunds(
          await mockUSDC.getAddress(),
          ethers.parseUnits("1000", 6)
        )
      ).to.be.reverted;
    });
    
    it("Should allow admin to pause the contract", async function () {
      await builderCreditCore.connect(owner).pause();
      expect(await builderCreditCore.paused()).to.equal(true);
      
      // Check that operations are blocked when paused
      await expect(
        builderCreditCore.connect(developer1).requestFunding(
          hackathonId,
          50,
          githubUrl,
          projectName,
          milestoneDescriptions,
          milestoneAmounts
        )
      ).to.be.revertedWith("Pausable: paused");
    });
    
    it("Should allow admin to unpause the contract", async function () {
      await builderCreditCore.connect(owner).pause();
      await builderCreditCore.connect(owner).unpause();
      expect(await builderCreditCore.paused()).to.equal(false);
      
      // Check that operations work after unpause
      await expect(
        builderCreditCore.connect(developer1).requestFunding(
          hackathonId,
          50,
          githubUrl,
          projectName,
          milestoneDescriptions,
          milestoneAmounts
        )
      ).to.not.be.reverted;
    });
    
    it("Should allow admin to update registry address", async function () {
      // Deploy a new registry
      const newRegistry = await HackathonRegistry.deploy();
      
      await builderCreditCore.connect(owner).updateRegistry(await newRegistry.getAddress());
      expect(await builderCreditCore.registry()).to.equal(await newRegistry.getAddress());
    });
    
    it("Should allow admin to update USDC token address", async function () {
      // Deploy a new token
      const newToken = await MockUSDC.deploy();
      
      await builderCreditCore.connect(owner).updateUsdcToken(await newToken.getAddress());
      expect(await builderCreditCore.usdcToken()).to.equal(await newToken.getAddress());
    });
  });
});