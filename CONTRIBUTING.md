# Contributing to POS Dashboard

Thank you for your interest in contributing to the POS Dashboard! This document provides guidelines and instructions for contributing to this project.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/POS-dashboard.git`
3. Install dependencies: `npm install`
4. Set up environment variables (see README.md)
5. Run the development server: `npm run dev`

## Development Workflow

1. Create a new branch for your feature or bugfix: `git checkout -b feature/your-feature-name`
2. Make your changes
3. Test your changes locally
4. Commit your changes with a descriptive commit message
5. Push your branch to your fork: `git push origin feature/your-feature-name`
6. Create a pull request to the main repository

## Project Structure

Please refer to the README.md file for a detailed overview of the project structure.

## Code Style

- Follow the existing code style in the project
- Use meaningful variable and function names
- Add comments for complex logic
- Format your code using the project's formatting rules

## Testing

- Test your changes thoroughly before submitting a pull request
- Ensure that your changes don't break existing functionality

## Deployment

The project is deployed to two platforms:

1. Firebase Hosting (Primary): https://proofofship.web.app
2. Vercel (Secondary): https://proof-of-ship.vercel.app/

See the README.md file for deployment instructions.

## Adding New Projects

To add a new project to the dashboard:

1. Update the `src/constants/celoProjects.js` file with the new project details
2. Run the import script: `node scripts/import-projects.js`
3. Grant project ownership: `node scripts/grant-project-ownership-by-github.js <github-username> <project-slug>`

## Questions and Support

If you have any questions or need support, please open an issue in the repository.

Thank you for contributing to the POS Dashboard!
