# Contributing to Quill

Thank you for your interest in contributing to Quill! This document provides guidelines and instructions for contributing to the project.

## 🎯 How to Contribute

### Making Changes

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/postadmin.git
   cd postadmin
   ```
3. **Create a new branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```
4. **Make your changes** following the code style and conventions
5. **Test your changes** thoroughly
6. **Commit your changes** with clear, descriptive messages:
   ```bash
   git commit -m "Add: description of your feature"
   # or
   git commit -m "Fix: description of your bug fix"
   ```
7. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```
8. **Submit a Pull Request** to the main repository

## 📋 Pull Request Guidelines

### Before Submitting

- ✅ Ensure your code follows the existing TypeScript and React patterns
- ✅ Test your changes locally
- ✅ Update documentation if needed
- ✅ Check for linting errors: `pnpm run lint`
- ✅ Ensure all existing tests pass (if applicable)

### Pull Request Title Format

Use one of these prefixes:
- `Add:` for new features
- `Fix:` for bug fixes
- `Update:` for updates to existing features
- `Refactor:` for code refactoring
- `Docs:` for documentation changes
- `Style:` for formatting changes

### Pull Request Description

Please include:
- A clear description of what the PR does
- Why the change is needed
- Any breaking changes (if applicable)
- Screenshots or examples (if UI changes)

## 🏗️ Development Setup

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Run the development server**:
   ```bash
   pnpm dev
   ```

3. **Run linting**:
   ```bash
   pnpm run lint
   ```

## 📝 Code Style

- Use TypeScript for all new code
- Follow the existing component structure
- Use functional components with hooks
- Follow the naming conventions used in the project
- Add JSDoc comments for complex functions

## 🔍 Project Structure

- `app/` - Next.js app directory with routes and API endpoints
- `components/` - React components organized by feature
- `lib/` - Utility functions, helpers, and stores
- `hooks/` - Custom React hooks
- `types/` - TypeScript type definitions

## ⚠️ Important Notes

### License Agreement

By contributing to this project, you agree that:
- Your contributions will be licensed under the same Non-Commercial Open Source License
- You have the right to submit the code you're contributing
- Your contributions may be used, modified, and distributed according to the project's license

### Commercial Use

This project uses a Non-Commercial Open Source License. This means:
- ✅ You can use and modify the code for free
- ❌ You cannot sell or use it in commercial products without permission
- 🔄 All modifications should be contributed back via Pull Request

## 🐛 Reporting Issues

If you find a bug or have a feature request:

1. Check if the issue already exists
2. Create a new issue with:
   - Clear title and description
   - Steps to reproduce (for bugs)
   - Expected vs actual behavior
   - Environment details (OS, Node version, etc.)

## 💬 Questions?

If you have questions about contributing, feel free to:
- Open an issue with the `question` label
- Check existing issues and discussions

Thank you for contributing to Quill! 🎉

