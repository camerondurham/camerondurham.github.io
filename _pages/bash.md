---
title: bash
classes: wide
sidebar:
  nav: "memos"
permalink: /bash/
---

## Conditionals

- Numerical operators `-eq`, `-ne`

```sh
# Checking if variable ≡ 2 print "yes"
if [ $varname -eq 2 ]; then echo "yes"; fi

# Checking if variable ≠ 1 print "yes"
if [ $youngone -ne 1 ]; then echo "yes"; fi

```

- Logical Not `!`

To negate an expression: ` ! expression `
OR
` [ ! expression ] `

_Example:_
```sh
if [ ! $var1 -ne $var2 ]; then echo "$var1 ≠ $var2"; fi


- Filetype operator `-f`

```sh
# Print "File" if filename is a file (not directory)
if [ -f $filename ]; then echo "File"; fi
```


## Expansion

Using the `$` character introduces _parameter_ expansion, _command_
substitution, or _arithmetic_ expansion.
- Parameter Expansion
- Arithmetic Expansion - evaluates as numbers not strings
- Brace Expansion - allows you to generate arbitrary strings (similar to
  pathname expansion)
- Command Substitution - allows command output to replace command name


| `bash`                       | Result                                                                                          |
| -----                        | -----                                                                                           |
| `${parameter}`               | value of `parameter` is substituted                                                             |
| `${parameter:offset:length}` | **Substring** expansion expands up to `length` (default EOS) of characters starting at `offset` |
| `$(( expr ))`                | evaluates `expr` as a math expression                                                           |
| `$(command)`                 | executes `command` in subshell and replaces in stdout of command                                |

Examples: `echo $(cat file)` or the faster `$(< file)`

## Data Structures

### Arrays
Ordered collections of objects.

Arrays: `Array=()`

- appending items to an array

```sh
arr=()
arr+=('DJ Khaled')
arr+=('Another One!')
```

## Command Line Arguments
You can use `$<number>` to access command line arguments and `$#`
to access the number of arguments given. Of course, the shell
script you're in is the _zero-th_ argument.

_Example:_

```sh
#!/bin/bash
# checks that user entered 2 args
if [ $# -ne 2 ]
then
	# complain and quit
	echo "Usage: $0 arg1 arg2"
	exit 1
fi
```


## Specific Command

  - Delete all files except certain file types
     - <https://stackoverflow.com/questions/4325216/remove-all-files-except-some-from-a-directory%20>
    - `find $delpath ! -name '*.cpp' ! -name '*.h' -type f -exec rm -f {} +`

  -  Testing return value of find function
    if find . -name 'abc' -type f -exec grep -q xyz {} +
    then : All invocations of grep found at least one xyz and nothing else failed
    else : One or more invocations of grep failed to find xyz or something else failed
    fi

  -  Delete files older than x Days *Command syntax*
    -  =find /path/to/files* -mtime +5 -exec rm {} \;=
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
   for target in "${arr[@]}"; do
      if [[ $filename == "$target.pdf" ]] then
         echo "found target $target"
      fi
   done
done

```
## Check if device is mounted

```sh
device="/mnt/backup-drive"
if [ $( mount | grep -c $device ) != 1 ]; then
	echo "Device not mounted!"
else
	echo "Device mounted!"
fi
```

## Reading from a a file and printing
```sh
file="./wiki/bash/install_dotfiles.sh"
while IFS= read line
do
    # display or do something with $line
    echo "$line"
done <"$file"
```

## Copying file and renaming into folder
- read filenames from file
- copy files into `list.txt` folders

```sh
#!/bin/bash
# Script for grading CS104 files since their python script wasn't working for me
input="./../list.txt"
hw=8
while IFS= read -r username
do
    report="GR${hw}_hw-$username.md"
    echo "Copying file $report and moving to folder $username"
    cp "GR${hw}_hw-username.md" "$report"
    mv "$report" "./$username"
done < "$input"
```

## Replace Spaces with Underscores in Dir's Filenames

```sh
for f in *;do mv "$f" "${f// /_}";done
```

## Random Values

`/dev/urandom`				used to generate random values cryptographic security
` echo $RANDOM`				generates random number from **0** => **16* * **(2^31 - 1)**
`echo $(( 1 + RANDOM % 100 ))`		get random number between 1 -> 100



      *print folder names*
```bash
for filename in /home/cam/*; do
   echo $filename
done
```
   - `if`, `else` and conditionals:
      - strings `[[STRING == STRING]]`
      - numbers `[[NUM -eq NUM]]`
## xargs

- doesn't read bash alias
- reads independent scripts

-----------------

