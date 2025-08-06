---
title : "Rate Limiting Using Redis"
weight : 156
---

Kong can rate-limit your traffic without any external dependency. In such a case, Kong stores the request counters in-memory and each Kong node applies the rate-limiting policy independently. There is no synchronization of information being done in this case. But if Redis is available in your cluster, Kong can take advantage of it and synchronize the rate-limit information across multiple Kong nodes and enforce a slightly different rate-limiting policy.

This section walks through the steps of using Redis for rate-limiting in a multi-node Kong deployment.

#### High Level Tasks
You will complete the following:
* Set up rate-limiting plugin
* Scale Kong for Kubernetes to multiple pods
* Verify rate-limiting across cluster

You can now click **Next** to proceed further.