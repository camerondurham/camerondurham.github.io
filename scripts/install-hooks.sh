#!/bin/bash

# Install git hooks for this repository

echo "Installing git hooks..."

# Create hooks directory if it doesn't exist
mkdir -p .git/hooks

# Copy pre-commit hook
cp scripts/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit

echo "✓ Pre-commit hook installed (strips trailing whitespace)"
echo "Git hooks installed successfully!"
