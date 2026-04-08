---
title : "Data Plane Elasticity"
weight : 114
---

One of the most important capabilities provided by Kubernetes is to easily scale out a Deployment. With a single command we can create or terminate pod replicas in order to optimally support a given throughput. 

This capability is especially interesting for Kubernetes applications like Kong for Kubernetes Ingress Controller.

Here's our deployment before scaling it out:

{{<highlight>}}
kubectl get service -n kong
{{</highlight>}}

**Sample Output**

```
NAME                               TYPE           CLUSTER-IP      EXTERNAL-IP   PORT(S)                      AGE
dataplane-admin-dataplane1-wjk92   ClusterIP      None            <none>        8444/TCP                     4d21h
proxy-kong-workshop                LoadBalancer   10.110.77.48    127.0.0.1     80:32462/TCP,443:31666/TCP   4d21h
```

Notice, at this point in the workshop, there is only one pod taking data plane traffic.

{{<highlight>}}
kubectl get pod -n kong -o wide
{{</highlight>}}

**Sample Output**

```
NAME                                                READY   STATUS    RESTARTS      AGE     IP            NODE       NOMINATED NODE   READINESS GATES
dataplane-kong-workshop-dp-9hfk9-5f477c5696-kx9gr   1/1     Running   1 (40h ago)   4d21h   10.244.0.82   minikube   <none>           <none>
```

### Manual Scaling Out

Now, let's scale the deployment out creating 3 replicas of the pod

{{<highlight>}}
cat <<EOF | kubectl apply -f -
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
   replicas: 3
 network:
   services:
     ingress:
       name: proxy-kong-workshop
       type: LoadBalancer
EOF
{{</highlight>}}

Check the Deployment again and now you should see 3 replicas of the pod.

{{<highlight>}}
kubectl get pod -n kong -o wide
{{</highlight>}}

**Sample Output**

```
NAME                                                READY   STATUS    RESTARTS   AGE     IP            NODE       NOMINATED NODE   READINESS GATES
dataplane-kong-workshop-dp-9hfk9-5f477c5696-kx9gr   1/1     Running   0          2m50s   10.244.0.8    minikube   <none>           <none>
dataplane-kong-workshop-dp-9hfk9-5f477c5696-mbmvv   1/1     Running   0          35s     10.244.0.11   minikube   <none>           <none>
dataplane-kong-workshop-dp-9hfk9-5f477c5696-ngks2   1/1     Running   0          35s     10.244.0.9    minikube   <none>           <none>
```

As we can see, the 2 new Pods have been created and are up and running. If we check our Kubernetes Service again, we will see it has been updated with the new IP addresses. That allows the Service to implement Load Balancing across the Pod replicas.

{{<highlight>}}
kubectl describe service proxy-kong-workshop -n kong
{{</highlight>}}

**Sample Output**

```
Name:                     proxy-kong-workshop
Namespace:                kong
Labels:                   app=kong-workshop-dp
                          gateway-operator.konghq.com/dataplane-service-state=live
                          gateway-operator.konghq.com/dataplane-service-type=ingress
                          gateway-operator.konghq.com/managed-by=dataplane
Annotations:              <none>
Selector:                 app=kong-workshop-dp,gateway-operator.konghq.com/selector=381aa153-c89d-4306-99a3-f8e87926322c
Type:                     LoadBalancer
IP Family Policy:         SingleStack
IP Families:              IPv4
IP:                       10.110.242.209
IPs:                      10.110.242.209
LoadBalancer Ingress:     127.0.0.1 (VIP)
Port:                     http  80/TCP
TargetPort:               8000/TCP
NodePort:                 http  32269/TCP
Endpoints:                10.244.0.8:8000,10.244.0.9:8000,10.244.0.11:8000
Port:                     https  443/TCP
TargetPort:               8443/TCP
NodePort:                 https  30668/TCP
Endpoints:                10.244.0.8:8443,10.244.0.9:8443,10.244.0.11:8443
Session Affinity:         None
External Traffic Policy:  Cluster
Internal Traffic Policy:  Cluster
Events:                   <none>
```

Reduce the number of Pods to 1 again running as now we will turn on Horizontal pod autoscalar.

{{<highlight>}}
cat <<EOF | kubectl apply -f -
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
   replicas: 1
 network:
   services:
     ingress:
       name: proxy-kong-workshop
       type: LoadBalancer
EOF
{{</highlight>}}

### HPA - Horizontal Autoscaler

HPA (“Horizontal Pod Autoscaler”) is the Kubernetes resource to automatically control the number of replicas of Pods. With HPA, Kubernetes is able to support the requests produced by the consumers, keeping a given Service Level.

