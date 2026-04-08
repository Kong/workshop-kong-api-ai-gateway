---
title : "Configure Claude Code"
weight : 192
---


### Create a Claude Code configuration file to consume Kong AI Gateway

Create a file named **.env.claude** with the following settings. The configuration tell **Claude Code** to use **Bedrock** and [**Claude Opus 4.6**](https://platform.claude.com/docs/en/about-claude/models/whats-new-claude-4-6).



:::code{showCopyAction=true showLineNumbers=false language=shell}
mkdir claudecode-aws
cd claudecode-aws

cat > .env.claude << 'EOF'
export AWS_REGION=us-west-2
export ANTHROPIC_MODEL=us.anthropic.claude-opus-4-6-v1
export ANTHROPIC_BEDROCK_BASE_URL=http://$DATA_PLANE_LB/anthropic
EOF
:::

You can get this settings with:
:::code{showCopyAction=true showLineNumbers=false language=shell}
. ./.env.claude
:::

Test **Claude Code**:
:::code{showCopyAction=true showLineNumbers=false language=shell}
claude --version
:::


### Start Claude Code for the first time

Assuming you have **Claude Code** installed locally, run:

:::code{showCopyAction=true showLineNumbers=false language=shell}
claude
:::

You shoul see the Claude Code welcome prompt:


```
Welcome to Claude Code v2.1.45
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

╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
 1  function greet() {
 2 -  console.log("Hello, World!");                                                                                                                                                                           
 2 +  console.log("Hello, Claude!");                                                                                                                                                                          
 3  }
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
 Syntax theme: Monokai Extended (ctrl+t to disable)
```

Choose the mode, enable the recommended settings, trust the current folder you are and use high effort mode.



### Check the configuration

Now you should see the main menu page. Type ``/status`` and check if **Claude Code** is configured to use Bedrock and Claude Opus 4.6 model:

```

╭─── Claude Code v2.1.45 ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╮
│                                             │ Tips for getting started                                                                                                                                     │
│                Welcome back!                │ Run /init to create a CLAUDE.md file with instructions for Claude                                                                                            │
│                                             │ ─────────────────────────────────────────────────────────────────                                                                                            │
│                                             │ Recent activity                                                                                                                                              │
│                  ▗ ▗   ▖ ▖                  │ No recent activity                                                                                                                                           │
│                                             │                                                                                                                                                              │
│                    ▘▘ ▝▝                    │                                                                                                                                                              │
│        Opus 4.6 · API Usage Billing         │                                                                                                                                                              │
│   ~/kong/kong-tech/Tech/AI/ClaudeCode/aws   │                                                                                                                                                              │
╰────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯

  Welcome to Opus 4.6         
              
❯ /status                                                                                                                                                                                                     
──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
 ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── 
  Settings:  Status   Config   Usage  (←/→ or tab to cycle)                                                                                                                                                   
                                                                                                                       
                                                                            
  Version: 2.1.45                                                           
  Session name: /rename to add a name                                                                                                                                                                         
  Session ID: 67f58aab-b020-46c8-9245-9341b3507861                                                                                                                                                            
  cwd: /Users/claudioacquaviva/kong/kong-tech/Tech/AI/ClaudeCode/aws
  API provider: AWS Bedrock
  AWS region: us-west-2

  Model: us.anthropic.claude-opus-4-6-v1
  Memory:
  Setting sources:
  Esc to cancel
```


Type ``esc`` to return to **Claude Code** prompt.







You can now click **Next** to proceed further.