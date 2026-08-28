---
title : "kongctl"
weight : 202
---

This section will explore the [**Developer self-service and App registration**](https://developer.konghq.com/dev-portal/self-service/) capabilities provided by Konnect Developer Portal.

So far, you have your API published in the portal. However, there's no control over the API consumption. Konnect Dev Portal provides flexible options for controlling access to content and APIs. When combined with a Gateway Service, developers visiting a Dev Portal can sign up, create an application, register it with an API, and retrieve API keys without intervention from Dev Portal administrators.

Developer self-service consists of two main components:

* User authentication: Allows users to access your Dev Portal by logging in. You can further customize what logged in users can see using RBAC.
* Application registration: Allows developers to use your APIs using credentials and create applications for them.



### Link the API to your Gateway Service.

When you link a service with an API, Konnect automatically adds the Konnect Application Auth (KAA) plugin on that Service. The KAA plugin is responsible for applying authentication and authorization on the Service. The authentication strategy that you select for the API defines how clients authenticate. After linking to the Konnect Gateway Service, developers can create applications and generate credentials, e.g. API keys.

Play the Administrator role again and click on **APIs** inside the **Catalog** menu option. Choose your API. Click in the **Gateway** tab and link the API to your Kong Gateway Service, created in the ``kong-workshop`` Control Plane. Make sure you choose the **Link to a single gateway service** link type.

![link_gateway_service](/static/images/link_gateway_service.png)

As a developer, if you try to consume the API from the Dev Portal you are going to get a ``401`` error code, meaning the Dev Portal is controlling the Authentication mechanism which is, by default, based on API Keys.

![401_dev_portal](/static/images/401_dev_portal.png)


### Turn RBAC on in your Portal

## EKS
https://aws.amazon.com/ec2/instance-types/
https://aws.amazon.com/ec2/pricing/on-demand/

eksctl delete cluster --name kongaigateway --region us-west-2 

eksctl create cluster --name kongaigateway --version 1.36 --region us-west-2 --nodegroup-name kong-node --node-type c8i.2xlarge --nodes 1

ß

## Pod Identity
https://eksctl.io/usage/pod-identity-associations/#eks-add-ons-support-for-pod-identity-associations

eksctl delete addon --cluster kongaigateway \
  --region us-west-2 \
  --name eks-pod-identity-agent



eksctl create addon --cluster kongaigateway \
  --region us-west-2 \
  --name eks-pod-identity-agent

eksctl get addons --cluster kong314 --region us-west-2



## AWS Load Balancer Controller
https://kubernetes-sigs.github.io/aws-load-balancer-controller/latest/
https://kubernetes-sigs.github.io/aws-load-balancer-controller/latest/guide/ingress/annotations/

export ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"





curl -O https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/v2.16.0/docs/install/iam_policy.json

curl -O https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/v3.0.0/docs/install/iam_policy.json

% aws iam list-policies | jq -r '.Policies[] | select(.PolicyName == "AWSLoadBalancerControllerIAMPolicy")' | jq -r '.Arn'
arn:aws:iam::$ACCOUNT_ID:policy/AWSLoadBalancerControllerIAMPolicy


aws iam list-policy-versions \
  --policy-arn arn:aws:iam::$ACCOUNT_ID:policy/AWSLoadBalancerControllerIAMPolicy

aws iam delete-policy-version \
  --policy-arn arn:aws:iam::$ACCOUNT_ID:policy/AWSLoadBalancerControllerIAMPolicy \
  --version-id v1



aws iam delete-policy --policy-arn arn:aws:iam::$ACCOUNT_ID:policy/AWSLoadBalancerControllerIAMPolicy

aws iam create-policy \
    --policy-name AWSLoadBalancerControllerIAMPolicy \
    --policy-document file://iam_policy.json


### Install AWS Load Balancer Controller

//kubectl delete sa aws-load-balancer-controller -n kube-system
//kubectl create sa aws-load-balancer-controller -n kube-system





eksctl get podidentityassociation --cluster kong314 --region us-west-2 --namespace kube-system --output json


helm repo update

eksctl create podidentityassociation \
    --cluster kongaigateway \
    --region us-west-2 \
    --namespace kube-system \
    --service-account-name aws-load-balancer-controller \
    --role-name AWSLoadBalancerControllerIAMRole-kongaigateway \
    --permission-policy-arns arn:aws:iam::$ACCOUNT_ID:policy/AWSLoadBalancerControllerIAMPolicy

helm uninstall aws-load-balancer-controller -n kube-system

helm install aws-load-balancer-controller eks/aws-load-balancer-controller -n kube-system \
  --set clusterName=kongaigateway \
  --set region=us-west-2 \
  --set serviceAccount.create=true \
  --set serviceAccount.name=aws-load-balancer-controller




### AWS Certificate Manager
```
export AWS_DOMAIN=kong-demo.com
```

```
aws route53domains register-domain \
  --domain-name $AWS_DOMAIN \
  --duration-in-years 1 \
  --auto-renew \
  --admin-contact 'FirstName=Claudio,LastName=Acquaviva,ContactType=PERSON,OrganizationName=Partner Engineering Team,AddressLine1=150 Spear Street,City=San Francisco,State=CA,CountryCode=US,ZipCode=94105,PhoneNumber=+1.6282437512,Email=claudio.acquaviva@konghq.com' \
  --registrant-contact 'FirstName=Claudio,LastName=Acquaviva,ContactType=PERSON,OrganizationName=Partner Engineering Team,AddressLine1=150 Spear Street,City=San Francisco,State=CA,CountryCode=US,ZipCode=94105,PhoneNumber=+1.6282437512,Email=claudio.acquaviva@konghq.com' \
  --tech-contact 'FirstName=Claudio,LastName=Acquaviva,ContactType=PERSON,OrganizationName=Partner Engineering Team,AddressLine1=150 Spear Street,City=San Francisco,State=CA,CountryCode=US,ZipCode=94105,PhoneNumber=+1.6282437512,Email=claudio.acquaviva@konghq.com' \
  --privacy-protect-admin-contact \
  --privacy-protect-registrant-contact \
  --privacy-protect-tech-contact \
  --region us-east-1
```

Check the Domain Registration status. Wait until it's been successfully registered.

``````
export OPERATION_ID=$(aws route53domains list-operations \
  --region us-east-1 \
  --query "Operations[?DomainName=='$AWS_DOMAIN'].{ID:OperationId,Type:Type,Status:Status}" | jq -r '.[0].ID')
``````

```
aws route53domains get-operation-detail \
  --operation-id $OPERATION_ID \
  --region us-east-1 | jq -r '.Status'
```


### Digital Certificate

aws acm delete-certificate \
  --certificate-arn $CERTIFICATE_ARN \
  --region us-east-2

aws acm request-certificate \
  --domain-name "*.${AWS_DOMAIN}" \
  --validation-method DNS \
  --region us-west-2



aws acm list-certificates \
  --region us-west-2 \
  --query 'CertificateSummaryList[?contains(DomainName, `*.kong-demo.com`)]' | jq -r '.[].Status'


export CERTIFICATE_ARN=$(aws acm list-certificates --region us-west-2 \
  --query 'CertificateSummaryList[?contains(DomainName, `*.kong-demo.com`)]' | jq -r '.[].CertificateArn')







You need to update the Route 53 domain with the CNAME Record Name and Record Value that AWS ACM generated for DNS validation of your certificate.

export CERTIFICATE_ARN=$(aws acm list-certificates --region us-west-2 \
  --output json | \
  jq -r ".CertificateSummaryList[] | select(.DomainName == \"*.${AWS_DOMAIN}\") | .CertificateArn")

export RESOURCE_RECORD_NAME=$(aws acm describe-certificate \
  --certificate-arn $CERTIFICATE_ARN \
  --query "Certificate.DomainValidationOptions" \
  --region us-west-2 | jq -r '.[].ResourceRecord.Name')

export RESOURCE_RECORD_VALUE=$(aws acm describe-certificate \
  --certificate-arn $CERTIFICATE_ARN \
  --query "Certificate.DomainValidationOptions" \
  --region us-west-2 | jq -r '.[].ResourceRecord.Value')

export HOSTED_ZONE_ID=$(aws route53 list-hosted-zones \
  --query "HostedZones[?Name=='$AWS_DOMAIN.'].Id" | jq -r '.[]' | cut -d'/' -f3)

aws route53 change-resource-record-sets \
  --hosted-zone-id $HOSTED_ZONE_ID \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "'"$RESOURCE_RECORD_NAME"'",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [{"Value": "'"$RESOURCE_RECORD_VALUE"'"}]
      }
    }]
  }'



