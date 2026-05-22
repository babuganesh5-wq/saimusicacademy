#!/bin/bash

# Clear screen for beautiful CLI output
clear

echo -e "\033[1;33m"
echo "  ███████╗ █████╗ ██╗     ██████╗  ██████╗ ████████╗██╗  ██╗"
echo "  ██╔════╝██╔══██╗██║     ██╔══██╗██╔═══██╗╚══██╔══╝██║  ██║"
echo "  ███████╗███████║██║     ██║  ██║██║   ██║   ██║   ███████║"
echo "  ╚════██║██╔══██║██║     ██║  ██║██║   ██║   ██║   ██╔══██║"
echo "  ███████║██║  ██║███████╗██████╔╝╚██████╔╝   ██║   ██║  ██║"
echo "  ╚══════╝╚═╝  ╚═╝╚══════╝╚═════╝  ╚═════╝    ╚═╝   ╚═╝  ╚═╝"
echo -e "\033[0m"
echo -e "\033[1;36mSai Music Academy — Premium Automated Deployment System\033[0m"
echo "--------------------------------------------------------"
echo "This script will build your optimized site and deploy it to a"
echo "high-speed global edge network (Vercel) with free SSL (port 443),"
echo "HTTP/3 enabled, and DDoS protection."
echo ""

# Ensure we are in the correct directory
cd "$(dirname "$0")"

# 1. Run production build
echo -e "\033[1;32m[1/3] Building optimized production bundles...\033[0m"
npm run build

if [ $? -ne 0 ]; then
  echo -e "\033[1;31mError: Build failed. Please fix compilation issues before deploying.\033[0m"
  exit 1
fi
echo -e "\033[1;32m✓ Build successful!\033[0m"
echo ""

# 2. Deploy to Vercel
echo -e "\033[1;32m[2/3] Deploying to Vercel global edge CDN...\033[0m"
echo "If this is your first time deploying, Vercel will open a browser to log you in."
echo "Press ENTER to accept the defaults for all project prompts."
echo ""

npx vercel --prod

if [ $? -ne 0 ]; then
  echo -e "\033[1;31mError: Deployment failed. Make sure you logged in to Vercel successfully.\033[0m"
  exit 1
fi

echo ""
echo -e "\033[1;32m[3/3] ✓ Deployment Complete!\033[0m"
echo "--------------------------------------------------------"
echo -e "\033[1;36mHOW TO CONNECT YOUR CUSTOM DOMAIN (www.saimusicacademy.com):\033[0m"
echo "1. Go to your domain registrar (GoDaddy, Hostinger, Namecheap, Cloudflare, etc.)."
echo "2. Access the DNS Management / DNS Zone Editor panel."
echo "3. Add the following two DNS records:"
echo ""
echo -e "   \033[1;33mRecord 1 (For root domain saimusicacademy.com):\033[0m"
echo "   - Type: A"
echo "   - Name: @"
echo "   - Value: 76.76.21.21"
echo "   - TTL: Automatic / Default"
echo ""
echo -e "   \033[1;33mRecord 2 (For www.saimusicacademy.com redirect):\033[0m"
echo "   - Type: CNAME"
echo "   - Name: www"
echo "   - Value: cname.vercel-dns.com."
echo "   - TTL: Automatic / Default"
echo ""
echo "4. In your Vercel Dashboard, go to your Project Settings > Domains,"
echo "   add 'saimusicacademy.com' (it will automatically prompt to add 'www'),"
echo "   and Vercel will instantly secure it with SSL/HTTPS (port 443) and enable HTTP/3."
echo "--------------------------------------------------------"
echo -e "\033[1;32mYour Sai Music Academy website is now live, secure, and fast!\033[0m"
