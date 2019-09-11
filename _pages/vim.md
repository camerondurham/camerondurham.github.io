---
title: vim
classes: wide
sidebar:
  nav: "memos"
permalink: /vim/
---

Vim is a text editor that is (IMHO) the ultimate programmer's tool. It's based
off the 30 year old Unix and Linux standard editor, *vi*.

Vim is the leading vi clone.
... it's *vi* _Improved_.


## References:

https://stackoverflow.com/questions/1218390/what-is-your-most-productive-shortcut-with-vim

## Using Help
- Enhanced Help:`:tab help <topic>` open help page in new tab

### Command Help

You can get specific help about commands with `:h <keystroke>`, preceeded by the following 'mode codes':

mode|code|example
:----:|:---:|:----
normal|none|`:h ^R` <C-R> in normal mode
visual|`v_`|`:h v_^R` <C-R> in visual mode
command line command|`:`|`:h :echo` echo command
command line editing|`c_`|`:h c_#` what # represents in commands
vim command argument|`-`|`:h -r` opening vim with `-r` flag
option|`''`|`:h 'nocompatible'` read about `set nocompatible`



### Navigation

- following file links: typing `gf` opens the file path under cursor
- `<enter>` follows any hyperlink

### Links

`[Link](ssh.md)` has the display text `Link` to file in same directory called
`ssh.md`. Pressing `gf` will open this file.

A normal url, such as https://github.com/durhc427 , will automatically be
highlighted and pressing `<enter>` over the link will open the link in your
`$BROWSER`.

## Basics
__Working with files:__
- `:w` : write current buffer to a file
- `:wa` : write all buffers to files
- `:wq` : write and quit current buffer


## Movement
The goal is to move around your text as quickly and precisely as possible using
the minimal number of keystrokes.

### Word Movement

| Keys          | Action                                                               |
| :-----------: | :------------------------------------------------------------------: |
| `^`           | move to the first nonblank character in a line                       |
| `(`,`)`       | move to the beginning/end of the sentence                            |
| `{`,`}`       | move to the beginning/end of the paragraph                           |
| `[[`,`]]`     | move to the beginning/end of the current section (chunk of text)     |
| `t{char}`     | move *unTil* just before next {char}                                 |
| `f{char}`     | move to *Find* the next {char}                                       |
| `/{pattern}`  | searches forward for {pattern}                                       |
| `?{pattern}`  | searches backward for {pattern}                                      |

### Page Movement

Key|Movement
:----:|:----:
`u`|up
`d`|down
`f`|forward
`H`|Home
`M`|Middle
`L`|Last

__Note__: Capitalizing a command usually _reverses_ the search direction. So,
`tc` moves cursor backwards until the first `c` character.

### Scrolling

Keys | Action
---- | ----
`<Ctrl-E>` | Scroll window down in buffer ("Extra lines")
`<Ctrl-D>`   | Scroll window down in buffer half a screen
`<Ctrl-F>`   | Scroll window pages Forward in buffer
`<Ctrl-Y>`    | Scroll window lines upwards in buffer
`<Ctrl-U>`    | Scroll window Upwards in buffer half a screen
`<Ctrl-B>`    | Scroll window pages Backwards in the buffer


## Vim Regex

To search for a pattern, enter normal mode and use `/`. To search a file for "vim", use `/vim`, of course.

You can search by regular expressions with vim regex or in **very magic** mode, which uses a more accepted regular expression syntax. You enter this mode with `\v`.

Matching special characters such as `[]`, `()`, you need to escape them.

`/\v\[String\]` matches: _[String]_

To start where the search matches, use `\zs` and to end search match, use `\ze`.

`/\v\[\zsString\ze\]` matches: [_String_]


## Search and Replace

### Motions

| Keys              | Action                                                 |
| -----             | -----                                                  |
| `{motion}s`       | delete characters and start insert                     |
| `{motion}w`       | delete from current position to beginning of next word |
| `{motion}r{char}` | replace with {char} over {motion}                      |

### Commands (uses sed)


