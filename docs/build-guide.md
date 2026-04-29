# OkamaOS Build Guide

## Prerequisites

| Tool          | Minimum version | Install                          |
|---------------|-----------------|----------------------------------|
| git           | 2.x             | `apt install git`                |
| make          | 3.82+           | `apt install make`               |
| gcc / g++     | 10+             | `apt install build-essential`    |
| Python 3      | 3.10+           | `apt install python3`            |
| pip           | 22+             | `apt install python3-pip`        |
| QEMU          | 7+              | `apt install qemu-system-x86`    |
| pygame (host) | 2.x (dev only)  | `pip install pygame`             |
| wget / curl   | any             | `apt install wget`               |
| cpio, rsync   | any             | `apt install cpio rsync`         |

Buildroot also needs:
```bash
apt install libncurses-dev bison flex libssl-dev bc file unzip
```

## Repository Layout

```
okamaos/                         ← this repo (BR2_EXTERNAL tree)
├── Makefile                     ← all build targets
├── configs/okamaos_x86_64_defconfig
├── board/okamaos/               ← kernel, busybox config; post-build scripts
├── board/okamaos/rootfs-overlay ← files overlaid on Buildroot rootfs
├── package/okama-runtime/       ← Buildroot recipe for OkamaOS userland
├── usr/bin/                     ← okama-* Python scripts
├── usr/lib/okamaos/             ← shared Python library
├── games/demo/                  ← demo .ok game source
├── tools/                       ← host-side helper scripts
└── docs/                        ← this and other docs
```

Buildroot is cloned by `make setup` into `./buildroot/`.
Build output goes to `./output/`.

---

## Step-by-Step Build

### 1. Clone this repo

```bash
git clone <okamaos-repo-url> okamaos
cd okamaos
```

### 2. Set up Buildroot

```bash
make setup
```

This clones Buildroot 2024.02.10 into `./buildroot/`. It only needs to run
once. Re-running is safe (checks if already present).

### 3. Configure Buildroot

```bash
make buildroot
```

This copies `configs/okamaos_x86_64_defconfig` into the Buildroot tree and
runs `make okamaos_x86_64_defconfig` to initialise the output directory.

To tune the config interactively:
```bash
make -C buildroot O=output menuconfig
```

To tune the kernel:
```bash
make -C buildroot O=output linux-menuconfig
```

Save your changes back to the config file:
```bash
make -C buildroot O=output savedefconfig
cp output/defconfig configs/okamaos_x86_64_defconfig
```

### 4. Build the full image

```bash
make okamaos-build
```

This calls `make -C buildroot O=output BR2_EXTERNAL=$(pwd)`.

First build: **1–3 hours** depending on your CPU and internet speed.
Subsequent builds (incremental): **2–20 minutes**.

Outputs in `output/images/`:
```
bzImage          ← Linux kernel
rootfs.ext4      ← ext4 rootfs
rootfs.squashfs  ← squashfs rootfs (alternative)
```

### 5. Run in QEMU

```bash
make okamaos-run-qemu
```

QEMU launches with:
- 2 GB RAM, 2 vCPUs
- Virtio block device (rootfs.ext4)
- Virtio net
- USB keyboard + mouse emulated
- VGA display (800×600 default; set `QEMU_FLAGS=-vga virtio` for better graphics)

On first boot you should see:
- Silent kernel boot (loglevel=0)
- `okama-shell` starts on tty1
- If Pygame is available: fullscreen SDL2 shell
- If not (no display): text-mode shell fallback

### 6. Build the demo game package

```bash
make package-demo
```

Output: `build/demo.ok`

Install it inside the running QEMU (or on device):
```bash
okama-cli install /path/to/demo.ok
okama-cli list
okama-cli run com.okamalabs.demo
```

### 7. Run tests

```bash
make naming-check     # verify no "akama" misspelling
make memory-test      # RAM budget check (run inside QEMU or on device)
make controller-test  # enumerate controllers and stream events
```

---

## Host Development (no Buildroot)

