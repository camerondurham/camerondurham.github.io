---
title: python
classes: wide
sidebar:
  nav: "memos"
permalink: /python/
---


## Strings

### Splitting Strings
To split strings into fields at multiple delimiters:

- `split()` used to split around regex expressions
```python
line = "asdf fjdk; afed, fjek,asdf,        foo"
import re
arr = re.split(r'[;.\s]\s*', line)  # ['asdf', 'fjdk', 'afed', 'fjek', 'asdf', 'foo']

```

## Lists:
- add items to list: `.append(<ITEM>)`
- list length: `len(<LIST>)`
- add item at index: `<LIST>.insert(<INDEX>, <ITEM>)`
- remove an item: `<LIST>.remove(<ITEM>)`
- clear list: `<LIST>.clear()`
- constructor returns list: `list( (i1, i2, ..., in))`
- sort: `<LIST>.sort()`

## Tuples:

- collection is ordered and *unchangable*
```python
this_tuple = ("apple", "banana", "cherry")
```
- access by index
- check if item exists:
```python
if "apple" in this_tuple: ...
```

- unpacking a tuple:
```python
x = [(1, 2), ('1','2')]
for item in x:
  print("A tuple: " + str(item))
  a , b = x
  print("First item: " + str(a) + " Second item: " + str(b))

```

## Dictionaries:

- key, value pairs

- Get iterables with
	-  `.items()`
	- `.keys()`
	- `.values()`


```python
dictionary = dict()
dictionary2 = {}
x = {'a':1,'b':2}
y = {'b':3, 'c':4}
```
- merging two dictionaries
```python
z = {**x, **y}	# z = {'c':4, 'a':1, 'b':3}
# Python merges dictionary keys in order,
# overwriting duplicates from left to right
```

- sort Python dictionary by value
```python

```
## Conditionals:

- check if some arbitrary number of variables is true
```python
x,y,z = (1,0,0)
if x or y or z: print ("Kinda smart passed check passed")
if 1 in (x,y,z): print("Smart check :) if passed")
if any((x,y,z)): print("Smartest pass check :)")
```
## Classes:
- keyword: `class`
- create objects: `obj1 = ClassName()`
- constructor: `__init__()`:
```python
def __init__(self, arg1, arg2, ...):
self.arg1 = arg1
self.arg2 = arg2
```
- `self` parameter is reference to class itself, used to access class variables
- delete object properties and objects with `del` keyword
	## *Printing*:
		- use `end` argument with `print()` to prevent newlines
		- `print("Nope, that is not a two. That is a", end="")`
## Matrices:
- Create 2D arrays using list comprehension:
```python
 Matrix = [[0 for x in range(width)] for y in range(height)]
```
## **Iterators and Generators**:
- iterables - objects stored in memory that you can "step" through: lists, strings, files
```python
	# mylist is iterable
	mylist = [x*x for x in range(9)]
	for i in mylist:
		print(i)
```


- generator -  type of collection using *less memory* to make items only iterated once
```python
	# mygenerator is a generator, values calculated one-by-one
	mygenerator = (x*x for x in range(3))
	for i in mygenerator:
		print(i)
```

- `yield` keyword - used like `return` but the function will return a generator
```python
	def createGenerator():
		mylist = range(3)
		for i in mylist:
			yield i*i
```


- use of generators means less memory use since they use lazy (on demand) generaton of values
```python
	#using items instead of returning a list
	def firstn2(n):
		num = 0
		while num < n:
			yield num*num
			num += 1
	sum_of_first_n_squares = sum(firstn(100000))
```

## `itertools` : https://realpython.com/python-itertools/

- using itertools to combine into a list

```python
import itertools
letters_map = {'2':'ABC', '3':'DEF', '4':'GHI', '5':'JKL',
               '6':'MNO', '7':'PQRS', '8':'TUV', '9':'WXYZ'}

def possible_words(phone_number):
   letters_to_combine = (letters_map[digit] for digit in
		   phone_number)
       for letters_group in itertools.product(*letters_to_combine):
       		yield ''.join(letters_group)

print list(possible_words("23567"))
```
--------
# Regular Expressions `re`

