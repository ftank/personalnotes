# 🗄️ Como Executar o Schema SQL no Railway

## Problema
Não há interface visual para executar SQL no Railway PostgreSQL.

## ✅ Solução: 3 Opções

---

## Opção 1: Via Railway CLI (Recomendado)

### 1. Instalar Railway CLI

**Windows (PowerShell como Admin):**
```powershell
iwr https://github.com/railwayapp/cli/releases/latest/download/railway-windows-amd64.exe -OutFile railway.exe
```

Ou baixar direto:
👉 https://github.com/railwayapp/cli/releases/latest

### 2. Fazer Login
```bash
railway login
```

### 3. Conectar ao Projeto
```bash
cd C:\Users\Tank\Desktop\Projects\Personalnotes
railway link
```

### 4. Executar Schema
```bash
railway run --service postgresql psql < personal-notes-backend/schema.sql
```

---

## Opção 2: Via Connection String (Mais Simples)

### 1. Pegar Connection String do Railway

No Railway:
1. Clique no **PostgreSQL** service
2. **Variables** tab
3. Copiar **DATABASE_URL** ou **DATABASE_PRIVATE_URL**

Será algo como:
```
postgresql://postgres:senha@monorail.proxy.rlwy.net:12345/railway
```

### 2. Instalar PostgreSQL Client (se não tiver)

**Windows:**
```powershell
winget install PostgreSQL.PostgreSQL
```

Ou baixar: https://www.postgresql.org/download/windows/

### 3. Executar Schema

Abrir **PowerShell** na pasta do projeto:

```bash
$env:PGPASSWORD="sua-senha"
psql -h monorail.proxy.rlwy.net -U postgres -d railway -p 12345 -f personal-notes-backend/schema.sql
```

**Substitua:**
- `sua-senha` → senha do DATABASE_URL
- `monorail.proxy.rlwy.net` → host do DATABASE_URL
- `12345` → porta do DATABASE_URL

---

## Opção 3: Via TablePlus/DBeaver (Visual)

### 1. Baixar TablePlus (Grátis)

https://tableplus.com/

Ou DBeaver: https://dbeaver.io/

### 2. Criar Nova Conexão

1. Abrir TablePlus
2. **Create a new connection** → PostgreSQL
3. Preencher com dados do Railway:
   - **Host:** (copiar do DATABASE_URL)
   - **Port:** (copiar do DATABASE_URL)
   - **User:** postgres
   - **Password:** (copiar do DATABASE_URL)
   - **Database:** railway

### 3. Conectar

Clicar em **Connect**

### 4. Executar Schema

1. **SQL** → **New Query**
2. Abrir arquivo `personal-notes-backend/schema.sql`
3. Copiar TODO o conteúdo
4. Colar na query
5. **Run** ou **Execute** (Ctrl/Cmd + Enter)

---

## Opção 4: Via Backend Endpoint (Automático)

Vou criar um endpoint no backend para executar o schema automaticamente.

### Criar arquivo de migration:

`personal-notes-backend/migrate.js`

```javascript
const { query } = require('./src/config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('🔄 Running database migration...');

    const schemaSQL = fs.readFileSync(
      path.join(__dirname, 'schema.sql'),
      'utf8'
    );

    await query(schemaSQL);

    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
```

### Executar via Railway:

```bash
# No terminal local
cd personal-notes-backend
railway run node migrate.js
```

---

## 🎯 Recomendação

**Para você agora:**

1. **Mais Rápido:** Opção 3 (TablePlus) - Visual e fácil
2. **Mais Profissional:** Opção 1 (Railway CLI) - Bom para o futuro
3. **Sem instalar nada:** Opção 4 (Endpoint automático) - Vou criar para você

---

## Qual opção você prefere?

- [ ] Opção 1: Railway CLI
- [ ] Opção 2: psql command line
- [ ] Opção 3: TablePlus (Visual)
- [ ] Opção 4: Criar endpoint automático

**Me avisa qual você quer e te guio passo a passo! 🚀**