Make sure the Digital Certificate has been issued with:
```
aws acm list-certificates \
  --region us-west-2 | \
  jq -r ".CertificateSummaryList[] | select(.DomainName == \"*.${AWS_DOMAIN}\") | .Status"
```

You should see:
```
ISSUE
```




## Kong


### Pod Identity

aws iam create-policy \
 --policy-name bedrock-policy \
 --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "bedrock:InvokeModel",
                "bedrock:InvokeModelWithResponseStream",
                "bedrock:ApplyGuardrail",
                "bedrock-agentcore:InvokeAgentRuntime",
                "bedrock-agentcore:GetAgentCard",
                "secretsmanager:ListSecrets",
                "secretsmanager:GetSecretValue"
            ],
            "Resource": "*"
        }
    ]
}'

kubectl delete namespace kong

kubectl create namespace kong
kubectl create sa kaigateway-podid-sa -n kong


### Define PodIdentityAssociation
eksctl get podidentityassociation \
  --cluster kongaigateway \
  --region us-west-2 \
  --namespace kong

eksctl create podidentityassociation \
  --cluster kongaigateway \
  --region us-west-2 \
  --namespace kong \
  --service-account-name kaigateway-podid-sa \
  --role-name kaigateway-podid-role \
  --permission-policy-arns arn:aws:iam::$ACCOUNT_ID:policy/bedrock-policy


