---
title : "Keycloak"
weight : 1573
---

The two next topics describe Authorization Code OAuth and Client Credentials grants implemented by Kong Konnect and [Keycloak](https://www.keycloak.org/) as the Identity Provider. Let's start installing Keycloak in our Kubernetes Cluster.


### Keycloak Installation

Run the following command to deploy Keycloak:

{{<highlight>}}
wget https://raw.githubusercontent.com/keycloak/keycloak-quickstarts/refs/heads/main/kubernetes/keycloak.yaml
{{</highlight>}}

{{<highlight>}}
yq 'select(.kind == "Service" and .metadata.name == "keycloak") |= .spec.type = "LoadBalancer"' -i keycloak.yaml
yq 'select(.kind == "StatefulSet" and .metadata.name == "keycloak") |= .spec.replicas = 1' -i keycloak.yaml
{{</highlight>}}




{{<highlight>}}
kubectl create namespace keycloak
kubectl apply -n keycloak -f keycloak.yaml
{{</highlight>}}




### Keycloak "Realm" definition

All our configuration will be done in a specific Keycloak Realm. Direct your browser to the Keycloak's external IP address:

{{<highlight>}}
http://localhost:8080
{{</highlight>}}


To login use the admin's credentials: ```admin/admin```. Click on **Manage realms** we can create a new ```realm```. Create a ```realm``` called **kong**.

###### Client_Id/Client_Secret creation

For both OAuth grants we need a **cliend_id** and **client_secret** pair. Clicking on **Clients** and **Create client** we can define a new ```client``` representing Kong.

Choose ```kong_id``` for the new **Client ID**. The configurations should be the following:
* **Capability config**
  * Client authentication: on (Access Type: public)
  * Authentication flow -> Service accounts role: on (this allows us to implement the OAuth "Client Credentials" Grant)
* **Login settings**
  * Valid Redirect URIs: ```http://localhost/oidc-route/get```. This parameter is needed in the OAuth Authorization Code Grant. It defines which URIs are allowed to redirect users to Keycloak.

Click on **Save**.


To get your ```client_secret```, click on the **Credentials** option shown in the horizontal menu. Take note of the ```client_secret```, for example: **RVXO9SOJskjw4LeVupjRbIMJIAyyil8j**



### Test the Keycloak Endpoint

You can check the Keycloak setting sending a request directly to its Token Endpoint, passing the **client_id/client_secret** pair you have just created. You should get an Access Token as a result. Use ```jwt``` to decode the Access Token. Make sure you have jwt installed on your environment. For example:

{{<highlight>}}
curl -s -X POST 'http://localhost:8080/realms/kong/protocol/openid-connect/token' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'client_id=kong_id' \
--data-urlencode 'client_secret=RVXO9SOJskjw4LeVupjRbIMJIAyyil8j' \
--data-urlencode 'grant_type=client_credentials' | jq -r '.access_token' | jwt decode -
{{</highlight>}}

Expected Output:
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
  "aud": "account",
  "azp": "kong_id",
  "clientAddress": "10.244.0.1",
  "clientHost": "10.244.0.1",
  "client_id": "kong_id",
  "email_verified": false,
  "exp": 1754940732,
  "iat": 1754940432,
  "iss": "http://localhost:8080/realms/kong",
  "jti": "trrtcc:e2550f41-801f-e8e2-99b5-cc90a3648091",
  "preferred_username": "service-account-kong_id",
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
  "scope": "email profile",
  "sub": "e7b5a37b-d06a-4b40-92d7-36f09768ed79",
  "typ": "Bearer"
}
```



### User creation
Now, specifically for the **Authorization Code Grant**, we need to create a Keycloak user. You can do it by clicking on **Users** and **Create new user**. Choose ```consumer1``` for the **Username** and click on **Create**:

Click on **Credentials** and **Set password**. Type ```kong``` for both **Password** and **Password confirmation** fields. Turn **Temporary** to ``off`` and click on **Save** and **Save Password**.


