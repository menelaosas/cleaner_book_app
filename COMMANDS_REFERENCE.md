# Bash Commands Reference - Serenity Project

All commands used during the development of this project, explained in detail.

---

## 1. Prisma / Database Commands

### Generate a database migration
```bash
cd /home/menelaosas/Documents/Projects/cleaner_book_app/backend && npx prisma migrate dev --name add-awaiting-confirmation-status
```

**What it does:**
- `cd ...` changes directory to the backend folder where `prisma/schema.prisma` lives.
- `npx` runs a package binary without installing it globally. It looks inside `node_modules/.bin/`.
- `prisma migrate dev` compares your current `schema.prisma` file against the database and generates a SQL migration file for any differences.
- `--name add-awaiting-confirmation-status` gives the migration a human-readable name. Prisma creates a folder like `migrations/20260127154527_add_awaiting_confirmation_status/migration.sql`.
- It then **applies** the migration to your database and **regenerates** the Prisma Client (the TypeScript code that lets you query the DB).

**When to use:** Every time you change `schema.prisma` (add a model, add a field, change an enum, etc.).

---

## 2. Git Commands

### Initialize a git repository
```bash
git init
```

**What it does:**
- Creates a hidden `.git/` folder in the current directory.
- This folder stores all version history, branches, and config.
- If the repo already exists, it prints "Reinitialized existing Git repository" and does nothing harmful.

