/**
 * Common ABIs for interacting with contracts
 */

// ERC20 Token Standard ABI (minimal interface)
export const ERC20_ABI = [
  // Read-only functions
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  
  // Events
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

// ERC721 NFT Standard ABI (minimal interface)
export const ERC721_ABI = [
  // Read-only functions
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function balanceOf(address owner) view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  
  // Events
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
  "event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)"
];

// Generic Contract Interface for detecting contract type
export const DETECTION_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function tokenURI(uint256) view returns (string)",
  "function ownerOf(uint256) view returns (address)"
];

// BuilderCreditCore ABI
export const BUILDER_CREDIT_CORE_ABI = [
  "function requestFunding(uint256[] hackathonIds, uint256 creditScore, string githubUrl, string projectName, string[] milestoneDescriptions, uint256[] milestoneAmounts) external returns (uint256)",
  "function backProject(uint256 projectId, uint256 multiplier, uint256 amount) external",
  "function pledgePrize(uint256 projectId, uint256 amount) external",
  "function distributePrize(uint256 projectId, uint256 prizeAmount) external",
  "function approveMilestone(uint256 projectId, uint256 milestoneId) external",
  "function calculateFundingAmount(uint256 creditScore) public view returns (uint256)",
  "function calculateBoostedFundingAmount(uint256 creditScore, uint256 projectId) public view returns (uint256)",
  "function getMaxMultiplier(uint256 creditScore) public pure returns (uint256)",
  "function totalProjectBacking(uint256 projectId) public view returns (uint256)",
  "function projectPledgedPrize(uint256 projectId) public view returns (uint256)",
  "function projects(uint256 projectId) public view returns (uint256[] hackathonIds, address developer, string githubUrl, string name, uint256 fundingAmount, bool isActive, uint256 fundedAt, uint256 creditScore, uint256 milestonesCompleted, uint256 milestonesCount)",
  "function getDeveloperProjects(address developer) external view returns (uint256[] memory)",
  "function getBackerProjects(address backer) external view returns (uint256[] memory)",
  "function getProjectMilestones(uint256 projectId) external view returns (tuple(string description, uint256 amount, bool completed, uint256 completedAt)[] memory)",
  "function projectBackings(uint256 projectId, uint256 backingId) public view returns (address backer, uint256 amount, uint256 multiplier, bool claimed)",
  "function creditLines(address developer) public view returns (uint256 totalAmount, uint256 usedAmount, uint256 reputation, bool active, uint256 lastUpdated)",
  "event ProjectCreated(uint256 indexed projectId, uint256[] hackathonIds, address indexed developer, uint256 amount, string name)",
  "event ProjectBacked(uint256 indexed projectId, address indexed backer, uint256 amount, uint256 multiplier)",
  "event PrizeDistributed(uint256 indexed projectId, uint256 totalAmount, uint256 backerPayout, uint256 builderPayout)"
];
