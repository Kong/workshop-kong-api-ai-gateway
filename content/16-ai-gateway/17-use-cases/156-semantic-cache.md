---
title : "AI Semantic Cache plugin"
weight : 156
---

Semantic caching enhances data retrieval efficiency by focusing on the meaning or context of queries rather than just exact matches. It stores responses based on the underlying intent and semantic similarities between different queries and can then retrieve those cached queries when a similar request is made.

When a new request is made, the system can retrieve and reuse previously cached responses if they are contextually relevant, even if the phrasing is different. This method reduces redundant processing, speeds up response times, and ensures that answers are more relevant to the user’s intent, ultimately improving overall system performance and user experience.

For example, if a user asks, “how to integrate our API with a mobile app” and later asks, “what are the steps for connecting our API to a smartphone application?”, the system understands that both questions are asking for the same information. It can then retrieve and reuse previously cached responses, even if the wording is different. This approach reduces processing time and speeds up responses.

The **AI Semantic Cache** plugin may not be ideal for you if:
* If you have limited hardware or budget. Storing semantic vectors and running similarity searches require a lot of storage and computing power, which could be an issue.
* If your data doesn’t rely on semantics, or exact matches work fine, semantic caching may offer little benefit. Traditional or keyword-based caching might be more efficient.

### How it works

The diagram below illustrates the semantic caching mechanism implemented by the **AI Semantic Cache** plugin.

![semantic_cache_plugin](/static/images/semantic_cache_plugin.png)

The process involves three parts: request handling, embedding generation, and response caching.
* First, a user starts a chat request with the LLM. The **AI Semantic Cache** plugin queries the vector database to see if there are any semantically similar requests that have already been cached. If there is a match, the vector database returns the cached response to the user.
* If there isn’t a match, the **AI Semantic Cache** plugin prompts the embeddings LLM to generate an embedding for the response.
* The **AI Semantic Cache** plugin uses a vector database and cache to store responses to requests. The plugin can then retrieve a cached response if a new request matches the semantics of a previous request, or it can tell the vector database to store a new response if there are no matches.

With the **AI Semantic Cache plugin**, you can configure a cache of your choice to store the responses from the LLM. Currently, the plugin supports **Redis** as a cache.

### Redis as a Vector database

We are going to configure the **AI Semantic Cache** to consume the Redis deployment available in the EKS Cluster. Redis, this time, will play the Vector database role.

### Apply the Semantic Cache plugin

:::code{showCopyAction=true showLineNumbers=false language=shell}
cat > ai-semantic-cache.yaml << 'EOF'
_format_version: "3.0"
_info:
  select_tags:
  - semantic-cache
_info:
  select_tags:
  - bedrock
_konnect:
  control_plane_name: kong-aws
services:
- name: service1
  host: localhost
  port: 32000
  routes:
  - name: route1
    paths:
    - /bedrock-route
    plugins:
    - name: ai-proxy
      instance_name: ai-proxy-bedrock-route
      enabled: true
      config:
        auth:
          param_name: "allow_override"
          param_value: "false"
          param_location: "body"
        route_type: llm/v1/chat
        model:
          provider: bedrock
          options:
            bedrock:
              aws_region: us-west-2
    - name: ai-semantic-cache
      instance_name: ai-semantic-cache-bedrock
      enabled: true
      config:
        embeddings:
          auth:
            param_name: "allow_override"
            param_value: "false"
            param_location: "body"
          model:
            provider: bedrock
            name: "amazon.titan-embed-text-v2:0"
            options:
              bedrock:
                aws_region: us-west-2
        vectordb:
          dimensions: 1024
          distance_metric: cosine
          strategy: redis
          threshold: 0.2
          redis:
            host: "redis-stack.redis.svc.cluster.local"
            port: 6379
EOF
:::


Apply the declaration with decK:
:::code{showCopyAction=true showLineNumbers=false language=shell}
deck gateway reset --konnect-control-plane-name kong-aws --konnect-token $PAT -f
deck gateway sync --konnect-token $PAT ai-semantic-cache.yaml
:::



### Check Redis
Before sending request, you can scan the Redis database:

