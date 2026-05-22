#!/bin/bash

# Clear screen for beautiful CLI output
clear

echo -e "\033[1;33m"
echo "  ██████╗ ██╗████████╗██╗  ██╗██╗   ██╗██████╗ "
echo "  ██╔════╝ ██║╚══██╔══╝██║  ██║██║   ██║██╔══██╗"
echo "  ██║  ███╗██║   ██║   ███████║██║   ██║██████╔╝"
echo "  ██║   ██║██║   ██║   ██╔══██║██║   ██║██╔══██╗"
echo "  ╚██████╔╝██║   ██║   ██║  ██║╚██████╔╝██████╔╝"
echo "   ╚═════╝ ╚═╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═════╝ "
echo -e "\033[0m"
echo -e "\033[1;36mSai Music Academy — GitHub Automated Push & Backup System\033[0m"
echo "--------------------------------------------------------"
echo "This script will link your project, create a GitHub repository,"
20: echo "and push all code for backup and retrieval."
21: echo ""
22: 
23: # Ensure we are in the correct directory
24: cd "$(dirname "$0")"
25: 
26: # Check if gh CLI is logged in
27: echo -e "\033[1;32m[1/3] Verifying GitHub CLI authentication...\033[0m"
28: gh auth status >/dev/null 2>&1
29: 
30: if [ $? -ne 0 ]; then
31:   echo -e "\033[1;31mError: You are not logged into GitHub CLI in this terminal.\033[0m"
32:   echo "To authenticate, please run the following command in your terminal first:"
33:   echo -e "   \033[1;33mgh auth login\033[0m"
34:   echo "Select 'GitHub.com', choose 'HTTPS' or 'SSH', and authenticate via browser."
35:   echo "Then, run this script again."
echo "and push all code for backup and retrieval."
echo ""

# Ensure we are in the correct directory
cd "$(dirname "$0")"

# Check if gh CLI is logged in
echo -e "\033[1;32m[1/3] Verifying GitHub CLI authentication...\033[0m"
gh auth status >/dev/null 2>&1

if [ $? -ne 0 ]; then
  echo -e "\033[1;31mError: You are not logged into GitHub CLI in this terminal.\033[0m"
  echo "To authenticate, please run the following command in your terminal first:"
  echo -e "   \033[1;33mgh auth login\033[0m"
  echo "Select 'GitHub.com', choose 'HTTPS' or 'SSH', and authenticate via browser."
  echo "Then, run this script again."
  exit 1
fi
echo -e "\033[1;32m✓ GitHub CLI is authenticated!\033[0m"
echo ""

# Check if remote 'origin' is set up, if not add it
git remote remove origin >/dev/null 2>&1
git remote add origin https://github.com/GaneshBabu777/saimusicacademy.git

# Check if the repository already exists on GitHub
echo -e "\033[1;32m[2/3] Checking if GitHub repository 'saimusicacademy' exists...\033[0m"
gh repo view GaneshBabu777/saimusicacademy >/dev/null 2>&1

if [ $? -ne 0 ]; then
  echo "Repository does not exist yet. Creating public repository 'saimusicacademy'..."
  gh repo create saimusicacademy --public --source=. --remote=origin --push
  if [ $? -ne 0 ]; then
    echo -e "\033[1;31mError: Failed to create repository on GitHub.\033[0m"
    exit 1
  fi
  echo -e "\033[1;32m✓ Repository created and pushed successfully!\033[0m"
else
  echo "Repository already exists on GitHub. Pushing latest changes..."
  git push -u origin main
  if [ $? -ne 0 ]; then
    echo -e "\033[1;31mError: Failed to push to GitHub.\033[0m"
    exit 1
  fi
  echo -e "\033[1;32m✓ Pushed latest changes to GitHub successfully!\033[0m"
fi
echo ""

echo -e "\033[1;32m[3/3] ✓ GitHub Sync Complete!\033[0m"
echo "--------------------------------------------------------"
echo -e "Your backup is live at: \033[1;34mhttps://github.com/GaneshBabu777/saimusicacademy\033[0m"
echo "--------------------------------------------------------"