If you want to delete the association

eksctl delete podidentityassociation \
  --cluster kongaigateway \
  --region us-west-2 \
  --namespace kong \
  --service-account-name kaigateway-podid-sa


### Kong Operator

Install the Operator
https://github.com/kong/kong-operator
https://github.com/Kong/charts/blob/main/charts/kong-operator/README.md



helm repo add kong https://charts.konghq.com
helm repo update
helm search repo kong/kong-operator --versions --devel



helm upgrade --install ko kong/kong-operator \
-n kong-system \
--create-namespace \
--set image.tag=2.3.0-rc.3 \
--version 1.4.0-rc.2 \
--set env.ENABLE_CONTROLLER_KONNECT=true \
--set env.ENABLE_CONTROLLER_AIGATEWAYDATAPLANE=true


kubectl -n kong-system rollout status deployment/ko-kong-operator-controller-manager



You can check the Operator’s log with:
kubectl logs -f $(kubectl get pod -n kong-system -o json | jq -r '.items[].metadata | select(.name | startswith("ko-kong-operator"))' | jq -r '.name') -n kong-system


Delete Kong Operator

helm uninstall kong-operator -n kong-system
kubectl delete namespace kong-system


export PAT=<YOUR_PAT>


### Control Plane
https://developer.konghq.com/operator/konnect/crd/control-planes/hybrid/

cat <<EOF | kubectl apply -f -
kind: Secret
apiVersion: v1
metadata:
  name: konnect-api-auth-secret
  namespace: kong
  labels:
    konghq.com/credential: konnect
    konghq.com/secret: "true"
stringData:
  token: $PAT
---
kind: KonnectAPIAuthConfiguration
apiVersion: konnect.konghq.com/v1alpha1
metadata:
  name: konnect-api-auth
  namespace: kong
spec:
  type: secretRef
  secretRef:
    name: konnect-api-auth-secret
  serverURL: us.api.konghq.com
EOF


kubectl get konnectapiauthconfiguration konnect-api-auth-conf -n kong -o jsonpath='{.spec.token}'


The second CRD creates the new Control Plane:


cat <<EOF | kubectl apply -f -
kind: KonnectAIGateway
apiVersion: konnect.konghq.com/v1alpha1
metadata:
  name: ai-gateway-1
  namespace: kong
spec:
  apiSpec:
    name: ai-gateway-1
    displayName: Kong AI Gateway 2
    description: AI Gateway Control Plane
  konnect:
    authRef:
      name: konnect-api-auth
EOF





### Data Plane

https://developer.konghq.com/operator/dataplanes/get-started/hybrid/install/
https://developer.konghq.com/operator/dataplanes/get-started/hybrid/deploy-dataplane/

cat <<EOF | kubectl apply -f -
apiVersion: aigateway.konghq.com/v1alpha1
kind: AIGatewayDataPlane
metadata:
  name: ai-gateway-1-dp
  namespace: kong