:::code{showCopyAction=true showLineNumbers=false language=shell}
kubectl exec -it $(kubectl get pod -n redis -o json | jq -r '.items[].metadata.name') -n redis -- redis-cli --scan
:::

##### 1st Request

Since we don't have any cached data, the first request is going to return "Miss":

:::code{showCopyAction=true showLineNumbers=false language=shell}
curl -i -X POST \
  --url $DATA_PLANE_LB/bedrock-route \
  --header 'Content-Type: application/json' \
   --data '{
   "messages": [
     {
       "role": "user",
       "content": "Who is Jimi Hendrix?"
     }
   ],
   "model": "us.amazon.nova-lite-v1:0"
 }'
:::

* Expected response
```
HTTP/1.1 200 OK
Content-Type: application/json
Connection: keep-alive
X-Cache-Status: Miss
Date: Fri, 18 Apr 2025 14:41:32 GMT
Content-Length: 2703
x-amzn-RequestId: 08a965e0-60b4-457f-aacd-273cb6940988
X-Kong-LLM-Model: bedrock/us.amazon.nova-lite-v1:0
X-Kong-Upstream-Latency: 3440
X-Kong-Proxy-Latency: 97
Via: 1.1 kong/3.10.0.1-enterprise-edition
Server: kong/3.10.0.1-enterprise-edition
X-Kong-Request-Id: 80eeaf284d891a588e55fb22b95f814b

{"usage":{"completion_tokens":557,"prompt_tokens":5,"total_tokens":562},"choices":[{"finish_reason":"stop","message":{"content":"Jimi Hendrix was an American rock guitarist, singer, and songwriter widely regarded as one of the greatest and most influential guitarists in the history of popular music. Born on November 27, 1942, in Seattle, Washington, he became a pivotal figure in the 1960s psychedelic and hard rock movements.\n\n### Early Life and Career\nHendrix's interest in music began at a young age. He started playing guitar at 15 and later served in the U.S. Army, where he was a member of the Army band. After leaving the Army, he moved to Nashville, Tennessee, and then to New York City, where he played in various R&B bands.\n\n### Breakthrough\nHendrix moved to London in 1966, where he formed the Jimi Hendrix Experience with bassist Noel Redding and drummer Mitch Mitchell. The band quickly gained popularity in Europe, and their debut album, \"Are You Experienced,\" released in 1967, brought them international acclaim.\n\n### Musical Innovation\nHendrix was known for his innovative and highly influential guitar playing. He used feedback, distortion, and other effects to create a new sound that pushed the boundaries of rock music. His performances were characterized by his virtuosic technique, including playing the guitar behind his back, between his legs, and with his teeth.\n\n### Notable Works\n- **\"Are You Experienced\" (1967)**: The band's debut album, featuring hits like \"Purple Haze\" and \"Hey Joe.\"\n- **\"Axis: Bold as Love\" (1967)**: Known for its complex compositions and innovative use of studio effects.\n- **\"Electric Ladyland\" (1968)**: A double album that showcased the band's experimental approach and included the iconic track \"Voodoo Child (Slight Return).\"\n- **Woodstock (1969)**: His performance at the Woodstock Festival, particularly his rendition of \"The Star-Spangled Banner,\" is considered one of the most legendary moments in rock history.\n\n### Legacy\nHendrix's influence extends far beyond his lifetime. He has inspired countless musicians across various genres, and his innovative approach to the guitar has left a lasting impact on rock music. He died on September 18, 1970, at the age of 27, but his music continues to be celebrated and studied.\n\n### Honors and Recognition\nHendrix has been inducted into multiple halls of fame, including the Rock and Roll Hall of Fame and the UK Music Hall of Fame. He has received numerous awards and accolades, including Grammy Awards, and is often ranked among the greatest guitarists of all time by various music publications.","role":"assistant"},"index":0}],"object":"chat.completion"}
```


##### Check Redis again

The Redis database has an entry now:
:::code{showCopyAction=true showLineNumbers=false language=shell}
kubectl exec -it $(kubectl get pod -n redis -o json | jq -r '.items[].metadata.name') -n redis -- redis-cli --scan
:::

* Expected response