| Description                  | Command                    |
| -----                        | -----                      |
| *Range from l1 to l2*        | `l1,l2 s/search/replace/g` |
| *Search entire file*         | `:%s/search/replace/g`     |
| *Search and confirm replace* | `:%s/search/replace/gc`    |





## Copy Paste

- **disable automatic indenting, etc** before copy/pasting from clipboard
- `:set paste`

- **after pasting**
	`:set nopaste`

## Deleting Text


| Keys | Description |
| ---- | -----       |
| `X`  | delete [count] characters before the cursor
| `D`  | delete characters under cursor until end of liner |
| `dG` | delete all lines to the end of the filer          |

## Changing/Replacing Text
`R` enter insert mode, replacing characters rather than inserting
`~` switch case of char under cursor, move to right


## Inserting a file

`:r[ead] [name]`    - insert the file [name] below the cursor
`:r[ead] !{cmd}`  - execute {cmd} and insert its standard output below cursor

## Ex editor

You can write command scripts in `ex` to be executed on a file.

For example, to replace some common misspellings in a file:
```vim
exscript
-------------------------------------

%s/thier/their/g
%s/writeable/writable/g
wq
```
Then to run it on a file:
```sh
ex -s misspelled < exscript
```

## Formatting

`gq{motion}`    -   format the lines motion moves over
example:
- select text block visually
`v`
- reformat it
`gq`

### Count Items

- To get count information about current visual selection:
`g <C-g>` in visual mode

(more info `:he count-items`)

### Auto Indent
- command: `gg <CR> =G`
	- gg: go to beginning of file
	- G:  go to end of file
	- =: indent
## Workspace

### Windows

To open a window vertically, the mapped command is: `:vsplit`. A horizontal
split is just `:split`, abbreviated `:sp`.

Shortcuts are: `<C-w><C-v>` and `<C-w>v` for vertical split

To resize the current split, you can make it taller/wider with `<C-w> +` or
shorter/slimmer with `<C-w> -`. To make windows equally sized, use `<C-w>=`.

### Tabs
To move the current window to a new tab, hit `<C-W> <S-T>`

## Macros
- To enter a macro: ```q<letter><commands>q```
- To execute macro <number> times: ``` <number>@<letter>```
- Quickstart:
   - *qd* start recoding register *d*
   - ... complex series of commands
   - *q* stop recording
   - * @d * execute macro
   - * @@ * execute again


## Remapping Keys

Useful tools for front end developers?

• view html file in browser
`:!firefox %<CR> nnoremap <C-f> :!firefox %<CR> " browser preview with ctrl-o`

## Open file at location

- **Open at line** `vim +LineNumber filename`
- **Open file and go to function called kissCote** `vim +/kiddCote filename`

## Configuration: the .vimrc

When opening vim, it reads from your config file, usually located in `$HOME/.vimrc`. Optionally, you can specify another config to use with `vim -u <config>`.

Programmers usually tend a certain set of defaults in their `.vimrc`. These issues are addressed in legendary vim-plugin writer [Tim Pope's](github.com/tpope) _sensible_ plugin.
```vim
set nocompatible
syntax on
set hidden
set backspace=indent,eol,start
set autoindent

set shiftwidth=4
let &softtabstop = &shiftwidth
set expandtab " because spaces > tabs
set number
```

### Tabs and Spaces
To tell Vim to use spaces in your `.vimrc`, you can do the following steps:

1.  `:set tabstop=4 ` tab size is 4 spaces
2. `:set {expandtab|noexpandtab}` use spaces/real tabs instead of spaces
3. `:retab!`	replace all tabs with spaces or vice versa

For example, to convert tabs to 4 spaces:
```vim
:set expandtab
:set tabstop=4
:retab
```
Or just:
```vim
:set et ts=4 | retab!
```

# Tips

## Cool edits

```vim
guu	: lowercase line
gUU	: uppercase line
~	: invert case (upper->lower; lower->upper) of current character
gf	: open file name under cursor (SUPER)
ga	: display hex, ascii value of character under cursor
g8	: display hex value of utf-8 character under cursor
ggg?G	: rot13 whole file
```

## SSH Remote Edit

Ref: https://medium.freecodecamp.org/learn-linux-vim-basic-features-19134461ab85

Uses secure connection established by scp provided by openssh-client:

```

vim scp://remoteuser@remote_IP_or_hostname/relative/path/of/file

vim scp://austintraver@172.20.10.7/Desktop/boring_stuff/.GPG_keys


```

To access machine frequently, create a file `~/.ssh/config`:
```sh
Host remote-dev-machine
    Hostname 10.0.18.12
    User dev-john
    IdentityFile ~/.ssh/id_rsa
```


# VimScript

### Statusbar

set status line with ruler

`:set statusline=%<$f\ %h%m%r%=%-14.(%l,%c%V%)\ %P`


flags:
N number
S string
F flag
- n/a
`item`	meaning
`f` S	directory to file in buffer
`F` S	full path to file in buffer
`y` F	type of file in buffer
`n` N	buffer number
`l` N	line number
`c` N	column number
`p` N	percent thru file in lines
`(` -	start of item group, used to set width and alignment of a section, must follow with %)
`)` -	end of item group
`#` -	set highlight group
`*` - set highlight group to user


