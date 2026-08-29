---
title : "kongctl"
weight : 204
---

[**kongctl**](https://developer.konghq.com/kongctl/) is a command line tool that enables you to manage Konnect resources programmatically. The tool provides both declarative and imperative style resource management capabilities along with other developer friendly features.

The declarative configuration feature allows you to define API Platform infrastructure as code using a YAML based syntax and a state free reconciliation system. The tool supports a growing list of Konnect resource types including Dev Portals, control planes, APIs, and more.

**kongctl** also ships installable AI agent skills that help coding agents generate, review, and operate kongctl configuration from a repository.

**kongctl** is one of multiple tools you can use to manage Konnect and Kong Gateway. To learn about other tools, see the [tools page](https://developer.konghq.com/tools/).

## Commonly Used kongctl Commands

| Command                                                   | Description                                                        |
| --------------------------------------------------------- | ------------------------------------------------------------------ |
| `kongctl --help`                                          | View all `kongctl` commands and options                            |
| `kongctl login`                                           | Authenticate to Konnect with browser-based device flow             |
| `kongctl get apis`                                        | List all APIs in your Konnect organization                         |
| `kongctl get api users-api --output json`                 | Get details for a specific API with JSON output                    |
| `kongctl api /v3/portals`                                 | Call Konnect APIs directly using current authentication            |
| `kongctl view`                                            | Launch an interactive terminal UI to explore resources             |
| `kongctl install skills`                                  | Install bundled AI agent skills in a repository                    |
| `kongctl plan -f my-portals.yaml --output-file plan.json` | Generate a plan from input configuration without invoking changes  |
| `kongctl apply -f my-portals.yaml -f my-apis.yaml`        | Apply changes from input configuration (create and update only)    |
| `kongctl sync -f konnect.yaml`                            | Sync changes from input configuration (create, update, and delete) |
| `kongctl diff --plan plan.json`                           | Preview proposed changes from a generated plan                     |


