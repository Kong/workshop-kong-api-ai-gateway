---
title : "Keycloak"
weight : 1573
---


The two next topics describe Authorization Code OAuth and Client Credentials grants implemented by Kong Konnect and [Keycloak](https://www.keycloak.org/) as the Identity Provider. Let's start installing Keycloak in our Kubernetes Cluster.




## Keycloak Installation

Download the [keycloak.yaml](/code/keycloak.yaml) spec.


```
kubectl apply -f keycloak.yaml
```


Check the Kubernetes deployment
```
kubectl get all -n keycloak
```

You should see something like this:
```
NAME                            READY   STATUS    RESTARTS   AGE
pod/keycloak-0                  1/1     Running   0          12s
pod/postgres-5cbbfb67bc-gthd9   1/1     Running   0          12s

NAME                         TYPE           CLUSTER-IP      EXTERNAL-IP   PORT(S)          AGE
service/keycloak             LoadBalancer   10.103.60.212   127.0.0.1     8080:32396/TCP   12s
service/keycloak-discovery   ClusterIP      None            <none>        <none>           12s
service/postgres             ClusterIP      10.110.93.239   <none>        5432/TCP         12s

NAME                       READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/postgres   1/1     1            1           12s

NAME                                  DESIRED   CURRENT   READY   AGE
replicaset.apps/postgres-5cbbfb67bc   1         1         1       12s

NAME                        READY   AGE
statefulset.apps/keycloak   1/1     12s
```


### Get the Keycloak Load Balancer

```
export KEYCLOAK_LB=$(kubectl get service keycloak -n keycloak --output=jsonpath='{.status.loadBalancer.ingress[0].ip}')
```

Make sure the Load Balancer has been provisioned:

```
curl -sX GET http://$KEYCLOAK_LB:8080/realms/master/.well-known/openid-configuration | jq -r '.issuer'
```

You should get a response like this:
```
http://127.0.0.1:8080/realms/master

```


## Create a Keycloak Realm and a Client-Id and Client-Secret pair

The following commands do the following:
* Issue a Keycloak Token:
* Create a new Keycloak Realm named as **kong**
* Create a Client-Id named as **client1**. The ```serviceAccountsEnbled```parameter grants the Client-Id the support for the [**Client Credentials Grant**](https://oauth.net/2/grant-types/client-credentials/). That's the Client-Id we are going to use for coming configurations.
* Get the Id of the Client-Id **client1**
* Add redirect URIs. That is used for the [**Authorization Code Grant**](https://oauth.net/2/grant-types/authorization-code/)
* Specifically for the **Authorization Code Grant**, a Keycloak user.

Click on Credentials and Set password. Type kong for both Password and Password confirmation fields. Turn Temporary to off and click on Save and Save Password.
* Create a Client-Secret for the Client-Id **client1**. The Client-Secret is stored in the **CLIENT_SECRET** environment variable.

```
echo "Get an Admin Token"
TOKEN=$(curl -s http://$KEYCLOAK_LB:8080/realms/master/protocol/openid-connect/token \
  -d "client_id=admin-cli" \
  -d "username=admin" \
  -d "password=admin" \
  -d "grant_type=password" \
  | jq -r .access_token)


echo "Get the Admin CLI Id"
ADMIN_CLI_ID=$(curl -s "http://$KEYCLOAK_LB:8080/admin/realms/master/clients?clientId=admin-cli" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.[0].id')

echo "Get current admin-cli JSON config"
CLIENT_JSON=$(curl -s "http://$KEYCLOAK_LB:8080/admin/realms/master/clients/$ADMIN_CLI_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "Update Admin Token lifespan attribute while preserving existing config"
echo "$CLIENT_JSON" | jq '.attributes["access.token.lifespan"] = "3600"' | \
curl -X PUT "http://$KEYCLOAK_LB:8080/admin/realms/master/clients/$ADMIN_CLI_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @-

echo "Issue a new Token with a longer expiration datetime"
TOKEN=$(curl -s http://$KEYCLOAK_LB:8080/realms/master/protocol/openid-connect/token \
  -d "client_id=admin-cli" \
  -d "username=admin" \
  -d "password=admin" \
  -d "grant_type=password" \
  | jq -r .access_token)




echo "Create the Kong Realm"
curl -X POST http://$KEYCLOAK_LB:8080/admin/realms \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "realm": "kong",
    "accessTokenLifespan": 3600,
    "enabled": true
  }'

echo "Create the client1 Client"
curl -X POST http://$KEYCLOAK_LB:8080/admin/realms/kong/clients \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "client1",
    "enabled": true,
    "serviceAccountsEnabled": true
  }'


echo "Create the Client internal Id"
ID=$(curl -s "http://$KEYCLOAK_LB:8080/admin/realms/kong/clients?clientId=client1" \
  -H "Authorization: Bearer $TOKEN" \
  | jq -r '.[0].id')


echo "Define the redirect URI for the Client"
curl -X PUT "http://$KEYCLOAK_LB:8080/admin/realms/kong/clients/$ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "client1",
    "enabled": true,
    "redirectUris": [
      "http://'"$DATA_PLANE_LB"'/oidc-route/get"
    ]
  }'


echo "Define the username for password for the Client"
curl -X POST http://$KEYCLOAK_LB:8080/admin/realms/kong/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "consumer1",
    "email": "claudio.acquaviva@gmail.com",
    "firstName": "Claudio",
    "lastName": "Acquaviva",
    "enabled": true,
    "credentials": [{
      "type": "password",
      "value": "kong",
      "temporary": false
    }]
  }'


echo "Get the Client Secret"
CLIENT_SECRET=$(curl -s "http://$KEYCLOAK_LB:8080/admin/realms/kong/clients/$ID/client-secret" \
  -H "Authorization: Bearer $TOKEN" \
  | jq -r '.value')
```

You can check the token's expiration datetime with

```
date -r $(echo "$TOKEN" | jq -R 'split(".")[1] | @base64d | fromjson | .exp')
```


Check you Keycloak installation redirecting your browser to:

```
open -a "Google Chrome" "http://$KEYCLOAK_LB:8080"
```

Use ``admin`` and ``admin`` as the Keycloak Administrator's user id and password. Go to the **kong** realm and check the Clients.

![keycloak](/static/images/keycloak.png)


## Test the Keycloak Endpoint

You can check the Keycloak setting sending a request directly to its Token Endpoint, passing the **client_id/client_secret** pair you have just created. You should get an Access Token as a result. Use ```jwt``` to decode the Access Token. Make sure you have jwt installed on your environment. For example:

```
curl -s -X POST http://$KEYCLOAK_LB:8080/realms/kong/protocol/openid-connect/token \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'client_id=client1' \
--data-urlencode "client_secret=$CLIENT_SECRET" \
--data-urlencode 'grant_type=client_credentials' | jq -r '.access_token' | jwt decode -
```



Expected Output:
```
Token header
------------
{
  "typ": "JWT",
  "alg": "RS256",
  "kid": "weLczjdEl67i4hvg_DTf6TcvYPPiCFIl_cXCYcoZKns"
}

Token claims
------------
{
  "acr": "1",
  "aud": "account",
  "azp": "client1",
  "clientAddress": "10.244.0.1",
  "clientHost": "10.244.0.1",
  "client_id": "client1",
  "email_verified": false,
  "exp": 1776083123,
  "iat": 1776082823,
  "iss": "http://localhost:8080/realms/kong",
  "jti": "trrtcc:f60fa4a6-f6df-71c3-7b14-730f2c2382b5",
  "preferred_username": "service-account-client1",
  "realm_access": {
    "roles": [
      "offline_access",
      "uma_authorization",
      "default-roles-kong"
    ]
  },
  "resource_access": {
    "account": {
      "roles": [
        "manage-account",
        "manage-account-links",
        "view-profile"
      ]
    }
  },
  "scope": "profile email",
  "sub": "ecbbd65d-94d6-4a03-b1de-c4db2cf50ee4",
  "typ": "Bearer"
}
```


