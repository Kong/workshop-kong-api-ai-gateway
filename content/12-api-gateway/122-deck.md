---
title : "decK"
weight : 122
---


With [**decK** (declarations for Kong)](https://docs.konghq.com/deck/) you can manage Kong Konnect configuration in a declaratively way.

decK operates on state files. decK state files describe the configuration of Kong API Gateway. State files encapsulate the complete configuration of Kong in a declarative format, including services, routes, plugins, consumers, and other entities that define how requests are processed and routed through Kong.


## Commonly used decK Gateway commands

| Command                                                            | Description                                                                                                                                                       |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `deck gateway dump -o kong.yaml`                                   | Export your current settings from Kong Gateway                                                                                                                    |
| `deck gateway diff kong.yaml`                                      | Diff a state file with the configuration in Kong Gateway                                                                                                          |
| `deck gateway sync kong.yaml`                                      | Sync a state file with the configuration in Kong Gateway                                                                                                          |
| `deck gateway ping`                                                | Check the connection to Kong Gateway                                                                                                                              |
| `deck gateway validate`                                            | Self-validate its own configuration                                                                                                                               |
| `deck gateway sync kong.yaml --konnect-control-plane-name staging` | Sync Gateway configs to Konnect. **Tip:** You can add Konnect flags to any decK command to target a Konnect Control Plane instead of a self-managed Kong Gateway. |
| `deck completion bash\|zsh\|fish\|powershell`                      | Generate completion scripts for Bash, Zsh, Fish, and PowerShell. **Tip:** Run `deck completion --help` for shell-specific instructions.                           |



## Commonly Used decK File Commands for APIOps

| Command                                                                 | Description                                                          |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `deck file openapi2kong -s oas.yaml -o httpbin.yaml`                    | Generate a Kong Gateway configuration file from an API specification |
| `deck file merge httpbin.yaml another-httpbin.yaml -o merged-kong.yaml` | Merge two configuration files into one                               |
