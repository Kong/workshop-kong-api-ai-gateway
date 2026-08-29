---
title : "AI Gateway entities with kongctl"
weight : 208
---





## Convert decK to kongctl

```
kongctl convert ai-gateway ai-a2a-proxy.yaml \
  --from deck \
  --to kongctl \
  --gateway-name ai-gateway-1 \
  --output-file ai-gateway.yaml
```

```
kongctl apply --pat $PAT -f ai-gateway.yaml --auto-approve
```










```
_defaults:
  kongctl:
    namespace: kong

ai_gateways:
- ref: ai-gateway-1
  _external:
    selector:
        matchFields:
          name: "ai-gateway-1"


ai_gateway_model_providers:
- ref: openai1
  ai_gateway: ai-gateway-1
  name: openai
  display_name: openai
  type: openai
  config:
    auth:
      type: basic
      headers:
        - name: Authorization
          value: !env OPENAI_AUTH_HEADER


ai_gateway_policies:
- ref: ai-rate-limiting-advanced1
  ai_gateway: ai-gateway-1
  enabled: true
  global: false
  name: ai-rate-limiting-advanced
  display_name: ai-rate-limiting-advanced1
  type: ai-rate-limiting-advanced
  config:
    strategy: local
    policies:
    - match:
      # - type: ip
      - type: consumer
      - type: model
        partition_by: true
        values:
        - gpt-4o
      limits:
      - limit: 500
        window_size: 60
      # - limit: 1000
      #   window_size: 3600



ai_gateway_identity_providers:
- ref: idp1
  ai_gateway: ai-gateway-1
  config:
    hide_credentials: true
    key_in_body: false
    key_in_header: true
    key_in_query: true
    key_names:
    - apikey
  display_name: key-auth1
  name: key-auth1
  type: key-auth



ai_gateway_consumers:
- ref: consumer1
  ai_gateway: ai-gateway-1
  display_name: consumer1
  name: consumer1
  type: api-key
  policies:
  - !ref ai-rate-limiting-advanced1
  credentials:
  - ref: credential1
    name: credential1
    display_name: credential1
    type: api-key
    api_key: !env CONSUMER_CREDENTIAL



ai_gateway_models:
- ref: openai
  ai_gateway: ai-gateway-1
  enabled: true
  name: gpt-4o
  display_name: gpt-4o
  type: model
  formats:
  - type: openai
  config:
    route:
      paths:
      - /openai-route
      model:
        body_param: model
        values:
        - gpt-4o
  targets:
  - name: gpt-4o
    provider: openai
    config:
      type: openai
  # policies:
  # - !ref key-auth1
  access:
    identity_providers:
    - key-auth1
  capabilities:
  - generate
```





