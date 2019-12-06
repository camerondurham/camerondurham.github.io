---
layout: posts
classes: wide
title: Debugging weird c++ behavior
date: 2019-12-06
tags: c++ cs104 oop
---


Sometimes you'll have a program that seems to work but will produce a
ton of Valgrind errors. You'll get some fairly strange errors about invalid reads
or confusing c++ library functions. Ever thought the compiler might be able to
help solve these issues before you had to slog through pages of these debugger
errors? Introducing the compiler flag `-O2` to the rescue! (that's an O as in
Oreo, or Optimize) Normally, when you compile c++ programs, you'll ask for all
warnings with the `-Wall` flag. After the compiler checks for these errors, it
will build your program with a ton of fancy optimizations to make your code
faster*. The problem with this is
sometimes you'll miss a few potential errors by not including the optimization
step. You can use the -O2 flag to optimize and error check at the same time.

\* you can learn about these more in a computer architecture class such as [USC's fantastic  CS356 course](https://usc-cs356.github.io)!

For example, a student's code seem to be perfectly normal when compiling with
the normal flags.

```shell

# before, compiled without errors
g++  -Wall -std=c++11 main.cpp -o main

# after, we get more helpful warnings about potential bugs
g++ -O2 -Wall -std=c++11 main.cpp -o main

In file included from main.cpp:9:
avl/avlbst.h: In member function
'void AVLTree<Key, Value>::balance(AVLNode<Key, Value>*&)
[with Key = std::__cxx11::basic_string<char>; Value = int]':
avl/avlbst.h:106:54: error: 'y' may be used uninitialized in this function
[-Werror=maybe-uninitialized]
  return static_cast<AVLNode<Key,Value>*>(this->mRight);
                                                      ^
avl/avlbst.h:199:23: note: 'y' was declared here
  AVLNode<Key, Value>* y;
```

[Reference about the -O2 flag](https://www.linuxtopia.org/online_books/an_introduction_to_gcc/gccintro_52.html)

## Address Sanitizers

Take a look at the program below. Do you see any potential errors?

```cpp
#include <iostream>
int* foo;
void allocfoo(size_t sz)    { foo = new int[sz]; }
void setfoo(int idx, int value)     { foo[idx] = value; }

int main() {


    allocfoo(5);

    // tons of important code

    setfoo(5, 4);

    delete foo;

}
```

Of course, the problem is when you `setfoo(5,4)`, which is out of bounds of your length 5 array.
You might pick it up after a quick glance in this context, but what if this is hidden in a really big program?

The issue with this is you'll compile and run the program without crashing or producing errors. Why? The memory allocator for most Unix based systems will grant the program memory on
the heap in 16-byte chunks, meaning the length 5 array from `allocfoo(5)` will actually be given space for six 4-byte int blocks. Thus, calling `foo[5] = 4` won't access "out of bounds".

However, problems like these could potentially grow in to huge problems if you run it
on a different machine or different compiler. Fortunately, you can use tools such as `clang++`
and `Valgrind` to help!

When you compile with:

```shell
   clang++ -fsanitize=address heap_overflow.cpp -o heap_overflow.o
```

You recieve the following error when running the program:
```
==58598==
ERROR: AddressSanitizer:
heap-buffer-overflow on address 0x603000001734
WRITE of size 4 at 0x603000001734 thread T0
#0 0x10d3f3e60 in setfoo(int, int) (heap_overhead.o:x86_64+0x100000e60)
```

Or with Valgrind:

```shell
valgrind -leak-check=yes ./heap_overflow.o

==23== Invalid write of size 4
==23==    at 0x109237: setfoo(int, int) (in /home/work/heap_overflow.o)
==23==    by 0x109258: main (in /home/work/heap_overflow.o)
==23==  Address 0x48ba464 is 0 bytes after a block of size 20 alloc d
==23==    at 0x489C344: operator new[](unsigned long) (vg_replace_malloc.c:433)
==23==    by 0x10920B: allocfoo(unsigned long) (in /home/work/heap_overflow.o)
==23==    by 0x109249: main (in /home/work/heap_overflow.o)
```

Hopefully these tips help you smash a couple c++ bugs sometime!

