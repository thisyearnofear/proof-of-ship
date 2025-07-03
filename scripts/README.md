# Builder Credit Scripts

This directory contains utility scripts for the Builder Credit platform.

## Deployment Scripts

- **deploy.js** - Main deployment script for the smart contracts
- **deploy-contracts.js** - Alternative deployment script for the contracts
- **deploy-production.sh** - Shell script for production deployment
- **deploy-firestore-rules.js** - Script to deploy Firestore security rules

## Data Management Scripts

- **list-projects.js** - Lists all projects in the system
- **list-users.js** - Lists all users in the system
- **import-projects.js** - Imports projects from external sources
- **delete-dummy-projects.js** - Removes test projects from the database
- **migrate-to-firebase.js** - Migrates data to Firebase
- **migrate-celo-projects.js** - Migrates Celo projects to the platform

## Permission Management Scripts

- **auto-grant-permissions.js** - Automatically grants permissions based on rules
- **grant-project-ownership.js** - Grants ownership of projects to users
- **grant-project-ownership-by-github.js** - Grants project ownership based on GitHub identity
- **grant-project-permissions.js** - Grants specific permissions for projects
- **verify-repo-ownership.js** - Verifies GitHub repository ownership

## Creating Resources

- **create-project.js** - Creates a new project in the system

## Usage

Most scripts can be run using Node.js:

```bash
node scripts/script-name.js
```

For deployment scripts, use Hardhat:

```bash
npx hardhat run scripts/deploy.js --network localhost
```

For shell scripts:

```bash
./scripts/deploy-production.sh
```

## Notes

- Some scripts may require environment variables to be set
- Check each script for specific requirements and command-line options
- For production use, always review scripts before running them
