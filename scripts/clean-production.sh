#!/bin/bash

# ============================================
# TALVIO - Script de Nettoyage Pré-Production
# ============================================

set -e  # Arrêter en cas d'erreur

echo ""
echo "============================================"
echo "🚀 TALVIO - Nettoyage Pré-Production"
echo "============================================"
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================
# ÉTAPE 1: Supprimer fichiers obsolètes
# ============================================

echo -e "${BLUE}📦 ÉTAPE 1: Suppression fichiers obsolètes${NC}"
echo ""

FILES_TO_DELETE=(
    "globals.css"
    "components/charts/PyramideChart.tsx"
    "components/charts/EvolutionETChart.tsx"
    "components/visions/VisionViewer.tsx"
    "lib/types/calculations.ts"
)

for file in "${FILES_TO_DELETE[@]}"; do
    if [ -f "$file" ]; then
        echo -e "   ${RED}✗${NC} Suppression: $file"
        rm -f "$file"
    else
        echo -e "   ${YELLOW}○${NC} Déjà supprimé: $file"
    fi
done

# Supprimer __MACOSX
if [ -d "__MACOSX" ]; then
    echo -e "   ${RED}✗${NC} Suppression: __MACOSX/"
    rm -rf __MACOSX
else
    echo -e "   ${YELLOW}○${NC} Déjà supprimé: __MACOSX/"
fi

echo ""

# ============================================
# ÉTAPE 2: Organiser scripts
# ============================================

echo -e "${BLUE}📁 ÉTAPE 2: Organisation scripts${NC}"
echo ""

mkdir -p scripts

if [ -f "hashPassword.js" ]; then
    echo -e "   ${GREEN}→${NC} Déplacement: hashPassword.js → scripts/"
    mv hashPassword.js scripts/
else
    echo -e "   ${YELLOW}○${NC} Déjà déplacé: hashPassword.js"
fi

echo ""

# ============================================
# ÉTAPE 3: Consolider types
# ============================================

echo -e "${BLUE}📝 ÉTAPE 3: Consolidation types${NC}"
echo ""

mkdir -p lib/types

if [ -f "types/builder.ts" ]; then
    echo -e "   ${GREEN}→${NC} Déplacement: types/builder.ts → lib/types/"
    mv types/builder.ts lib/types/
    
    # Supprimer dossier types si vide
    if [ -d "types" ] && [ -z "$(ls -A types)" ]; then
        echo -e "   ${RED}✗${NC} Suppression: types/ (vide)"
        rmdir types
    fi
else
    echo -e "   ${YELLOW}○${NC} Déjà consolidé: builder.ts"
fi

echo ""

# ============================================
# ÉTAPE 4: Renommer WaterfallChart
# ============================================

echo -e "${BLUE}🔄 ÉTAPE 4: Renommer WaterfallChart (charts)${NC}"
echo ""

if [ -f "components/charts/WaterfallChart.tsx" ]; then
    echo -e "   ${GREEN}→${NC} Renommage: WaterfallChart.tsx → SimpleWaterfallChart.tsx"
    mv components/charts/WaterfallChart.tsx components/charts/SimpleWaterfallChart.tsx
    
    # Mettre à jour le nom de l'export
    sed -i.bak 's/export function WaterfallChart/export function SimpleWaterfallChart/g' components/charts/SimpleWaterfallChart.tsx
    rm -f components/charts/SimpleWaterfallChart.tsx.bak
else
    echo -e "   ${YELLOW}○${NC} Déjà renommé ou supprimé"
fi

echo ""

# ============================================
# ÉTAPE 5: Scanner console.log
# ============================================

echo -e "${BLUE}🧼 ÉTAPE 5: Scanner console.log${NC}"
echo ""

CONSOLE_FILES=$(find app components lib -type f \( -name "*.tsx" -o -name "*.ts" \) ! -name "logger.ts" -exec grep -l "console\." {} \; 2>/dev/null || true)

if [ -z "$CONSOLE_FILES" ]; then
    echo -e "   ${GREEN}✓${NC} Aucun console.log trouvé!"
else
    echo "$CONSOLE_FILES" > /tmp/talvio_console_files.txt
    FILE_COUNT=$(echo "$CONSOLE_FILES" | wc -l)
    
    echo -e "   ${RED}⚠${NC}  Fichiers avec console.log: ${RED}$FILE_COUNT${NC}"
    echo ""
    echo -e "   ${YELLOW}Liste sauvegardée dans: /tmp/talvio_console_files.txt${NC}"
    echo ""
    echo -e "   ${YELLOW}Fichiers à vérifier manuellement:${NC}"
    echo "$CONSOLE_FILES" | head -10 | sed 's/^/      - /'
    
    if [ "$FILE_COUNT" -gt 10 ]; then
        echo -e "      ${YELLOW}... et $((FILE_COUNT - 10)) autres fichiers${NC}"
    fi
fi

echo ""

# ============================================
# ÉTAPE 6: Vérifier structure
# ============================================

echo -e "${BLUE}🔍 ÉTAPE 6: Vérification structure${NC}"
echo ""

# Compter fichiers par type
TS_FILES=$(find app components lib -name "*.ts" -o -name "*.tsx" | wc -l)
COMPONENT_FILES=$(find components -name "*.tsx" | wc -l)
PAGE_FILES=$(find app -name "page.tsx" | wc -l)

echo -e "   ${GREEN}✓${NC} Fichiers TypeScript: $TS_FILES"
echo -e "   ${GREEN}✓${NC} Composants React: $COMPONENT_FILES"
echo -e "   ${GREEN}✓${NC} Pages Next.js: $PAGE_FILES"

echo ""

# ============================================
# RÉSUMÉ
# ============================================

echo ""
echo "============================================"
echo -e "${GREEN}✅ NETTOYAGE TERMINÉ${NC}"
echo "============================================"
echo ""

echo -e "${YELLOW}📋 Prochaines étapes:${NC}"
echo ""
echo "   1. ${BLUE}Vérifier les console.log${NC}"
echo "      cat /tmp/talvio_console_files.txt"
echo ""
echo "   2. ${BLUE}Mettre à jour les imports de types${NC}"
echo "      - Remplacer: @/types/builder"
echo "      - Par: @/lib/types/builder"
echo ""
echo "   3. ${BLUE}Tester le build${NC}"
echo "      npm run build"
echo ""
echo "   4. ${BLUE}Activer RLS sur Supabase${NC}"
echo "      - Voir TALVIO_AUDIT_PRODUCTION_READY.md"
echo ""
echo "   5. ${BLUE}Créer .env.example${NC}"
echo "      - Documenter toutes les variables"
echo ""

echo -e "${GREEN}🎉 Votre code est maintenant plus propre!${NC}"
echo ""
