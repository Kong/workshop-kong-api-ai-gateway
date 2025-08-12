---
title : "PAT - Personal Access Token"
weight : 112
---

KGO requires a [Konnect Personal Access Token (PAT)](https://docs.konghq.com/konnect/org-management/access-tokens/) for creating the Control Plane. To generate your PAT,  click on your initials in the upper right corner of the Konnect home page, then select **Personal Access Tokens**. Click on **+ Generate Token**, name your PAT, set its expiration time, and be sure to copy and save it, as Konnect won’t display it again.

![pat](/static/images/pat.png)


> [!NOTE]
> Be sure to copy and save your PAT, as Konnect won’t display it again.


#### Konnect PAT secret

Create a Kubernetes (K8) Secret with your PAT in the `kong` namespace. KGO requires the secret to be labeled. 

* Save PAT in an environment variables

{{<highlight>}}
export PAT=PASTE_THE_CONTENTS_OF_COPIED_PAT
{{</highlight>}}


* Create the namespace

{{<highlight>}}
kubectl create namespace kong
{{</highlight>}}


* Create K8s Secret with PAT

> [!NOTE]
> Don’t forget to replace **PASTE_THE_CONTENTS_OF_COPIED_PAT** in the command above with the copied PAT from Kong UI.

{{<highlight>}}
kubectl create secret generic konnect-pat -n kong --from-literal=token=$(echo $PAT)
kubectl label secret konnect-pat -n kong "konghq.com/credential=konnect"
{{</highlight>}}


* Check your Secret. You should your PAT.

{{<highlight>}}
kubectl get secret konnect-pat -n kong -o jsonpath='{.data.*}' | base64 -d
{{</highlight>}}

You can now click **Next** to install the operator.