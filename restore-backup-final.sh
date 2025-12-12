#!/bin/bash

if [ -z "$1" ]; then
    echo "❌ Usage: ./restore-backup-final.sh <backup_directory>"
    echo ""
    echo "Exemple:"
    echo "  ./restore-backup-final.sh backup-final-20251211-223000"
    echo ""
    exit 1
fi

BACKUP_DIR="$1"

if [ ! -d "$BACKUP_DIR" ]; then
    echo "❌ Le dossier de backup n'existe pas: $BACKUP_DIR"
    exit 1
fi

echo "🔄 Restauration depuis: $BACKUP_DIR"
echo ""
read -p "Êtes-vous sûr? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Restaurer tous les fichiers
    cp -r "$BACKUP_DIR"/* .
    
    echo ""
    echo "✅ Restauration terminée!"
    echo ""
    echo "Vérifier:"
    echo "  git status"
else
    echo "Restauration annulée."
fi