```
"kong_semantic_cache:9eb0bd74-b166-46a7-b478-d46910134e2b:bedrock-us.amazon.nova-lite-v1:0:6e373ab243f6868432eae1f532c4cb11849d502b60a9a6644a6f24d7e89cc4bf"
```



##### 2nd Request
The Semantic Cache plugin will use the cached data for similar requests:

:::code{showCopyAction=true showLineNumbers=false language=shell}
curl -i -X POST \
  --url $DATA_PLANE_LB/bedrock-route \
  --header 'Content-Type: application/json' \
   --data '{
   "messages": [
     {
       "role": "user",
       "content": "Tell me more about Jimi Hendrix"
     }
   ],
   "model": "us.amazon.nova-lite-v1:0"
 }'
:::


* Expected response

```
HTTP/1.1 200 OK
Date: Fri, 18 Apr 2025 14:44:21 GMT
Content-Type: application/json; charset=utf-8
Connection: keep-alive
X-Cache-Status: Hit
Age: 3
X-Cache-Key: kong_semantic_cache:9eb0bd74-b166-46a7-b478-d46910134e2b:bedrock-us.amazon.nova-lite-v1:0:7bb5349c15e9068e3dfca4f83bd2f40fbdf42aa892b93622f8759f58273db18d
X-Cache-Ttl: 297
Content-Length: 3653
X-Kong-Response-Latency: 73
Server: kong/3.10.0.1-enterprise-edition
X-Kong-Request-Id: deab9b016f23907e1b737a0d8fea6a5d

{"usage":{"completion_tokens":731,"prompt_tokens":6,"total_tokens":737},"choices":[{"finish_reason":"stop","message":{"content":"Jimi Hendrix was an iconic American rock guitarist, singer, and songwriter, widely regarded as one of the greatest musicians in the history of rock music. Born on November 27, 1942, in Seattle, Washington, Hendrix became a pivotal figure in the 1960s counterculture and is celebrated for his groundbreaking guitar techniques and innovative approach to music.\n\n### Early Life and Career\nHendrix's early years were marked by a deep interest in music, which he pursued despite facing racial discrimination. He began playing in local bands in the mid-1960s before moving to New York City, where he played in various R&B and soul bands. His big break came when he moved to London in 1966, where he formed the Jimi Hendrix Experience with bassist Noel Redding and drummer Mitch Mitchell.\n\n### The Jimi Hendrix Experience\nThe Jimi Hendrix Experience quickly gained a reputation for their electrifying live performances. Their debut album, \"Are You Experienced,\" released in 1967, showcased Hendrix's innovative guitar playing, characterized by his use of feedback, distortion, and other effects to create a unique sound. Tracks like \"Purple Haze\" and \"Hey Joe\" became instant classics.\n\n### Iconic Performances\nHendrix's performances at major music festivals, such as the Monterey Pop Festival (1967) and Woodstock (1969), are legendary. His rendition of \"The Star-Spangled Banner\" at Monterey, where he played the song with feedback and distortion, remains one of the most iconic moments in rock history. At Woodstock, his performance was a highlight, featuring songs like \"Voodoo Child (Slight Return)\" and \"Purple Haze.\"\n\n### Innovations and Techniques\nHendrix revolutionized the role of the electric guitar in rock music. He was a master of using the guitar as a percussive and melodic instrument, often incorporating elements of blues, jazz, and psychedelic rock. His techniques included playing with his teeth and behind his back, using the guitar as a percussive instrument, and employing innovative studio effects.\n\n### Studio Albums\nHendrix released several influential albums during his career, including:\n- **\"Are You Experienced\" (1967)**: The debut album that introduced his innovative sound.\n- **\"Axis: Bold as Love\" (1967)**: Featuring hits like \"Castles Made of Sand\" and \"Little Wing.\"\n- **\"Electric Ladyland\" (1968)**: A double album that showcased the band's studio experimentation and live performances.\n- **\"Band of Gypsys\" (1969)**: Recorded with Billy Cox and Buddy Miles, it featured a more raw and powerful sound.\n\n### Legacy\nHendrix's influence extends far beyond his lifetime. His innovative approach to guitar playing has inspired countless musicians across genres. He was inducted into the Rock and Roll Hall of Fame in 1990 and the UK Music Hall of Fame in 2005. His life and music continue to be celebrated, with numerous documentaries, biographies, and compilations dedicated to his work.\n\n### Personal Life and Death\nHendrix's personal life was marked by struggles with addiction and mental health issues. He died on September 18, 1970, in London, at the age of 27. His death was ruled an accidental overdose, but it remains a subject of much speculation and debate.\n\nJimi Hendrix's legacy as a musical innovator and cultural icon endures, and his contributions to rock music continue to be celebrated and studied.","role":"assistant"},"index":0}],"object":"chat.completion","id":"7bb5349c15e9068e3dfca4f83bd2f40fbdf42aa892b93622f8759f58273db18d"}
```