spec:
  controlPlaneRef:
    type: konnectNamespacedRef
    konnectNamespacedRef:
      name: ai-gateway-1
  deployment:
    replicas: 1
    podTemplateSpec:
      spec:
        containers:
          - name: aigw
            image: kong/kong-ai-gateway:2.0
        serviceAccountName: kaigateway-podid-sa
  network:
    services:
      ingress:
        #name: proxy-kong-aws
        type: LoadBalancer
        ports:
        - name: https
          port: 8443
          targetPort: 8000
        - name: http
          port: 8000
          targetPort: 8000
        annotations:
          "service.beta.kubernetes.io/aws-load-balancer-type": "nlb"
          "service.beta.kubernetes.io/aws-load-balancer-scheme": "internet-facing"
          "service.beta.kubernetes.io/aws-load-balancer-nlb-target-type": "ip"
          service.beta.kubernetes.io/aws-load-balancer-ssl-cert: $CERTIFICATE_ARN
          service.beta.kubernetes.io/aws-load-balancer-ssl-ports: "8443"
          service.beta.kubernetes.io/aws-load-balancer-listen-ports: '[{"HTTP":8000},{"HTTPS":8443}]'
          service.beta.kubernetes.io/aws-load-balancer-ssl-negotiation-policy: ELBSecurityPolicy-TLS-1-2-2017-01
          service.beta.kubernetes.io/aws-load-balancer-backend-protocol: "http"
EOF







kubectl get -n kong dataplane kong-aws-dp \
  -o=jsonpath='{.status.conditions[?(@.type=="Ready")]}' | jq


kubectl describe pod $(kubectl get pod -n kong -o json | jq -r '.items[].metadata | select(.name | startswith("dataplane-kong-aws"))' | jq -r '.name') -n kong



kubectl logs -f $(kubectl get pod -n kong -o json | jq -r '.items[].metadata | select(.name | startswith("ai-gateway-1-dp"))' | jq -r '.name') -n kong




kubectl delete aigatewaydataplane ai-gateway-1-dp -n kong
kubectl delete konnectaigateway ai-gateway-1 -n kong





### Route53
Use the Load Balancer created during the deployment:


kubectl get service -n kong
NAME                                TYPE           CLUSTER-IP      EXTERNAL-IP                                                                 PORT(S)         AGE
dataplane-admin-kong-aws-dp-pvrp5   ClusterIP      None            <none>                                                                      8444/TCP        49s
proxy-kong-aws                      LoadBalancer   10.100.25.216   k8s-kong-proxykon-7e69891787-0916acbae65837b1.elb.us-west-2.amazonaws.com   443:30117/TCP   49s




aws elbv2 describe-load-balancers \
  --region us-west-2 \
  --query "LoadBalancers[0].LoadBalancerArn" \
  --output text




export DATA_PLANE_LB=$(kubectl get service -n kong ai-gateway-1-dp-ingress --output=jsonpath='{.status.loadBalancer.ingress[].hostname}')

export LB_NAME=$(aws elbv2 describe-load-balancers \
  --region us-west-2 \
  --query "LoadBalancers[?DNSName=='$DATA_PLANE_LB'].LoadBalancerName" \
  --output text)

export LB_ARN=$(aws elbv2 describe-load-balancers \
  --region us-west-2 \
  --query "LoadBalancers[?DNSName=='$DATA_PLANE_LB'].LoadBalancerArn" \
  --output text)



aws elbv2 describe-listeners \
  --region us-west-2 \
  --load-balancer-arn $LB_ARN \
  --query "Listeners[].{Port:Port,Protocol:Protocol}" \
  --output table



export HOSTED_ZONE_ID=$(aws route53 list-hosted-zones --query "HostedZones[?Name=='kong-demo.com.'].Id" | jq -r '.[]' | cut -d'/' -f3)

export LB_HOSTED_ZONE_ID=$(aws elbv2 describe-load-balancers \
  --region us-west-2 \
  --names $LB_NAME \
  --query "LoadBalancers[0].CanonicalHostedZoneId" \
  --output text)





aws route53 change-resource-record-sets \
  --hosted-zone-id $HOSTED_ZONE_ID \
  --change-batch '{
      "Comment": "Create alias record to NLB",
      "Changes": [{
          "Action": "UPSERT",
          "ResourceRecordSet": {
              "Name": "kong-dp.kong-demo.com",
              "Type": "A",
              "AliasTarget": {
                  "HostedZoneId": "'"$LB_HOSTED_ZONE_ID"'",
                  "DNSName": "'"$DATA_PLANE_LB"'",
                  "EvaluateTargetHealth": true
              }
          }
      }]
  }'