Based on CPU utilization or custom metrics, HPA starts and terminates Pods replicas updating all service data to help on the load balancing policies over those replicas.

HPA is described at https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/. Also, there's a nice walkthrough at https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale-walkthrough/

Kubernetes defines its own units for cpu and memory. You can read more about it at: https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/. We use these units to set our Deployments with HPA.

#### Metrics Server

HPA relies no the Metrics Server to control the number of replicas of a given deployment. Check it as follows:

{{<highlight>}}
kubectl get pod -n kube-system -o json | jq -r '.items[].metadata | select(.name | startswith("metrics-server-"))' | jq -r '.name'
{{</highlight>}}

Now you should see two *metrics-server-* pods in *Running* state

**Sample Output**

```
metrics-server-7fbb699795-5qqp5
```

#### Turn HPA on

Still using the Operator, let's upgrade our Data Plane deployment including new and specific settings for HPA. The new settings are defining the ammount of CPU and memory each Pod should allocate. At the same time, the "scaling" sets are telling HPA how to proceed to instantiate new Pod replicas.

Here's the final declaration:

{{<highlight>}}
cat <<EOF | kubectl apply -f -
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
         resources:
           requests:
             memory: "300Mi"
             cpu: "300m"
           limits:
             memory: "800Mi"
             cpu: "1200m"
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
 network:
   services:
     ingress:
       name: proxy-kong-workshop
       type: LoadBalancer
EOF
{{</highlight>}}



#### Checking HPA

After submitting the command check the Deployment again. Since we're not consume the Data Plane, we are supposed to see a single Pod running. In the next sections we're going to send requests to the Data Plane and new Pod will get created to handle them.

{{<highlight>}}
kubectl get pod -n kong
{{</highlight>}}

**Sample Output**

```
NAME.                                               READY   STATUS    RESTARTS   AGE
dataplane-kong-workshop-dp-9hfk9-84b465f8bc-9h6mj   1/1     Running   0          8s
```

You can check the HPA status with:

{{<highlight>}}
kubectl get hpa -n kong
{{</highlight>}}


**Send traffic**

We are going to use Fortio to consume the Data Plane and see the HPA in action. Note we are interested on sending traffic to the Data Plane only, so we are consuming a non-existing Route.

{{<highlight>}}
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
    args: ["load", "-c", "100", "-qps", "500", "-t", "20m", "-allow-initial-errors", "http://proxy-kong-workshop.kong.svc.cluster.local:80/route1/get"]
EOF
{{</highlight>}}


**Sample Output**

Eventually, HPA will start a new replica:

```
% kubectl get hpa -n kong
NAME               REFERENCE                                     TARGETS        MINPODS   MAXPODS   REPLICAS   AGE
kong-workshop-dp   Deployment/dataplane-kong-workshop-dp-9hfk9   cpu: 24%/20%   1         20        1          3m50s

% kubectl get pod -n kong -o json | jq -r '.items[].metadata.name'
dataplane-kong-workshop-dp-9hfk9-84b465f8bc-9h6mj
dataplane-kong-workshop-dp-9hfk9-84b465f8bc-wchn8
```

If you delete the Fortio pod, HPA should terminate one pod and get back to 1 replica only.
{{<highlight>}}
kubectl delete pod fortio
{{</highlight>}}


**Delete HPA**

Delete the HPA setting applying the original declaration

{{<highlight>}}
cat <<EOF | kubectl apply -f -
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
   replicas: 1
 network:
   services:
     ingress:
       name: proxy-kong-workshop
       type: LoadBalancer
EOF
{{</highlight>}}


#### Further Reading

* [Kong Konnect Data Plane Elasticity: Pod Autoscaling with VPA](https://konghq.com/blog/engineering/data-plane-elasticity-eks-1-29-pod-autoscaling-with-vpa)
* [Kong Konnect Data Plane Pod Autoscaling with HPA](https://konghq.com/blog/engineering/pod-autoscaling-with-hpa-on-eks-1-29)
* [Kong Konnect Data Plane Node Autoscaling with Cluster Autoscaler](https://konghq.com/blog/engineering/dp-node-autoscaling-with-cluster-autoscaler-aws-eks-1-29)
* [Kong Konnect Data Plane Node Autoscaling with Karpenter](https://konghq.com/blog/engineering/dp-node-autoscaling-with-karpenter-aws-eks-1-29)


Kong-gratulations! have now reached the end of this module by creating control plane and data plane. You can now click **Next** to proceed with the next module.



Kong-gratulations! have now reached the end of this module by implementing and successfully testing Horizontal Pod AutoScaling. You can now click **Next** to proceed with the next chapter.

