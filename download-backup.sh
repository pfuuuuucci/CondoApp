
#!/bin/bash

API_KEY="eE1CdBpSeNcJ098"
URL="https://condo-torre-panoramica-app-paulofucci.replit.app"

echo "🔍 Listando backups remotos..."

# Listar todos os backups
BACKUP_LIST=$(curl -s -H "X-API-Key: $API_KEY" "$URL/api/backup/list")

if echo "$BACKUP_LIST" | grep -q '"success":true'; then
    # Extrair todos os nomes de backup
    BACKUP_NAMES=$(echo "$BACKUP_LIST" | grep -o '"nome":"[^"]*"' | cut -d'"' -f4)
    
    if [ ! -z "$BACKUP_NAMES" ]; then
        # Criar pasta de backups local se não existir
        mkdir -p ./backups
        
        # Contar total de backups
        TOTAL=$(echo "$BACKUP_NAMES" | wc -l)
        echo "📦 Encontrados $TOTAL backup(s) para download"
        echo ""
        
        CONTADOR=1
        
        # Criar arquivo temporário com os nomes dos backups
        TEMP_FILE=$(mktemp)
        echo "$BACKUP_NAMES" > "$TEMP_FILE"
        
        # Baixar cada backup
        while IFS= read -r BACKUP_NAME; do
            if [ ! -z "$BACKUP_NAME" ]; then
                echo "📥 [$CONTADOR/$TOTAL] Baixando: $BACKUP_NAME"
                
                curl -H "X-API-Key: $API_KEY" \
                     "$URL/api/backup/download/$BACKUP_NAME" \
                     -o "./backups/$BACKUP_NAME" \
                     --silent --show-error
                
                if [ $? -eq 0 ]; then
                    # Verificar se arquivo foi baixado corretamente
                    if [ -f "./backups/$BACKUP_NAME" ] && [ -s "./backups/$BACKUP_NAME" ]; then
                        TAMANHO=$(du -h "./backups/$BACKUP_NAME" | cut -f1)
                        echo "   ✅ Sucesso! Tamanho: $TAMANHO"
                    else
                        echo "   ❌ Erro: Arquivo vazio ou não criado"
                        rm -f "./backups/$BACKUP_NAME" 2>/dev/null
                    fi
                else
                    echo "   ❌ Erro no download"
                fi
                
                CONTADOR=$((CONTADOR + 1))
                echo ""
            fi
        done < "$TEMP_FILE"
        
        # Remover arquivo temporário
        rm -f "$TEMP_FILE"
        
        echo "🎉 Download concluído!"
        echo "📁 Arquivos salvos em: ./backups/"
        echo ""
        
        # Limpeza inteligente: manter apenas os 10 backups mais recentes (locais + remotos)
        echo "🧹 Organizando backups locais (mantendo os 10 mais recentes)..."
        
        # Verificar todos os arquivos locais existentes
        ARQUIVOS_REMOVIDOS=0
        if ls ./backups/*.sql >/dev/null 2>&1; then
            # Listar todos os arquivos locais ordenados por data (mais recente primeiro)
            cd ./backups
            TODOS_ARQUIVOS=$(ls -t *.sql 2>/dev/null)
            TOTAL_ARQUIVOS=$(echo "$TODOS_ARQUIVOS" | wc -l)
            
            echo "   📊 Total de backups locais: $TOTAL_ARQUIVOS"
            
            # Se temos mais de 10 arquivos, remover os mais antigos
            if [ $TOTAL_ARQUIVOS -gt 10 ]; then
                PARA_REMOVER=$((TOTAL_ARQUIVOS - 10))
                echo "   🗑️ Removendo os $PARA_REMOVER backup(s) mais antigo(s)..."
                
                # Pegar os arquivos mais antigos (últimos da lista ordenada por data)
                echo "$TODOS_ARQUIVOS" | tail -n $PARA_REMOVER | while read ARQUIVO_ANTIGO; do
                    if [ ! -z "$ARQUIVO_ANTIGO" ]; then
                        echo "      ➤ Removendo: $ARQUIVO_ANTIGO"
                        rm -f "$ARQUIVO_ANTIGO"
                        ARQUIVOS_REMOVIDOS=$((ARQUIVOS_REMOVIDOS + 1))
                    fi
                done
                
                echo "   ✅ $PARA_REMOVER arquivo(s) antigo(s) removido(s)"
            else
                echo "   📊 Sistema limpo: mantendo todos os $TOTAL_ARQUIVOS arquivos (limite: 10)"
            fi
            
            cd ..
        fi
        
        echo ""
        echo "📋 Resumo dos arquivos atuais:"
        ls -lh ./backups/*.sql 2>/dev/null | awk '{print "   📄 " $9 " - " $5}' || echo "   Nenhum arquivo .sql encontrado"
        
    else
        echo "❌ Nenhum backup encontrado no servidor"
    fi
else
    echo "❌ Erro ao listar backups:"
    echo "$BACKUP_LIST"
fi