You should get a response like this:

curl http://$DATA_PLANE_LB
curl http://kong-dp.kong-demo.com
curl -i https://kong-dp.kong-demo.com

HTTP/1.1 404 Not Found
Date: Tue, 09 Dec 2025 12:55:42 GMT
Content-Type: application/json; charset=utf-8
Connection: keep-alive
Content-Length: 103
X-Kong-Response-Latency: 0
Server: kong/3.12.0.1-enterprise-edition
X-Kong-Request-Id: 95b09b2a40dc745d59ea6d684f9c4a13

{
  "message":"no Route matched with those values",
  "request_id":"95b09b2a40dc745d59ea6d684f9c4a13"
}

Now we can define the Kong Objects necessary to expose and control Bedrock, including Kong Gateway Service, Routes, and Plugins.




### Delete CP/DP
kubectl delete aigatewaydataplane ai-gateway-1-dp -n kong
kubectl delete konnectextensions.konnect.konghq.com konnect-config-aws -n kong


kubectl delete konnectaigateway ai-gateway-1 -n kong
kubectl delete konnectapiauthconfiguration konnect-api-auth-conf -n kong


//kubectl delete secret konnect-pat -n kong
kubectl delete namespace kong




kubectl logs -f $(kubectl get pod -n kong -o json | jq -r '.items[].metadata | select(.name | startswith("dataplane-kong-polyapi"))' | jq -r '.name') -n kong


http https://kong-dp.kong-demo.com

curl http://kong-dp.kong-demo.com/llm-route \
  -H "Content-Type: application/json" \
  -H "apikey-llm: 12345" \
  -d '{
     "messages": [
       {
         "role": "user",
         "content": "Hello!"
       }
     ]
   }'





## Convert decK to kongctl

kongctl convert ai-gateway ai-a2a-proxy.yaml \
  --from deck \
  --to kongctl \
  --gateway-name ai-gateway-1 \
  --output-file ai-gateway.yaml


kongctl apply --pat $PAT -f ai-gateway.yaml --auto-approve















## Observability

Collector
Cert Manager
helm install \
  cert-manager oci://quay.io/jetstack/charts/cert-manager \
  --version v1.20.1 \
  --namespace cert-manager \
  --create-namespace \
  --set crds.enabled=true

helm repo add open-telemetry https://open-telemetry.github.io/opentelemetry-helm-charts
helm repo update


helm install opentelemetry-operator open-telemetry/opentelemetry-operator \
  --namespace opentelemetry-operator-system \
  --create-namespace \
  --set manager.collectorImage.repository=otel/opentelemetry-collector-k8s \
  --set admissionWebhooks.certManager.enabled=true



kubectl logs -f $(kubectl get pod -n opentelemetry-operator-system -o json | jq '.items[].metadata | select(.name | startswith("collector"))' | jq -r '.name') -n opentelemetry-operator-system

Jaeger

helm repo add jaegertracing https://jaegertracing.github.io/helm-charts
helm repo update



//wget -O jaeger-values.yaml https://raw.githubusercontent.com/jaegertracing/helm-charts/refs/heads/v2/charts/jaeger/values.yaml

helm uninstall jaeger -n jaeger
kubectl delete namespace jaeger







helm install jaeger jaegertracing/jaeger -n jaeger \
  --create-namespace \
  --set allInOne.image.repository=jaegertracing/jaeger \
  --set allInOne.image.tag=2.17.0 \
  --set livenessProbe.initialDelaySeconds=30 \
  --set livenessProbe.periodSeconds=15 \
  --set readinessProbe.initialDelaySeconds=30 \
  --set readinessProbe.periodSeconds=15 \
  --set provisionDataStore.cassandra=false \
  --set storage.type=memory \
  --set agent.enabled=false \
  --set collector.enabled=false \
  --set query.enabled=false \
  --set service.type=ClusterIP



Prometheus
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update


helm uninstall prometheus -n prometheus
kubectl delete namespace prometheus


