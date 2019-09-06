---
title: sed
classes: wide
sidebar:
  nav: "memos"
permalink: /sed/
---

# sed: The Stream Editor

## References
- http://www.grymoire.com/Unix/Sed.html#uh-0

sed replaces bits of regular expressions in a file with another expression.
Vim does search and replace with sed syntax.
- `s`: search/substitute
- `g` : global / replace everywhere

**Format**:
`sed "s/pattern-find/pattern-replace/g"  filename`

### Erase comments and blank lines in file

erase all comment lines in file
erase all blank lines in a document
- `.` : regular expression for any number of previous character
- `*` : wildcard matches anything

`sed "s/#.*//g`
`sed "s/\s*#.*//g; /^$/ d" .copyfiles"`

### Prepend text to a file

Use `sed -i` (inline) to replace the first line of a file w/o redirecting
output to another location.

`sed -i '1s/^/text to add\n/' file1`


**NOTICE: the `-i` option is a GNU option and won't work on Macs or BSD computers**

To use the `-i` flag on macOS, install `gnu-sed`:
```sh
brew install gnu-sed
echo -e 'PATH="/usr/local/opt/gnu-sed/libexec/gnubin:$PATH"' >> ~/.bashrc
```

Then, you can easily execute `ex` commands on files:

```sh
gsed -i "3iI'm inserting text on line 3!" FILE
```

Alternative, use `ibu` option to create copy with `bu` appended:
```sh
sed -ibu 's/FILE/file/' file
```
(Thanks https://www.commandlinefu.com/commands/view/8714/prepend-a-text-to-a-file )

Making a bash function out of it:

```sh
prepend () {
        array=("@");
        len=${#array[@]};
        file=${array[$len-1]};
        text=${array[@]:0:$len-1};
        printf '%s\n' 0a "$text" . w | ed -s "$file";
}
```
## Operating on multiple files

If you need to do something on a whole bunch of files, you should use a for loop to iterate through the files.

```sh
# put an author tag to some markdown files
for i in *.md; do
    sed -i "2iAuthor: Cameron" $i
done
```
