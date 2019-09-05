---
title: a simple guide to linux
sidebar:
  nav: "wiki"
permalink: /linux/
---

## Startup Files

Unix programs use configuration files to help control the user's environment.
These files commonly have the suffix _rc_ in their filename, which means _resource configuration_.

- `.bash_profile` runs on login

- `.bashrc` runs when making new terminal

`.profile` : Profile file. Runs on login
- add scripts and subdirectories to $PATH
- **Note:** keep all profiles together in `.profile`:
	- zprofile
	- bash_profile
	- ...
- in **bash profile**:
	- add environment variables
	- add program/script names
	- start graphical environment
	- load keyboard shortcuts

### Adding file paths to `$PATH`
```sh
PATH=$PATH:~/path/to/file
PATH=~/path/to/file:$PATH
```

## Important Directories

`/bin`
- Essential Unix commands, such as _ls_ and _man_

`/usr/bin`
- Other commands; separation between `/bin` and `/usr/bin` is arbitrary.

`/sbin`
- Common commands used by the superuser for system administration

`/usr/sbin`
- Commands used less often by the superuser

`/boot`
- Location where kernel and other files used for booting are stored

`/etc`
- Files used by subsystems (i.e. networking, NFS, mail). Usually contain tables of network services, disks to mount, so on.
- Configuration files for system programs

`/var`
- Administrative files (i.e. log files)

`/var/spool`
- Temp storage for files being printed, sent by UUCP, ...

`/usr/lib`
- Standard libraries, such as `libc.a`. When you link a program, the linker always searches here for libraries specified in `-l` option

`/usr/lib/X11`
- The X Window System distribution. Contains libraries by X clients, as well as fonts, sample resource files, and other important parts of the X package.

`/usr/include`
- Standard location files of C-program `#include`'s, such as `<stdio.h>`

`/usr/src`
- Location of sources to programs built on the system

`/usr/local`
- Programs and datafiles added locally by the system administrator

`/etc/skel`
- Sample startup files you can place in home directories for new users

`/dev`
- Location of __device files__, the interface between file system and the hardware.
_Examples:_
`/dev/bus`  ⇒   USB devices
`/dev/ttyACM0`  ⇒  Arduino device
`/dev/stdout` ⇒  Exactly what you think
`/dev/stderr`  ⇒  Exactly what you think
`/dev/stdin` ⇒  Exactly what you think

`/proc`
- Just like, `/dev` is the filesystem ↔ hardware interface, `/proc` is the filesystem ↔ **running process**, **CPU**, **memory** interface
- "Files" here represent _virtual_ files (they're just generated on the fly when viewed) togive information about certain processes, CPU state & configuration, etc

`/opt`
- Often used for larger software packages (`/opt/firefox`, `/opt/google`, `/opt/maven`)

### /dev


**Random Values**:

`/dev/urandom`				used to generate random values for cryptographic security
` echo $RANDOM`				generates random number from **0** => **16* * **(2^31 - 1)**
`echo $(( 1 + RANDOM % 100 ))`		get random number between 1 -> 100


## Suckless Programs
- minimal program
- no typical config file (`.sucklessrc`)
- rebuild the package and recompile program to create new file
    - vim autocommand to automate the process
```vim
" Recompile suckless programs automatically
    autocmd BufWritePost  config.h, config.def.h !sudo make install
```

### About `/dev/null`

What is `/dev/null`?
It's a **null device** in Unix systems. It's the **bit bucket** or **black
hole** since it immediately discards anything written into it and only returns
an `EOF` when read.

It gives us an exit status of the last command.

**Exit status**:
0       if OK
1       if minor problems
2       if serious trouble (can't access command-line argument)

For example:
```sh
$ ls
<file>
$ echo $?
0
```
With an invalid command:

```sh
$ ls  -0
ls: illegal option -- 0
...
$ echo $?
1
```

For standard bash scripts, we don't want the error message printed. Instead, we
will suppress error messages by piping them to `/dev/null`.

```sh
$ ls -0 > /dev/null 2>&1
$ echo $?
1
```

### Speed up Bash

**Know what Bash-isms are**

TODO
- [ ] Link `bash` to `dash` to speed up system

## Check Kernel Version
```sh
# check your kernel version
$ uname -r
5.0.13-arch1-1-ARCH
```

What do the numbers mean?
- `4.` - kernel version
- `0.` - major revision
- `13.` - minor revision
- `arch1-1` - bug fix (?)
- `ARCH` - distribution specific



## Definitions

### POSIX
The **Portable Operating System Interface (POSIX)** defines standards by the
_IEEE Computer Society_ for maintaining compatibility between operating
systems.

POSIX-certified operating systems include
- macOS
- Solaris
- EulerOS (Huiwei)
- other ones I've not heard of


POSIX-compliant operating systems include
- Linux (most distributions)
- OpenBSD
- Darwin(core of OS X/macOS and iOS)
- FreeBSD
- LynxOS
- Cygwin (for windows)
- ...

