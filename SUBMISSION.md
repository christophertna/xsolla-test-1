# Submission

 (Submission a bit late but the last moments were used to write up the SUBMISSION.md) 

## What did you investigate first, and why?
-First went over the repo by myself to get a brief idea of what I will be working with.
-What is the main purpose of the repo, and what are the main functionalities that help the repo achieve its goal(s).
-Then used a skill to help me understand the repo in more detail (file structure, specific functions, dependencies, etc.), 
and help me identify and understand points of potential weaknesses in the repo.

Main points identified were (there were probably more but here is what we found, not in order of priority):
- npm test failing means the whole tool fails as well
- repo_path vs repoPath for the MCP tool
- any paths with spaces between them were getting cut off
- renamed files looked broken/weird in the report
- asking for 'format --json' gave markdown anyways
- tool will execute any shell-command (no guardrail or permission list)
- bad repo path/branch --> CLI dumped a raw error

## What did you choose to implement or fix?
# 1. npm test failing means the whole tool fails as well 
Fix: make it write down "this failed" and keep going

# 2. repo_path vs repoPath for the MCP tool
Fix: read the same name it asks for

# 3. any paths with spaces between them were getting cut off
Fix: stop chopping the path at the first space

# 4. renamed files looked broken/weird in the report
Fix: detect renames properly, show one clean path

# 5. asking for 'format --json' gave markdown anyways
Fix: just delete the json option since it doesn't work and isnt worth building right now.

# 6. tool will execute any shell-command (no guardrail or permission list)
Fix: only allow `npm run <script>` where `<script>` is a real script name already in that repo's `package.json`. Reject everything else.

# 7. bad repo path/branch --> CLI dumped a raw error
Fix: CLI prints one clear "this path is bad" message and stops cleanly. MCP wraps the risky part in a try/catch so one bad request doesn't take the whole server down.

## What did you intentionally not do?
For one of the issues, we intentionally did not implement a .json output feature.
Rather than building real JSON output right now, we simply removed the option entirely 
so the tool doesnt advertise behavior it doesn't have. `format` should be dropped from `ReviewRequest`, 
the CLI's `--format` flag, and any other place it was threaded through (ex: `Args["format"]` in cli.ts)

## Interface decision

- Decision: CLI-first / MCP-first / hybrid
- Primary user and execution environment: CLI
- Trust boundary and allowed capabilities:
- Reliability, discoverability, latency/context, and output tradeoffs:
- How supported interfaces remain consistent:
- Evidence that would change this decision:

## How did you use an AI coding agent?
Used a skill to help me learn the repo and identify any potential weaknesses first that we agree together on.
Then ask it to use that list of issues/weaknesses to convert it into a detailed PRD.md file.
Then the .md file is converted into a tasks.json file, easy for a coding agent to read/comprehend.
Then feed the json file into an autonomous ai builder agent.

## Where did you check, correct, or reject an AI suggestion? (required)
A lot of this during my session was during the initial comprehension stage, where the AI and me both try
to properly understand the repo as well as identify its weaknesses. It was a back-and-forth conversation
about identifying potential issues in files, and understanding overall file and repo structure as well as
trying to align both of our goals in the same direction.

Another big one was I had to forcibly stop the AI builder due to a test that a fixed push didnt pass, but the 
builder didnt recognize (issue more in detail below) so I had to intervene, stop the process, try to identify the issue
and the root cause of it, push a quick fix, update the builder's context, then restart the process.

## Commands used to verify the result, with outcomes
-The agent auto ran the 'npm test' check on its own to see if fixes are passing (issue discussed later)

## A blocker you hit and how you approached it
The test for #2 was broken onwards (CI red for 4 stories in a row) and showed that the github test failed in the Actions tab.
The test written for fix #2 pointed itself at the real live repo folder instead of a fake throwaway one.
Essentially, the fix worked fine on local machine, but broke on GitHubs servers (dont usually have full copy of the repo, just partial; no main branch), so:
"npm test" failed on GitHub every single time, right from US--002 onward (until US--005).

Fix: Stopped workflow process, rewrote that 1 test to build its own fake mini git repo instead of using the real one. Re-pushed, GitHub check went green.

## Known limitations and the next three things you would do
-Make the constraints and details for the first understanding phase more detailed, since me and the AI both missed the issue
-Specifically check the status of pushes before moving on autonomously (encode it in its .md)
-Optimize the AI builder

## Approximate focused-work time

- Start: around 11:00am
- Finish: around 12:20pm
