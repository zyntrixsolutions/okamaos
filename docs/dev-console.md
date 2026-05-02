# Dev Console Manual

The Dev Console is the built-in maintenance terminal inside the OkamaOS shell.
It is meant for setup, recovery, package installs, update checks, disk install
work, and support diagnostics.

## Open and Exit

- Press F10 from the shell to open Dev Console.
- Type `help` for built-in help.
- Type `clear` to clear the console history.
- Type `exit` to close the persistent shell and return to Settings.
- Press B, Start, or Esc to go back.
- Use Up and Down to recall previous commands.

The console runs a persistent `/bin/sh` session. Commands keep their current
directory and environment until you type `exit` or the shell closes.

## Built-In Console Commands

These are handled by the shell UI before the command is sent to `/bin/sh`:

```bash
help
clear
exit
```

`help` shows the short on-device reminder:

```text
Persistent /bin/sh session. Commands keep cwd and env.
Commands: exit, clear, help, reboot, poweroff, ip, ps, df, ls, cat <file>
Use Up/Down to recall previous commands.
```

## Good First Commands

Use these when diagnosing a system:

```bash
okama-cli status
okama-cli list
okama-update check
ip addr
ip route
df -h
mount
ps
ls /var/okamaos
ls /var/okamaos/logs
cat /etc/okamaos/okama.conf
```

## Network Checks

```bash
ip addr
ip route
okama-update check
cat /etc/resolv.conf
```

If wired networking is present but the UI looks stale, compare Settings with
`ip addr` and `okama-update check`.

## Bluetooth and Controller Checks

```bash
okama-cli bluetooth status
okama-cli bluetooth scan
okama-cli bluetooth pair <mac>
okama-cli bluetooth trust <mac>
okama-cli bluetooth connect <mac>
okama-cli controllers list
okama-cli controllers test
ls /dev/input
ps | grep okama-inputd
```

## Game Package Checks

```bash
okama-cli list
okama-cli verify /media/USB/game.ok
okama-cli install /media/USB/game.ok
okama-cli run com.publisher.game
ls /var/okamaos/games
ls /var/okamaos/saves
ls /var/okamaos/logs
```

Crash logs are written under `/var/okamaos/logs` when a game exits with an
error.

## Update Checks

```bash
okama-update check
okama-update apply --dry-run /var/okamaos/updates/downloads/update.okupdate
okama-update apply /var/okamaos/updates/downloads/update.okupdate
okama-update rollback
```

Always dry-run local update bundles first when you are not sure where they came
from.

## Disk and Persistence Commands

Disk commands can erase data. Use these carefully:

```bash
okama-install --list-disks
okama-install --target /dev/sdX --dry-run
okama-install --target /dev/sdX --yes
okama-install --make-persistence /dev/sdXN --dry-run
okama-install --make-persistence /dev/sdXN --yes
okama-install --persistence-status
```

Do not guess disk names. Run `okama-install --list-disks` and confirm the model
and size.

## Creator Commands

```bash
okama-agent template list
okama-agent new-game
okama-agent auto-pack ./my-game --output my-game.ok --bundle
okama-pack build ./my-game --output my-game.ok
okama-pack inspect my-game.ok
okama-pack verify my-game.ok
```

Most creators should use Okama Studio first, then use these commands when they
need local packaging or debugging.

## Safety Notes

- `poweroff` and `reboot` act immediately.
- `okama-install --target ... --yes` erases the selected disk.
- `okama-install --make-persistence ... --yes` formats the selected partition.
- Avoid `dd`, `mkfs`, and recursive delete commands unless you know exactly
  what target you are changing.
- Preserve `/var/okamaos/games`, `/var/okamaos/saves`, and
  `/var/okamaos/updates` when collecting support data.