### Functions

```vim
function! HelloVim()
	echo "HelloVim"
endfunction
```


```vim
function! HelloVim()
	echo "HelloVim"
endfunction
```
#### Using Python in Vimscript

```vim
function! HelloPython()
python << endPython

print("HelloPython")

endPython
endfunction
```

#### Function Arguments

Vimscript functions can take in arguments, of course. However, arguments must
use a variable scope: `a:`.

```vim
function DisplayName(name)
        echom "Hello! "
        echom a:name
        echom "I'm a simple function! "
endfunction
```

**Varargs**

Like Javascript and Python, Vimscript can take in variable-length argument
lists.

Define the function
```vim
:function Varg(...)
:        echom a:0
:        echom:1
:        echo a:000
:endfunction

:call Varg("a","b")
```


--------


### Global Variables



### Current Filename: %

`%`             current filename

See `:h expand()`

Let's say you want to map a shortcut to compile a java file.
You'll need both the filename to do that.
Goal:
```sh
javac MyJavaClass.java && java MyJavaClass
```
You're going to need modifiers to do that.

Modifiers:
        :p    expand to full path (all the way from root)
        :h    head (last path component removed)
        :t    tail (last path component only)
        :r    root (one extension removed)  (_what we need_)
        :e    extension only

_Examples:_
```vim
        :p      /home/cam/vectors.cpp
        :p:.    /cam/vectors.cpp
        :h      cam
        :t      vectors.cpp
        :e      cpp
```

What we need:

```vim
map <leader><leader>j : exec '!javac % && java %:r' <CR>
```

Using `expand` function to expand and obtain values:

```vim
:let file_name = expand('%:t:r')
```

## Special Text


### Digraphs
**Use mapping <C-k>**:
example: `<C-k> + UD` ⇒ `↕`

### Using Multi-byte Encodings in Vim

Let's say you want to make a text document look less...plain. Multi-byte encodings can help you out. If you're using `vim` to write your text (as all programmers should :grin: ), you can use Vim's digraphs to help you out.

Vim uses digraphs to encode non-ASCII characters with simple two key combos.

For example, let's say you want to add a check mark for a to-do list:

```
Cameron's To Do List:

- Hack Austin Traver's computer (Done)
- Buy a MacBook (IMPORTANT!)
```
If you type `<C-k>OK` in vim, you'll get a check mark: ✓

```
Cameron's To Do List:

✓ Hack Austin Traver's computer
★★ Buy a MacBook
```

The command syntax uses:
`\<C-k>{vim digraph}`.

Note that these require that vim was compiled with multibyte support.

To check, type this in your terminal:
`vim -v | grep "multi_byte"`.

1. `+multi_byte` enabled! :smile:
2. `-multi_byte` not enabled :cry:

You can see all multibyte characters if you type `:digraph`.

Here are some useful digraphs:

### Symbols

