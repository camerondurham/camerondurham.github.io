---
title: a brief guide to arch linux
sidebar:
  nav: "wiki"
permalink: /arch/
---

# Arch Linux Notes

## Auto Mounting
`autofs` provides automounting of removable media or network shares
when they're inserted or accessed. The _package_ is ~3.5MB, so an alternative
is preferable but that's a TODO!

To add, remove, or edit a device, edit the file `/etc/autofs/auto.misc`.

For example, this is my file currently:

```
# This is an automounter map and it has the following format
# key [ -mount-options-separated-by-comma ] location

cd		-fstype=iso9660,ro,nosuid,nodev	:/dev/cdrom

# mounts my SD card to backup-data

removable	-fstype=ext2		:/mnt/backup-data

```

### DCron
Using `dcron` from the AUR for cron jobs and still trying to make it work 😢.

`sudo crontab -e` opens the file to add crontabs

```
# crontab format
* * * * *  command_to_execute
- - - - -
| | | | |
| | | | +- day of week (0 - 7) (where sunday is 0 and 7)
| | | +--- month (1 - 12)
| | +----- day (1 - 31)
| +------- hour (0 - 23)
+--------- minute (0 - 59)
```

```sh
# example entries
# every 15 min
*/15 * * * * /home/user/command.sh

# every midnight
0 0 * * * /home/user/command.sh

# every Saturday at 8:05 AM
5 8 * * 6 /home/user/command.sh

```

### VPN

See for more information: [Private Internet Access - ArchLinux Wiki](https://wiki.archlinux.org/index.php/Private_Internet_Access#OpenVPN_command_line_approach)

Currently using _PIA_

Installation on Arch Linux: https://www.privateinternetaccess.com/pages/download

Instructions:
1. Download the linux install script ( `pia-linux-1.1.1-02545.run` as of Sat 18 May 2019 )
2. Run the script
sh <script name>
3. Log in with your credentials

### Check Kernel Version

[See Linux](/Linux.md)

### Backlight & Brightness

Setting backlight is normally done using the `xbacklight` utility in Linux systems.
However, there are issues when working with the i3 windows manager `i3wm`.

Currently, the **Arch Linux** package `light` works to manage this and wrap the lower level system
configurations.

**Setting Keybindings**
`i3wm.config`
-----
```sh
#Screen brightness controls
bindsym XF86MonBrightnessUp exec
light -A 5 # increase screen brightness

bindsym XF86MonBrightnessDown exec
light -U 5 # decrease screen brightness

```

### Configuring Bluetooth Devices - CLI

- Start `bluetooth.service` systemd unit
`sudo systemctl start bluetooth.service`
Note: enabling is not a good idea since you don't always bluetooth on startup

- Start CLI: `bluetoothctl`

```bash
bluetoothctl
[bluetooth]# power on
[bluetooth]# agent on
[bluetooth]# scan on
```
- Put headset in pairing mode
```bash
[NEW] Device 40:EF:6D:03:26 JLabs LB2929
```
- initiate pairing
```bash
[bluetooth]# pair 40:EF:6D:03:26
```
- connect after pairing (not sure every time??)
```bash
[bluetooth]# connect 40:EF:6D:03:26
```
- If getting a connect error `org.bluez.Error.Failed`, kill PulseAudio daemon
```bash
pulseaudio -k
[bluetooth]# connect 40:EF:6D:03:26
```
- after connecting, disable scanning:
```bash
[bluetooth]# scan off
[bluetooth]# exit


### Setting up auto connection
Add the following lines to `/etc/pulse/default.pa`
```bash
/etc/pulse/default.pa
-------------------------------------------------
# automatically switch to newly-connected devices
load-module module-switch-on-connect
```

By default, Bluetooth adapter won't power on after reboot.

Workaround:
```bash
/etc/bluetooth/main.conf
-------------------------------------------------
[Policy]
AutoEnable=true
```

##  Time

Set time when connecting to new network

```sh
/etc/NetworkManager/dispatcher.d/09-timezone
------------------------------------------------
#!/bin/sh
case "$2" in
  up)
      timedatectl set-timezone "$(curl --fail https://ipapi.co/timezone)"
  ;;
esac
```



