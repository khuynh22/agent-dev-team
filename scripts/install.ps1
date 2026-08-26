#Requires -Version 5.1
<#
.SYNOPSIS
Installs agent-dev-team for Claude Code, and optionally for other agent tools.

.DESCRIPTION
Two modes.

  plugin  (default)  Registers this repository as a local Claude Code marketplace and
                     installs the plugin. Everything is namespaced (/agent-dev-team:...),
                     nothing is copied, and uninstalling is one command.

  copy               Copies skills into ~/.claude/skills/ and agents into ~/.claude/agents/.
                     Use when you want the files present without a plugin, or for a tool
                     that reads those directories directly.

.PARAMETER Mode
plugin or copy. Default: plugin.

.PARAMETER Target
Extra tools to copy skills into: codex, gemini, cursor, opencode, windsurf. Repeatable.

.PARAMETER Uninstall
Reverse whichever mode you name.

.EXAMPLE
pwsh scripts/install.ps1

.EXAMPLE
pwsh scripts/install.ps1 -Mode copy -Target codex,gemini
#>
[CmdletBinding()]
param(
    [ValidateSet('plugin', 'copy')]
    [string]$Mode = 'plugin',

    [ValidateSet('codex', 'gemini', 'cursor', 'opencode', 'windsurf')]
    [string[]]$Target = @(),

    [switch]$Uninstall,
    [switch]$Force
)

$ErrorActionPreference = 'Stop'

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$PluginName = 'agent-dev-team'
$ClaudeHome = Join-Path $HOME '.claude'

function Write-Step { param($Message) Write-Host "  $Message" }
function Write-Ok   { param($Message) Write-Host "  OK   $Message" -ForegroundColor Green }
function Write-Warn { param($Message) Write-Host "  WARN $Message" -ForegroundColor Yellow }

function Test-Repo {
    foreach ($required in @('skills', 'agents', 'references', '.claude-plugin/plugin.json')) {
        if (-not (Test-Path (Join-Path $RepoRoot $required))) {
            throw "Not a complete agent-dev-team checkout: missing $required"
        }
    }
}

function Invoke-Validate {
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        Write-Warn 'node not found; skipping pre-install validation'
        return
    }
    Write-Step 'Validating repository...'
    & node (Join-Path $RepoRoot 'scripts/validate.js') | Out-Host
    if ($LASTEXITCODE -ne 0 -and -not $Force) {
        throw 'Validation failed. Fix the problems above, or re-run with -Force.'
    }
}

function Install-Plugin {
    $claude = Get-Command claude -ErrorAction SilentlyContinue
    if (-not $claude) {
        throw "The 'claude' CLI is not on PATH. Install Claude Code, or use: -Mode copy"
    }

    Write-Step "Registering marketplace from $RepoRoot"
    & claude plugin marketplace add $RepoRoot 2>&1 | Out-Host

    Write-Step "Installing $PluginName@$PluginName"
    & claude plugin install "$PluginName@$PluginName" 2>&1 | Out-Host

    Write-Ok 'Plugin installed. Start a new Claude Code session to load it.'
    Write-Host ''
    Write-Host '  Try:  /agent-dev-team:team  add rate limiting to the upload endpoint'
}

function Uninstall-Plugin {
    $claude = Get-Command claude -ErrorAction SilentlyContinue
    if (-not $claude) { throw "The 'claude' CLI is not on PATH." }

    & claude plugin uninstall $PluginName 2>&1 | Out-Host
    & claude plugin marketplace remove $PluginName 2>&1 | Out-Host
    Write-Ok 'Plugin removed.'
}

# Copy mode namespaces every directory so it cannot collide with a personal skill or
# agent of the same name, and so uninstall can identify exactly what it put there.
$Prefix = 'adt-'

function Install-Copy {
    $skillsDest = Join-Path $ClaudeHome 'skills'
    $agentsDest = Join-Path $ClaudeHome 'agents'
    New-Item -ItemType Directory -Force -Path $skillsDest, $agentsDest | Out-Null

    $skills = 0
    foreach ($skill in Get-ChildItem (Join-Path $RepoRoot 'skills') -Directory) {
        $dest = Join-Path $skillsDest "$Prefix$($skill.Name)"
        if (Test-Path $dest) { Remove-Item $dest -Recurse -Force }
        Copy-Item $skill.FullName $dest -Recurse
        $skills++
    }

    # Skills reference the checklists by relative path, so they travel with them.
    $refDest = Join-Path $skillsDest "${Prefix}references"
    if (Test-Path $refDest) { Remove-Item $refDest -Recurse -Force }
    Copy-Item (Join-Path $RepoRoot 'references') $refDest -Recurse

    $agents = 0
    foreach ($agent in Get-ChildItem (Join-Path $RepoRoot 'agents') -Filter '*.md') {
        Copy-Item $agent.FullName (Join-Path $agentsDest $agent.Name) -Force
        $agents++
    }

    Write-Ok "$skills skills -> $skillsDest (prefixed $Prefix)"
    Write-Ok "$agents agents -> $agentsDest"
    Write-Warn 'Agent names are not prefixed. If you already have an agent with one of these names, yours is overwritten.'
}

function Uninstall-Copy {
    $removed = 0
    $skillsDest = Join-Path $ClaudeHome 'skills'
    if (Test-Path $skillsDest) {
        foreach ($dir in Get-ChildItem $skillsDest -Directory | Where-Object { $_.Name -like "$Prefix*" }) {
            Remove-Item $dir.FullName -Recurse -Force
            $removed++
        }
    }
    $agentsDest = Join-Path $ClaudeHome 'agents'
    foreach ($agent in Get-ChildItem (Join-Path $RepoRoot 'agents') -Filter '*.md') {
        $installed = Join-Path $agentsDest $agent.Name
        if (Test-Path $installed) {
            Remove-Item $installed -Force
            $removed++
        }
    }
    Write-Ok "Removed $removed item(s)."
}

$TargetPaths = @{
    codex    = '.codex/skills'
    gemini   = '.gemini/skills'
    cursor   = '.cursor/skills'
    opencode = '.config/opencode/skills'
    windsurf = '.codeium/windsurf/skills'
}

function Install-Targets {
    foreach ($tool in $Target) {
        $dest = Join-Path $HOME $TargetPaths[$tool]
        New-Item -ItemType Directory -Force -Path $dest | Out-Null
        foreach ($skill in Get-ChildItem (Join-Path $RepoRoot 'skills') -Directory) {
            $to = Join-Path $dest $skill.Name
            if (Test-Path $to) { Remove-Item $to -Recurse -Force }
            Copy-Item $skill.FullName $to -Recurse
        }
        $refs = Join-Path $dest 'references'
        if (Test-Path $refs) { Remove-Item $refs -Recurse -Force }
        Copy-Item (Join-Path $RepoRoot 'references') $refs -Recurse
        Write-Ok "$tool -> $dest"
    }
    if ($Target.Count) {
        Write-Warn 'Agent personas are not copied to these tools. Point the tool at AGENTS.md in this repository instead.'
    }
}

Write-Host ''
Write-Host "agent-dev-team installer" -ForegroundColor Cyan
Write-Host "  repo: $RepoRoot"
Write-Host "  mode: $Mode$(if ($Uninstall) { ' (uninstall)' })"
Write-Host ''

Test-Repo

if ($Uninstall) {
    if ($Mode -eq 'plugin') { Uninstall-Plugin } else { Uninstall-Copy }
} else {
    Invoke-Validate
    if ($Mode -eq 'plugin') { Install-Plugin } else { Install-Copy }
    Install-Targets
}

Write-Host ''
