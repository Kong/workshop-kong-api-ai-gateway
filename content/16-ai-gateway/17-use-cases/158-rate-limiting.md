---
title : "AI Rate Limiting Advanced plugin"
weight : 158
---

With the existing API Key policy, we can control the incoming requests. However, the policies implemented by the other plugins are the same regardless the consumer.

In this section, we are going to define specific Rate Limiting policies for each Consumer represented by its API Key.

### Kong Consumer Policies

It's important then to be able to define specific policies for each one of these consumers. For example, it would be great to define Rate Limiting policies for different consumers like this:

* consumer1:
    * apikey = 123456
    * rate limiting policy = 500 tokens per minute
* consumer2:
    * apikey = 987654
    * rate limiting policy = 10000 tokens per minute

Doing that, the Data Plane is capable to not just protect the Route but to identify the consumer based on the key injected to enforce specific policies to the consumer. Keep in mind that a Consumer might have other plugins also enabled such as [TCP Log](https://docs.konghq.com/hub/kong-inc/tcp-log/), etc.


#### New Consumer and AI Rate Limiting Advanced plugin Policies

Then, create the second ``consumer2``, just like you did with the first one, with the ``987654`` key. Both Kong Consumers have the **AI Rate Limiting Advanced** plugin enabled with specific configurations.


:::code{showCopyAction=true showLineNumbers=false language=shell}
cat > ai-key-auth-rate-limiting-advanced.yaml << 'EOF'
_format_version: "3.0"
_konnect:
  control_plane_name: kong-aws
_info:
  select_tags:
  - bedrock
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
    - name: key-auth
      instance_name: key-auth-bedrock
      enabled: true
consumers:
- keyauth_credentials:
  - key: "123456"
  username: user1
  plugins:
  - name: ai-rate-limiting-advanced
    instance_name: ai-rate-limiting-advanced-consumer1
    config:
      llm_providers:
      - name: bedrock
        window_size:
        - 60
        limit:
        - 500
- keyauth_credentials:
  - key: "987654"
  username: user2  
  plugins:
  - name: ai-rate-limiting-advanced
    instance_name: ai-rate-limiting-advanced-consumer2
    config:
      llm_providers:
      - name: bedrock
        window_size:
        - 60
        limit:
        - 10000
EOF
:::


Apply the declaration with decK:
:::code{showCopyAction=true showLineNumbers=false language=shell}
deck gateway reset --konnect-control-plane-name kong-aws --konnect-token $PAT -f
deck gateway sync --konnect-token $PAT ai-key-auth-rate-limiting-advanced.yaml
:::


#### Use both Kong Consumers

If you will, you can inject both keys to your requests.

:::code{showCopyAction=true showLineNumbers=false language=shell}
curl -i -X POST \
  --url $DATA_PLANE_LB/bedrock-route \
  --header 'Content-Type: application/json' \
  --header 'apikey: 123456' \
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

* Expected output

```
HTTP/1.1 200 OK
Content-Type: application/json
Connection: keep-alive
X-AI-RateLimit-Limit-minute-bedrock: 500
X-AI-RateLimit-Remaining-minute-bedrock: 500
Date: Fri, 18 Apr 2025 14:58:51 GMT
Content-Length: 2697
x-amzn-RequestId: 52a2aa58-fe6e-413b-a06c-889922bfdba7
X-Kong-LLM-Model: bedrock/us.amazon.nova-lite-v1:0
X-Kong-Upstream-Latency: 3155
X-Kong-Proxy-Latency: 4
Via: 1.1 kong/3.10.0.1-enterprise-edition
Server: kong/3.10.0.1-enterprise-edition
X-Kong-Request-Id: 9782b97c3b0bda090f928d765214077b

{"usage":{"completion_tokens":570,"prompt_tokens":5,"total_tokens":575},"choices":[{"finish_reason":"stop","message":{"content":"Jimi Hendrix was an American rock guitarist, singer, and songwriter widely regarded as one of the greatest and most influential guitarists in the history of popular music. Born on November 27, 1942, in Seattle, Washington, he became a pivotal figure in the 1960s psychedelic and hard rock movements.\n\n### Key Aspects of Jimi Hendrix's Career:\n\n1. **Early Life**:\n   - Hendrix grew up in Seattle and began playing guitar at a young age.\n   - He served in the U.S. Army but was discharged due to a foot injury.\n\n2. **Musical Breakthrough**:\n   - After moving to New York City, Hendrix became part of the vibrant music scene and played with various R&B and soul bands.\n   - He moved to London in 1966, where he formed the Jimi Hendrix Experience with bassist Noel Redding and drummer Mitch Mitchell.\n\n3. **Iconic Albums**:\n   - **\"Are You Experienced\" (1967)**: His debut album, which included hits like \"Purple Haze\" and \"Hey Joe.\"\n   - **\"Axis: Bold as Love\" (1967)**: Showcased his innovative guitar work and songwriting.\n   - **\"Electric Ladyland\" (1968)**: Known for its ambitious and experimental tracks, including \"Voodoo Child (Slight Return)\" and \"All Along the Watchtower.\"\n\n4. **Innovative Techniques**:\n   - Hendrix revolutionized guitar playing with his use of feedback, distortion, and effects pedals.\n   - He was known for his ability to play the guitar with his teeth and behind his back, as well as his use of the wah-wah pedal.\n\n5. **Live Performances**:\n   - Hendrix's live performances were legendary, characterized by his energetic stage presence and improvisational skills.\n   - Notable performances include his iconic rendition of \"The Star-Spangled Banner\" at the Woodstock Festival in 1969 and his groundbreaking performance at the Monterey Pop Festival in 1967.\n\n6. **Legacy**:\n   - Hendrix's influence extends beyond rock music, impacting various genres including blues, funk, and heavy metal.\n   - He has been inducted into multiple halls of fame, including the Rock and Roll Hall of Fame and the UK Music Hall of Fame.\n   - Rolling Stone magazine has consistently ranked him among the greatest guitarists of all time.\n\n### Death:\nHendrix died on September 18, 1970, in London, from asphyxiation due to barbiturate overdose. His death occurred just a day after his final concert at the Royal Albert Hall.\n\nJimi Hendrix remains a cultural icon, celebrated for his musical genius and his profound impact on the evolution of rock music.","role":"assistant"},"index":0}],"object":"chat.completion"}
```

or

:::code{showCopyAction=true showLineNumbers=false language=shell}
curl -i -X POST \
  --url $DATA_PLANE_LB/bedrock-route \
  --header 'Content-Type: application/json' \
  --header 'apikey: 987654' \
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

* Expected output

```
HTTP/1.1 200 OK
Content-Type: application/json
Connection: keep-alive
X-AI-RateLimit-Limit-minute-bedrock: 10000
X-AI-RateLimit-Remaining-minute-bedrock: 10000
Date: Fri, 18 Apr 2025 14:59:27 GMT
Content-Length: 1670
x-amzn-RequestId: 814f0ce7-a47d-4e70-a6ce-be36e8e1b0b9
X-Kong-LLM-Model: bedrock/us.amazon.nova-lite-v1:0
X-Kong-Upstream-Latency: 2222
X-Kong-Proxy-Latency: 4
Via: 1.1 kong/3.10.0.1-enterprise-edition
Server: kong/3.10.0.1-enterprise-edition
X-Kong-Request-Id: a3a50214d6b82a6343f6e5608e56e633

{"usage":{"completion_tokens":330,"prompt_tokens":5,"total_tokens":335},"choices":[{"finish_reason":"stop","message":{"content":"Jimi Hendrix was an American rock guitarist, singer, and songwriter widely regarded as one of the greatest and most influential guitarists in the history of popular music. Born on November 27, 1942, in Seattle, Washington, he was a key figure in the evolution of rock music during the 1960s.\n\nHendrix gained fame in the mid-1960s while living in London, where he formed the Jimi Hendrix Experience with bassist Noel Redding and drummer Mitch Mitchell. His groundbreaking technique, which included the innovative use of feedback, distortion, and other effects, along with his virtuosic playing style, set him apart from his contemporaries.\n\nSome of Hendrix's most iconic songs include \"Purple Haze,\" \"Foxy Lady,\" \"Hey Joe,\" \"All Along the Watchtower,\" and \"Voodoo Child (Slight Return).\" His performances, particularly at the Monterey Pop Festival in 1967, Woodstock in 1969, and the Isle of Wight Festival in 1970, are legendary.\n\nHendrix's influence extends far beyond his recorded music. He was known for his charismatic stage presence and his ability to push the boundaries of what was possible with the electric guitar. His work has inspired countless musicians across various genres.\n\nTragically, Hendrix's career was cut short when he died on September 18, 1970, in London, from asphyxiation due to barbiturate overdose. Despite his relatively short career, his impact on music and culture endures, and he continues to be celebrated as a pioneering artist.","role":"assistant"},"index":0}],"object":"chat.completion"}
```


Again, test the rate-limiting policy by executing the following command multiple times and observe the rate-limit headers in the response, specially, ``X-AI-RateLimit-Limit-minute-bedrock`` and ``X-AI-RateLimit-Remaining-minute-bedrock``:



Now, let's consume it with the Consumer1's API Key. As you can see the Data Plane is processing the Rate Limiting processes independently.

:::code{showCopyAction=true showLineNumbers=false language=shell}
curl -i -X POST \
  --url $DATA_PLANE_LB/bedrock-route \
  --header 'Content-Type: application/json' \
  --header 'apikey: 123456' \
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


```
HTTP/1.1 200 OK
Content-Type: application/json
Connection: keep-alive
X-AI-RateLimit-Limit-minute-bedrock: 500
X-AI-RateLimit-Remaining-minute-bedrock: 500
Date: Fri, 18 Apr 2025 15:00:53 GMT
Content-Length: 2601
x-amzn-RequestId: 998b5022-e5b2-487f-a3d0-cb19eb8dee77
X-Kong-LLM-Model: bedrock/us.amazon.nova-lite-v1:0
X-Kong-Upstream-Latency: 3287
X-Kong-Proxy-Latency: 4
Via: 1.1 kong/3.10.0.1-enterprise-edition
Server: kong/3.10.0.1-enterprise-edition
X-Kong-Request-Id: ba97994f991645566325aa5468568e72
```


If we keep sending requests using the first API Key, eventually, as expected, we'll get an error code:

:::code{showCopyAction=true showLineNumbers=false language=shell}
curl -i -X POST \
  --url $DATA_PLANE_LB/bedrock-route \
  --header 'Content-Type: application/json' \
  --header 'apikey: 123456' \
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

```
HTTP/1.1 429 Too Many Requests
Date: Fri, 18 Apr 2025 15:09:57 GMT
Content-Type: application/json; charset=utf-8
Connection: keep-alive
X-AI-RateLimit-Reset: 8
X-AI-RateLimit-Retry-After-minute-bedrock: 8
X-AI-RateLimit-Retry-After: 8
X-AI-RateLimit-Limit-minute-bedrock: 500
X-AI-RateLimit-Remaining-minute-bedrock: 0
X-AI-RateLimit-Reset-minute-bedrock: 8
Content-Length: 67
X-Kong-Response-Latency: 1
Server: kong/3.10.0.1-enterprise-edition
X-Kong-Request-Id: 671b855c4535e7596d22d16cca0e6f10

{"message":"AI token rate limit exceeded for provider(s): bedrock"}
```

However, the second API Key is still allowed to consume the Kong Route:


:::code{showCopyAction=true showLineNumbers=false language=shell}
curl -i -X POST \
  --url $DATA_PLANE_LB/bedrock-route \
  --header 'Content-Type: application/json' \
  --header 'apikey: 987654' \
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

```
HTTP/1.1 200 OK
Content-Type: application/json
Connection: keep-alive
X-AI-RateLimit-Limit-minute-bedrock: 10000
X-AI-RateLimit-Remaining-minute-bedrock: 10000
Date: Fri, 18 Apr 2025 15:10:30 GMT
Content-Length: 2287
x-amzn-RequestId: a5ffda3e-0ed0-4958-9134-382dc4cc87e7
X-Kong-LLM-Model: bedrock/us.amazon.nova-lite-v1:0
X-Kong-Upstream-Latency: 2974
X-Kong-Proxy-Latency: 2
Via: 1.1 kong/3.10.0.1-enterprise-edition
Server: kong/3.10.0.1-enterprise-edition
X-Kong-Request-Id: 55c8f21ff35a8043d33ed739ec4aac1c

{"usage":{"completion_tokens":480,"prompt_tokens":5,"total_tokens":485},"choices":[{"finish_reason":"stop","message":{"content":"Jimi Hendrix was an American rock guitarist, singer, and songwriter widely regarded as one of the greatest and most influential guitarists in the history of popular music. Born on November 27, 1942, in Seattle, Washington, he became a pivotal figure in the 1960s psychedelic and hard rock movements.\n\n### Early Life and Career\n- **Birth Name:** Johnny Allen Hendrix\n- **Early Years:** He grew up in Seattle and began playing guitar at a young age. His early career included stints in various R&B bands in the Southern United States.\n\n### Breakthrough\n- **Move to New York:** Hendrix moved to New York City in 1964 and later to London in 1966, where he found greater success.\n- **The Jimi Hendrix Experience:** In London, he formed the Jimi Hendrix Experience with bassist Noel Redding and drummer Mitch Mitchell.\n\n### Musical Innovations\n- **Guitar Techniques:** Hendrix was known for his innovative use of guitar effects, including distortion, feedback, and wah-wah pedals. He also played the guitar behind his back and with his teeth.\n- **Stage Presence:** His electrifying performances and flamboyant stage presence made him a legend.\n\n### Notable Works\n- **Albums:** Some of his most famous albums include \"Are You Experienced\" (1967), \"Axis: Bold as Love\" (1967), and \"Electric Ladyland\" (1968).\n- **Songs:** Iconic songs include \"Purple Haze,\" \"Hey Joe,\" \"All Along the Watchtower,\" and \"Voodoo Child (Slight Return).\"\n\n### Legacy\n- **Influence:** Hendrix's influence extends across genres, impacting rock, blues, funk, and jazz musicians.\n- **Death:** Tragically, he died on September 18, 1970, in London, at the age of 27, from an overdose of barbiturates.\n\n### Honors and Recognition\n- **Hall of Fame:** Inducted into the Rock and Roll Hall of Fame in 1990.\n- **Cultural Impact:** His music and persona continue to be celebrated and studied, and he remains a symbol of artistic freedom and innovation.\n\nJimi Hendrix's contributions to music have left an indelible mark, and his work continues to inspire new generations of musicians and fans alike.","role":"assistant"},"index":0}],"object":"chat.completion"}
```

Kong-gratulations! have now reached the end of this module by authenticating the API requests with a key and associating different consumers with policy plans. You can now click **Next** to proceed with the next module.

