---
title : "Authentication-OpenID Connect"
weight : 157
---

[OpenID Connect plugin](https://docs.konghq.com/hub/kong-inc/openid-connect/) allows the integration with a 3rd party identity provider (IdP) in a standardized way. This plugin can be used to implement Kong as a (proxying) [OAuth 2.0](https://tools.ietf.org/html/rfc6749) resource server (RS) and/or as an OpenID Connect relying party (RP) between the client, and the upstream service.

In this module, we will configure this plugin to use [Amazon Cognito](https://aws.amazon.com/cognito/) . A detailed integration guide is available [here](https://docs.konghq.com/gateway/latest/kong-plugins/authentication/oidc/cognito/) for future reading.


#### Creating AWS Cognito

Run the following command to create the AWS Cognito Resources using a CloudFormation templates

:::code{showCopyAction=true showLineNumbers=false language=shell}
curl ':assetUrl{path="/code/cognito.yaml"}' --output cognito.yaml
echo "export RANDOM_IDENTIFIER=$(uuidgen -r)" >> ~/.bashrc
bash
aws cloudformation  deploy --template-file cognito.yaml --stack-name cognito-$RANDOM_IDENTIFIER \
--parameter-overrides ClientName=$RANDOM_IDENTIFIER-client Domain=$RANDOM_IDENTIFIER PoolName=$RANDOM_IDENTIFIER-pool CallBackUrl=https://$DATA_PLANE_LB/oidc-route/get
echo "export COGNITO_CLIENT_ID=$(aws cloudformation describe-stack-resources --stack-name cognito-$RANDOM_IDENTIFIER | jq -r '.StackResources[] | select(.ResourceType=="AWS::Cognito::UserPoolClient") | .PhysicalResourceId')" >> ~/.bashrc
bash
echo "export COGNITO_POOL_ID=$(aws cloudformation describe-stack-resources --stack-name cognito-$RANDOM_IDENTIFIER | jq -r '.StackResources[] | select(.ResourceType=="AWS::Cognito::UserPool") | .PhysicalResourceId')" >> ~/.bashrc
bash
echo "export ISSUER=https://cognito-idp.$AWS_REGION.amazonaws.com/$COGNITO_POOL_ID/.well-known/openid-configuration" >> ~/.bashrc
bash
:::



Fetch the client secret

:::code{showCopyAction=true showLineNumbers=false language=shell}
echo "export CLIENT_SECRET=$(aws cognito-idp describe-user-pool-client --user-pool-id $COGNITO_POOL_ID --client-id $COGNITO_CLIENT_ID --query 'UserPoolClient.ClientSecret')" >> ~/.bashrc
bash
:::

#### Installing OpenID Connect Plugin

:::code{showCopyAction=true showLineNumbers=false language=shell}
echo "_format_version: \"3.0\"
_konnect:
  control_plane_name: kong-aws
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
        auth_methods:
        - authorization_code
        redirect_uri:
        - https://$DATA_PLANE_LB/oidc-route/get
        client_id:
        - $COGNITO_CLIENT_ID
        client_secret:
        - $CLIENT_SECRET
        issuer: $ISSUER" > ./oidc.yaml
:::


Submit the declaration
:::code{showCopyAction=true showLineNumbers=false language=shell}
deck gateway sync --konnect-token $PAT oidc.yaml
:::



Check your Client Id, Secret and Issuer

:::code{showCopyAction=true showLineNumbers=false language=shell}
echo $COGNITO_CLIENT_ID
echo $CLIENT_SECRET
echo $ISSUER
:::




#### Verification

Copy output of `echo https://$DATA_PLANE_LB/oidc-route/get` and paste in browser.

After accepting the Server Certificate, since you haven't been authenticated, you will be redirected to Cognito's Authentication page:

![cognito7](/static/images/cognito7.png)


Click on "Sign up" to register.

![cognito8](/static/images/cognito8.png)


After entering your data click on "Sign Up". Cognito will create a user and request the verification code sent by your email.


After typing the code, Cognito will authenticate you, issues an Authorization Code and redirects you back to the original URL (Data Plane). The Data Plane connects to Cognito with the Authorization Code to get the Access Token and then allows you to consume the URL.


Kong-gratulations! have now reached the end of this module by authenticating your API requests with AWS Cognito. You can now click **Next** to proceed with the next module.