helm install prometheus -n prometheus prometheus-community/kube-prometheus-stack \
--create-namespace \
--set alertmanager.enabled=false \
--set grafana.enabled=false \
--set prometheus.service.type=ClusterIP \
--set prometheus.service.port=9090 \
--set prometheus.prometheusSpec.additionalArgs[0].name=web.enable-otlp-receiver \
--set prometheus.prometheusSpec.additionalArgs[0].value="" \
--set prometheus.prometheusSpec.additionalArgs[1].name=web.enable-remote-write-receiver \
--set prometheus.prometheusSpec.additionalArgs[1].value=""


image:
      registry: quay.io
      repository: prometheus/prometheus
      tag: v3.11.1
      sha: ""
      pullPolicy: IfNotPresent


 \
--set annotations."service.beta.kubernetes.io/aws-load-balancer-type"="nlb" \
--set annotations."service.beta.kubernetes.io/aws-load-balancer-scheme"="internet-facing" \
--set annotations."service.beta.kubernetes.io/aws-load-balancer-nlb-target-type"="ip" \





Loki
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update


helm uninstall loki -n loki
kubectl delete namespace loki










  canary:
    enabled: false
    args:
      - -log-output=false

  memberlist:
    enable: false




cat > loki-values.yaml << 'EOF'
deploymentMode: SingleBinary

singleBinary:
  replicas: 1
  service:
    type: ClusterIP
#    type: LoadBalancer
#    annotations:
#      "service.beta.kubernetes.io/aws-load-balancer-type": "nlb"
#      "service.beta.kubernetes.io/aws-load-balancer-scheme": "internet-facing"
#      "service.beta.kubernetes.io/aws-load-balancer-nlb-target-type": "ip"

  persistence:
    enabled: false
  extraVolumeMounts:
    - name: loki-storage
      mountPath: /var/loki
  extraVolumes:
    - name: loki-storage
      emptyDir: {}

loki:
  commonConfig:
    replication_factor: 1
  image:
    tag: 3.7.1
  auth_enabled: false
  storage:
    type: filesystem
    filesystem:
      chunks_directory: /var/loki/chunks
      rules_directory: /var/loki/rules
  schemaConfig:
    configs:
      - from: "2024-04-01"
        store: tsdb
        object_store: filesystem
        schema: v13
        index:
          prefix: loki_index_
          period: 24h
  limits_config:
    allow_structured_metadata: true
    volume_enabled: true
  ruler:
    enable_api: true
  pattern_ingester:
    enabled: true
  otlp_config:
    resource_attributes:
      attributes_config:
      - action: index_label
        attributes:
        - service.name


chunksCache:
  enabled: false

resultsCache:
  enabled: false

indexGateway:
  enabled: false

minio:
  enabled: false

gateway:
  enabled: false

backend:
  replicas: 0
read:
  replicas: 0
write:
  replicas: 0
ingester:
  replicas: 0
querier:
  replicas: 0
queryFrontend:
  replicas: 0
queryScheduler:
  replicas: 0
distributor:
  replicas: 0
compactor:
  replicas: 0
bloomCompactor:
  replicas: 0
bloomGateway:
  replicas: 0
EOF


helm uninstall loki -n loki
kubectl delete namespace loki

helm install loki grafana/loki \
  --namespace=loki --create-namespace \
  -f loki-values.yaml



helm upgrade --install loki grafana/loki \
--namespace loki \
--create-namespace \
--set deploymentMode=SingleBinary \
--set singleBinary.replicas=1 \
--set singleBinary.persistence.enabled=false \
--set singleBinary.extraVolumeMounts[0].name=loki-storage \
--set singleBinary.extraVolumeMounts[0].mountPath=/var/loki \
--set singleBinary.extraVolumes[0].name=loki-storage \
--set-json 'singleBinary.extraVolumes[0].emptyDir={}' \
--set loki.image.tag=3.7.1 \
--set loki.auth_enabled=false \
--set loki.commonConfig.replication_factor=1 \
--set loki.storage.type=filesystem \
--set loki.useTestSchema=true \
--set loki.limits_config.allow_structured_metadata=true \
--set loki.otlp_config.resource_attributes.attributes_config[0].action=index_label \
--set loki.otlp_config.resource_attributes.attributes_config[0].attributes[0]=service.name \
--set chunksCache.enabled=false \
--set resultsCache.enabled=false \
--set minio.enabled=false \
--set gateway.enabled=false \
--set read.replicas=0 \
--set write.replicas=0 \
--set backend.replicas=0


