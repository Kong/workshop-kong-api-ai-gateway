---
title : "Data Plane Elasticity"
weight : 114
---

One of the most important capabilities provided by Kubernetes is to easily scale out a Deployment. With a single command we can create or terminate pod replicas in order to optimally support a given throughput. 

This capability is especially interesting for Kubernetes applications like Kong for Kubernetes Ingress Controller.

Here's our deployment before scaling it out:

:::code{showCopyAction=true showLineNumbers=false language=shell}
kubectl get service -n kong
:::

**Sample Output**

```
NAME                               TYPE           CLUSTER-IP       EXTERNAL-IP                                                               PORT(S)                      AGE
dataplane-admin-dataplane1-x9n6r   ClusterIP      None             <none>                                                                    8444/TCP                     20h
proxy1                             LoadBalancer   10.100.234.223   k8s-kong-proxy1-518c8abdcc-a10b0ef08ae8ba02.elb.us-east-2.amazonaws.com   80:32290/TCP,443:31084/TCP   20h
```

Notice, at this point in the workshop, there is only one pod taking data plane traffic.

:::code{showCopyAction=true showLineNumbers=false language=shell}
kubectl get pod -n kong -o wide
:::

**Sample Output**

```
NAME                                          READY   STATUS    RESTARTS   AGE   IP              NODE                                          NOMINATED NODE   READINESS GATES
dataplane-dataplane1-ch6g9-6889fdf76b-5gjh9   1/1     Running   0          20h   192.168.61.40   ip-192-168-44-68.us-east-2.compute.internal   <none>           <none>
```

### Manual Scaling Out

Now, let's scale the deployment out creating 3 replicas of the pod

:::code{showCopyAction=true showLineNumbers=false language=shell}
cat <<EOF | kubectl apply -f -
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
         image: kong/kong-gateway:3.10.0.1
       serviceAccountName: kaigateway-podid-sa
   replicas: 3
 network:
   services:
     ingress:
       name: proxy1
       type: LoadBalancer
       annotations:
         "service.beta.kubernetes.io/aws-load-balancer-scheme": "internet-facing"
         "service.beta.kubernetes.io/aws-load-balancer-nlb-target-type": "ip"
EOF
:::

Check the Deployment again and now you should see 3 replicas of the pod.

:::code{showCopyAction=true showLineNumbers=false language=shell}
kubectl get pod -n kong -o wide
:::

**Sample Output**

```
NAME                                          READY   STATUS    RESTARTS   AGE     IP              NODE                                          NOMINATED NODE   READINESS GATES
dataplane-dataplane1-ch6g9-6889fdf76b-5gjh9   1/1     Running   0          20h     192.168.61.40   ip-192-168-44-68.us-east-2.compute.internal   <none>           <none>
dataplane-dataplane1-ch6g9-6889fdf76b-9gt4s   1/1     Running   0          6m15s   192.168.52.45   ip-192-168-44-68.us-east-2.compute.internal   <none>           <none>
dataplane-dataplane1-ch6g9-6889fdf76b-mrjdx   1/1     Running   0          6m15s   192.168.36.12   ip-192-168-44-68.us-east-2.compute.internal   <none>           <none>
```

As we can see, the 2 new Pods have been created and are up and running. If we check our Kubernetes Service again, we will see it has been updated with the new IP addresses. That allows the Service to implement Load Balancing across the Pod replicas.

:::code{showCopyAction=true showLineNumbers=false language=shell}
kubectl describe service proxy1 -n kong
:::

**Sample Output**

```
Name:                     proxy1
Namespace:                kong
Labels:                   app=dataplane1
                          gateway-operator.konghq.com/dataplane-service-state=live
                          gateway-operator.konghq.com/dataplane-service-type=ingress
                          gateway-operator.konghq.com/managed-by=dataplane
Annotations:              gateway-operator.konghq.com/last-applied-annotations:
                            {"service.beta.kubernetes.io/aws-load-balancer-nlb-target-type":"ip","service.beta.kubernetes.io/aws-load-balancer-scheme":"internet-facin...
                          service.beta.kubernetes.io/aws-load-balancer-nlb-target-type: ip
                          service.beta.kubernetes.io/aws-load-balancer-scheme: internet-facing
Selector:                 app=dataplane1,gateway-operator.konghq.com/selector=2231a2f4-f440-4453-98a4-872ed899169b
Type:                     LoadBalancer
IP Family Policy:         SingleStack
IP Families:              IPv4
IP:                       10.100.234.223
IPs:                      10.100.234.223
LoadBalancer Ingress:     k8s-kong-proxy1-518c8abdcc-a10b0ef08ae8ba02.elb.us-east-2.amazonaws.com
Port:                     http  80/TCP
TargetPort:               8000/TCP
NodePort:                 http  32290/TCP
Endpoints:                192.168.61.40:8000,192.168.36.12:8000,192.168.52.45:8000
Port:                     https  443/TCP
TargetPort:               8443/TCP
NodePort:                 https  31084/TCP
Endpoints:                192.168.61.40:8443,192.168.36.12:8443,192.168.52.45:8443
Session Affinity:         None
External Traffic Policy:  Cluster
Internal Traffic Policy:  Cluster
Events:
  Type    Reason                  Age                From     Message
  ----    ------                  ----               ----     -------
  Normal  SuccessfullyReconciled  13m (x2 over 20h)  service  Successfully reconciled
```

