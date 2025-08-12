---
title : "Kong Gateway Operator"
weight : 111
---

#### Install the Operator

To get started let's install the Operator:


{{<highlight>}}
helm repo add kong https://charts.konghq.com
helm repo update kong
{{</highlight>}}

{{<highlight>}}
helm upgrade --install kgo kong/gateway-operator \
-n kong-system \
--create-namespace \
--set image.tag=1.6.2 \
--set kubernetes-configuration-crds.enabled=true \
--set env.ENABLE_CONTROLLER_KONNECT=true
{{</highlight>}}


You can check the Operator's log with:
{{<highlight>}}
kubectl logs $(kubectl get pod -n kong-system -o json | jq -r '.items[].metadata | select(.name | startswith("kgo-gateway-operator"))' | jq -r '.name') -n kong-system
{{</highlight>}}


#### Delete KGO

If you want to delete KGO run:
```
helm uninstall kgo -n kong-system
kubectl delete namespace kong-system
```

Kong-gratulations! have now reached the end of this module by creating a Kong Operator. You can now click **Next** to proceed with the next module.