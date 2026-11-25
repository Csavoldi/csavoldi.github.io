---
title: "Living with Volta: settling two Tesla V100s into the homelab"
date: 2026-11-25
summary: The follow-up I promised on the fan curve script, plus everything else it took to settle two Tesla V100s into a Proxmox homelab.
slug: living-with-volta-settling-two-tesla-v100s-into-the-homelab
---

At the end of [my last post](reviving-volta-qwen3-8-flash-next-on-two-tesla-v100s.html) I mentioned "a fan curve script keeping the fans quiet too, more on that in a future post". This is that post. Getting two V100s to the point where they just run took more than the Strata patch. There was cooling, a passthrough VM, a P2P flag I would never have found on my own, and a NUMA setting that stopped the VM from booting. Then I moved the model serving from PolyStrata to a different engine, Lapilli, and measured it.

The short version: Volta is old enough that most defaults are wrong now. The driver has to be the 580 branch, the toolkit has to be CUDA 12.x, and nothing gets to assume bf16. The long version is below.

### The Card

The V100-PCIE-32GB is a passive card. No fans, 250 W, and a heatsink that expects a server chassis to push air through it. It takes a CPU 8-pin (EPS) power connector, not a PCIe 8-pin, which is worth checking before you close the case. It has fp16 tensor cores and nothing newer, so no bf16, no TF32, and no FP8. And it is the PCIe model, so there is no NVLink between the pair.

### Cooling