Reduce the number of Pods to 1 again running as now we will turn on Horizontal pod autoscalar.

:::code{showCopyAction=true showLineNumbers=false language=shell}
cat <<EOF | kubectl apply -f -
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
         image: kong/kong-gateway:3.10.0.1
       serviceAccountName: kaigateway-podid-sa
   replicas: 1
 network:
   services:
     ingress:
       name: proxy1
       type: LoadBalancer
       annotations:
         "service.beta.kubernetes.io/aws-load-balancer-scheme": "internet-facing"
         "service.beta.kubernetes.io/aws-load-balancer-nlb-target-type": "ip"
EOF
:::

### HPA - Horizontal Autoscaler

HPA (“Horizontal Pod Autoscaler”) is the Kubernetes resource to automatically control the number of replicas of Pods. With HPA, Kubernetes is able to support the requests produced by the consumers, keeping a given Service Level.

Based on CPU utilization or custom metrics, HPA starts and terminates Pods replicas updating all service data to help on the load balancing policies over those replicas.

HPA is described at https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/. Also, there's a nice walkthrough at https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale-walkthrough/

Kubernetes defines its own units for cpu and memory. You can read more about it at: https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/. We use these units to set our Deployments with HPA.

#### Metrics Server

HPA relies no the Metrics Server to control the number of replicas of a given deployment. Check it as follows:

:::code{showCopyAction=true showLineNumbers=false language=shell}
kubectl get pod -n kube-system -o json | jq -r '.items[].metadata | select(.name | startswith("metrics-server-"))' | jq -r '.name'
:::

Now you should see two *metrics-server-* pods in *Running* state

**Sample Output**

```
metrics-server-84cbf4fd8-9fblt
metrics-server-84cbf4fd8-zw6hs
```

#### Turn HPA on

Still using the Operator, let's upgrade our Data Plane deployment including new and specific settings for HPA. The new settings are defining the ammount of CPU and memory each Pod should allocate. At the same time, the "scaling" sets are telling HPA how to proceed to instantiate new Pod replicas.

Here's the final declaration:

:::code{showCopyAction=true showLineNumbers=false language=shell}
cat <<EOF | kubectl apply -f -
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
         image: kong/kong-gateway:3.10.0.1
         resources:
           requests:
             memory: "300Mi"
             cpu: "300m"
           limits:
             memory: "800Mi"
             cpu: "1200m"
       serviceAccountName: kaigateway-podid-sa
   scaling:
     horizontal:
       minReplicas: 1
       maxReplicas: 20
       metrics:
       - type: Resource
         resource:
           name: cpu
           target:
             type: Utilization
             averageUtilization: 20
EOF
:::



#### Checking HPA

After submitting the command check the Deployment again. Since we're not consume the Data Plane, we are supposed to see a single Pod running. In the next sections we're going to send requests to the Data Plane and new Pod will get created to handle them.

:::code{showCopyAction=true showLineNumbers=false language=shell}
kubectl get pod -n kong
:::

**Sample Output**

```
NAME                                          READY   STATUS    RESTARTS   AGE
dataplane-dataplane1-ch6g9-5fb9c6484b-kklw5   1/1     Running   0          73s
```

You can check the HPA status with:

:::code{showCopyAction=true showLineNumbers=false language=shell}
kubectl get hpa -n kong
:::


**Send traffic**

We are going to use Fortio to consume the Data Plane and see the HPA in action. Note we are interested on sending traffic to the Data Plane only, so we are consuming a non-existing Route.

:::code{showCopyAction=true showLineNumbers=false language=shell}
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name:  fortio
  labels:
    app: fortio
spec:
  containers:
  - name: fortio
    image: fortio/fortio
    args: ["load", "-c", "800", "-qps", "3000", "-t", "20m", "-allow-initial-errors", "http://proxy1.kong.svc.cluster.local:80/route1/get"]
EOF
:::


**Sample Output**

Eventually, HPA will start a new replica:

```
% kubectl get hpa -n kong
NAME         REFERENCE                               TARGETS       MINPODS   MAXPODS   REPLICAS   AGE
dataplane1   Deployment/dataplane-dataplane1-ch6g9   cpu: 2%/75%   1         20        2          14m

% kubectl get pod -n kong -o json | jq -r '.items[].metadata.name'
dataplane-dataplane1-ch6g9-8c6c9cfcd-qbqp5
dataplane-dataplane1-ch6g9-8c6c9cfcd-rxcwm
```

If you delete the Fortio pod, HPA should terminate one pod and get back to 1 replica only.
:::code{showCopyAction=true showLineNumbers=false language=shell}
kubectl delete pod fortio
:::


**Delete HPA**

Delete the HPA setting applying the original declaration

:::code{showCopyAction=true showLineNumbers=false language=shell}
cat <<EOF | kubectl apply -f -
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
         image: kong/kong-gateway:3.10.0.1
       serviceAccountName: kaigateway-podid-sa
   replicas: 1
 network:
   services:
     ingress:
       name: proxy1
       type: LoadBalancer
       annotations:
         "service.beta.kubernetes.io/aws-load-balancer-scheme": "internet-facing"
         "service.beta.kubernetes.io/aws-load-balancer-nlb-target-type": "ip"
EOF
:::

Kong-gratulations! have now reached the end of this module by implementing and successfully testing Horizontal Pod AutoScaling. You can now click **Next** to proceed with the next chapter.

