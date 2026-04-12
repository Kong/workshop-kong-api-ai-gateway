---
title : "Mock Kong Gateway Services with OpenAPI Spec"
weight : 1801
---

The Mocking plugin allows you to provide mock endpoints to test APIs in development against your existing services. The Mocking plugin leverages standards based on the Open API Specification (OAS) for sending out mock responses to APIs. Mocking supports both Swagger 2.0 and OpenAPI 3.0.

In this first step we are just creating a Kong Gateway Service and a Kong Route with the [**Kong Mocking Plugin**](https://developer.konghq.com/plugins/mocking/) and the OpenAPI Spec. The next step will convert the Kong Gateway Service into MCP Tools.

Here's the architecture:

![marketplace_arch](/static/images/marketplace_arch.png)


### Download the decK declaration with Kong Mocking Plugin and OpenAPI Spec

* Download the [**marketplace_mock.yaml**](/code/marketplace_mock.yaml) spec.



### Submit the decK declaration to your Control Plane

```
deck gateway reset --konnect-control-plane-name kong-workshop --konnect-token $PAT -f
deck gateway sync --konnect-control-plane-name kong-workshop --konnect-token $PAT marketplace_mock.yaml
```

You should see your a new Kong Service and Route. Particularly, the Kong Route has the **Mocking Plugin** enabled.

![martetplace_service_route](/static/images/marketplace_service_route.png)




### Check the decK file and test the Kong Route

Just like anyother spec, The decK file has an initial section defining the Kong Gateway Service and Kong Route:
```
_format_version: "3.0"
services:
- url: http://httpbin.konghq.com
  name: marketplace
  routes:
  - name: marketplace-route
    paths:
    - /
```

The Kong Route has the **Kong Mocking Plugin** enabled. The Plugin configuration has a full OpenAPI Specification which include some paths. Here's a snippet of the **api_specification** configuration parameter:
```
    plugins:
    - name: mocking
      instance_name: marketplace-mock
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
...
            /users:
              get:
                summary: List all users
                description: Retrieves a list of all users.
...
            /users/{id}:
              get:
                summary: Get a user by ID
                description: Retrieves details for a specific user by their ID.
...
            /orders:
              get:
                summary: List all orders
                description: Retrieves a list of all orders.
...
            /users/{userId}/orders:
              get:
                summary: List orders for a user
                description: Retrieves all orders for a specific user by their ID.
...
```

Each path defines, inside the **examples** section, the values the plugin should return when it receives a request with the given path. For example, if you send the following request:
```
curl -s $DATA_PLANE_LB/users | jq
```

You should get a response like:
```
[
  {
    "fullName": "Alice Johnson",
    "id": "a1b2c3d4"
  },
  {
    "fullName": "Bob Smith",
    "id": "e5f6g7h8"
  },
  {
    "fullName": "Charlie Lee",
    "id": "i9j0k1l2"
  },
  {
    "fullName": "Diana Evans",
    "id": "m3n4o5p6"
  },
  {
    "fullName": "Ethan Brown",
    "id": "q7r8s9t0"
  },
  {
    "fullName": "Fiona Clark",
    "id": "u1v2w3x4"
  },
  {
    "fullName": "George Harris",
    "id": "y5z6a7b8"
  },
  {
    "fullName": "Hannah Lewis",
    "id": "c9d0e1f2"
  },
  {
    "fullName": "Ian Walker",
    "id": "g3h4i5j6"
  },
  {
    "fullName": "Julia Turner",
    "id": "k7l8m9n0"
  }
]
```

Here's the snippet of the decK declaration for the **/users** path:
```
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
```



### Test the API Deployment

You can also send requests like this, for example:
```
curl -s $DATA_PLANE_LB/orders | jq
```





You can now click **Next** to proceed further.
