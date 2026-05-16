export const guideMarkdown = `# Clean Install iMac + Dev Environment — Guia Completo
> Stack: Vite puro · Sem Next.js · Deploy via Cloudflare/Netlify

---

## Parte 0 — Salva todos os projetos locais no GitHub

Essa etapa vem primeiro porque é a mais arriscada de esquecer. Seus projetos podem estar em três lugares: no \`~/Code\`, dentro do iCloud Drive, ou ambos.

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

**Cria o repositório no GitHub via CLI e faz o push:**

\`\`\`bash
brew install gh
gh auth login

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

\`\`\`
[ ] Todos os projetos com remote GitHub confirmado (git remote -v)
[ ] Nenhum projeto com arquivos sujos não commitados
[ ] node_modules removidos dos projetos no iCloud
[ ] Backup do ~/.ssh/ (chaves SSH)
[ ] Backup do ~/.gitconfig
[ ] Backup do ~/.zshrc e ~/.zshrc.local (tem API keys aí)
[ ] Backup do ~/.npmrc se existir
[ ] Backup de .env de cada projeto
[ ] Configs do Claude Code: ~/.claude/
[ ] Lista de extensões VSCode: code --list-extensions > ~/Desktop/vscode-extensions.txt
[ ] Lista de extensões Cursor: cursor --list-extensions > ~/Desktop/cursor-extensions.txt
[ ] Sign out do iCloud (System Settings → Apple ID)
[ ] Sign out do iMessage e FaceTime
[ ] Sign out da App Store
[ ] Sign out de licenças por máquina (Adobe, JetBrains, etc.)
[ ] Desautoriza o Music app (Account → Authorizations → Deauthorize This Computer)
\`\`\`

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

### 2.3 — Git e config básica

\`\`\`bash
brew install git
git config --global user.name "Daniel"
git config --global user.email "danielvm@gmail.com"
git config --global init.defaultBranch main
git config --global pull.rebase false
\`\`\`

### 2.4 — SSH key pro GitHub

\`\`\`bash
ssh-keygen -t ed25519 -C "danielvm@gmail.com"
# enter, enter, enter (ou coloca passphrase)
pbcopy < ~/.ssh/id_ed25519.pub
\`\`\`

Cola em **github.com → Settings → SSH and GPG keys → New SSH key**.

Testa: \`ssh -T git@github.com\`

---

## Parte 3 — Node via NVM

\`\`\`bash
brew install nvm
mkdir ~/.nvm
\`\`\`

Adiciona ao \`~/.zshrc\`:

\`\`\`bash
echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.zshrc
echo '[ -s "/opt/homebrew/opt/nvm/nvm.sh" ] && \\. "/opt/homebrew/opt/nvm/nvm.sh"' >> ~/.zshrc
echo '[ -s "/opt/homebrew/opt/nvm/etc/bash_completion.d/nvm" ] && \\. "/opt/homebrew/opt/nvm/etc/bash_completion.d/nvm"' >> ~/.zshrc
source ~/.zshrc
\`\`\`

Instala Node:

\`\`\`bash
nvm install --lts
nvm install node          # latest
nvm alias default lts/*   # LTS como padrão
\`\`\`

### Pacotes globais — stack Vite

\`\`\`bash
npm install -g pnpm typescript ts-node vite @anthropic-ai/claude-code
\`\`\`

> **Por que sem Vercel CLI?** O \`vercel\` é uma ferramenta proprietária da Vercel Inc. Para projetos em Vite puro, use **Cloudflare Pages** ou **Netlify** — ambas com CLIs open-friendly.

\`\`\`bash
npm install -g wrangler          # Cloudflare Pages/Workers CLI
npm install -g netlify-cli       # Netlify CLI
\`\`\`

---

## Parte 4 — Python via pyenv

\`\`\`bash
brew install pyenv
echo 'export PYENV_ROOT="$HOME/.pyenv"' >> ~/.zshrc
echo 'export PATH="$PYENV_ROOT/bin:$PATH"' >> ~/.zshrc
echo 'eval "$(pyenv init -)"' >> ~/.zshrc
source ~/.zshrc

pyenv install 3.12
pyenv global 3.12
pip install --upgrade pip pipx
pipx ensurepath
\`\`\`

---

## Parte 5 — IDEs e ferramentas

### VS Code

\`\`\`bash
brew install --cask visual-studio-code
\`\`\`

Restaura extensões do backup:

\`\`\`bash
cat ~/Desktop/vscode-extensions.txt | xargs -L 1 code --install-extension
\`\`\`

### Cursor

\`\`\`bash
brew install --cask cursor
\`\`\`

\`Cmd+Shift+P → "Shell Command: Install 'cursor' command in PATH"\`

Pode importar settings do VSCode na tela de setup inicial.

### Claude Code

Já instalado via npm. Confirma:

\`\`\`bash
claude --version
claude   # abre browser pra autenticar
\`\`\`

### CLIs e utilitários

\`\`\`bash
brew install gh                    # GitHub CLI
brew install --cask docker         # Docker Desktop
brew install jq                    # JSON no terminal
brew install httpie                # alternativa ao curl
brew install fzf ripgrep fd bat eza
brew install zsh-autosuggestions zsh-syntax-highlighting
brew install --cask raycast        # Spotlight turbinado
brew install --cask iterm2         # Terminal melhor que o nativo
brew install --cask rectangle      # Snap de janelas
brew install --cask the-unarchiver
\`\`\`

---

## Parte 6 — Stack Vite

### Scaffold de projeto Vite

\`\`\`bash
pnpm create vite@latest
\`\`\`

Escolhe o template: \`vanilla\`, \`vanilla-ts\`, \`vue\`, \`vue-ts\`, \`react\`, \`react-ts\`, \`svelte\`, etc.

### Ferramentas do ecossistema Vite

\`\`\`bash
# Dentro de projetos (não global)
pnpm add -D vitest                # testes unitários nativos do Vite
pnpm add -D @vitest/ui            # UI bonita pra ver os testes
pnpm add -D playwright            # testes E2E
pnpm add -D eslint prettier
pnpm add -D @typescript-eslint/parser @typescript-eslint/eslint-plugin
\`\`\`

### Deploy sem Vercel

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

## Parte 7 — .zshrc organizado

\`\`\`bash
# ---- PATH base ----
eval "$(/opt/homebrew/bin/brew shellenv)"

# ---- NVM ----
export NVM_DIR="$HOME/.nvm"
[ -s "/opt/homebrew/opt/nvm/nvm.sh" ] && \\. "/opt/homebrew/opt/nvm/nvm.sh"
[ -s "/opt/homebrew/opt/nvm/etc/bash_completion.d/nvm" ] && \\. "/opt/homebrew/opt/nvm/etc/bash_completion.d/nvm"

# ---- pyenv ----
export PYENV_ROOT="$HOME/.pyenv"
export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init -)"

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

# ---- Plugins ----
source /opt/homebrew/share/zsh-autosuggestions/zsh-autosuggestions.zsh
source /opt/homebrew/share/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh

# ---- fzf ----
[ -f ~/.fzf.zsh ] && source ~/.fzf.zsh

# ---- API keys e segredos (não vai pro git) ----
[ -f ~/.zshrc.local ] && source ~/.zshrc.local
\`\`\`

Cria \`~/.zshrc.local\` (nunca commita esse arquivo):

\`\`\`bash
export ANTHROPIC_API_KEY="sk-..."
export CLOUDFLARE_API_TOKEN="..."
# outras API keys aqui
\`\`\`

---

## Parte 8 — Estrutura de pastas

\`\`\`bash
mkdir -p ~/Code/{work,personal,sandbox,oss}
\`\`\`

\`\`\`
~/Code/
  ├── work/       (projetos do trabalho)
  ├── personal/   (projetos pessoais)
  ├── sandbox/    (experimentos rápidos)
  └── oss/        (contribuições open source)
\`\`\`

### Reclonar os repos do GitHub

\`\`\`bash
gh repo list --limit 100 --json nameWithOwner,url \\
  | jq -r '.[].url' \\
  | while read url; do
      name=$(basename "$url" .git)
      gh repo clone "$url" ~/Code/personal/"$name"
    done
\`\`\`

---

## Parte 9 — Recuperar projetos do iCloud

Depois do login no iCloud pós-formatação, os arquivos sincronizam de volta. Para confirmar:

\`\`\`bash
ls ~/Library/Mobile\\ Documents/com~apple~CloudDocs/
\`\`\`

Para mover projetos do iCloud para \`~/Code/\`:

\`\`\`bash
mv ~/Library/Mobile\\ Documents/com~apple~CloudDocs/nome-do-projeto ~/Code/personal/
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
| 5 | Xcode CLT → Homebrew → Git → SSH key | Terminal |
| 6 | NVM → Node → pnpm → pacotes globais | Terminal |
| 7 | Python + pyenv | Terminal |
| 8 | VSCode → Cursor → Claude Code | Terminal |
| 9 | Substitui ~/.zshrc, cria ~/.zshrc.local | Terminal |
| 10 | Cria ~/Code/ e reclona repos do GitHub | Terminal |
| 11 | Restaura .env dos projetos do backup | Por projeto |
| 12 | Move projetos do iCloud Drive pra ~/Code/ | Terminal |
`

export const sections = [
  { id: 'parte-0', label: 'Parte 0 — GitHub backup', num: '0' },
  { id: 'parte-1', label: 'Parte 1 — Clean Install macOS', num: '1' },
  { id: 'parte-2', label: 'Parte 2 — Fundação do ambiente', num: '2' },
  { id: 'parte-3', label: 'Parte 3 — Node via NVM', num: '3' },
  { id: 'parte-4', label: 'Parte 4 — Python via pyenv', num: '4' },
  { id: 'parte-5', label: 'Parte 5 — IDEs e ferramentas', num: '5' },
  { id: 'parte-6', label: 'Parte 6 — Stack Vite', num: '6' },
  { id: 'parte-7', label: 'Parte 7 — .zshrc organizado', num: '7' },
  { id: 'parte-8', label: 'Parte 8 — Estrutura de pastas', num: '8' },
  { id: 'parte-9', label: 'Parte 9 — Recuperar do iCloud', num: '9' },
  { id: 'ordem-de-execucao', label: 'Ordem de execução', num: '→' },
]