##### 3rd Request
As expected, for a non-related request, the AI Gateway will hit the LLM to satisfy the query:

:::code{showCopyAction=true showLineNumbers=false language=shell}
curl -i -X POST \
  --url $DATA_PLANE_LB/bedrock-route \
  --header 'Content-Type: application/json' \
   --data '{
   "messages": [
     {
       "role": "user",
       "content": "Who was Joseph Conrad?"
     }
   ],
   "model": "us.amazon.nova-lite-v1:0"
 }'
:::

* Expected response

```
HTTP/1.1 200 OK
Content-Type: application/json
Connection: keep-alive
X-Cache-Status: Miss
Date: Fri, 18 Apr 2025 14:45:30 GMT
Content-Length: 1465
x-amzn-RequestId: e23f122b-b4d7-4164-a417-1d9f20e82289
X-Kong-LLM-Model: bedrock/us.amazon.nova-lite-v1:0
X-Kong-Upstream-Latency: 1647
X-Kong-Proxy-Latency: 143
Via: 1.1 kong/3.10.0.1-enterprise-edition
Server: kong/3.10.0.1-enterprise-edition
X-Kong-Request-Id: 6025a75733a29f47b2c7fd56c0c4771f

{"usage":{"completion_tokens":296,"prompt_tokens":5,"total_tokens":301},"choices":[{"finish_reason":"stop","message":{"content":"Joseph Conrad (born Józef Teodor Konrad Korzeniowski) was a renowned Polish-British writer born on December 3, 1857, in Berdichev, then part of the Russian Empire (now Ukraine), and died on August 3, 1924, in Bishopsbourne, England. \n\nConrad is best known for his novels and short stories that explore themes of imperialism, existentialism, and the complexities of the human psyche. His works often feature seafaring settings and characters, reflecting his own experiences as a sailor. Some of his most famous works include:\n\n1. **\"Heart of Darkness\"** (1899) - A novella that critiques the brutal realities of colonialism in the Congo Free State.\n2. **\"Lord Jim\"** (1900) - A novel that delves into themes of honor, failure, and redemption.\n3. **\"Nostromo\"** (1904) - A novel set in the fictional South American country of Costaguana, exploring themes of imperialism and the corrupting influence of power.\n4. **\"The Secret Agent\"** (1907) - A novel that examines the nature of terrorism and the psychology of the individual.\n\nConrad's writing is characterized by its complex narrative structures, rich symbolism, and deep psychological insight. He is considered one of the greatest novelists in the English language and a precursor to modernist literature.","role":"assistant"},"index":0}],"object":"chat.completion"}
```



##### Check Redis again

Redis database has two entries now:

:::code{showCopyAction=true showLineNumbers=false language=shell}
kubectl exec -it $(kubectl get pod -n redis -o json | jq -r '.items[].metadata.name') -n redis -- redis-cli --scan
:::

* Expected response
```
"kong_semantic_cache:2398b6a1-85e4-4330-af08-4628f51254e7:bedrock-us.amazon.nova-lite-v1:0:6e373ab243f6868432eae1f532c4cb11849d502b60a9a6644a6f24d7e89cc4bf"
"kong_semantic_cache:2398b6a1-85e4-4330-af08-4628f51254e7:bedrock-us.amazon.nova-lite-v1:0:60afd78b21ec82cf4d2264efd0b6faf081edd85c287f272e41508e5ddcd7dc50"
```



Kong-gratulations! have now reached the end of this module by authenticating the API requests with a key and associating different consumers with policy plans. You can now click **Next** to proceed with the next module.


