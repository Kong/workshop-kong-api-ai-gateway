---
title : "OPA (Open Policy Agent) - Authorization"
weight : 158
---

OAuth and OpenID Connect are great and recommended options to implement not just Authentication and Authorization processes. However, there are some use cases where the Authorization policies require a bit of business logic. For example, let's say we want to prevent our API Consumers from consuming applications, protected by the Gateway, during weekends. In cases like this, one nice possibility is to have a specific layer taking care of the Authorization policies. That's the main purpose of the [Open Policy Agent - OPA](https://www.openpolicyagent.org) engine.

In fact, such a decision is simply applying the same Separation of Concerns principle to get two independent layers implementing, each one of them, the Authentication and Authorization policies. Our architecture topology would look slightly different now.


On the other hand, as we stated in the beginning of the chapter, it is not the case to remove the Authorization policies from the OAuth/OIDC layer. There will be different abstraction levels for the policies: some of them, possibly coarse-grained enterprise class ones, should still be implemented by the OAuth/OIDC layer. Fine-grained policies, instead, would be better implemented by the specific Authorization layer.

![keycloak_opa](/static/images/keycloak_opa.png)


### OPA Installation

Create another namespace, this time to install OPA

```
kubectl create namespace opa
```

OPA can be installed with this simple declaration. Note it's going to be exposed with a new Load Balancer:

```
cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: opa
  namespace: opa
  labels:
    app: opa
spec:
  replicas: 1
  selector:
    matchLabels:
      app: opa
  template:
    metadata:
      labels:
        app: opa
    spec:
      containers:
      - name: opa
        image: openpolicyagent/opa:edge-static
        volumeMounts:
          - readOnly: true
            mountPath: /policy
            name: opa-policy
        args:
          - "run"
          - "--server"
          - "--addr=0.0.0.0:8181"
          - "--set=decision_logs.console=true"
          - "--set=status.console=true"
          - "--ignore=.*"
      volumes:
      - name: opa-policy
---
apiVersion: v1
kind: Service
metadata:
  name: opa
  namespace: opa
spec:
  selector:
    app: opa
  type: LoadBalancer
  ports:
  - name: http
    protocol: TCP
    port: 8181
    targetPort: 8181
EOF
```

Check the installation
```
% kubectl get service -n opa
NAME   TYPE           CLUSTER-IP      EXTERNAL-IP   PORT(S)          AGE
opa    LoadBalancer   10.99.181.108   127.0.0.1     8181:32674/TCP   14s

% kubectl get pod -n opa
NAME                  READY   STATUS    RESTARTS   AGE
opa-b9fb4959c-mh6v6   1/1     Running   0          45s
```


Check if OPA is running properly:

```
curl -i -X GET http://localhost:8181/health
```

Expected output

```
HTTP/1.1 200 OK
Content-Type: application/json
Date: Mon, 11 Aug 2025 21:07:45 GMT
Content-Length: 3

{}
```


As expected, there no policies available:

```
curl -s -X GET http://localhost:8181/v1/policies
```

```
{"result":[]}
```

#### Create the Authorization Policy
OPA uses [Rego](https://www.openpolicyagent.org/docs/latest/#rego) language for Policy definition. Here's the policy we are going to create:

```
cat > jwt.rego << 'EOF'
package jwt

import rego.v1

default allow := false

allow if {
	check_cid
	check_working_day
}

check_cid if {
	v := input.request.http.headers.authorization
	startswith(v, "Bearer")
	bearer_token := substring(v, count("Bearer "), -1)
	[_, token, _] := io.jwt.decode(bearer_token)
	token.aud == "silver"
}

check_working_day if {
	wday := time.weekday(time.now_ns())
	wday != "Saturday"; wday != "Sunday"
}
EOF
```

The simple policy checks two main conditions:
* If the Access Token issued by Keycloak, validated and mapped by Kong Data Plane, has a specific audience. To try the policy we are requesting the audience to be a different one.
* Only requests sent during working days should be allowed.

Create the ``jwt.rego`` file and apply the policy sending a request to OPA:

```
curl -XPUT http://localhost:8181/v1/policies/jwt --data-binary @jwt.rego
```

Check the policy with:

```
curl -s -X GET http://localhost:8181/v1/policies | jq -r '.result[].id'
```
```
curl -s -X GET http://localhost:8181/v1/policies/jwt | jq -r '.result.raw'
```


#### Enable the OPA plugin to the Kong Route

Just like we did for the other plugins, we can enable the OPA plugin with a request like this. Note the **opa_path** parameter refers to the ``allow`` function defined in the policy. The **opa_host** and **opa_port** are references to the OPA Kubernetes Service's FQDN.

Since we are going to move the Authorization policy to OPA, we are also returning our OpenID Connect plugin to the original Client Credentials state, with no **audience_required** configuration:



{{<highlight>}}
cat > oidc.yaml << 'EOF'
_format_version: "3.0"
_konnect:
  control_plane_name: kong-workshop
_info:
  select_tags:
  - httpbin-service-route
services:
- name: httpbin-service
  host: httpbin.kong.svc.cluster.local
  port: 8000
  routes:
  - name: oidc-route
    paths:
    - /oidc-route
    plugins:
    - name: openid-connect
      instance_name: openid-connect1
      config:
        auth_methods: ["client_credentials"]
        issuer: http://keycloak.keycloak:8080/realms/kong
        token_endpoint: http://keycloak.keycloak:8080/realms/kong/protocol/openid-connect/token
        extra_jwks_uris: ["http://keycloak.keycloak.svc.cluster.local:8080/realms/kong/protocol/openid-connect/certs"]
        consumer_optional: false
        consumer_claim: ["client_id"]
        consumer_by: ["username"]
    - name: opa
      instance_name: opa1
      config:
        opa_path: "/v1/data/jwt/allow"
        opa_protocol: http
        opa_host: "opa.opa.svc.cluster.local"
        opa_port: 8181
consumers:
- username: kong_id
EOF
{{</highlight>}}



Submit the declaration
{{<highlight>}}
deck gateway sync --konnect-token $PAT oidc.yaml
{{</highlight>}}


#### Consume the Kong Route
A new error code should be returned if we try to consume the Route:

```
curl -siX GET http://localhost/oidc-route/get -u "kong_id:RVXO9SOJskjw4LeVupjRbIMJIAyyil8j"
```

```
HTTP/1.1 403 Forbidden
Date: Sat, 03 Aug 2024 22:02:37 GMT
Content-Type: application/json; charset=utf-8
Connection: keep-alive
Content-Length: 26
X-Kong-Response-Latency: 4
Server: kong/3.7.1.2-enterprise-edition
X-Kong-Request-Id: fa699046f7d21773b626a4311537e171

{"message":"unauthorized"}
```

This is due the audience required by OPA is different to the existing one defined in our Keycloak Client. Go to Keycloak ``kong_mapper`` Client Scope Mapper and change the **Included Custom Audience** to ``silver``.



Assuming you are on a working day, OPA should allow you to consume the Route again.

```
curl -sX GET http://localhost/oidc-route/get -u "kong_id:RVXO9SOJskjw4LeVupjRbIMJIAyyil8j"| jq -r '.headers.Authorization' | cut -d " " -f 2 | jwt decode -
```

```
Token header
------------
{
  "typ": "JWT",
  "alg": "RS256",
  "kid": "JIao4TIXpSwJxcukz6W0hK8qc_vuYf6HrmGsDmT6kzY"
}

Token claims
------------
{
  "acr": "1",
  "allowed-origins": [
    "/*"
  ],
  "aud": "silver",
  "azp": "kong_id",
  "clientAddress": "10.244.0.106",
  "clientHost": "10.244.0.106",
  "client_id": "kong_id",
  "email_verified": false,
  "exp": 1754949643,
  "iat": 1754949343,
  "iss": "http://keycloak.keycloak:8080/realms/kong",
  "jti": "trrtcc:a4d77414-c9a7-f5c0-daea-0532b8960b4e",
  "preferred_username": "service-account-kong_id",
  "scope": "openid email profile",
  "sub": "e7b5a37b-d06a-4b40-92d7-36f09768ed79",
  "typ": "Bearer"
}
```

Kong-gratulations! have now reached the end of this module by authenticating your API requests with AWS Cognito. You can now click **Next** to proceed with the next module.
