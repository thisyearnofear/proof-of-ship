/**
 * Builder Credit Smart Contract ABIs and Addresses
 * These constants are used for interacting with the BuilderCredit contract system
 */

// Contract addresses by network
export const CONTRACT_ADDRESSES = {
  mainnet: {
    core: "", // To be deployed
    factory: "", // To be deployed
    scoring: "", // To be deployed
    security: "", // To be deployed
    storage: "" // To be deployed
  },
  testnet: {
    core: "0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db",
    factory: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    scoring: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    security: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0", 
    storage: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9"
  },
  localhost: {
    core: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    factory: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    scoring: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
    security: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
    storage: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9"
  }
};

// BuilderCreditCore ABI
export const BUILDER_CREDIT_CORE_ABI = [
  // Events
  "event FundingProvided(uint256 indexed projectId, address indexed developer, uint256 amount)",
  "event MilestoneCompleted(uint256 indexed projectId, uint256 indexed milestoneIndex, uint256 reward)",
  "event LoanRepaid(address indexed developer, uint256 amount)",
  "event ProjectCreated(uint256 indexed projectId, address indexed developer, string githubUrl)",
  
  // View functions
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "creditProfiles",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "creditScore",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "totalFunded",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "totalRepaid",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "activeLoanAmount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "lastFundingTime",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "reputation",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "isActive",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "projects",
    "outputs": [
      {
        "internalType": "address",
        "name": "developer",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "githubUrl",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "fundingAmount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "fundedAt",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "isActive",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "creditScore",
        "type": "uint256"
      }
    ],
    "name": "calculateFundingAmount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "developer",
        "type": "address"
      }
    ],
    "name": "getDeveloperProjects",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "projectId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "milestoneIndex",
        "type": "uint256"
      }
    ],
    "name": "getMilestoneDetails",
    "outputs": [
      {
        "components": [
          {
            "internalType": "string",
            "name": "description",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "reward",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "confirmations",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "completed",
            "type": "bool"
          },
          {
            "internalType": "uint256",
            "name": "completedAt",
            "type": "uint256"
          }
        ],
        "internalType": "struct BuilderCreditStorage.Milestone",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "usdc",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  
  // Transaction functions
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "creditScore",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "githubUrl",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "projectName",
        "type": "string"
      },
      {
        "internalType": "string[]",
        "name": "milestoneDescriptions",
        "type": "string[]"
      },
      {
        "internalType": "uint256[]",
        "name": "milestoneRewards",
        "type": "uint256[]"
      }
    ],
    "name": "requestFunding",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "repayLoan",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "projectId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "milestoneIndex",
        "type": "uint256"
      }
    ],
    "name": "completeMilestone",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "projectId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "milestoneIndex",
        "type": "uint256"
      }
    ],
    "name": "verifyMilestone",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// BuilderCreditFactory ABI
export const BUILDER_CREDIT_FACTORY_ABI = [
  // Events
  "event CoreContractDeployed(address indexed coreContract, address owner)",
  "event ScoringContractDeployed(address indexed scoringContract, address owner)",
  
  // View functions
  {
    "inputs": [],
    "name": "coreImplementation",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "scoringImplementation",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "storageImplementation",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "securityImplementation",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  
  // Transaction functions
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "usdcAddress",
        "type": "address"
      }
    ],
    "name": "deployCore",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "coreContract",
        "type": "address"
      }
    ],
    "name": "deployScoring",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// BuilderCreditScoring ABI
export const BUILDER_CREDIT_SCORING_ABI = [
  // Events
  "event CreditFactorAdded(uint256 indexed factorId, string name, uint256 weight)",
  "event CreditFactorUpdated(uint256 indexed factorId, string name, uint256 weight, bool active)",
  "event GithubAccountLinked(address indexed user, string githubUsername)",
  
  // View functions
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getCreditScore",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "creditScore",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "isVerified",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllCreditFactors",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "ids",
        "type": "uint256[]"
      },
      {
        "internalType": "string[]",
        "name": "names",
        "type": "string[]"
      },
      {
        "internalType": "uint256[]",
        "name": "weights",
        "type": "uint256[]"
      },
      {
        "internalType": "bool[]",
        "name": "actives",
        "type": "bool[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getGithubUsername",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  
  // Transaction functions
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "githubUsername",
        "type": "string"
      },
      {
        "internalType": "bytes",
        "name": "signature",
        "type": "bytes"
      },
      {
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "linkGithubAccount",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "weight",
        "type": "uint256"
      }
    ],
    "name": "addCreditFactor",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "factorId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "weight",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "active",
        "type": "bool"
      }
    ],
    "name": "updateCreditFactor",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// USDC ABI (ERC20)
export const ERC20_ABI = [
  // Events
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
  
  // View functions
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      }
    ],
    "name": "allowance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  
  // Transaction functions
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "recipient",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "transfer",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "sender",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "recipient",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "transferFrom",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];
