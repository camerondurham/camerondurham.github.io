---
title: utils
classes: wide
sidebar:
  nav: "memos"
permalink: /utils/
---

Utilities in Unix/Linux Systems and how to use them

- [7z](#7z): 7zip is the standard for compression at Oracle
- [awk](#awk): AWK is a programming language tool used to manipulate text
- chown: changes file or group ownership
- cmp: compares files of any type and writes results to stdout
- cpio: copies files into or out of a cpio or tar archive
- [cron](#cron): executes a program at a preset time

- declare: states variables, gives them attributes or modifies the properties
  of variables

- df: displays amount of disk space available on the file system containing
  each file name argument. Without a file name, df shows available space on all
  currently mounted file systems

- ed: basic editor allowing commandline insertion of text

- enable: stops or starts printers and classes
- env: runs a program in a modified environment or displays current environment
  and its variables

- eval: analyzes several arguments and concatinates them into a single command
  and reports on the argument's status
- egrep: POSIX designed _extended_ grep
- free: see total amount of free and used physical memory and swap space on
  system, as well as buffers and cache used by the kernel

- [grep](#grep): searches for files for a given char string or pattern and can
  replace them with another

- history: shows all commands used since the start of the current session

- ifup: configure network interface and enable network connections

- ifdown: shuts down network interface and disables a network connection

- iptables: allows or blocks traffic on a Linux host and can prevent certain
  applications from receiving or transmitting a request

- [mkdir](#mkdir): make a directory with many configurations

- [nslookup](#nslookup): user can enter host name and find corresponding IP address, can also help find host name
- [ngrok](#ngrok): tunnel a local port to the internet for local development
- wc: count lines in a document

## Script Syntax
-  Delete all files except certain file types <https://stackoverflow.com/questions/4325216/remove-all-files-except-some-from-a-directory%20>

`find $delpath ! -name '*.cpp' ! -name '*.h' -type f -exec rm -f {} +`

-  Testing return value of find function
if find . -name 'abc' -type f -exec grep -q xyz {} +
then : All invocations of grep found at least one xyz and nothing else failed
else : One or more invocations of grep failed to find xyz or something else failed
fi

-  Delete files older than x days *Command syntax*
-  `find /path/to/files* -mtime +5 -exec rm {} \;`
    -  cmd: find
    -  path to files
    -  specify with mtime deleting files /older/ than *5* days
    -  exec allows you to pass rm

•  Basic enabling script
•  chmod +x script.sh
•  Links to look at...
• https://bbs.archlinux.org/viewtopic.php?id%3D56646 — Arch Linux Handy Cmd Line Scripts

- for loops and arrays:
  - **iterators**:
     - `"${arrayName[@]}"  - all elements, space separated
```sh
arr = ("hello" "world")
for i in "${arr[@]}"; do
	echo $i
done
```
   - iterate over files and filenames
      *print files*
```sh
arr=("hw1" "hw2" "comics")
for filename in /home/cam/Downloads/*.pdf; do
   echo $filename
   for [target](target) in "${arr[@]}"; do
      if [[ $filename == "$target.pdf" ]] then
         echo "found target $target"
      fi
   done
done
```

## Information

### date

Get current date:
```sh
$ date
Fri 17 May 2019 11:24:13 PM PDT
```

Get date specified by string:

```sh
$ date -d "1 day ago"
Thu 16 May 2019 11:32:13 PM PDT
$ date -d "10 days ago"
Tue 07 May 2019 11:32:37 PM PDT
```

Get last modified date of file: (`-r, --reference=FILE` displays last modification time of FILE)
```sh
$ date -r larbs.sh
Thu 09 May 2019 04:48:02 AM PDT
$ date -r larbs.sh -R
Thu, 09 May 2019 04:48:02 -0700
$ date -r larbs.sh -u
Thu 09 May 2019 11:48:02 AM UTC
$ date -r larbs.sh +%s
1557402482
```



## Compression


### tar - archiving

GNU 'tar' creates and manipulates "archives". The name "tar" comes from **T**ape **AR**chive,
but you don't _have_ to use tapes these days ☺.

#### Commands
Official syntax:
`tar {A|c|d|r|t|u|x}[GnSkUWOmpsMBiajJzZhPlRvwo] [ARGS..]`

General format:

`tar functionoptions files...`

_short-option style:_
`tar -cvf etc.tar /etc` === `tar -c -v -f etc.tar /etc`

_long-option style:_
`tar --create --file etc.tar --verbose /etc` === `tar --cre --file=etc.tar --verb /etc`

#### tar operations

Basic commands

flag | description
---- | ----
`c` | create new archive
`u` | update, **append** newer files newer (same as `-c`, `-r` options)
`x` | extract files from archive
`t` | list conten**t**s



Compression & File Selection Options

flag | description
---- | ----
`a` | (auto compress) select compression with suffix
`z` | filter archive through `gzip`
`Z` | filter archive through `compress`
`N`, `--newer=DATE` | only store files newer than `DATE`
`--exclude=PATTERN` | exclude files matching `PATTERN`

_Examples:_
```sh
# archive abc def hij and random.txt
tar cf backup.tar abc def hij random.txt

# archive all files in current directory
tar cf backup.tar *


# archive all files in folder using gzip compression
tar cfz backup.gz *

# un-archive files from backup.tar into current folder
tar xvf backup.tar

# un-archive all files in folder using gzip compression
tar xcfz backup.gz *
```


### zip
- Basic usage
**Note:** `zip` makes it easier to add new files to an existing zipped file.

```sh
zip SmallFile.zip Big@SSFile.csv
zip -r Project.zip JavaProjFolder
# Add a new file to .zip file
zip Already.zip NewFile.java
```

- Command format
`zip options archive inpath inpath inpath ...`

A couple notes: `archive` is an existing `zip` file and `inpath` is a
directory or file path optionally including wildcards. Given an existing
`zip` archive, `zip` will replace identically named entries.


- Command modes: **external** and **internal**

flag | description | type
---- | ---- | ----
`add` | update and add new files (**default**) | **external**
`update` | update if newer and add new files | **external**
`freshen`, (`-f`) | update existing if newer, doesn't add new files to archive | **external**
`delete`,(`-d`) | select entries in archive and delete | **internal**
`copy`, (`-U`) | selects entries and copies to new archive | **internal**



- Encrypted Files

`zip --encrypt -r secure.zip /folder/ `
`zip --encrypt secure.zip file1 file2 ...`
`unzip -P password secure.zip`


### unzip
- Basic usage

```sh
unzip File.zip
unzip Folder.zip -d UnzippedFolder
```

- Command format

`unzip file[.zip] [files(s) ...] [-x excludedfile(x)] [-d exdir]`

- Options

flag | description
----- | ------
`c` | extract file to screen ("CRT")
`f` | freshen existing files that already exist on disk
`l` | list files in short format

_Examples:_
```sh
# Add files abc def hij random.txt to zip file
zip files.zip abc def hij random.txt

# Add new file to files.zip
zip files.zip newfile

# Extract all files into current folder
unzip files.zip

# Extract all files into new folder "partial-alphabet"
unzip files.zip -d partial-alphabet
```

## Useful Commands

### Print the number of lines with a given length in a file

```sh
awk '{count[length]++}END{for(i in count){printf("%d: %d\n", count[i], i)}}' <FILENAME>
```

### Backup

**Create a quick backup copy of a file**
Uses shell expansion to create a back-up called `.vimrc.bak`

`cp .vimrc{,.bak}`

### Execute a command at a given time
`echo "ls -l" | at midnight`

### Combine PDFs
*assuming that* `pdfunite` is installed with poppler:
`pdfunite *.pdf out.pdf`


**Random Text Generators**
 Must be limited by another command or it will generate infinite text.
```sh
tr -dc a-z1-4 </dev/urandom | tr 1-2 ' \n' | awk 'length==0 || length>50' | tr
3-4 ' ' | sed 's/^ *//' | cat -s | fmt
```

**Shell Script to Generate Random Text Block**
`tr` translates to input from `/dev/urandom` to printable ASCII characters. Other options include:
`[:digits:]`, `[:alpha:]`, and `[:alnum:]`. Which are exactly what they sound like. See `man tr` for more.

```sh

 head --lines=90 /dev/urandom | tr -cd '[:print:]' | fold -w 79 > file

```

My command line script to make exactly `x` lines.

Usage: `rand [number of lines] [file.output]`

```sh
val=$(( $1  + 1 )) &&  head -$(( $1 * 2 )) /dev/urandom | tr -cd '[:alpha:]' | fold -w 80 > $2 | mod $2 "${val},$ d"
```

--------


**Print folder names**

```sh
for filename in /home/cam/*; do
   echo $filename
done
```
   - `if`, `else` and conditionals:
      - strings `[[STRING == STRING]]`
      - numbers `[[NUM -eq NUM]]`

--------

**Sort Part of a File**

_Example: sorting lines 2 → EOF of file_ `index.md`

```sh
head -1 index.md > index | cat index.md | tail +2 | sort >> index && mv index index.md
```
_sort lines from_ `begin` → `end` of file `filename`

```sh
# begin = $1, end = $2, file = $3
head -$(($1 - 1)) "$3">> temp_file && tail +"$1" "$3" | head -$(( $2 - $1+ 1)) | sort >> temp_file && tail +$(($2 + 1)) "$3">> temp_file && mv temp_file "$3"
```

--------



### wc

Count lines in a document and other stuff.

Syntax: `wc -l <filename>`


```sh
# in another folder
$ wc -l < /dir/path/file.md

# piping data
$ cat /dir/path/file.md | wc -l

# urls
$ curl yahoo.com --silent | wc -l

```

### awk

Basic command syntax:

`awk [options] -f file ...`

Really basic commands:

```sh
# simply print file's contents
awk '{print}' file.txt

# run command from awk file on another file
awk -f command.awk file.txt
```

More advanced examples:

Print by columns:

Use `$0` to refer to the whole line.

Use `$n` (n > 0) to refer to a space separated column in the line. If no such line exists, then awk will print a blank line.

```sh
# pass in variable to awk command
#   Output: Name = Liam
awk -v name=Liam 'BEGIN{printf "Name = %s\n", name}'

# only print lines matching /<REGEX>/
awk '/<REGEX>/ {print $0}' file.txt

# prints lines containing 90
awk '/90/ {print $0}' file.txt
```

Another more complex, though contrived  example of using awk with other commands:

Grab the filenames of all the undo files (they have the extension `.un~`):

```sh
# the 9th column of la -la is the filename
ls -la | awk '/(\.un~)/ {print $9}
```

Or, something I actually used to get the names of all symlinked files in my directory:

```sh
ls -lA | grep ^l | awk '{print $9}'
```

### cron

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
### mkidr

```sh
# make directory
mkdir folder

# make array of 50 folders
mkdir sda{1..50}

# make directory structure with subfolders
mkdir -p sda{1..50}/dev{1..50}

# make 26 letter-labeled directories (on LINUX based systems only)
mkdir {a-z}12345

```

### nslookup
    - used for querying DNS to obtian IP addresses, mapping, or specific DNS records
    - **find the IP address of a host**:
        - `nslookup optprime.dev`
    - **Find the IP address to a domain name**:
        - `nslookup -querytype=mx domain-name`
    - **Find DNS for mail server**:
        - `nslookup -query=ms usc.edu`


### grep


Search for all the CS104 students needlessly importing everything into their programs
`grep "using namespace std" ./*/*.h`

The general pattern:
```sh
grep "text-pattern" /directory/to/search
```

**Flags**
- `v` inverts pattern selection, used often with `vE` for extended grep mode
- `E` turns `grep` into `egrep`


- count matches:
```sh
grep -c "pattern" /directory/to/search
```

- grep (**PDF**) pdfgrep:
_Examples_
`find /path -iname '*.pdf' -exec pdfgrep pattern {}`
`pdfgrep 'pattern' file.pdf`





###  stty


stty [options]  [modes] [Options: -a, --all -F dev, --device=dev -g, --save --help --version]

Set terminal I/O options for the current standard input device. Without options, stty reports the terminal settings that differ from those set by running stty sane, where ^ indicates the Ctrl key and `^` indicates a null value. Most modes can be negated using an optional - (shown in brackets). The corresponding description is also shown in brackets. Some arguments use non-POSIX extensions; these are marked with *.

   - Bash How To
      - <http://tldp.org/HOWTO/Bash-Prog-Intro-HOWTO.html#toc>


- Download options for video
` youtube-dl -F <video-url> `

- Download video in format
` youtube-dl -f <format code> <video-url>`
- downloading a playlist with start and end index
- `youtube-dl -i -f mp4 --yes-playlist --playlist-items <ITEMS>
	- ITEMS: start-end **or** idx1, idx2, ...

- `youtube-dl -i -f mp4 --yes-playlist --playlist-start <NUMBER>

- downloading a playlist `youtube-dl -i -f mp4 --yes-playlist
'https://www.youtube.com/watch?v=7Vy8970q0Xc&list=PLwJ2VKmefmxpUJEGB1ff6yUZ5Zd7Gegn2'
`
## Display : xrandr
run command for Apple Cinema display

xrandr --output HDMI1 --mode 1680x1050 --scale 1.142857x1.0285714 --panning 1680x1050

## File Rename: vidir


## File Rename : vimv
- (using the plugin: thameera/vimv.git)
- $ git clone https://github.com/thameera/vimv.git
- sudo cp vimv/vimv /usr/local/bin/ #Copy binary to the $PATH
- sudo chmod +x /usr/local/bin/vimv

Use:
- go to directory
- execute ` vimv ` command
- edit filenames and ` :wq `

## File Directory `tree`:
```sh
tree
```

## ed editor

__Pronounced "eee-dee"__

Vim inherits many command  structure from the `ed` line editor in Linux. They
both work on _buffers_ and allow users to append, substitute, and dump other
buffers in to the current file.


Commands follow the following structure:

```
[start[,end]]command[parameters]
```

Typing `ed` puts you in command mode in a buffer, just like with vim.

Try the following:

- `ed`
- `a` (append mode)
- This is a simple file.
- One could be studying for finals now.
- But making little tutorials is much more fun.
- `.` (return to command mode)
- `,p` (prints text in the buffer)
- `,s/little/brilliant/`
- `,p`

See how the modes are similar to Vim? Also, the search and replace format is
very similar to Vim's `%s/<pattern>/<replace>/` format. You can see that `,`
takes the place of Vim's `%` to mean all lines in the file.

A useful tool you can make use of later on is pasting command output into a
file directly.

For example, let's add some pretty ASCII Art to the buffer:
- `0r !figlet What the foo?!`
- `,p`


What happened?


`0r [command]` means read output of `[command]` and paste it into the file
before the first line. `!` means to execute the `[command]` using a
subshell, where we call `figlet` to produce some text.

To save the file, it's pretty standard Vim syntax: `w [filename]`. `q` quits
and `Q` quits without saving the buffer.

--------

Using the `ed` editor on GNU systems, you can execute arbitrary ed (similar to
ex) commands on Linux. For example, to prepend some text to a file:

```sh
ed -s file.txt <<< $'0r !echo that was easy'
```
The `0r` means read output of the command into your file after line zero.

Creating a script out of this, for arbitrary multi-line commands, such as
reading `figlet` output into a file:

```
~/.scripts/camtools/mod
-----------------------------
```
```sh
#!/bin/bash
#echo "executing cmd"
ed -s $1 <<EOT
$2
.
w
q
EOT

echo
cat $1

```

To prepend figlet to a file, then substitute all occurences of "Aaron Cote"
with "Aaron the Bald":

```sh
mod file.txt '0r !figlet some text'
mod file.txt '%s/Aaron Cote/Aaron the Bald'
```

## find

Find files modified in the last 30 minutes

```sh
# looking in current directory
find ./ -mmin -30
```

Find files modified in last 5 days
```sh
# looking from root directory
find / -mtime -5
```

## figlet

set output justification:
`$ figlet -c "phrase"`

read input from a file

`$ echo "I wish I could chmod 644 my Girlfriend > girlfriend.txt"`
`figlet -kp < girlfriend.txt`

Make a big clock with hours, minutes and seconds

`watch -tn1 'date +%r | figlet'`

# Network

- `ifconfig` depreciated `net-tools` resource
- `ip addr` used instead
- `ip route | grep default ` : default gateway
- `ip addr show`

- Show current network interface

```sh
route | grep -m1 ^default | awk '{print $NF}'
```

# MariaDB
- immediately go into database
```sh
mysql -u <username> -p<password>
```
# groff

## Exporting docs to pdf
```sh
filename -Tpdf filename >filename.pdf
```


## Pictures
` example equation `
```sh
> .EQ
> a ~ mark = ~ 30
> .EN
> .sp
> .EQ
> a sup 2 ~ + ~ b sup 2~lineup = ~ 1000
> .EN
> .sp
> .EQ
> x sup 3 ~ + ~ y sup 3 ~ + ~ z sup 3~lineup = ~ 1400
> .EN
```

` exporting : ` $ groff -Tps -l -mm -e memoeqn.mm


`  example diagram `
<memopic.mm>
```sh
> .PS
> box invis "Start" "Here"; arrow
> box "Step 1"; arrow
> circle "Step 2"; arrow
> ellipse "Step 3"; arrow
> box "Step 4"; arrow
> box invis "End"
> .PE
```

` exporting : ` $ groff -Tpdf -l -mm -p memopic.mm



# Network Manager

## Examples
- List nearby wifi networks
`nmcli device wifi list`
- Connect to a hidden network
`nmcli device wifi connect SSID password PASSWORD `
- Disconnect from an interface
`nmcli device disconnect ifname eth0`
- Get a list of UUIDs
`nmcli connection show`
- See a list of network devices and their state
`nmcli device`
- Turn off wifi
`nmcli radio wifi off`

## Keeping processes running
- Simplest: `nohup` (logs stdout to `nohup.log`)
```
nohup compute-first-1000-primes &
```
- "Background" an already running task
`ctrl-z`
`bg`
puts most recent suspended task to the background
`disown` keeps process running after you log out


# System Info

## Getting System Info and Making a Module

### Getting memory usage

- `free -h` command to get free memory

example for making module - awk:

` free -h  | awk '/^Mem:/ {print $3 "/" $2} `

### Sensors

`lm_sensors package`
- get tmp on your machine:
`$ sensors`

example getting degrees:
`sensors | awk '/^temp1/ {print$2}' `

###  ps

command showing processes you have and memory/cpu usage

- get process information with short paths, no header
- output to percent memory used

`ps axch ` no output

most memory intense processes, 15 character wide

`ps axch -o cmd15,%mem --sort=-%mem | head`
`ps axch -o cmd15,%cpu --sort=-%cpu | head`

###  Adding to i3blocks

**i3blocks module format**

`config` file:


```sh
[cpu]
command=i3cpu
interval=30
label=💻

[memory]
command=i3mem
interval=30
label=🧠

```

script: `i3mem`


```sh
#!/bin/bash

case $BLOCK_BUTTON in
    1) notify-send "Biggest Memory Moochs:
$(ps axch -o cmd:15,%mem --sort=-%mem | head)" ;;
esac

free -h | awk '/^Mem:/ {print $3 "/" $2}'

```

script: i3cpu



```sh
#!/bin/bash

case $BLOCK_BUTTON in
    1) notify-send "Biggest CPU Moochs:
$(ps axch -o cmd:15,%cpu --sort=-%cpu | head)" ;;
esac

sensors | awk '/^temp1/ {print$2}'
```

### 7z
- `p7zip` package

CLI's:
- 7z
- 7za
- 7zr

_Examples_:

```sh
# add folder or file to archive
$ 7z a basic.7z basic

# extract an archive
$ 7z e basic.7z && ls

# list archive details
$ 7z l basic.7z

# test integrity (compare to target folder)
$ 7z t basic.7z basic

# update existing archive
$ 7z u basic.7z basic

```

[Encryption Question](https://askubuntu.com/questions/928275/7z-command-line-with-highest-encryption-aes-256-encrypting-the-filenames)

Using for more advanced encryption methods to comply with Oracle's document submission policy required reading the manual:

flag (append `-`) | meaning
:----: | :----
`t{Type}` | type of archive (7z, zip, gzip, bzip2, tar) {**default**: `7z`}
`mx={1-9}` | level of compression
`w[path]` | set working directory
`p{Password(optional)}` | set password, prompted if Password isn't given
`o{Directory}` | output directory
`r` | recurse subdirectories
`md={size}` | size of dictionary in `m`:megabytes
`s=[off|on|...]` | sets solid mode **default:** on (see below)


About password mode:
- recommended to **not** include password string
- will not echo into your bash history when prompted

About solid mode:
- `{N}f` - set limit for number of files in one solid block
- `{N}b | {N}k | ...` set limit for associated compression level:
	1. Store - 0B
	2. Fastest - 16MB
	3. Fast - 128MB
	4. Normal - 2GB
	5. Maximum - 4GB
	6. Ultra - 4GB
- Example: `s=100f10m` sets solid mode with 100 files and 10MB limits for one solid block



Note for Linux/Unix users:
- **DO NOT USE** 7z format for backup. 7z doesn't store owner/group of the file.

### ngrok

Simply start a tunnel with the command: `ngrok http <PORT>`

Example:

```sh
ngrok http 4390
```

You should see a status feed like:

```sh
ngrok by @inconshreveable                                               (Ctrl+C to quit)

Session Status                online
Session Expires               7 hours, 33 minutes
Version                       2.3.30
Region                        United States (us)
Web Interface                 http://127.0.0.1:4040
Forwarding                    http://db5493da.ngrok.io -> http://localhost:4390
Forwarding                    https://db5493da.ngrok.io -> http://localhost:4390

Connections                   ttl     opn     rt1     rt5     p50     p90
                              7       0       0.00    0.00    0.00    5.02

HTTP Requests
-------------

GET /                          200 OK

```

View the ngrok console at: [http://127.0.0.1:4040/](http://127.0.0.1:4040/)