loki.storage.filesystem.chunks_directory — defaults to /var/loki/chunks
loki.storage.filesystem.rules_directory — defaults to /var/loki/rules
loki.schemaConfig — defaults to tsdb + v13 in Loki 3.x
loki.ruler.enable_api — enabled by default
loki.pattern_ingester.enabled — enabled by default in SingleBinary
loki.limits_config.volume_enabled — enabled by default in 3.x



Grafana
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update


helm uninstall grafana -n grafana
kubectl delete namespace grafana




helm upgrade --install grafana grafana/grafana \
--namespace grafana \
--create-namespace \
--set adminUser=admin \
--set adminPassword=admin \
--set service.type=LoadBalancer \
--set service.port=3000 \
--set-json 'service.annotations={"service.beta.kubernetes.io/aws-load-balancer-type":"nlb","service.beta.kubernetes.io/aws-load-balancer-scheme":"internet-facing","service.beta.kubernetes.io/aws-load-balancer-nlb-target-type":"ip"}' \
--set datasources."datasources\.yaml".apiVersion=1 \
--set datasources."datasources\.yaml".datasources[0].name=Jaeger \
--set datasources."datasources\.yaml".datasources[0].type=jaeger \
--set datasources."datasources\.yaml".datasources[0].url=http://jaeger.jaeger:16686 \
--set datasources."datasources\.yaml".datasources[0].access=proxy \
--set datasources."datasources\.yaml".datasources[1].name=Prometheus \
--set datasources."datasources\.yaml".datasources[1].type=prometheus \
--set datasources."datasources\.yaml".datasources[1].url=http://prometheus-kube-prometheus-prometheus.prometheus:9090 \
--set datasources."datasources\.yaml".datasources[1].access=proxy \
--set datasources."datasources\.yaml".datasources[2].name=Loki \
--set datasources."datasources\.yaml".datasources[2].type=loki \
--set datasources."datasources\.yaml".datasources[2].url=http://loki.loki:3100 \
--set datasources."datasources\.yaml".datasources[2].access=proxy



export GRAFANA_LB=$(kubectl get service -n grafana grafana --output=jsonpath='{.status.loadBalancer.ingress[].hostname}')

open -a "Google Chrome" "http://$GRAFANA_LB:3000"





Collector Configuration
cat > otelcollector.yaml << 'EOF'
apiVersion: opentelemetry.io/v1beta1
kind: OpenTelemetryCollector
metadata:
  name: collector-kong
  namespace: opentelemetry-operator-system
spec:
  image: otel/opentelemetry-collector-contrib:0.149.0
  serviceAccount: collector
  mode: deployment
  config:
    receivers:
      otlp:
        protocols:
          grpc:
            endpoint: 0.0.0.0:4317
          http:
            endpoint: 0.0.0.0:4318

      prometheus:
        config:
          scrape_configs:
            - job_name: 'otel-collector'
              scrape_interval: 5s
              kubernetes_sd_configs:
              - role: pod
              scheme: http
              tls_config:
                ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
              authorization:
                credentials_file: /var/run/secrets/kubernetes.io/serviceaccount/token
              metrics_path: /metrics
              relabel_configs:
              - source_labels: [__meta_kubernetes_namespace]
                action: keep
                regex: "kong"
              - source_labels: [__meta_kubernetes_pod_name]
                action: keep
                regex: "dataplane-(.+)"
              - source_labels: [__meta_kubernetes_pod_container_name]
                action: keep
                regex: "proxy"
              - source_labels: [__meta_kubernetes_pod_container_port_number]
                action: keep
                regex: "8100"
      tcplog:
        listen_address: 0.0.0.0:54525
        operators:
          - type: json_parser

    processors:
      resource:
        attributes:
          - action: upsert
            key: service.name
            value: kong-gateway
            
    exporters:
      otlphttp/jaeger:
        endpoint: http://jaeger.jaeger:4318
      otlphttp/prometheus:
        endpoint: http://prometheus-kube-prometheus-prometheus.prometheus:9090/api/v1/otlp
      otlphttp/loki:
        endpoint: http://loki.loki:3100/otlp
      prometheus:
        endpoint: 0.0.0.0:8889
      #debug:
      #  verbosity: detailed

    service:
      pipelines:
        traces:
          receivers: [otlp]
          exporters: [otlphttp/jaeger]
        metrics:
          receivers: [prometheus]
          exporters: [otlphttp/prometheus, prometheus]
        logs:
          receivers: [tcplog]
          processors: [resource]
          exporters: [otlphttp/loki]