character | digraph  | hex | dec
:----:|:----:|:----:|:----:
★|*2|2605|9733
☆|*1|2606|9734
✓|OK|2713|10003
✗|XX|2717|10007
▲|UT|25B2|9650
△|uT|25B3|9651
▶|PR|25B6|9654
▷|Tr|25B7|9655
▼|Dt|25BC|9660
▽|dT|25BD|9661
◀|PL|25C0|9664
◁|Tl|25C1|9665
◆|Db|25C6|9670
◇|Dw|25C7|9671
◊|LZ|25CA|9674
○|0m|25CB|9675
◎|0o|25CE|9678
●|0M|25CF|9679


### Some Greek Letters

character | digraph  | hex | dec
:----:|:----:|:----:|:----:
Γ|G*|0393|0915
Δ|D*|0394|0916
Θ|H*|0398|0920
Ι|I*|0399|0921
Π|P*|03A0|0928
Σ|S*|03A3|0931
Υ|U*|03A5|0933
Φ|F*|03A6|0934
Χ|X*|03A7|0935
Ψ|Q*|03A8|0936
Ω|W*|03A9|0937
α|a*|03B1|0945
β|b*|03B2|0946
γ|g*|03B3|0947
δ|d*|03B4|0948
ε|e*|03B5|0949
ζ|z*|03B6|0950
η|y*|03B7|0951
θ|h*|03B8|0952
ι|i*|03B9|0953
κ|k*|03BA|0954
λ|l*|03BB|0955
μ|m*|03BC|0956
ν|n*|03BD|0957
ξ|c*|03BE|0958
ο|o*|03BF|0959
π|p*|03C0|0960
ρ|r*|03C1|0961
ς|*s|03C2|0962
σ|s*|03C3|0963
τ|t*|03C4|0964
φ|f*|03C6|0966
χ|x*|03C7|0967
ψ|q*|03C8|0968



### Some Math Symbols

character | digraph  | hex | dec
:----:|:----:|:----:|:----:
∀|FA|2200|8704
∂|dP|2202|8706
∃|TE|2203|8707
∅|/0|2205|8709
∆|DE|2206|8710
∇|NB|2207|8711
∈|(-|2208|8712
∋|-)|220B|8715
∏|*P|220F|8719
∑|+Z|2211|8721
∗|*-|2217|8727
∘|Ob|2218|8728
∙|Sb|2219|8729
√|RT|221A|8730
∞|00|221E|8734
∥|PP|2225|8741
∧|AN|2227|8743
∨|OR|2228|8744
∫|In|222B|8747
∴|.:|2234|8756
∵|:.|2235|8757
≅|?=|2245|8773
≌|=?|224C|8780
≡|=3|2261|8801
≤|=<|2264|8804
≥|>=|2265|8805
≪|<*|226A|8810
≫|*>|226B|8811
≮|!<|226E|8814
≯|!>|226F|8815
⊂|(C|2282|8834
⊃|)C|2283|8835
⊆|(_|2286|8838
⊇|)_|2287|8839
⌈|<7 |2308|8968
⌉|>7 |2309|8969
⌊|7< |230A|8970
⌋|7> |230B|8971


### A Few Fractions

character | digraph  | hex | dec
:----:|:----:|:----:|:----:
½|13 |2153|8531
⅓ |13|2153|8531
⅕ |15|2155|8533
⅘ |45|2158|8536
⅙ |16|2159|8537

Now you can write such atrocities as:

```
⌊π⌋= 3 ∴ π ≡ 3
```

