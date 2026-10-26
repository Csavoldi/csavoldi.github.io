---
title: Wiring up a local LLM with STT and TTS + Home Assistant
date: 2026-04-20
summary: Wrestling an LLM to turn off my lights.
slug: wiring-up-a-local-llm-with-stt-and-tts-home-assistant
---

I have always wanted a "Smart Home" since I was a kid, watching **"Smart House"** on the Disney Channel in the early 00's, but hopefully mine will be without the shenanigans and bad acting.

After some research I landed on using Home Assistant as the orchestrator or operating system. I have a Proxmox box in my homelab so it was an easy process to fire up a new VM and install HAOS (Home Assistant Operating System).
After some configuration and adopting my smart lights, security cameras, air purifier, etc, I dove right into researching what I would need to add an actually intelligent AI to control everything.

First I needed to decide what machine I was going to run my model from. I have a couple options: the HTPC in my living room that my wife uses to game on every now and then, or my main gaming rig, as
I do not have a powerful enough card installed in my homelab (yet... currently a GTX 960 2GB for transcoding, **thanks** current hardware market prices..). I decided to go with installing llama.cpp on my gaming rig as it has an AMD 7800XT 16GB card, and with Vulkan support I
should be able to get some solid tokens-per-second and a model that supports tool calling.

### Model choice

I chose the new Gemma 4 model [gemma-4-E4B-it-UD-Q4_K_XL.gguf](https://huggingface.co/unsloth/gemma-4-E4B-it-GGUF) which is about 4.5 gigs in size. When loaded on the card it uses 5 gigs of VRAM. Most modern games (that **I** play) use 10 gigs or less depending on your graphics settings, so I
shouldn't see any major issues with this running 24/7.

Is the model really smart? Well, not really, but I am getting 98 tokens-per-second with reasoning turned off, and that's what I need for tool calling to operate my lights and other smart home equipment.

Best part about this is that everything is private. I only have to worry about the software that the smart lights use for setup snooping, so I put my IoT devices on a separate subnet and VLAN from the majority of my network.

### STT

Next I needed STT (Speech to Text). A friend recommended nvidia parakeet v3 as it is very accurate, fast (10x faster than Whisper Large V3) and does not use many resources. I cloned this repo [wyoming-onnx-asr](https://github.com/chiabre/wyoming-onnx-asr) and set up a
systemd service to keep it running, so if the machine reboots it will auto launch. Next I wired this to Home Assistant's Assist feature using the wyoming protocol by adding it as an entity and selecting it as the speech to text engine in the assistant config page.

### TTS

For TTS (Text To Speech) I found Pocket TTS to be a great choice as it runs very quickly and with low latency on CPU. There is a Wyoming Protocol version here: [Pocket-TTS Wyoming Protocol Server](https://github.com/ikidd/pocket-tts-wyoming). I am running this in parallel with my other docker compose
stacks, and like STT I set it up as an entity in HA and configured the Assistant to use it.

The voice files are pretty good and sound natural. There is also a voice cloning feature, you just need a 10 second clip of anyone talking including your favorite tv show character etc.

At this point I am talking with the assistant and it is working well. There are some adjustments to be made in regards to tool calling and some tweaking to make this a smooth experience, and training my family to use it.

Check out this link [Home Assistant Voice Control](https://www.home-assistant.io/voice_control/) regarding expanding this system and setting up voice satellites. In a future post I will go over what I chose for hardware regarding voice satellites.

My forks of the pieces I run day to day live on [my GitHub](https://github.com/Csavoldi), including the [Pocket TTS Wyoming server](https://github.com/Csavoldi/pocket-tts-wyoming) and the [Home Assistant local LLM integration](https://github.com/Csavoldi/home-llm) I have been poking at.