Boilerplate:
```python
import re
regexName = re.compile(r'<REGEX>')
```

Example:
```python
import re
phoneNumRegex = re.compile(r'\d\d\d-\d\d\d-\d\d\d\d')
```

- use parenthesis to create groups within regex
- index groups by `<return-obj>.group(<index>)`
- use pipes for matching <text> OR <other text> → `r'<text>|<other text>'`
- `?` denotes an optional preceeding group: `r'text(optional)?something else'`

--------
# `BeautifulSoup`:
- import: `from bs4 import BeautifulSoup`
- requires `request` to make HTTP requests

## *Python Virtual Environments* `virtualenv`:
- installing virtual environments for projects in a folder
`virtualenv --python <PYTHON VERSION> env`
- creates virtual copy of python install in env folder
- *activate with:* `source env/bin/activate`
- *deactivate with:* `deactivate`
----

# Machine Learning:


## conventions:
- **X**: independent variable matrix
- **y**: dependent variable matrix (features)
## `numpy`:
- *missing data*:
	- NaN / `np.nan`

# `pandas`:
## importing & reading datasets:
- `pandas.read_csv(<FILENAME>)`  - read values into `dataset` variable
- `dataset.iloc[ row_start : row_end, col_start: col_end].values`
- `X = dataset.iloc[:, :-1].values` -- takes all rows & columns except last col

## indexing
- `iloc` locates by index
- `loc` locating by value
```python
df.loc[ : , 'close']
df.loc[0:3, 'close']  # may throw error if row labels are non-numeric
df.iloc[0:3, 8]  # only select column by index
```

- `MultiIndex` allows multiple specifications for data
```python
MultiIndex(levels=[['AAPL','DWS'], ['close', 'high', 'low', 'open','volume']],
			labels=[[0, 0, 0, 0, 0, 1, 1, 1, 1, 1], [3, 1, 2, 0, 4, 3, 1, 2, 0, 4]])
volumes = df.loc[ : , [('AAPL', 'volume'), ('DWS', 'volume' ) ]]  # returns 2 column frame of volume data
```

## operations

- `DataFrame.apply( func, axis=0, columns)`  returns `Series` or `DataFrame`
```python
>>> df = pd.DataFrame([[4,9], ] * 2, columns=['A','B'])
>>> df
   A  B
0  4  9
1  4  9
>>> df.apply(np.sqrt)
>>> df
   A  B
0  2  3
1  2  3
```
using a `lambda` in apply to transform data and data type

```python
df = df.apply(lambda x : x * 100)   	# using a lambda function to transform our data
df = df.apply(lambda x : x * 100).astype(int)  	# using a lambda function and turning into integer types
```
- `DataFrame.transfom(func, axis=0)` returns `Series` or `DataFrame`
```python
s = pd.Series(range(3))
s.transform([np.sqrt, np.exp])

```
## selecting `pandas` DataFrame rows based on conditions

```python
raw_data = {'first_name': ['Jason', 'Molly', np.nan, np.nan, np.nan],
        'nationality': ['USA', 'USA', 'France', 'UK', 'UK'],
	        'age': [42, 52, 36, 24, 70]}

df = pd.DataFrame(raw_data, columns = ['first_name', 'nationality', 'age'])

american = df['nationality'] == "USA"

elderly = df['age'] > 50
```
## accessing week day attribute
Transforming `isoformat` column labels into day name:
```python
print( df.index.get_level_values('time').day_name() )

# filtering dataframe to only 'Thursdays'
df = df[ (df.index.get_level_values('time').day_name() == 'Thursday') ]
```


# *sklearn*:
	# *preprocessing*
		- library: `sklearn.preprocessing`
		- replace missing data by mean:
