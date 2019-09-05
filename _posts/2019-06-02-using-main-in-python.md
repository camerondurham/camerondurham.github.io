---
layout: posts
classes: wide
title: "Using the name variable in Python"
date: 2019-06-02
---

When writing modules in python, it's nice to test individual components. You can always add some messy test cases at the bottom of your code but, of course, this is messy.

A clean solution is to use the handy line I'll call the "main block"
```python
if __name__ == '__main__':
    # execute code or call function here
```

How does this work? Code in the main block will only be run if you're explicitly executing that python script. The private `__name__` variable determines whether the current file is the main one being executed. In other words, the code below the main block will __not__ be run if you're just importing the file.

For example, let's consider these two files:

`importing_file.py`
```python
# main module importing_file.py

num=42

print("the number is " + str(num))

from imported import *

print("Getting number from imported " + str(get_num()))
```

`imported_file.py`
```python
# supporting module imported_file.py

num=7

def get_num():
    return num

def main():
    print("Testing that the local num is 7")
    assert(num == 7)

if __name__ == '__main__':
    main()
```
The code in `main()` will only be executed if we explicitly run `imported_file.py` and not when the module is imported into another Python file.

For example, this is the output from running these files:

```sh
$ python imported_file.py
Testing that the local num is 7
```
And the output from running `importing_file.py`:

```sh
$ python importing_file.py
the number is 42
Getting number from imported: 7
```

Now, add some garbage code in the `imported_file.py` file to see what happens otherwise. I added the line:

```python
print("I'm some 💩 code!")
```

The messy code lying around `imported_file.py` will be run no matter what.  Let's look at the output from running `imported_file.py`:

```sh
$ python imported_file.py
I'm some 💩 code!
Testing that the local num is 7
```
And the output from running `importing_file.py`:
```sh
$ python importing_file.py
the number is 42
I'm some 💩 code!
Getting number from imported: 7
```

--------

__TLDR__:
Use the main block and a main function to define test code to be run only if explicitly executing the current file.

```python
if __name__ == '__main__':
    main()
def main():
    # test code goes here
```
