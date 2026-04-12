---
title : "Configure Claude Code"
weight : 192
---


### Create a Claude Code configuration file to consume Kong AI Gateway

Create a file named **.env.claude** with the following settings. Check the [**Claude Opus 4.6**](https://platform.claude.com/docs/en/about-claude/models/whats-new-claude-4-6) documentation to learn more.



```
mkdir claudecode-workshop
cd claudecode-workshop

cat > .env.claude << 'EOF'
export ANTHROPIC_MODEL=claude-opus-4-6
export ANTHROPIC_BASE_URL=http://$DATA_PLANE_LB/anthropic
EOF
```

You can get this settings with:
```
. ./.env.claude
```

Test **Claude Code**:
```
claude --version
```


### Start Claude Code for the first time

Assuming you have **Claude Code** installed locally, run:

```
claude
```

You shoul see the Claude Code welcome prompt:


<pre style="font-size: 0.75em">
Welcome to Claude Code v2.1.104
…………………………………………………………………………………………………………………………………………………………

     *                                       █████▓▓░
                                 *         ███▓░     ░░
            ░░░░░░                        ███▓░
    ░░░   ░░░░░░░░░░                      ███▓░
   ░░░░░░░░░░░░░░░░░░░    *                ██▓░░      ▓
                                             ░▓▓███▓▓░
 *                                 ░░░░
                                 ░░░░░░░░
                               ░░░░░░░░░░░░░░░░
                                                      *
      ▗ ▗     ▖ ▖                       *
                      *
…………………         ………………………………………………………………………………………………………………

 Let's get started.

 Choose the text style that looks best with your terminal
 To change this later, run /theme

 ❯ 1. Dark mode ✔
   2. Light mode
   3. Dark mode (colorblind-friendly)
   4. Light mode (colorblind-friendly)
   5. Dark mode (ANSI colors only)
   6. Light mode (ANSI colors only)

╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
 1  function greet() {
 2 -  console.log("Hello, World!");
 2 +  console.log("Hello, Claude!");                                                  
 3  }
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
 Syntax theme: Monokai Extended (ctrl+t to disable)
</pre>

Choose the mode, enable the recommended settings, trust the current folder you are and use high effort mode.



### Check the configuration

Now you should see the main menu page. Type ``/status`` and check if **Claude Code** is configured to use Bedrock and Claude Opus 4.6 model:

<pre style="font-size: 0.7em">
╭─── Claude Code v2.1.104 ───────────────────────────────────────────────────────────────────────────────────────────────╮
│                                                    │ Tips for getting started                                          │
│                 Welcome back Acqua!                │ Run /init to create a CLAUDE.md file with instructions for Claude │
│                                                    │ ───────────────────────────────────────────────────────────────── │
│                      ▗ ▗   ▖ ▖                     │ Recent activity                                                   │
│                                                    │ No recent activity                                                │
│                        ▘▘ ▝▝                       │                                                                   │
│ Opus 4.6 · API Usage Billing · Acqua’s Individual  │                                                                   │
│ Org                                                │                                                                   │
│   ~/…/GitHub/Workshops/temp/claudecode-workshop    │                                                                   │
╰────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯
                                                                                                                                                    
─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
❯  
─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  ? for shortcuts
</pre>



<pre style="font-size: 0.75em">
❯ /status
────
   Status   Config   Usage                                                                                                                                                                                                                                                 
                                                                                                                     
  Version: 2.1.87                                                               
  Session name: /rename to add a name                                                      
  Session ID: 1c124aae-594a-48fd-b8db-6b4663dcc16b                                                                                                                                                                                                                           
  cwd: /Users/claudioacquaviva/kong/kong-github/GitHub/Workshops/temp/claudecode-workshop
  Auth token: none
  API key: ANTHROPIC_API_KEY
  Anthropic base URL: http://127.0.0.1/anthropic

  Model: claude-opus-4-6
  Setting sources:
  Esc to cancel
</pre>


Type ``esc`` to return to **Claude Code** prompt.







You can now click **Next** to proceed further.