---
title : "Control Plane and Data Plane"
weight : 113
---

#### Konnect PAT - Personal Access Token

Kong Operator requires a [Konnect Personal Access Token (PAT)](https://developer.konghq.com/konnect-api/#personal-access-tokens) for creating the Control Plane. To generate your PAT,  click on your initials in the upper right corner of the Konnect home page, then select **Personal Access Tokens**. Click on **+ Generate Token**, name your PAT, set its expiration time, and be sure to copy and save it, as Konnect won’t display it again.

![pat](/static/images/pat.png)


> [!NOTE]
> Be sure to copy and save your PAT, as Konnect won’t display it again.

* Save PAT in an environment variables

{{<highlight>}}
export PAT=PASTE_THE_CONTENTS_OF_COPIED_PAT
{{</highlight>}}





#### Control Plane Deployment

The following declaration defines an [Authentication Configuration](https://developer.konghq.com/operator/reference/custom-resources/#konnect-konghq-com-v1alpha1-konnectapiauthconfiguration) referring to a Konnect API URL, and the actual [Konnect Control Plane](https://developer.konghq.com/operator/reference/custom-resources/#konnect-konghq-com-v1alpha2-konnectgatewaycontrolplane). 


* Create the namespace

{{<highlight>}}
kubectl create namespace kong
{{</highlight>}}



{{<highlight>}}
cat <<EOF | kubectl apply -f -
kind: KonnectAPIAuthConfiguration
apiVersion: konnect.konghq.com/v1alpha1
metadata:
  name: konnect-api-auth-conf
  namespace: kong
spec:
  type: token
  token: $PAT
  serverURL: us.api.konghq.com
---
kind: KonnectGatewayControlPlane
apiVersion: konnect.konghq.com/v1alpha2
metadata:
 name: kong-workshop
 namespace: kong
spec:
  createControlPlaneRequest:
    name: kong-workshop
  konnect:
    authRef:
      name: konnect-api-auth-conf
EOF
{{</highlight>}}




* Check your PAT

{{<highlight>}}
kubectl get konnectapiauthconfiguration konnect-api-auth-conf -n kong -o jsonpath='{.spec.token}'
{{</highlight>}}


* Check your Control Plane

{{<highlight>}}
kubectl get -n kong konnectgatewaycontrolplane kong-workshop \
  -o=jsonpath='{.status.conditions[?(@.type=="Programmed")]}' | jq
{{</highlight>}}



If you go to Konnect UI > Gateway manager, you should see a new control plane named `kong-workshop` getting created.









#### Data Plane deployment

The next declaration instantiates a Data Plane connected to your Control Plane. It creates a [KonnectExtension](https://developer.konghq.com/operator/reference/custom-resources/#konnect-konghq-com-v1alpha2-konnectextension), asking KO to manage the certificate and private key provisioning automatically, and the actual Data Plane. The [Data Plane](https://developer.konghq.com/operator/reference/custom-resources/#gateway-operator-konghq-com-v1beta1-dataplane) declaration specifies the Docker image, in our case 3.14, as well as how the Kubernetes Service, related to the Data Plane, should be created. Also, we use the the Data Plane deployment refers to the Kubernetes Service Account we created before.

{{<highlight>}}
cat <<EOF | kubectl apply -f -
kind: KonnectExtension
apiVersion: konnect.konghq.com/v1alpha2
metadata:
 name: konnect-config-workshop
 namespace: kong
spec:
 clientAuth:
   certificateSecret:
     provisioning: Automatic
 konnect:
   controlPlane:
     ref:
       type: konnectNamespacedRef
       konnectNamespacedRef:
         name: kong-workshop
---
apiVersion: gateway-operator.konghq.com/v1beta1
kind: DataPlane
metadata:
 name: kong-workshop-dp
 namespace: kong
spec:
 extensions:
 - kind: KonnectExtension
   name: konnect-config-workshop
   group: konnect.konghq.com
 deployment:
   podTemplateSpec:
     spec:
       containers:
       - name: proxy
         image: kong/kong-gateway:3.14
 network:
   services:
     ingress:
       name: proxy-kong-workshop
       type: LoadBalancer
#       type: NodePort
#       ports:
#       - port: 80
#         nodePort: 30080
#       - port: 443
#         nodePort: 30443
EOF
{{</highlight>}}


It takes some minutes to get the Load Balancer provisioned and avaiable. Get its domain name with:

{{<highlight>}}
export DATA_PLANE_LB=$(kubectl get svc -n kong proxy-kong-workshop --output=jsonpath='{.status.loadBalancer.ingress[].ip}')
{{</highlight>}}

View the load balancer DNS as

{{<highlight>}}
echo $DATA_PLANE_LB
{{</highlight>}}

Try calling it as

{{<highlight>}}
curl -w '\n' $DATA_PLANE_LB
{{</highlight>}}

**Expected Output**

```
{
  "message":"no Route matched with those values",
  "request_id":"d364362a60b32142fed73712a9ea1948"
}
```

You can check the Data Plane logs with
{{<highlight>}}
kubectl logs -f $(kubectl get pod -n kong -o json | jq -r '.items[].metadata | select(.name | startswith("dataplane-"))' | jq -r '.name') -n kong
{{</highlight>}}


#### Control Plane and Data Plane deletion

If you want to delete the DP run run:
```
kubectl delete dataplane kong-workshop-dp -n kong
kubectl delete konnectextension.konnect.konghq.com konnect-config-workshop -n kong
```

If you want to delete the CP run:
```
kubectl delete konnectgatewaycontrolplane kong-workshop -n kong
kubectl delete konnectapiauthconfiguration konnect-api-auth-conf -n kong
```

If you want to delete the namespace run:
```
kubectl delete namespace kong
```

#### Further Reading

* [Kong Konnect API auth configuration](https://docs.konghq.com/gateway-operator/latest/get-started/konnect/create-konnectextension/#create-an-access-token-in-konnect) 

Kong-gratulations! have now reached the end of this module by creating control plane and data plane. You can now click **Next** to proceed with the next module.
