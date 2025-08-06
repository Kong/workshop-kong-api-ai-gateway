---
title : "Control Plane and Data Plane"
weight : 113
---

#### Control Plane Deployment

The following declaration defines an [Authentication Configuration](https://docs.konghq.com/gateway-operator/latest/reference/custom-resources/#konnectapiauthconfiguration), based on the Kubernetes Secret and referring to a Konnect API URL, and the actual [Konnect Control Plane](https://docs.konghq.com/gateway-operator/1.5.x/reference/custom-resources/#konnectgatewaycontrolplane). 


{{<highlight>}}
cat <<EOF | kubectl apply -f -
kind: KonnectAPIAuthConfiguration
apiVersion: konnect.konghq.com/v1alpha1
metadata:
  name: konnect-api-auth-conf
  namespace: kong
spec:
  type: secretRef
  secretRef:
    name: konnect-pat
    namespace: kong
  serverURL: us.api.konghq.com
---
kind: KonnectGatewayControlPlane
apiVersion: konnect.konghq.com/v1alpha1
metadata:
 name: kong-workshop
 namespace: kong
spec:
 name: kong-workshop
 konnect:
   authRef:
     name: konnect-api-auth-conf
EOF
{{</highlight>}}


**Expected Sample Output**

```
konnectapiauthconfiguration.konnect.konghq.com/konnect-api-auth-conf created
konnectgatewaycontrolplane.konnect.konghq.com/kong-aws created
```

If you go to Konnect UI >  Gateway manager, you should see a new control plane named `kong-aws` getting created.

#### Data Plane deployment

The next declaration instantiates a Data Plane connected to your Control Plane. It creates a [KonnectExtension](https://docs.konghq.com/gateway-operator/1.5.x/reference/custom-resources/#konnectextension-1), asking KGO to manage the certificate and private key provisioning automatically, and the actual Data Plane. The [Data Plane](https://docs.konghq.com/gateway-operator/latest/reference/custom-resources/#dataplane) declaration specifies the Docker image, in our case 3.11, as well as how the Kubernetes Service, related to the Data Plane, should be created. Also, we use the the Data Plane deployment refers to the Kubernetes Service Account we created before.

{{<highlight>}}
cat <<EOF | kubectl apply -f -
kind: KonnectExtension
apiVersion: konnect.konghq.com/v1alpha1
metadata:
 name: konnect-config1
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
 name: dataplane1
 namespace: kong
spec:
 extensions:
 - kind: KonnectExtension
   name: konnect-config1
   group: konnect.konghq.com
 deployment:
   podTemplateSpec:
     spec:
       containers:
       - name: proxy
         image: kong/kong-gateway:3.11
 network:
   services:
     ingress:
       name: proxy1
       type: LoadBalancer
EOF
{{</highlight>}}


It takes some minutes to get the Load Balancer provisioned and avaiable. Get its domain name with:

{{<highlight>}}
export DATA_PLANE_LB=$(kubectl get svc -n kong proxy1 --output=jsonpath='{.status.loadBalancer.ingress[].ip}')
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

#### Further Reading

* [Kong Konnect API auth configuration](https://docs.konghq.com/gateway-operator/latest/get-started/konnect/create-konnectextension/#create-an-access-token-in-konnect) 

Kong-gratulations! have now reached the end of this module by creating control plane and data plane. You can now click **Next** to proceed with the next module.