EOF



kubectl delete opentelemetrycollector collector-kong -n opentelemetry-operator-system
kubectl apply -f otelcollector.yaml






Kong Objects
_format_version: "3.0"
_info:
  select_tags:
  - httpbin-service-route
services:
- name: httpbin-service
  tags:
  - httpbin-service-route
  host: httpbin.kong.svc.cluster.local
  port: 8000
  plugins:
  - name: opentelemetry
    instance_name: opentelemetry1
    enabled: true
    config:
      traces_endpoint: http://collector-kong-collector.opentelemetry-operator-system.svc.cluster.local:4318/v1/traces
      #propagation:
      #  default_format: "w3c"
      #  inject: ["w3c"]
      resource_attributes:
        service.name: "kong-otel"
  - name: prometheus
    instance_name: prometheus1
    enabled: true
    config:
      per_consumer: true
      status_code_metrics: true
      latency_metrics: true
      bandwidth_metrics: true
      upstream_health_metrics: true
      ai_metrics: true
  - name: tcp-log
    instance_name: tcp-log1
    enabled: true
    config:
      host: collector-kong-collector.opentelemetry-operator-system.svc.cluster.local
      port: 54525
  routes:
  - name: httpbin-route
    tags:
    - httpbin-service-route
    paths:
    - /httpbin-route



deck gateway reset --konnect-control-plane-name kong-aws --konnect-token $PAT -f
deck gateway sync --konnect-control-plane-name kong-aws --konnect-token $PAT httpbin.yaml



curl $DATA_PLANE_LB/httpbin-route/get

curl http://kong-dp.kong-demo.com/httpbin-route/get
curl https://kong-dp.kong-demo.com/httpbin-route/get




helm uninstall jaeger -n jaeger
kubectl delete namespace jaeger

helm uninstall prometheus -n prometheus
kubectl delete namespace prometheus

helm uninstall loki -n loki
kubectl delete namespace loki

helm uninstall grafana -n grafana
kubectl delete namespace grafana





A2A
https://github.com/a2aproject
https://github.com/a2aproject/a2a-samples
https://a2a-protocol.org/latest/
https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/
https://aaif.io/
https://github.com/a2aproject/a2a-python


https://pypi.org/project/python-a2a/


Pod Identity injects credentials into the pod's environment via the standard credential provider chain — boto3 picks them up automatically, and the boto3 client handles SigV4 signing internally. AWS4Auth is only needed when you're using a third-party HTTP library like requests or httpx that has no AWS awareness.

Pod Identity puts credentials in the environment — the boto3 client picks them up and signs automatically. You only need SigV4Auth manually when you're constructing raw HTTP outside the boto3 client.
But you're hitting a raw HTTP URL, so something has to sign it. The question is which layer.
The cleanest approach — use botocore's built-in endpoint resolver to get a presigned/signed request without touching SigV4Auth directly:
Actually, no — there's no way around it for raw HTTP. The options are:
ApproachSigns for you?Raw HTTP?boto3.client("bedrock-agentcore").invoke_agent_runtime()Yes, fully automaticNo — abstracts the URLbotocore.auth.SigV4Auth + AWSRequestYes, using Pod Identity credsYes — you control the URLrequests + AWS4AuthYes, but you own cred refreshYesPlain requests / urllibNo signing at allYes — but 403
Pod Identity removes the need to provide or manage credentials. It doesn't remove the need to sign requests — that's a separate concern. Every call to an AWS service endpoint must be SigV4-signed regardless of how the credentials arrived.
So for your case — raw URL, Pod Identity creds — the previous code is actually the right minimal approach:
python


**References:**
- [Konnect Dev Portal Overview](https://developer.konghq.com/dev-portal/#dev-portal)
- [Publish your API to Dev Portal](https://developer.konghq.com/dev-portal/apis/#publish-your-api-to-dev-portal)
- [Automate your API catalog with Dev Portal](https://developer.konghq.com/how-to/automate-api-catalog/)
- [Developer Self-Service and App Registration](https://developer.konghq.com/dev-portal/self-service/)

--------------------------------------------------------------------------------------------



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

--------------------------------------------------------------------------------------------

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
                # access_key_id: "AKIAXAKB57VP2MX5M75Q"
                # secret_access_key: "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"
              # region: us-west-2
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




-------------------------------------------------------