```
# ai_gateway_identity_providers:
# - ref: idp1
#   ai_gateway: ai-gateway-1
#   config:
#     hide_credentials: true
#     key_in_body: false
#     key_in_header: true
#     key_in_query: true
#     key_names:
#     - apikey-a2a
#     - apikey-llm
#   display_name: key-auth1
#   name: key-auth1
#   type: key-auth



# ai_gateway_consumers:
# - ref: consumer1
#   ai_gateway: ai-gateway-1
#   display_name: consumer1
#   name: consumer1
#   type: api-key
#   policies:
#   - !ref ai-rate-limiting-advanced1
#   credentials:
#   - ref: credential1
#     name: credential1
#     display_name: credential1
#     type: api-key
#     api_key: !env CONSUMER_CREDENTIAL


ai_gateways:
  # - name: ai-gateway-1
  #   # ai_gateway: ai-gateway-1
  #   display_name: ai-gateway-1
  #   ref: ai-gateway-1
  - ref: ai-gateway-1
    _external:
      selector:
          matchFields:
            name: "ai-gateway-1"
    identity_providers:
    - display_name: key-auth1
      name: key-auth1
      type: key-auth
      ref: idp1
      config:
        hide_credentials: true
        key_in_body: false
        key_in_header: true
        key_in_query: true
        key_names:
        - apikey-a2a
        - apikey-llm
    # providers:
    model_providers:
      - display_name: bedrock-mp
        name: bedrock-mp
        ref: bedrock-mp
        type: bedrock
        config:
          auth:
            type: aws
    models:
      - name: bedrock-m
        display_name: bedrock-m
        ref: bedrock-m
        type: model
        formats:
          - type: openai
        # access:
        #   identity_providers:
        #     - key-auth-1
        # capabilities: []
        access:
          identity_providers:
          - key-auth1
        capabilities:
          - generate
        config:
          route:
            paths:
            - /llm-route
            protocols:
              - http
              - https            
          logging:
            payloads: true
            # statistics: true
          max_request_body_size: 65536
        policies:
          - request-transformer
          # - tcp-log
        # target_models:
        targets:
          - provider: bedrock-mp
            name: us.anthropic.claude-sonnet-4-6
            # name: us.anthropic.claude-sonnet-4-20250514-v1:0
            allow_auth_override: false
            config:
              input_cost: 1000
              output_cost: 3000
              region: us-west-2
              type: bedrock
    agents:
      - name: a2a-agent
        display_name: a2a-agent
        ref: a2a-agent
        type: a2a
        # access:
        #   identity_providers:
        #   - key-auth1
        # policies:
        #   - key-auth
        config:
          url: https://bedrock-agentcore.us-west-2.amazonaws.com:443/runtimes/arn%3Aaws%3Abedrock-agentcore%3Aus-west-2%3A481711488351%3Aruntime%2Fkongagentcore_kongagentcore-xRHFSSFpX5/invocations
          route:
            # name: a2a-route
            paths:
              - /a2a
            protocols:
              - http
              - https
            strip_path: true
          upstream:
            auth:
              type: aws
          logging:
            max_payload_size: 1048576
            payloads: true
            statistics: true
          max_request_body_size: 0
    consumers:
      - display_name: a2a-client-1
        name: a2a-client-1
        ref: a2a-client-1
        type: api-key
        credentials:
          - display_name: a2a-client-1-credential
            name: a2a-client-1-credential
            ref: a2a-client-1-credential
            type: api-key
            api_key: !env A2A_CREDENTIAL
            # api_key: "abcde"
      - display_name: llm-client-1
        name: llm-client-1
        ref: llm-client-1
        type: api-key
        credentials:
          - display_name: llm-client-1-credential
            name: llm-client-1-credential
            ref: llm-client-1-credential
            type: api-key
            api_key: !env LLM_CREDENTIAL
            # api_key: "12345"
    mcp_servers:
      - name: mcp-listener
        display_name: mcp-listener
        ref: mcp-listener
        type: listener
        config:
          route:
            paths:
              - /mcp-listener
            protocols:
              - http
              - https
          max_request_body_size: 32768
          logging:
            audits: true
            payloads: true
            # statistics: true
        sources:
        - mcp-proxy-marketplace
      - name: mcp-proxy-agentcore
        display_name: mcp-proxy-agentcore
        ref: mcp-proxy-agentcore
        type: passthrough-listener
        config:
          route:
            # name: agentcore-route
            paths:
              - /agentcore-mcp
          url: https://bedrock-agentcore.us-west-2.amazonaws.com:443/runtimes/arn%3Aaws%3Abedrock-agentcore%3Aus-west-2%3A481711488351%3Aruntime%2Fmcp1_mcp1-ytzd3L6RAX/invocations
          upstream:
            auth:
              type: aws
          # server:
          #   tags:
          #   - mcp-tools
          logging:
            audits: true
            payloads: true
            # statistics: true
      - name: mcp-proxy-marketplace
        display_name: mcp-proxy-marketplace
        ref: mcp-proxy-marketplace
        type: conversion-only
        config:
          logging:
            audits: false
            payloads: false
            # statistics: true
          route:
            # name: marketplace-route
            paths:
              - /
          url: http://localhost:32000
        policies:
          - mocking
        tools:
          - description: Get users
            method: GET
            name: get-users
            parameters:
              - description: Optional user ID
                in: query
                name: id
                required: false
                schema:
                  type: string
            path: /users
          - description: Get orders for a user
            method: GET
            name: get-orders
            parameters:
              - description: User ID to filter orders
                in: query
                name: userid
                required: true
                schema:
                  type: string
            path: /orders
    policies:
      # - config:
      #     key_names:
      #       - apikey-a2a
      #   display_name: key-auth
      #   enabled: false
      #   name: key-auth
      #   ref: key-auth
      #   type: key-auth
      - name: request-transformer
        display_name: request-transformer
        ref: request-transformer
        type: request-transformer
        enabled: false
        config:
          replace:
            body:
              - model:us.anthropic.claude-sonnet-4-20250514-v1:0
      # - config:
      #     host: collector-kong-collector.opentelemetry-operator-system.svc.cluster.local
      #     port: 54525
      #   display_name: tcp-log
      #   enabled: true
      #   name: tcp-log
      #   ref: tcp-log
      #   type: tcp-log
      - name: mocking
        ref: mocking
        type: mocking
        display_name: mocking
        enabled: true
        config:
          api_specification: |-
            openapi: 3.0.0
            info:
              title: Sample Users API
              version: 1.1.0
              description: A sample API for managing users and orders in a mock marketplace.
            servers:
              - url: http://localhost:3000
                description: Local development server
            paths:
              /:
                get:
                  summary: Root endpoint
                  description: Returns the name of the API.
                  responses:
                    '200':
                      description: API name
                      content:
                        application/json:
                          schema:
                            type: object
                            properties:
                              name:
                                type: string
                                example: Sample Users API
                          examples:
                            root:
                              summary: API root response
                              value:
                                name: Sample Users API
              /users:
                get:
                  summary: List all users
                  description: Retrieves a list of all users.
                  responses:
                    '200':
                      description: List of users
                      content:
                        application/json:
                          schema:
                            type: array
                            items:
                              type: object
                              properties:
                                id:
                                  type: string
                                fullName:
                                  type: string
                          examples:
                            allUsers:
                              summary: Complete list of all users
                              value:
                                - id: a1b2c3d4
                                  fullName: Alice Johnson
                                - id: e5f6g7h8
                                  fullName: Bob Smith
                                - id: i9j0k1l2
                                  fullName: Charlie Lee
                                - id: m3n4o5p6
                                  fullName: Diana Evans
                                - id: q7r8s9t0
                                  fullName: Ethan Brown
                                - id: u1v2w3x4
                                  fullName: Fiona Clark
                                - id: y5z6a7b8
                                  fullName: George Harris
                                - id: c9d0e1f2
                                  fullName: Hannah Lewis
                                - id: g3h4i5j6
                                  fullName: Ian Walker
                                - id: k7l8m9n0
                                  fullName: Julia Turner
              /users/{id}:
                get:
                  summary: Get a user by ID
                  description: Retrieves details for a specific user by their ID.
                  parameters:
                    - name: id
                      in: path
                      required: true
                      description: The unique ID of the user
                      schema:
                        type: string
                  responses:
                    '200':
                      description: User details
                      content:
                        application/json:
                          schema:
                            type: object
                            properties:
                              id:
                                type: string
                              fullName:
                                type: string
                          examples:
                            alice:
                              summary: Alice Johnson user
                              value:
                                id: a1b2c3d4
                                fullName: Alice Johnson
                            bob:
                              summary: Bob Smith user
                              value:
                                id: e5f6g7h8
                                fullName: Bob Smith
                            charlie:
                              summary: Charlie Lee user
                              value:
                                id: i9j0k1l2
                                fullName: Charlie Lee
                            diana:
                              summary: Diana Evans user
                              value:
                                id: m3n4o5p6
                                fullName: Diana Evans
                            ethan:
                              summary: Ethan Brown user
                              value:
                                id: q7r8s9t0
                                fullName: Ethan Brown
                            fiona:
                              summary: Fiona Clark user
                              value:
                                id: u1v2w3x4
                                fullName: Fiona Clark
                            george:
                              summary: George Harris user
                              value:
                                id: y5z6a7b8
                                fullName: George Harris
                            hannah:
                              summary: Hannah Lewis user
                              value:
                                id: c9d0e1f2
                                fullName: Hannah Lewis
                            ian:
                              summary: Ian Walker user
                              value:
                                id: g3h4i5j6
                                fullName: Ian Walker
                            julia:
                              summary: Julia Turner user
                              value:
                                id: k7l8m9n0
                                fullName: Julia Turner
                    '404':
                      description: User not found
                      content:
                        application/json:
                          schema:
                            type: object
                            properties:
                              error:
                                type: string
                          examples:
                            notFound:
                              summary: Error when user does not exist
                              value:
                                error: User not found
              /orders:
                get:
                  summary: List all orders
                  description: Retrieves a list of all orders.
                  responses:
                    '200':
                      description: List of all orders
                      content:
                        application/json:
                          schema:
                            type: array
                            items:
                              type: object
                              properties:
                                id:
                                  type: string
                                name:
                                  type: string
                                userId:
                                  type: string
                          examples:
                            allOrders:
                              summary: Complete list of all orders
                              value:
                                - id: ord001
                                  name: Sugar (50kg)
                                  userId: a1b2c3d4
                                - id: ord002
                                  name: Cleaning Supplies Pack
                                  userId: a1b2c3d4
                                - id: ord003
                                  name: Canned Tomatoes (100 cans)
                                  userId: a1b2c3d4
                                - id: ord004
                                  name: Flour (100kg)
                                  userId: e5f6g7h8
                                - id: ord005
                                  name: Dish Soap (10 bottles)
                                  userId: e5f6g7h8
                                - id: ord006
                                  name: Salt (25kg)
                                  userId: e5f6g7h8
                                - id: ord007
                                  name: Olive Oil (20L)
                                  userId: i9j0k1l2
                                - id: ord008
                                  name: Baking Powder (10kg)
                                  userId: i9j0k1l2
                                - id: ord009
                                  name: Rice (200kg)
                                  userId: m3n4o5p6
                                - id: ord010
                                  name: Vegetable Oil (15L)
                                  userId: m3n4o5p6
                                - id: ord011
                                  name: Pasta (80kg)
                                  userId: m3n4o5p6
                                - id: ord012
                                  name: Canned Beans (50 cans)
                                  userId: m3n4o5p6
                                - id: ord013
                                  name: Toilet Paper (Case of 48)
                                  userId: q7r8s9t0
                                - id: ord014
                                  name: Hand Sanitizer (20 bottles)
                                  userId: q7r8s9t0
                                - id: ord015
                                  name: Laundry Detergent (10L)
                                  userId: u1v2w3x4
                                - id: ord016
                                  name: Trash Bags (100 ct)
                                  userId: u1v2w3x4
                                - id: ord017
                                  name: Disinfectant Spray (5 bottles)
                                  userId: u1v2w3x4
                                - id: ord018
                                  name: Coffee Beans (30kg)
                                  userId: k7l8m9n0
                                - id: ord019
                                  name: Tea Bags (500ct)
                                  userId: k7l8m9n0
                                - id: ord020
                                  name: Condensed Milk (40 cans)
                                  userId: k7l8m9n0
                                - id: ord021
                                  name: Paper Towels (24 rolls)
                                  userId: g3h4i5j6
                                - id: ord022
                                  name: Broom & Mop Set
                                  userId: g3h4i5j6
                                - id: ord023
                                  name: Cereal (20 boxes)
                                  userId: c9d0e1f2
                                - id: ord024
                                  name: Powdered Milk (10kg)
                                  userId: c9d0e1f2
                                - id: ord025
                                  name: Snacks Variety Pack
                                  userId: c9d0e1f2
                                - id: ord026
                                  name: Cooking Gas Cylinder
                                  userId: y5z6a7b8
                                - id: ord027
                                  name: Napkins (1000ct)
                                  userId: y5z6a7b8
              /users/{userId}/orders:
                get:
                  summary: List orders for a user
                  description: Retrieves all orders for a specific user by their ID.
                  parameters:
                    - name: userId
                      in: path
                      required: true
                      description: The unique ID of the user
                      schema:
                        type: string
                  responses:
                    '200':
                      description: List of orders for the user
                      content:
                        application/json:
                          schema:
                            type: array
                            items:
                              type: object
                              properties:
                                id:
                                  type: string
                                name:
                                  type: string
                                userId:
                                  type: string
                          examples:
                            aliceOrders:
                              summary: "Orders for Alice Johnson (userId: a1b2c3d4)"
                              value:
                                - id: ord001
                                  name: Sugar (50kg)
                                  userId: a1b2c3d4
                                - id: ord002
                                  name: Cleaning Supplies Pack
                                  userId: a1b2c3d4
                                - id: ord003
                                  name: Canned Tomatoes (100 cans)
                                  userId: a1b2c3d4
                            bobOrders:
                              summary: "Orders for Bob Smith (userId: e5f6g7h8)"
                              value:
                                - id: ord004
                                  name: Flour (100kg)
                                  userId: e5f6g7h8
                                - id: ord005
                                  name: Dish Soap (10 bottles)
                                  userId: e5f6g7h8
                                - id: ord006
                                  name: Salt (25kg)
                                  userId: e5f6g7h8
                            charlieOrders:
                              summary: "Orders for Charlie Lee (userId: i9j0k1l2)"
                              value:
                                - id: ord007
                                  name: Olive Oil (20L)
                                  userId: i9j0k1l2
                                - id: ord008
                                  name: Baking Powder (10kg)
                                  userId: i9j0k1l2
                            dianaOrders:
                              summary: "Orders for Diana Evans (userId: m3n4o5p6)"
                              value:
                                - id: ord009
                                  name: Rice (200kg)
                                  userId: m3n4o5p6
                                - id: ord010
                                  name: Vegetable Oil (15L)
                                  userId: m3n4o5p6
                                - id: ord011
                                  name: Pasta (80kg)
                                  userId: m3n4o5p6
                                - id: ord012
                                  name: Canned Beans (50 cans)
                                  userId: m3n4o5p6
                            ethanOrders:
                              summary: "Orders for Ethan Brown (userId: q7r8s9t0)"
                              value:
                                - id: ord013
                                  name: Toilet Paper (Case of 48)
                                  userId: q7r8s9t0
                                - id: ord014
                                  name: Hand Sanitizer (20 bottles)
                                  userId: q7r8s9t0
                            fionaOrders:
                              summary: "Orders for Fiona Clark (userId: u1v2w3x4)"
                              value:
                                - id: ord015
                                  name: Laundry Detergent (10L)
                                  userId: u1v2w3x4
                                - id: ord016
                                  name: Trash Bags (100 ct)
                                  userId: u1v2w3x4
                                - id: ord017
                                  name: Disinfectant Spray (5 bottles)
                                  userId: u1v2w3x4
                            juliaOrders:
                              summary: "Orders for Julia Turner (userId: k7l8m9n0)"
                              value:
                                - id: ord018
                                  name: Coffee Beans (30kg)
                                  userId: k7l8m9n0
                                - id: ord019
                                  name: Tea Bags (500ct)
                                  userId: k7l8m9n0
                                - id: ord020
                                  name: Condensed Milk (40 cans)
                                  userId: k7l8m9n0
                            ianOrders:
                              summary: "Orders for Ian Walker (userId: g3h4i5j6)"
                              value:
                                - id: ord021
                                  name: Paper Towels (24 rolls)
                                  userId: g3h4i5j6
                                - id: ord022
                                  name: Broom & Mop Set
                                  userId: g3h4i5j6
                            hannahOrders:
                              summary: "Orders for Hannah Lewis (userId: c9d0e1f2)"
                              value:
                                - id: ord023
                                  name: Cereal (20 boxes)
                                  userId: c9d0e1f2
                                - id: ord024
                                  name: Powdered Milk (10kg)
                                  userId: c9d0e1f2
                                - id: ord025
                                  name: Snacks Variety Pack
                                  userId: c9d0e1f2
                            georgeOrders:
                              summary: "Orders for George Harris (userId: y5z6a7b8)"
                              value:
                                - id: ord026
                                  name: Cooking Gas Cylinder
                                  userId: y5z6a7b8
                                - id: ord027
                                  name: Napkins (1000ct)
                                  userId: y5z6a7b8
                    '404':
                      description: User not found
                      content:
                        application/json:
                          schema:
                            type: object
                            properties:
                              error:
                                type: string
                          examples:
                            notFound:
                              summary: Error when user does not exist
                              value:
                                error: User not found
```