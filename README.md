# mqtt-cyberpower-bridge

This is a simple docker container that I use to bridge Cyberpower with my MQTT bridge.

I have a collection of bridges, and the general format of these begins with these environment variables:

```
      TOPIC_PREFIX: /your_topic_prefix  (eg: /some_topic_prefix/somthing)
      MQTT_HOST: YOUR_MQTT_URL (eg: mqtt://mqtt.yourdomain.net)
      (OPTIONAL) MQTT_USER: YOUR_MQTT_USERNAME
      (OPTIONAL) MQTT_PASS: YOUR_MQTT_PASSWORD
```

This will publish and (optionally) subscribe to events for this bridge with the TOPIC_PREFIX of you choosing.

Generally I use 0 as 'off', and 1 as 'on' for these.

For changing states '/set' commands also work, eg:

publish this to turn on the outlet named "Pool"

```
   topic: /living_room/cabinet/sonos/pool/set
   value: 1
```

Here's an example docker compose:

```
version: '3.3'
services:
  mqtt-cyberpower-bridge:
    image: ghcr.io/terafin/mqtt-cyberpower-bridge:latest
    environment:
      LOGGING_NAME: mqtt-cyberpower-bridge
      TZ: America/Los_Angeles
      TOPIC_PREFIX: /your_topic_prefix  (eg: /living_room/cabinet/sonos)
      CYBERPOWER_IP: YOUR_CYPERPOWER_IP
      CYBERPOWER_PORT: 161
      CYBERPOWER_COMMUNITY: YOUR_SNMP_COMMUNITY (eg: private)
      MQTT_HOST: YOUR_MQTT_URL (eg: mqtt://mqtt.yourdomain.net)
      (OPTIONAL) MQTT_USER: YOUR_MQTT_USERNAME
      (OPTIONAL) MQTT_PASS: YOUR_MQTT_PASSWORD
```

Here's an example publish for my setup:

```
/living_room/cabinet/sonos/pool 1
/living_room/cabinet/sonos/bedroom 1
/living_room/cabinet/sonos/guest_bathroom 1
/living_room/cabinet/sonos/study 1
/living_room/cabinet/sonos/guest_bedroom 1
/living_room/cabinet/sonos/entrance 1
/living_room/cabinet/sonos/bathroom 1
/living_room/cabinet/sonos/receiver 1
```