```python

imputer = Imputer(missing_values = np.nan, strategy = 'mean', axis = {0:columns, 1:rows})`
imputer = imputer.fit(<MATRIX>[ : , : ]) # imputer object fitted to <MATRIX>
<MATRIX>[ : , :  ] = imputer.transform( <MATRIX>[ : , : ]) # replaces missing data
```
## Flask

- requests objects:
	- type `MultiDict`
	- `request.data`: incoming request data as string
	- `request.args`: key/value pairs in body, from HTML post form
	- `request.files`: the files in the body
```python
request.form['name'] 			# if you know the key exists
request.form.get('name') 		#  in case key might not exist
request.form.getlist('name')  	# if key is sent multiple times and you want list of values
request.get_json()
```
- access request sections
```python
# given request object
request_json = request.get_json(silent=True)
request_args = request.args

if request_json and 'date' in request_json:
	date = request_json['date']
```
### Boilerplate Flask Setup
```python
from flask import Flask, url_for
app = Flask(__name__)					# set flask stuff
@app.route('/')							# set app route for USL
def api_root():
    return 'Welcome'

from flask import Response
@app.route('/hello', methods = ['GET'])
def api_hello():
    import json
    data = { 'hello' : 'world', 'number' : 3 }
    js = json.dumps(data)
    return Response(js, status=200, mimetype='application/json')

if __name__ == '__main__':				# run main program
    app.run()
```
## Exceptions

```python
try:
	day = int("garbage")
except ValueError:
	print("Can't convert to a date, asshole!")
```


## JSON

- `json.dumps()`: accepts list returns Python string

## Input
- `raw_input("Prompt")` returns string
- `input("Prompt")` evaluates the expression / returns an integer


## Command Line Application
- Packages
**argparse**: best library for CLA's


### Click

```python

import click
@click.command()
@click.option('--name', default="Aaron", help="Name to convert to uppercase")
def main(name):
    click.echo("{} Uppified ✨".format( name.upper() ))

if __name__ == "__main__":
    main()
```

- Input & Output:
	- **stdout**: piped to files
	- **stderr**: logging and program information
```python
logging.basicConfig(level=logging.WARNING, format="%(msg)s")

if options.verbose:
	logging.getLogger().setLevel(logging.DEBUG)

LOG = logging.getLogger('logtest')

LOG.debug('Running main')
LOG.info('Everything is okay')
LOG.warning('EVERYTHING HAS GONE WRONG!')
```
- check format if script is connected to terminal
- **colorama** coloring library:

```python
from colorama import Fore, Back, Style
print(Fore.RED + 'some red text')
print(Back.GREEN + 'and with a green background')
print(Style.BRIGHT + 'and in bright text')
print(Fore.RESET + Back.RESET + Style.RESET_ALL)
print('back to normal now')

```
## Pyperclip

- `copy()` and `paste()` functionality to modify compuer clipboard
- ideas: use for password storage program

```python
import pyperclip
pypclip.copy('Hello world!')
pyperclip.paste()
```
## Random
- `random.choice()` selects item randomly from list


# Environment

## Environment Tips

### Testing Code Cleanly

__TLDR__:
Use the main block and a main function to define test code to be run only if explicitly executing the current file.

```python
if __name__ == '__main__':
    main()
def main():
    # test code goes here
```
----
When writing modules in python, it's nice to test individual components. You can always add some messy test cases at the bottom of your code but, of course, this is messy.

A clean solution is to use the handy line I'll call the "main block"
```python
if __name__ == '__main__':
    ...
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

print("I'm some 💩 code!")

def main():
    print("Testing that number is correct")
    assert(num == 7)

if __name__ == '__main__':
    main()
```

The messy code lying around `imported_file.py` will be run no matter what. However, the code in the imported file's `main()` will only be run if we're only running that file.

Let's look at the output from running `imported_file.py`:

```sh
$ python imported_file.py
I'm some 💩 code!
Testing that number is correct
```
And the output from running `importing_file.py`:
```sh
$ python importing_file.py
the number is 42
I'm some 💩 code!
Getting number from imported 7
```
