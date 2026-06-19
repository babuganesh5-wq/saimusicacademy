#!/bin/bash
PROJECT_NAME="saimusicacademy"
SOURCE_DIR="/Users/ganeshbabu/.gemini/antigravity/scratch/saimusicacademy"

echo "=========================================================="
echo "    Sai Music Academy — Google Drive Sync Utility        "
echo "=========================================================="

# Auto-detect Google Drive mount
GDRIVE_DIR=$(find /Users/ganeshbabu/Library/CloudStorage -maxdepth 1 -name "GoogleDrive-*" 2>/dev/null | head -n 1)

if [ -z "$GDRIVE_DIR" ]; then
    GDRIVE_DIR="/Users/ganeshbabu/Google Drive"
fi

# Fallback check
if [ ! -d "$GDRIVE_DIR" ] && [ -d "/Volumes/GoogleDrive" ]; then
    GDRIVE_DIR="/Volumes/GoogleDrive"
fi

if [ ! -d "$GDRIVE_DIR" ]; then
    echo "⚠️ Google Drive is not mounted or not installed."
    echo "Please install the Google Drive Desktop application on your Mac first."
    echo "It will automatically mount to: ~/Library/CloudStorage/GoogleDrive-[your-email]"
    echo ""
    echo "Or run this script by passing your custom Google Drive path:"
    echo "   ./sync-gdrive.sh /path/to/google/drive"
    exit 1
fi

# Accept manual path overrides
if [ ! -z "$1" ]; then
    GDRIVE_DIR="$1"
fi

DEST_DIR="$GDRIVE_DIR/My Drive/$PROJECT_NAME"
echo "🟢 Found Google Drive at: $GDRIVE_DIR"
echo "🔄 Syncing workspace to: $DEST_DIR"

mkdir -p "$DEST_DIR"

# Perform clean sync excluding heavy dependency folders
rsync -av --progress \
  --exclude='node_modules' \
  --exclude='.venv' \
  --exclude='dist' \
  --exclude='.git' \
  --exclude='__pycache__' \
  --exclude='*.pyc' \
  "$SOURCE_DIR/" "$DEST_DIR/"

echo "✅ Sync complete! Your codebase is safely stored on Google Drive."