All `okama-*` tools are plain Python 3 scripts. You can run them on any Linux
host with Python 3.10+:

```bash
export PYTHONPATH=$PWD/usr/lib/okamaos
export OKAMA_CONF=$PWD/board/okamaos/rootfs-overlay/etc/okamaos/okama.conf

./usr/bin/okama-cli status
./usr/bin/okama-pack build games/demo --output /tmp/demo.ok
./usr/bin/okama-pack verify /tmp/demo.ok
```

Run the shell in a window (host, requires pygame):
```bash
pip install pygame
PYTHONPATH=$PWD/usr/lib/okamaos ./usr/bin/okama-shell --windowed
```

Run the demo game in a window:
```bash
pip install pygame
cd games/demo
PYTHONPATH=$PWD/../../usr/lib/okamaos python3 main.py --windowed
```

---

## Flashing to Hardware

```bash
make okamaos-build
tools/flash-image.sh output/images/rootfs.ext4 /dev/sdX
```

Replace `/dev/sdX` with your target USB drive or SSD. The script prompts for
confirmation before writing.

**Warning:** this overwrites the entire device. Use `lsblk` to confirm the
correct device before running.

For production: use the hybrid ISO (v1 target) which supports both USB boot
and CDROM boot without additional setup.

## Installing to a Hard Drive

`okama-install` is included in the live root filesystem. It installs the running
OkamaOS system to a whole disk and sets up a legacy BIOS Extlinux bootloader.

From a live boot in developer mode:

```bash
okama-install --list-disks
okama-install --target /dev/sdX --dry-run
okama-install --target /dev/sdX
```

Replace `/dev/sdX` with the target disk. The installer refuses the current root
disk, refuses mounted target disks, and requires typing `ERASE /dev/sdX` before
partitioning. See `docs/hard-drive-installer.md` for QEMU install testing and
boot-mode details.

---

## Makefile Reference

| Target               | Description                                         |
|----------------------|-----------------------------------------------------|
| `make setup`         | Clone Buildroot into `./buildroot`                  |
| `make buildroot`     | Configure Buildroot with OkamaOS defconfig          |
| `make okamaos-build` | Full build: kernel + rootfs + userland              |
| `make okamaos-run-qemu` | Boot latest image in QEMU                       |
| `make okamaos-clean` | Clean Buildroot output and `./build`               |
| `make package-demo`  | Build `games/demo` → `build/demo.ok`               |
| `make memory-test`   | Run `tools/measure-memory.sh`                      |
| `make controller-test` | Run `tools/controller-test.sh`                  |
| `make naming-check`  | Fail if `akama` misspelling found anywhere          |

---

## Troubleshooting

### Buildroot fails with missing host tool

```bash
apt install <missing package>
make -C buildroot O=output
```

### QEMU: no display / black screen

Try adding `-vga virtio` or `-vga std` to the QEMU flags:
```bash
QEMU_FLAGS="-vga virtio" make okamaos-run-qemu
```

Or set SDL video driver for the shell:
```bash
# Inside QEMU shell:
SDL_VIDEODRIVER=fbcon okama-shell
# or:
SDL_VIDEODRIVER=x11 DISPLAY=:0 okama-shell --windowed
```

### okama-shell: pygame not found

pygame is not installed as a host package by default.
- In Buildroot: `BR2_PACKAGE_PYTHON_PYGAME=y` in the defconfig (already set)
- On host: `pip install pygame`

### naming-check fails

```bash
make naming-check
# Shows file:line where "akama" appears
# Fix: replace with "OkamaOS" / "OkamaLabs" / "okama-*" as appropriate
```

### Controller not detected

```bash
ls /dev/input/event*
# Should show at least one device when controller is plugged in
okama-inputd --test
# Should print events when buttons are pressed
```

If no events appear, check kernel HID modules:
```bash
lsmod | grep hid
lsmod | grep xpad
modprobe xpad      # Xbox controllers
modprobe hid_sony  # PlayStation controllers
```
