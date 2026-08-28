# Security Policy

## What this project ships

This repository contains no runtime code that a user executes against their data. It ships
markdown role definitions, markdown workflow skills, three Node scripts used for validation
and installation, and generated command shims. It has no dependencies.

That shapes the threat model. The realistic risks are:

1. **Prompt injection through repository content.** A skill or agent body is read by an
   agent and treated as instruction. Content that instructs an agent to exfiltrate secrets,
   disable a check, or run an unexpected command is a vulnerability in this repository,
   even though it is only text.
2. **The installer.** `scripts/install.sh` and `scripts/install.ps1` write into a user's
   home directory. A path traversal, an unguarded overwrite, or a destructive default is a
   vulnerability.
3. **A workflow that weakens a user's safety posture.** A skill that tells an agent to
   bypass a permission prompt, commit secrets, force-push, or skip a review gate is a
   vulnerability, not a feature request.

Findings in the *code being reviewed by* one of these agents are not vulnerabilities in
this project.

## Reporting

Report privately through GitHub's **Report a vulnerability** button on the Security tab,
which opens a private advisory visible only to the maintainers.

Do not open a public issue for anything in the three categories above until it has been
fixed and released.

Include: what the content or script does, the path and line, the conditions under which it
triggers, and what an attacker gains. A proof of concept helps; a working exploit against a
third party does not, and should not be included.

## Response

- Acknowledgement within 7 days.
- An assessment, including whether it is accepted as a vulnerability, within 14 days.
- Fixes ship in a patch release. The advisory is published once the fix is available.

This is a volunteer-maintained project. These are targets, not a contractual SLA.

## Supported versions

The latest tagged release and the default branch. There are no long-term support branches.

## Credit

Reporters are credited in the advisory and the changelog unless they ask not to be.
