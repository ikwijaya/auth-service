#!/bin/bash

# Step 1: Run depcheck to find unused dependencies
echo "Running depcheck to find unused dependencies..."

# Get unused dependencies from both 'dependencies' and 'devDependencies'
unused_deps=$(depcheck --json | jq -r '.unused[]')
unused_dev_deps=$(depcheck --json | jq -r '.devDependencies[]')

# Combine both 'dependencies' and 'devDependencies' unused dependencies
all_unused_deps="$unused_deps $unused_dev_deps"

# List of dependencies to skip
skip_deps=("is-ci" "husky")

# Check if there are any unused dependencies
if [ -z "$all_unused_deps" ]; then
  echo "No unused dependencies found."
  exit 0
fi

# Step 2: Uninstall unused dependencies from both 'dependencies' and 'devDependencies'
echo "Found unused dependencies: $all_unused_deps"
for dep in $all_unused_deps; do
  # Check if the dependency is in the skip list
  if [[ " ${skip_deps[@]} " =~ " $dep " ]]; then
    echo "Skipping $dep (it's in the skip list)."
  else
    echo "Uninstalling $dep..."
    npm uninstall "$dep" --save --save-dev
  fi
done

# Step 3: Clean up node_modules (optional)
echo "Cleaning up node_modules..."
rm -rf node_modules
rm package-lock.json

# Step 4: Reinstall the remaining dependencies to ensure everything is in sync
echo "Reinstalling dependencies..."
npm install

echo "Unused dependencies removed and project cleaned up successfully."
