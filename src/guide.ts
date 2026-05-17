export const guideMarkdown = `# Clean Install iMac + Dev Environment — Guia Completo
> Stack: Vite puro · Sem Next.js · Deploy via Cloudflare/Netlify

---

## Parte 0 — Salva todos os projetos locais no GitHub

Essa etapa vem primeiro porque é a mais arriscada de esquecer. Seus projetos podem estar em três lugares: no \`~/Developer\`, dentro do iCloud Drive, ou ambos.

### 0.1 — Mapa dos projetos no iCloud

O iCloud Drive espelha arquivos localmente em \`~/Library/Mobile Documents/com~apple~CloudDocs/\`. Se você organizou projetos lá, eles ficam em:

\`\`\`bash
ls ~/Library/Mobile\\ Documents/com~apple~CloudDocs/
\`\`\`

Busca por repositórios git em toda a sua home (incluindo iCloud):

\`\`\`bash
find ~ -name ".git" -type d -not -path "*/node_modules/*" 2>/dev/null | sed 's|/.git||'
\`\`\`

### 0.2 — Verifica quais já têm remote

\`\`\`bash
# Roda dentro de cada pasta de projeto
git remote -v
\`\`\`

### 0.3 — Script de auditoria completa

\`\`\`bash
find ~ -name ".git" -type d \\
  -not -path "*/node_modules/*" \\
  -not -path "*/.Trash/*" \\
  2>/dev/null | while read gitdir; do
    repo=$(dirname "$gitdir")
    remote=$(git -C "$repo" remote get-url origin 2>/dev/null || echo "SEM REMOTE")
    branch=$(git -C "$repo" branch --show-current 2>/dev/null)
    dirty=$(git -C "$repo" status --short 2>/dev/null | wc -l | tr -d ' ')
    echo "Repo: $repo | Remote: $remote | Branch: $branch | Dirty: $dirty"
done
\`\`\`

### 0.4 — Para cada projeto sem remote

**Instala o GitHub CLI:**

\`\`\`bash
brew install gh
\`\`\`

**Autentica no GitHub:**

\`\`\`bash
gh auth login
\`\`\`

**Cria o repositório e faz o push:**

\`\`\`bash
cd ~/caminho/do/projeto
git init
git add .
git commit -m "chore: backup antes do clean install"
gh repo create nome-do-projeto --private --source=. --remote=origin --push
\`\`\`

Se já tem remote mas tem mudanças locais:

\`\`\`bash
git add .
git commit -m "chore: stash antes do clean install"
git push
\`\`\`

### 0.5 — Limpa node_modules do iCloud

\`\`\`bash
find ~/Library/Mobile\\ Documents/com~apple~CloudDocs -name "node_modules" \\
  -type d -prune -exec rm -rf {} \\; 2>/dev/null
\`\`\`

> **Nota:** Com 2TB de iCloud, os projetos sobrevivem ao clean install se estiverem no iCloud Drive. Mesmo assim, **garanta o GitHub como segunda cópia**. iCloud não é versionamento de código.

### 0.6 — Checklist final antes de formatar

Roda esse script primeiro — cria uma pasta datada no Desktop com todos os configs:

\`\`\`bash
BACKUP=~/Desktop/backup-$(date +%Y%m%d)
mkdir -p "$BACKUP"

cp -r ~/.ssh "$BACKUP/"
cp ~/.gitconfig "$BACKUP/" 2>/dev/null
cp ~/.zshrc "$BACKUP/" 2>/dev/null
cp ~/.zshrc.local "$BACKUP/" 2>/dev/null
cp ~/.npmrc "$BACKUP/" 2>/dev/null
cp -r ~/.claude "$BACKUP/" 2>/dev/null

# .env de cada projeto
find ~ -name ".env" \
  -not -path "*/node_modules/*" \
  -not -path "*/.Trash/*" \
  -not -path "*/Library/Application Support/*" \
  2>/dev/null | while read f; do
  dest="$BACKUP$(dirname "$f")"
  mkdir -p "$dest" && cp "$f" "$dest/"
done

echo "Backup em $BACKUP"
\`\`\`

Depois confirma cada item:

- [ ] Todos os projetos com remote GitHub confirmado (\`git remote -v\`)
- [ ] Nenhum projeto com arquivos sujos não commitados
- [ ] node_modules removidos dos projetos no iCloud
- [ ] Backup do \`~/.ssh/\` (chaves SSH)
- [ ] Backup do \`~/.gitconfig\`
- [ ] Backup do \`~/.zshrc\` e \`~/.zshrc.local\` (tem API keys aí)
- [ ] Backup do \`~/.npmrc\` se existir
- [ ] Backup de \`.env\` de cada projeto
- [ ] Configs do Claude Code: \`~/.claude/\`
- [ ] Lista de extensões VSCode: \`code --list-extensions > ~/Desktop/vscode-extensions.txt\`
- [ ] Lista de extensões Cursor: \`cursor --list-extensions > ~/Desktop/cursor-extensions.txt\`
- [ ] Sign out do iCloud (System Settings → Apple ID)
- [ ] Sign out do iMessage e FaceTime
- [ ] Sign out da App Store
- [ ] Sign out de licenças por máquina (Adobe, JetBrains, etc.)
- [ ] Desautoriza o Music app (Account → Authorizations → Deauthorize This Computer)

---

## Parte 1 — Clean Install do macOS

### Método recomendado (Apple Silicon e Intel com T2)

**Apple menu → System Settings → General → Transfer or Reset → Erase All Content and Settings**

Autentica, segue os passos, deixa apagar tudo. O Mac reinicia no Setup Assistant — **não restaure de backup**, configura como novo. Cria seu usuário com nome curto e sem espaço (\`daniel\`, não \`Daniel Mendes\`) — evita dor de cabeça com paths no terminal.

**Se "Erase All Content" não aparecer** (iMac Intel antigo sem T2): reinicia segurando \`Cmd+R\`, abre Disk Utility → apaga o disco em APFS, reinstala o macOS pelo menu.

### Após o primeiro boot

1. **System Settings → General → Software Update** — atualiza tudo antes de qualquer coisa
2. Faz login no iCloud — seus projetos que estavam no iCloud Drive vão sincronizar de volta
3. **Privacy & Security → FileVault** — ativa e guarda a recovery key num lugar seguro
4. Aguarda o iCloud sincronizar (pode demorar horas dependendo da quantidade de dados)

---

## Parte 2 — Fundação do ambiente

A partir daqui, tudo no Terminal (\`Cmd+Espaço → "Terminal"\`).

### 2.1 — Xcode Command Line Tools

\`\`\`bash
xcode-select --install
\`\`\`

Aceita o popup, espera terminar. Confirma com \`xcode-select -p\`.

### 2.2 — Homebrew

\`\`\`bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
\`\`\`

No fim ele mostra os comandos pra adicionar ao PATH — copia e roda esses comandos exatos.

### 2.3 — Git — instalar

\`\`\`bash
brew install git
\`\`\`

### 2.4 — Git — configurar

\`\`\`bash
git config --global user.name "Daniel"
git config --global user.email "danielvm@gmail.com"
git config --global init.defaultBranch main
git config --global pull.rebase false
\`\`\`

### 2.5 — GitHub CLI — instalar

\`\`\`bash
brew install gh
\`\`\`

### 2.6 — GitHub CLI — autenticar

O \`gh auth login\` gera a SSH key, faz upload direto pro GitHub e configura o credential helper — sem copiar chave, sem abrir settings.

\`\`\`bash
gh auth login
\`\`\`

Quando perguntar, escolhe:
- **GitHub.com**
- **SSH**
- **Generate a new SSH key** → define uma passphrase
- **Login with a web browser** → abre o browser, autoriza

### 2.7 — GitHub CLI — verificar

\`\`\`bash
gh auth status
ssh -T git@github.com
\`\`\`

---

## Parte 3 — .zshrc

O shell é configurado uma única vez, aqui. A partir daqui nenhuma outra parte toca no \`.zshrc\`.

### 3.1 — Oh My Zsh — instalar

\`\`\`bash
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended
\`\`\`

O \`--unattended\` evita que o instalador mude o shell padrão (já é zsh no macOS) e não abre uma nova sessão no fim.

### 3.2 — Plugins externos — instalar

O Oh My Zsh carrega plugins da pasta \`~/.oh-my-zsh/custom/plugins/\`. Os dois abaixo não vêm incluídos — precisam ser clonados:

\`\`\`bash
git clone https://github.com/zsh-users/zsh-autosuggestions \\
  \${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions

git clone https://github.com/zsh-users/zsh-syntax-highlighting.git \\
  \${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting
\`\`\`

### 3.3 — Escrever o .zshrc

\`\`\`bash
cat > ~/.zshrc << 'EOF'
# ---- Oh My Zsh ----
export ZSH="$HOME/.oh-my-zsh"
ZSH_THEME="robbyrussell"

plugins=(
  git
  nvm
  zsh-autosuggestions
  zsh-syntax-highlighting
)

source $ZSH/oh-my-zsh.sh

# ---- PATH base ----
eval "$(/opt/homebrew/bin/brew shellenv)"

# ---- pyenv ----
export PYENV_ROOT="$HOME/.pyenv"
export PATH="$PYENV_ROOT/bin:$PATH"
command -v pyenv &>/dev/null && eval "$(pyenv init -)"

# ---- pnpm ----
export PNPM_HOME="$HOME/Library/pnpm"
export PATH="$PNPM_HOME:$PATH"

# ---- Aliases ----
alias ll='eza -la --git'
alias cat='bat --paging=never'
alias gs='git status'
alias gp='git pull'
alias gc='git commit -m'
alias dev='pnpm run dev'
alias build='pnpm run build'
alias preview='pnpm run preview'

# ---- fzf ----
[ -f ~/.fzf.zsh ] && source ~/.fzf.zsh

# ---- API keys e segredos (não vai pro git) ----
[ -f ~/.zshrc.local ] && source ~/.zshrc.local
EOF
\`\`\`

O plugin \`nvm\` do OMZ faz lazy-loading — carrega o nvm apenas na primeira vez que o comando é chamado, sem atrasar o arranque do shell. O bloco manual de NVM deixa de ser necessário.

### 3.4 — Criar o .zshrc.local

\`\`\`bash
cat > ~/.zshrc.local << 'EOF'
export ANTHROPIC_API_KEY="sk-..."
export CLOUDFLARE_API_TOKEN="..."
# outras API keys aqui
EOF
\`\`\`

Nunca commita esse arquivo — guarda os segredos fora do git.

### 3.5 — Activar

\`\`\`bash
source ~/.zshrc
\`\`\`

A partir daqui não se toca mais no \`.zshrc\`. As próximas instalações limitam-se a \`brew install\` ou \`npm install -g\` — o shell já sabe o que fazer quando cada ferramenta estiver presente.

---

## Parte 4 — Node via NVM

### 4.1 — NVM — instalar

\`\`\`bash
brew install nvm
mkdir ~/.nvm
source ~/.zshrc
\`\`\`

O \`source\` aqui garante que o plugin \`nvm\` do OMZ encontra o \`nvm.sh\` recém-instalado na primeira chamada.

### 4.2 — Node 24 LTS — instalar

\`\`\`bash
nvm install 24
nvm alias default 24
\`\`\`

### 4.3 — pnpm — instalar

\`\`\`bash
npm install -g pnpm
\`\`\`

---

## Parte 5 — Python via pyenv

### 5.1 — pyenv — instalar

\`\`\`bash
brew install pyenv
source ~/.zshrc
\`\`\`

O \`source\` aqui activa o \`pyenv init\` do \`.zshrc\` agora que o pyenv está presente.

### 5.2 — Python — instalar versão

\`\`\`bash
pyenv install 3.12
pyenv global 3.12
\`\`\`

### 5.3 — pip e pipx — instalar

\`\`\`bash
pip install --upgrade pip pipx
pipx ensurepath
\`\`\`

---

## Parte 6 — IDEs e ferramentas

### 6.1 — VS Code — instalar

\`\`\`bash
brew install --cask visual-studio-code
\`\`\`

### 6.2 — VS Code — restaurar extensões

\`\`\`bash
cat ~/Desktop/vscode-extensions.txt | xargs -L 1 code --install-extension
\`\`\`

### 6.3 — Cursor — instalar

\`\`\`bash
brew install --cask cursor
\`\`\`

### 6.4 — Cursor — registar comando shell

\`Cmd+Shift+P → "Shell Command: Install 'cursor' command in PATH"\`

Pode importar settings do VSCode na tela de setup inicial.

### 6.5 — Claude Code — instalar

\`\`\`bash
npm install -g @anthropic-ai/claude-code
\`\`\`

### 6.6 — Claude Code — autenticar

\`\`\`bash
claude   # abre browser pra autenticar
\`\`\`

### 6.7 — CLIs e utilitários

\`\`\`bash
brew install --cask docker         # Docker Desktop
brew install jq                    # JSON no terminal
brew install httpie                # alternativa ao curl
brew install fzf              # fuzzy finder — Ctrl+R turbinado no terminal
brew install ripgrep          # grep rápido que ignora .git e node_modules
brew install fd               # find mais simples: fd "*.ts"
brew install bat              # cat com syntax highlighting
brew install eza              # ls moderno com cores e info de git
brew install --cask raycast        # Spotlight replacement com clipboard history e snippets
brew install --cask iterm2         # terminal com split panes e perfis de cor
brew install --cask rectangle      # snap de janelas com atalhos de teclado
brew install --cask the-unarchiver # extrai .zip .rar .7z sem instalar nada extra
\`\`\`

---

## Parte 7 — Stack Vite

### 7.1 — CLIs de deploy — instalar

> **Por que sem Vercel CLI?** O \`vercel\` é uma ferramenta proprietária da Vercel Inc. Para projetos em Vite puro, use **Cloudflare Pages** ou **Netlify** — ambas com CLIs open-friendly.

\`\`\`bash
npm install -g wrangler          # Cloudflare Pages/Workers CLI
npm install -g netlify-cli       # Netlify CLI
\`\`\`

### 7.2 — Scaffold de projeto Vite

\`\`\`bash
pnpm create vite@latest
\`\`\`

Escolhe o template: \`vanilla\`, \`vanilla-ts\`, \`vue\`, \`vue-ts\`, \`react\`, \`react-ts\`, \`svelte\`, etc.

### 7.3 — Ferramentas do ecossistema Vite

\`\`\`bash
# Dentro de projetos (não global)
pnpm add -D typescript            # compilador TypeScript — versão fixada por projeto
pnpm add -D ts-node               # executa .ts directamente sem compilar
pnpm add -D vitest                # testes unitários nativos do Vite
pnpm add -D @vitest/ui            # UI bonita pra ver os testes
pnpm add -D playwright            # testes E2E
pnpm add -D eslint prettier
pnpm add -D @typescript-eslint/parser @typescript-eslint/eslint-plugin
\`\`\`

### 7.4 — Deploy

**Netlify:**

\`\`\`bash
netlify login
netlify init
netlify deploy --prod --dir=dist
\`\`\`

**Cloudflare Pages:**

\`\`\`bash
wrangler pages project create nome-do-projeto
wrangler pages deploy ./dist
\`\`\`

Nos dois casos: \`vite build\` → pasta \`dist/\` → deploy aponta pra essa pasta.

---

## Parte 8 — Estrutura de pastas

O macOS reserva \`~/Developer\` como a pasta canónica para conteúdo de desenvolvimento — é o caminho que o Xcode usa por omissão para projectos, simuladores e dados derivados. Ao usá-la estás alinhado com as convenções do sistema, e ela fica fora do iCloud Drive (sem problemas de sync com \`node_modules\` ou builds).

### 8.1 — Criar a estrutura

\`\`\`bash
mkdir -p ~/Developer/{web,native,sandbox,oss}
\`\`\`

\`\`\`
~/Developer/
  ├── web/        (Vite, Node, APIs, sites)
  ├── native/     (Swift, SwiftUI, apps macOS/iOS)
  ├── sandbox/    (experimentos rápidos, throwaway)
  └── oss/        (contribuições open source)
\`\`\`

O Xcode usa \`~/Developer\` como raiz — ao criar um projecto novo, aponta para \`~/Developer/native/\`.

### 8.2 — Reclonar os repos do GitHub

\`\`\`bash
gh repo list --limit 100 --json nameWithOwner,url \\
  | jq -r '.[].url' \\
  | while read url; do
      name=$(basename "$url" .git)
      gh repo clone "$url" ~/Developer/web/"$name"
    done
\`\`\`

Repos nativos clona manualmente para \`~/Developer/native/\` — mais fácil distinguir caso a caso.

---

## Parte 9 — Recuperar projetos do iCloud

Depois do login no iCloud pós-formatação, os arquivos sincronizam de volta. Para confirmar:

\`\`\`bash
ls ~/Library/Mobile\\ Documents/com~apple~CloudDocs/
\`\`\`

Para mover projetos do iCloud para \`~/Developer/\`:

\`\`\`bash
mv ~/Library/Mobile\\ Documents/com~apple~CloudDocs/nome-do-projeto ~/Developer/web/
\`\`\`

> Projetos de código não pertencem ao iCloud — \`node_modules\` e builds causam comportamento estranho no sync. O iCloud é paraquedas temporário; o GitHub é o lugar certo para versionamento.

---

## Ordem de execução

| # | Etapa | Onde |
|---|-------|------|
| 0 | Auditoria + push de todos os projetos pro GitHub | iMac atual |
| 1 | Checklist de sign-outs e backups | iMac atual |
| 2 | Erase All Content and Settings | iMac atual |
| 3 | Primeiro boot: update macOS, FileVault, iCloud login | iMac formatado |
| 4 | Aguarda iCloud sincronizar | iMac formatado |
| 5 | Xcode CLT | Terminal |
| 6 | Homebrew | Terminal |
| 7 | Git — instalar e configurar | Terminal |
| 8 | GitHub CLI — instalar, autenticar e verificar | Terminal |
| 9 | Oh My Zsh — instalar e clonar plugins | Terminal |
| 9b | .zshrc — escrever e activar | Terminal |
| 10 | NVM — instalar | Terminal |
| 11 | Node 24 LTS — instalar | Terminal |
| 12 | pnpm — instalar | Terminal |
| 13 | pyenv — instalar | Terminal |
| 14 | Python 3.12 — instalar | Terminal |
| 15 | pip e pipx | Terminal |
| 16 | VS Code — instalar e restaurar extensões | Terminal |
| 17 | Cursor — instalar e registar comando shell | Terminal |
| 18 | Claude Code — instalar e autenticar | Terminal |
| 19 | CLIs e utilitários | Terminal |
| 20 | CLIs de deploy (wrangler, netlify-cli) | Terminal |
| 21 | Cria ~/Code/ e reclona repos do GitHub | Terminal |
| 22 | Restaura .env dos projetos do backup | Por projeto |
| 23 | Move projetos do iCloud Drive pra ~/Code/ | Terminal |
`

export const sections = [
  { id: 'parte-0', label: 'Parte 0 — GitHub backup', num: '0' },
  { id: 'parte-1', label: 'Parte 1 — Clean Install macOS', num: '1' },
  { id: 'parte-2', label: 'Parte 2 — Fundação do ambiente', num: '2' },
  { id: 'parte-3', label: 'Parte 3 — Oh My Zsh + .zshrc', num: '3' },
  { id: 'parte-4', label: 'Parte 4 — Node via NVM', num: '4' },
  { id: 'parte-5', label: 'Parte 5 — Python via pyenv', num: '5' },
  { id: 'parte-6', label: 'Parte 6 — IDEs e ferramentas', num: '6' },
  { id: 'parte-7', label: 'Parte 7 — Stack Vite', num: '7' },
  { id: 'parte-8', label: 'Parte 8 — Estrutura de pastas', num: '8' },
  { id: 'parte-9', label: 'Parte 9 — Recuperar do iCloud', num: '9' },
  { id: 'ordem-de-execucao', label: 'Ordem de execução', num: '→' },
]