[Engineer Meme](https://www.reddit.com/r/EngineeringStudents/comments/9pd540/pi_e_3/)

Or:

```
∞
∑ n = -(⅙ ×½)
```

[Math Meme](https://blogs.scientificamerican.com/roots-of-unity/does-123-really-equal-112/?redirect=1)





## Using Latex and Vim

(TODO):

Article: [link](https://castel.dev/post/lecture-notes-1/)

## Command line editing

**vi mode in bash**

How to edit in the command line using vim

`bindkey -v`	use vim key bindings in the command line
`bindkey -e`	use emacs key bindings in the command line

or in `.bashrc`
```sh
set -o vi
```
- use yanking lines `yy`
- repeat commands `5p`
- repeat commands `.`
- find letters

Look at all commands: `bind -P` (in _insert_ and _normal_ modes)


## Executing vim commands remotely

To execute a set of commands on a file without opening vim,
use `ex` (vim command mode) commands on file.

_Example:_

```sh
vim -c "<commands>" file
```

For easier syntax, we should use the following script `mod`:


```sh
#!/bin/bash
vim -u NONE -esc "$1" -esc x "$2" &>/dev/null
```
Explanation:
1. `-u NONE` specifies to not load `.vimrc` settings and not load any plugins
2. `e` says to start in `Ex`/Execute mode
3. `c` says to execute the command following
4. `s` says to be silent
5. `x` says to save the file and quit

Now this script can execute any command on a file in the format:
`$ mod '<command>' <filename>`

_Example:_
```sh
$ mod '2,20sort' file.txt
$ mod '%s/^/#/g' pythonfile.py
```


Previously, using ed:
```sh

ed -s $1 <<EOT
$2
.
w
q
EOT

cat $1

```

----------------
# Plugins

## VimWiki
- `<Leader>ww` Open default index file
-  `<Leader>wt`  Open default index file in new tab
- `<Leader>w<Leader>w` Make diary note

**Keys**: `:h vimwiki-mappings`



## CtrlP

### Once CtrlP is open:
* Press `<F5>` to purge the cache for the current directory to get new files, remove deleted files and apply new ignore options.
* Press `<c-f>` and `<c-b>` to cycle between modes.
* Press `<c-d>` to switch to filename only search instead of full path.
* Press `<c-r>` to switch to regexp mode.
* Use `<c-j>`, `<c-k>` or the arrow keys to navigate the result list.
* Use `<c-t>` or `<c-v>`, `<c-x>` to open the selected entry in a new tab or in a new split.
* Use `<c-n>`, `<c-p>` to select the next/previous string in the prompt's history.
* Use `<c-y>` to create a new file and its parent directories.
* Use `<c-z>` to mark/unmark multiple files and `<c-o>` to open them.

Run `:help ctrlp-mappings` or submit `?` in CtrlP for more mapping help.

## Debugging VIM Issues

### Debugging Tools

- check which file last changed a local variable:

 `:verbose set {setting} ?`

 example: `:verbose set syntax?`


- get info on your runtime path: `:h rtp`


### Debugging Tips


source: _Ciro Santilli_


```
This is not an exact solution to your syntax highlighting issue but rather a solid way to debug VIM issues. Please don't mark this as the solution to your question.

I would manually go through your ~/.vim/bundles/ folder and mv each plugin out one by one until you find the culprit. Start with the plugins that are likely to be causing the problem and continue from there. I.e, vim-markdown is more likely to be causing these issues than wap-it (my VIM plugin ;) ).
```

# Easter Eggs
- `:help 42`
- `:help holy-grail`


# macOS

Notes from Austin:

Include in .vimrc:
```vim
" [Key Bindings]
" --------------
" Enable binding Meta-keys on MacOS
let c='a'
while c <= 'z'
  exec "set <M-".toupper(c).">=\e".c
  exec "imap \e".c." <M-".toupper(c).">"
  let c = nr2char(1+char2nr(c))
endw
```

# Unorganized

- Hammerspoon: keylogger (see greg hurrell's post)
- one off command in vim `<C-o>{command}`
- in `:h` (helpdocs), type `<Esc>gO` to see table of contents
- saving a read-only file edited in vim `:w !sudo tee %`:
        - `:w` writes to the file
        - `!sudo` call subshell sudo
        - `tee` the output of the vim write command is redirected using tee
        - `%` current filename
- Location of vim on my MacBook: `/usr/local/share/vim/vim81`

THIS IS AWESOME:

Insert incremented line numbers into text (used for SQL queries)

```vim
:let i=1 | '<,'>g/^/ s//\=i . " "/ | let i+=2
```
