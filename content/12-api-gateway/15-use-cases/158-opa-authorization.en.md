---
title : "OPA (OpenPolicyAgent) - Authorization"
weight : 158
---

OAuth and OpenID Connect are great and recommended options to implement not just Authentication and Authorization processes. However, there are some use cases where the Authorization policies require a bit of business logic. For example, let's say we want to prevent our API Consumers from consuming applications, protected by the Gateway, during weekends. In cases like this, one nice possibility is to have a specific layer taking care of the Authorization policies. That's the main purpose of the [Open Policy Agent - OPA](https://www.openpolicyagent.org) engine.

In fact, such a decision is simply applying the same Separation of Concerns principle to get two independent layers implementing, each one of them, the Authentication and Authorization policies. Our architecture topology would look slightly different now.


On the other hand, as we stated in the beginning of the chapter, it is not the case to remove the Authorization policies from the OAuth/OIDC layer. There will be different abstraction levels for the policies: some of them, possibly coarse-grained enterprise class ones, should still be implemented by the OAuth/OIDC layer. Fine-grained policies, instead, would be better implemented by the specific Authorization layer.

![keycloak_opa](/static/images/keycloak_opa.png)




Change the OpenID Connect plugin to turn Authorization off

Since we are going to move the Authorization policy to OPA, the first thing to do is return our OpenID Connect plugin to the original Client Credentials state:

curl -X PUT https://us.api.konghq.com/v2/control-planes/$CP_ID/core-entities/routes/$ROUTE_ID/plugins/oidc1 \
  --header 'Content-Type: application/json' \
  --header 'accept: application/json' \
  --header "Authorization: Bearer $PAT" \
  --data '
  {
    "name": "openid-connect",
    "instance_name": "oidc1",
    "config": {
      "issuer": "'$ISSUER'",
      "extra_jwks_uris": ["http://keycloak.keycloak.svc.cluster.local:8080/realms/kong/protocol/openid-connect/certs"],
      "auth_methods": ["client_credentials"],
      "consumer_optional": false,
      "consumer_claim": ["client_id"],
      "consumer_by": ["username"]
    }
  }'

OPA Installation
Create another namespace, this time to install OPA

kubectl create namespace opa

OPA can be installed with this simple declaration. Note it's going to be exposed with a new Load Balancer:

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

Check the installation
% kubectl get service -n opa
NAME   TYPE           CLUSTER-IP     EXTERNAL-IP      PORT(S)          AGE
opa    LoadBalancer   10.96.128.59   172.19.255.202   8181:30954/TCP   44m

% kubectl get pod -n opa
NAME                  READY   STATUS    RESTARTS   AGE
opa-84d784c88-m8r2n   1/1     Running   0          5h17m

Check if OPA is running properly:

% curl -i -X GET http://172.19.255.202:8181/health
HTTP/1.1 200 OK
Content-Type: application/json
Date: Sat, 03 Aug 2024 17:16:14 GMT
Content-Length: 3

{}

As expected, there no policies available:

% curl -s -X GET http://172.19.255.202:8181/v1/policies
{"result":[]}

Create the Authorization Policy
OPA uses Rego (https://www.openpolicyagent.org/docs/latest/#rego) language for Policy definition. Here's the policy we are going to create:

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

The simple policy checks two main conditions:
If the Access Token issued by Keycloak, validated and mapped by Kong Data Plane, has a specific audience. To try the policy we are requesting the audience to be a different one.
Only requests sent during working days should be allowed.

Create a file named "jwt.rego" and apply the policy sending a request to OPA:

curl -XPUT http://172.19.255.202:8181/v1/policies/jwt --data-binary @jwt.rego

Check the policy with:

curl -s -X GET http://172.19.255.202:8181/v1/policies | jq -r '.result[].id'

curl -s -X GET http://172.19.255.202:8181/v1/policies/jwt | jq -r '.result.raw'

Enable the OPA plugin to the Kong Route
Just like we did for the other plugins, we can enable the OPA plugin with a request like this. Note the "opa_path" parameter refers to the "allow" function defined in the policy. The "opa_host" and "opa_port" are references to the OPA Kubernetes Service's FQDN:

curl -X POST https://us.api.konghq.com/v2/control-planes/$CP_ID/core-entities/routes/$ROUTE_ID/plugins \
  --header 'Content-Type: application/json' \
  --header 'accept: application/json' \
  --header "Authorization: Bearer $PAT" \
  --data '
  {
    "name": "opa",
    "instance_name": "opa",
    "config": {
      "opa_path": "/v1/data/jwt/allow",
      "opa_protocol": "http",
      "opa_host": "opa.opa.svc.cluster.local",
      "opa_port": 8181
    }
  }'

If you want to check the enabled plugin your Kong Route currently has send the following request:

% curl -sX GET https://us.api.konghq.com/v2/control-planes/$CP_ID/core-entities/routes/$ROUTE_ID/plugins \
  --header 'Content-Type: application/json' \
  --header 'accept: application/json' \
  --header "Authorization: Bearer $PAT" | jq -r '.data[] | select(.enabled==true)' | jq -r '.name'
openid-connect
opa

Consume the Kong Route
A new error code should be returned if we try to consume the Route:

% curl -siX GET $DP_ADDR/route1/get -u "kong_id:Se1nohCpJMpjBplyGbTrh67yKeAmP1Kr"

HTTP/1.1 403 Forbidden
Date: Sat, 03 Aug 2024 22:02:37 GMT
Content-Type: application/json; charset=utf-8
Connection: keep-alive
Content-Length: 26
X-Kong-Response-Latency: 4
Server: kong/3.7.1.2-enterprise-edition
X-Kong-Request-Id: fa699046f7d21773b626a4311537e171

{"message":"unauthorized"}

This is due the audience required by OPA is different to the existing one defined in our Keycloak Client. Go to Keycloak "kong_mapper" Client Scope Mapper and change the "Included Custom Audience" to "silver".



Assuming you are on a working day, OPA should allow you to consume the Route again.

% curl -sX GET $DP_ADDR/route1/get -u "kong_id:Se1nohCpJMpjBplyGbTrh67yKeAmP1Kr"| jq -r '.headers.Authorization' | cut -d " " -f 2 | jwt decode -

Token header
------------
{
  "typ": "JWT",
  "alg": "RS256",
  "kid": "9ah-4Ngfka3NZOd3lnu1zO4Wy31jS9vS-jU_xCW45pU"
}

Token claims
------------
{
  "acr": "1",
  "allowed-origins": [
    "http://172.19.255.200"
  ],
  "aud": "silver",
  "azp": "kong_id",
  "clientAddress": "10.244.0.1",
  "clientHost": "10.244.0.1",
  "client_id": "kong_id",
  "email_verified": false,
  "exp": 1722723209,
  "iat": 1722722909,
  "iss": "http://172.19.255.201:8080/realms/kong",
  "jti": "ae549748-1dc0-4f5a-8c7f-4d6d9ae52f70",
  "preferred_username": "service-account-kong_id",
  "scope": "openid profile email",
  "sub": "f1905c0c-3454-4fdc-a050-752da8062f80",
  "typ": "Bearer"
}


Kong-gratulations! have now reached the end of this module by authenticating your API requests with AWS Cognito. You can now click **Next** to proceed with the next module.