I covered the shroud last time. I printed a remix of [themayeah's fan adapter](https://www.thingiverse.com/thing:6897454) as a [120 mm version](https://www.thingiverse.com/thing:7423592), so one slow fan feeds both cards. If you are sizing a fan, at 250 W the air heats by 22 °C at 20 CFM, by 14.6 °C at 30 CFM, and by 8.8 °C at 50 CFM. A shroud adds back-pressure, so check the fan's P/Q curve and not only its free-air rating.

The fan curve took longer, because of the passthrough. The host has no NVIDIA driver, so it cannot read a GPU temperature. Only the VM can. The fans are on motherboard headers, so only the host can spin them. My fix is a tiny pipeline. A script in the VM sends the hottest GPU temperature to the host every 5 s, a receiver on the host writes it to `/run/gpu-temp`, and a loop maps that file to the fan headers.

| Hottest GPU | Fan |
| --- | --- |
| up to 35 °C | 25% |
| up to 45 °C | 40% |
| up to 55 °C | 55% |
| up to 65 °C | 70% |
| up to 75 °C | 85% |
| above 75 °C | 100% |
| no reading, or older than 30 s | 100% |

The GPU halves its clocks at 87 °C, so full fan from 76 °C up leaves some margin. The last row matters more than the rest. If the VM is off, or the script dies, the fan goes to full speed rather than trust a stale number. I would rather have a loud server than a cooked one.

The guest side is one line in a loop (trimmed):

```bash
while true; do
  T=$(nvidia-smi --query-gpu=temperature.gpu --format=csv,noheader,nounits | sort -n | tail -1)
  echo "$T" | timeout 5 bash -c 'cat > /dev/tcp/<pve-host-ip>/19999'
  sleep 5
done
```

The receiver on the host listens on every interface with no authentication, so that port stays on my LAN and nowhere else. The fan loop is a lookup table and a staleness check, again trimmed:

```bash
curve() {
  local t=$1 p
  if   [ "$t" -le 35 ]; then p=64;     # ~25%
  elif [ "$t" -le 45 ]; then p=102;    # ~40%
  elif [ "$t" -le 55 ]; then p=140;    # ~55%
  elif [ "$t" -le 65 ]; then p=178;    # ~70%
  elif [ "$t" -le 75 ]; then p=216;    # ~85%
  else                        p=255;   # 100%
  fi
  echo "$p"
}

while true; do
  age=$(( $(date +%s) - $(stat -c %Y /run/gpu-temp 2>/dev/null || echo 0) ))
  if [ "$age" -le 30 ]; then P=$(curve "$(cat /run/gpu-temp)"); else P=255; fi
  for n in 3 4 5; do echo "$P" > "$FAN_HWMON/pwm$n"; done
  sleep 5
done
```

`$FAN_HWMON` is the nct6775 hwmon directory, which the real script finds by name, and `pwm3` to `pwm5` are the system fan headers on my board. Each header has to be switched to manual control first (`echo 1 > pwm3_enable`). The CPU fans stay on the board's own control. Both scripts run as systemd services. In a 15-minute soak with six concurrent ~30k-token requests at 180 W caps, the cards sat between 54 and 59 °C.

### The Passthrough VM

Both cards live in a Debian 13 VM on Proxmox. The NVIDIA driver goes in the guest and never on the host. The host only binds the cards to `vfio-pci`. That way a PVE kernel update cannot break the driver, and a failed DKMS build in the guest is a problem I can fix over SSH instead of with a keyboard plugged into the box.

A few settings matter more than the rest:

- `machine: q35` and `cpu: host`. The VM started life on a CPU model with no AVX, and a prebuilt binary died with `SIGILL` until I switched.
- `hostpci0` and `hostpci1` point at whole slots, with no display flags. The VM keeps its emulated VGA for a console.
- `hugepages: 1024` with `balloon: 0`, and `numa: 1`. More on that below.
- Save `qm config` and `lspci -nn` before you touch the BIOS or move a card. The PCI addresses of my V100s have moved as I filled slots.

Debian 13 ships driver 550, and Volta needs 580. I ran NVIDIA's `.run` installer for 580.173.02, which registers the module with DKMS so it rebuilds on kernel updates. Then comes the trick. `apt install nvidia-cuda-toolkit` would pull the 550 driver back in, so I built an empty package with `equivs` that claims to provide the Debian driver packages:

```
Package: nvidia-driver-dummy-580
Version: 580.173.02
Provides: libcuda1, nvidia-driver, nvidia-driver-libs, nvidia-driver-bin, nvidia-kernel-dkms, ...
```

The `Provides:` line lists every Debian driver package, trimmed here. Build it, install it, and the toolkit goes in without touching the driver:

```bash
equivs-build control && dpkg -i nvidia-driver-dummy-580_*.deb
apt-get install -y nvidia-cuda-toolkit     # nvcc 12.4, and the 580 driver stays put
```

Two more gotchas from the guest:

- Installing the toolkit pulled in `libnvidia-ml1` 550, which broke `nvtop`. The fix is `ln -sf libnvidia-ml.so.1 /usr/lib/x86_64-linux-gnu/libnvidia-ml.so && ldconfig`.
- CUDA 12.9 will not compile anything on Debian 13. glibc 2.41 declares the `cospi`/`sinpi` family with `__THROW` and CUDA's headers do not, so nvcc fails on every file. A one-line `sed` on `crt/math_functions.h` adds the missing `__THROW`.

### P2P

This one is my favorite. Inside the VM, CUDA refused to let the cards see each other's memory. `cudaDeviceCanAccessPeer` returned 0 and `cudaDeviceEnablePeerAccess` failed with error 217. The cards were fine. QEMU had never been told they sit in the same GPUDirect clique. Two arguments fix it:

```
-set device.hostpci0.x-nv-gpudirect-clique=1 -set device.hostpci1.x-nv-gpudirect-clique=1
```

Then stop and start the VM. A reboot is not enough. After that the check passes (`canAccessPeer=1`) and a kernel on one card can read and write the other card's memory, with every byte verified.

| Transfer (256 MiB) | GB/s |
| --- | --- |
| Host to GPU | 11.86 |
| GPU to host | 13.08 |
| GPU to GPU, one way | 10.22 |
| GPU to GPU, both ways at once | 19.55 |

Enabling P2P did not make the 16 MiB peer copy faster in the single sweep I ran: 10.86 and 10.75 GB/s before, 10.06 and 10.08 after. PolyStrata passes layers between the cards through host memory anyway, so I am not claiming a speedup. Small-copy latency did drop, from 15.26 and 15.87 µs to 11.99 and 13.23 µs. It is one less thing to rule out. And if a multi-GPU framework in a VM ever tells you peer access is unsupported, check the hypervisor before the hardware.

### NUMA

The host is a dual-socket X99, and each V100 hangs off a different socket's PCIe root complex (GPU0 on node 0, GPU1 on node 1, going by `lspci`). So I set `numa: 1` and bound each guest NUMA node to its own host node with `policy=bind`, on 1 GB hugepages. Then the VM refused to start:

```
hugepage allocation failed (Memory.pm line 731)
```

At the time, the board's second socket had no RAM detected at all. `numactl --hardware` listed node 1 at 0 MB. Binding 24 GB to an empty node can never work, hugepages or not. One line fixed it:

```bash
qm set <vmid> -numa1 "cpus=32-63,hostnodes=0,memory=24576,policy=bind"
```

Run `numactl --hardware` on the host before you bind anything. Later, with RAM on both sockets, I tried pinning the vCPUs to their local node to see if it helped decode. It did not: 77.9 tok/s before, 77.1 pinned.

### Lapilli

What serves the model on these cards now is [Lapilli](https://github.com/chris83-dev/lapilli-v100), a V100 port of [Basalt](https://github.com/jesdga95/basalt), the local inference engine for Qwen3.8-Flash-Next. Basalt itself targets Blackwell only. chris83-dev did the Volta port. The README lists Linux and PCIe cards under "not tested", and the prebuilt build is Windows only, so I built it into a container. It brings its own chat page and keeps Basalt's OpenAI and Anthropic APIs.

The Dockerfile is ten lines. It starts from the PolyStrata V100 image I already had, which carries the CUDA 12.9 toolchain, and builds Lapilli for `sm_70`. There are no engine changes:

```dockerfile
FROM polystrata-v100:v0.1.45-poly.10
USER root
RUN apt-get update && apt-get install -y --no-install-recommends cmake ninja-build && rm -rf /var/lib/apt/lists/*
WORKDIR /opt/lapilli
COPY . /opt/lapilli/
RUN cmake -S . -B build70 -G Ninja -DCMAKE_BUILD_TYPE=Release -DCMAKE_CUDA_ARCHITECTURES=70 -DBASALT_MODELS=qwen4exp -DBUILD_TESTING=ON -DCMAKE_CUDA_RUNTIME_LIBRARY=Shared && cmake --build build70 -j4
RUN python3 -m venv .venv && .venv/bin/pip install --no-cache-dir -r requirements.txt
ENV HOME=/data PATH=/opt/lapilli/bin:$PATH PYTHONUNBUFFERED=1
HEALTHCHECK NONE
ENTRYPOINT ["/opt/lapilli/bin/basalt", "serve"]
```

The image is tagged `lapilli-v100:7588701-cuda12.9`, after the source commit. The container serves the UD-IQ4_XS pack on both cards with int8 KV, memory-mapped experts, and a 524288-token context, which is 2x YaRN on top of the model's native 262144. It passed 80 functional CPU tests, five GPU tests picked for the V100, and ten quantization parity fixtures.

One line in the compose file ties back to the P2P section. Lapilli ships with peer access switched off on Volta, because on the author's machine direct copies between two V100s returned bad data. `BASALT_PEER_NO_P2P=0` turns it back on. The byte checks pass in both directions on my cards, so I turned it on. Run the check on your own cards before you flip it.

To see whether the context limit is real, I fed it 520041 tokens with two random values planted early and midway. It returned both exactly, with no cached prompt tokens. Reading the prompt took 646.9 s, which is 803.9 tok/s, and the 31-token answer decoded at 43.4 tok/s. That is a retrieval test, not a prose benchmark at 512K.

Against the dense Qwen3.8-27B in FP16 that ran on these cards before (llama.cpp, tensor split, no draft), on the median of three 512-token answers at temperature 0 with thinking off:

| Case | Lapilli tok/s | Qwen3.8-27B FP16 tok/s |
| --- | --- | --- |
| short, coding/design | 106.7 | 27.2 |
| short, prose | 91.0 | 27.2 |
| short, structured | 131.8 | 27.1 |
| 128K, coding/design | 87.9 | 20.0 |
| 128K, prose | 77.1 | 19.9 |
| 128K, structured | 107.0 | 19.8 |

The long rows carry about 130K tokens of context, and the first long prompt took 112.5 s to read against 163.3 s for the 27B. Two caveats. This compares two deployed setups and not equal accuracy, since Lapilli runs quantized MoE weights with speculative decoding and the 27B is dense FP16 with no draft. And the coding prompt asked for a design explanation first, so those tokens are prose about code.

I also run the [Huihui abliterated build](https://huggingface.co/huihui-ai/Huihui-Qwen3.8-Flash-Next-abliterated-v2-GGUF) of the same model. The converter ships in the image, so I pointed it at the UD-IQ4_XS GGUF shards after checking their SHA256 hashes, and 35.5 minutes later it had repacked them into a 91 GiB `.basalt` file with no engine rebuild. Arithmetic, streaming, a tool-call round trip and the long-context retrieval all pass. It is slower on short prompts, and the draft acceptance rate on Python and JSONL drops with it:

| Short prompt | Stock tok/s | Abliterated tok/s |
| --- | --- | --- |
| prose | 105.5 | 102.1 |
| Python | 157.0 | 148.8 |
| JSONL | 153.6 | 134.4 |

These prompts differ from the table above and were measured on the 512K profile, so do not line the two tables up. The abliterated build has been the default on the box since November 20.

The last piece is Inkling 2 Mini on a single V100, which I ported in [my own fork of Lapilli](https://github.com/Csavoldi/lapilli-inkling/blob/inkling2-port/INKLING2.md) shortly after upstream Basalt added it for Blackwell. About 16 GB of weights fit on one card. Its logits match llama.cpp on 5 of 5 top-1 tokens, with KL between 0.0001 and 0.0005. With a 512K context configured, decode runs at 69 tok/s on an empty context, 60.5 at 42K, and 44.4 at 165K. Prefill is the weak part, at 439 tok/s with 42K tokens in and 211 at 165K, so a cold 512K prompt would take something like 45 minutes. A first scheduling tweak, which skips the expert prefetch during single-row decode, lifted short-prompt decode from about 72.5 to 83.5 tok/s with byte-identical logits. That one is still an experiment until it holds up at longer contexts.

### Loose Ends

- `nvidia-smi` reports Persistence Mode as Disabled on both cards even though `nvidia-persistenced` is running. I have not chased that down.
- ECC is off on both cards. My notes do not say why, and the card ships with it on.
- Upstream still marks Lapilli's Linux and Volta peer path as experimental, which is fair.

Credits where due: [themayeah](https://www.thingiverse.com/thing:6897454) for the original fan adapter, [chris83-dev](https://github.com/chris83-dev/lapilli-v100) for the Lapilli port, [Jesús Gulfo](https://github.com/jesdga95/basalt) for Basalt, and [gpu-burn](https://github.com/wilicc/gpu-burn), which is what I use for burn-in. Build it with `COMPUTE=70`, since upstream defaults to 7.5.