**When to use:** Once, at the start of a new project. Safe to run again (it won't delete anything).

---

### Check remote repositories
```bash
git remote -v
```

**What it does:**
- Lists all configured remote repositories (like GitHub, GitLab, etc.).
- `-v` (verbose) shows both the URL and whether it's used for `fetch` or `push`.
- If nothing is printed, no remote is configured yet.

**Example output:**
```
origin  git@github.com:menelaosas/cleaner_book_app.git (fetch)
origin  git@github.com:menelaosas/cleaner_book_app.git (push)
```

---

### Add a remote repository
```bash
git remote add origin https://github.com/menelaosas/cleaner_book_app.git
```

**What it does:**
- `git remote add` registers a new remote.
- `origin` is the conventional name for your primary remote (you could name it anything).
- The URL is where git will push/pull code to/from.

**When to use:** Once, when connecting a local repo to GitHub for the first time.

---

### Change a remote's URL
```bash
git remote set-url origin git@github.com:menelaosas/cleaner_book_app.git
```

**What it does:**
- Changes the URL of an existing remote called `origin`.
- Here we switched from HTTPS (`https://github.com/...`) to SSH (`git@github.com:...`).
- SSH uses your SSH key for authentication instead of username/password.

**HTTPS vs SSH:**
| | HTTPS | SSH |
|---|---|---|
| URL format | `https://github.com/user/repo.git` | `git@github.com:user/repo.git` |
| Auth method | Username + token | SSH key pair |
| Setup | Create personal access token | Add public key to GitHub |

---

### Check the status of your files
```bash
git status -s
```

**What it does:**
- Shows which files are modified, staged, or untracked.
- `-s` (short) gives a compact output instead of the verbose default.

**Output codes:**
| Code | Meaning |
|------|---------|
| `M` (left column) | Modified and staged (ready to commit) |
| `M` (right column) | Modified but NOT staged |
| `A` | New file, staged |
| `??` | Untracked (new file, not yet added to git) |
| `D` | Deleted |

**Example:**
```
 M backend/src/server.ts        # Modified, not staged
A  frontend/src/app/bookings/   # New file, staged
?? docker-compose.yml           # Untracked
```

---

### View commit history
```bash
git log --oneline -5
```

**What it does:**
- `git log` shows the commit history.
- `--oneline` compresses each commit to a single line (hash + message).
- `-5` limits output to the last 5 commits.

**Example output:**
```
e7efef5 Add customer confirmation flow for booking completion
d4fbd80 Add Serenity home cleaning service platform
899970f Add .gitignore for Node.js, Next.js, and Prisma
```

---

### Stage all files for commit
```bash
git add -A
```

**What it does:**
- Adds ALL changes to the staging area (the "ready to commit" zone).
- `-A` includes: new files, modified files, AND deleted files.
- Alternative: `git add .` (similar but slightly different behavior with deleted files outside current dir).

**Staging area concept:**
```
Working Directory  -->  Staging Area  -->  Repository
  (your files)      git add            git commit
```

**Be careful:** `-A` stages everything, including files you might not want (like `.env`). That's why `.gitignore` is important.

---

### Create a commit
```bash
git commit -m "$(cat <<'EOF'
Add customer confirmation flow for booking completion

When a cleaner marks a job as complete, the booking now enters
AWAITING_CONFIRMATION status. The customer must confirm or dispute
the completion via real-time Socket.io notifications.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

**What it does:**
- `git commit` saves all staged changes as a snapshot in the repository.
- `-m "message"` provides the commit message inline.
- The `$(cat <<'EOF' ... EOF)` part is called a **heredoc** — it lets you write multi-line text in bash.

**Breaking down the heredoc:**
```bash
$(          # Start command substitution — run a command and use its output
  cat       # Print text
  <<'EOF'   # Start heredoc — everything until 'EOF' is the text
    Line 1
    Line 2
  EOF       # End of heredoc
)           # End command substitution
```

**Why use a heredoc?** Commit messages with multiple lines or special characters can break with simple quotes. The heredoc avoids escaping issues.

**Commit message best practices:**
- First line: short summary (50 chars max)
- Blank line
- Body: explain WHY, not WHAT (the diff shows what changed)

---

### Rename the current branch
```bash
git branch -M main
```

**What it does:**
- `-M` force-renames the current branch to `main`.
- Older repos default to `master`; GitHub now uses `main`.
- The `-M` flag (capital M) forces the rename even if `main` already exists.

---

### Push to remote
```bash
git push -u origin main
```

**What it does:**
- `git push` uploads your commits to the remote repository.
- `origin` is the remote name (GitHub).
- `main` is the branch to push.
- `-u` (or `--set-upstream`) links your local `main` to `origin/main`. After this, you can just type `git push` without specifying the remote/branch.

**First push vs subsequent pushes:**
```bash
git push -u origin main   # First time (sets up tracking)
git push                   # Every time after
```

---

## 3. SSH Commands

### List SSH keys
```bash
ls ~/.ssh/id_*
```

**What it does:**
- `ls` lists files.
- `~` is a shortcut for your home directory (`/home/menelaosas`).
- `~/.ssh/` is the standard directory where SSH keys are stored.
- `id_*` is a glob pattern matching any file starting with `id_` (e.g., `id_ed25519`, `id_rsa`).

**Common SSH key types:**
| File | Type | Notes |
|------|------|-------|
| `id_ed25519` | Ed25519 | Modern, recommended |
| `id_rsa` | RSA | Older, still widely used |
| `*.pub` | Public key | The one you share (add to GitHub) |
| Without `.pub` | Private key | NEVER share this |

---

### Print your public SSH key
```bash
cat ~/.ssh/id_ed25519.pub
```

**What it does:**
- `cat` prints the contents of a file to the terminal.
- This shows your **public** key, which you paste into GitHub Settings > SSH Keys.
- The public key is safe to share — it's the "lock". The private key (`id_ed25519` without `.pub`) is the "key" — never share it.

---

## 4. General Utility Commands

### Check if a command exists
```bash
gh auth status
```

**What happened:** This returned `command not found` because the GitHub CLI (`gh`) wasn't installed. This told us we needed to use SSH or token-based authentication instead.

---

### List files to check they exist
```bash
ls -la .gitignore README.md
```

**What it does:**
- `ls` lists files.
- `-l` shows detailed info (permissions, size, date).
- `-a` shows hidden files (starting with `.`).
- We used this to verify `.gitignore` and `README.md` existed before pushing.

**Output columns:**
```
-rw-rw-r-- 1 menelaosas menelaosas 329 Jan 24 19:41 .gitignore
│           │ │                     │   │              │
│           │ owner  group          size date           filename
│           link count
permissions
```

---

## 5. Piping and Chaining

### Chain commands with `&&`
```bash
git add -A && git status -s | head -60
```

**What it does:**
- `&&` means "run the next command ONLY if the previous one succeeded".
- `|` (pipe) sends the output of one command as input to the next.
- `head -60` shows only the first 60 lines of output.

**Chaining operators:**
| Operator | Meaning |
|----------|---------|
| `&&` | Run next only if previous SUCCEEDED (exit code 0) |
| `||` | Run next only if previous FAILED (non-zero exit code) |
| `;` | Run next regardless of success/failure |
| `|` | Pipe output of left to input of right |

**Example from the project:**
```bash
git remote add origin ... 2>&1 || git remote set-url origin ...
```
This tries to add the remote. If it fails (remote already exists), it updates the URL instead.

---

### Redirect stderr with `2>&1`
```bash
git push -u origin main 2>&1
```

**What it does:**
- `2>&1` redirects stderr (error output) to stdout (normal output).
- File descriptors: `0` = stdin, `1` = stdout, `2` = stderr.
- This combines all output into one stream so we can see both success and error messages.

---

## Quick Reference Summary

| Command | Purpose |
|---------|---------|
| `npx prisma migrate dev --name X` | Create and apply DB migration |
| `git init` | Initialize a git repo |
| `git remote -v` | List remotes |
| `git remote add origin URL` | Add a remote |
| `git remote set-url origin URL` | Change remote URL |
| `git status -s` | Show changed files (short) |
| `git log --oneline -5` | Show last 5 commits |
| `git add -A` | Stage all changes |
| `git commit -m "msg"` | Commit staged changes |
| `git branch -M main` | Rename branch to main |
| `git push -u origin main` | Push and set upstream |
| `ls ~/.ssh/id_*` | List SSH keys |
| `cat ~/.ssh/id_ed25519.pub` | Show public SSH key |
