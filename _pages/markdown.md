---
title: markdown
classes: wide
sidebar:
  nav: "memos"
permalink: /markdown/
---

## The Basics

### Headers

To write levels header levels, use more hashmarks `#` to denote lower levels.

For example:

```
# H1
## H2
### H3
#### H4
##### H5
###### H6 (subtitles, sort of)
```


# H1
## H2
### H3
#### H4
##### H5
###### H6 (subtitles, sort of)

### Lists

Making Lists:


```
1. First ordered list
2. The next item
    * Unordered Sub List
3. Another item
    - Using a -
4. Yet another item
    + Using a +
```

Renders:

1. First ordered list
2. The next item
    * Unordered Sub List
3. Another item
    - Using a -
4. Yet another item
    + Using a +

### Images

Check out this stormtroopocat:

<img src="https://octodex.github.com/images/stormtroopocat.jpg" alt="The Stormtroopcat" width="300"/>

For further customization, such as image sizing, you can use HTML image tags to
link a smaller image.


## Links

Like links, Images also have a footnote style syntax:

`![Label](URL link)`.


For example, this is how could get the cat:

`![Stormtroopocat](https://octodex.github.com/images/stormtroopocat.jpg "The Stormtroopocat")`


Below is how you'd use HTML to add the cat:


`<img src="https://octodex.github.com/images/stormtroopocat.jpg" alt="The Stormtroopcat" width="300"/>`

You can also use shortcut style links if you reuse a long url. For example:

This is a short [link][links] that references another link (see below ↓).

[links]: https://en.wikipedia.org/wiki/Lightweight_markup_language#Link_syntax

To link within the same file (in **GFM**), add `-` separators for spaces, wrap the heading in parens, and write the header in _lowercase_. This is due to how Markdown renders links.

[an anchor](#anchor-heading-in-markdown)

[link](#text-formatting)


### Tables

Markdown supports tables

| Tables   | Organize      |
| :------- | :----------:  |
| Abdul    | Peanut Butter |
| Austin   | Soylent       |
| Charlie  | Sandwich      |
| John     | Burrito       |
| Cameron  | Oatmeal       |

You use colons for alignment.

```
| Right | Center | Left |
| ---:  | :---:  | :--- |
| Right | Center | Left |
```

Renders:

| Right | Center | Left |
| ---:  | :---:  | :--- |
| Right | Center | Left |


Note that you need **minimum of 3 dashes** to
make a valid column.

Also, you can be sloppy:

```
Weird | ... still pretty | somehow
---|---|---|
1|2|3
```

Weird | ... still pretty | somehow
---|---|---|
1|2|3

--------


## Text Formatting



You can have subscript and superscript with standard HTML syntax:

- `<sub></sub>`

- `<sup></sup>`


_Example:_

This is some <sub>subscript</sub>

This is some <sup>superscript</sup>


### Emphasis

```
*Some italic text*
_Some more italic text_
```

*Some italic text*

_Some more italic text_

```
**Some bold text**
__Some more bold text__
```

**Some bold text**

__Some more bold text__

### Blockquotes
As Grace Hopper said:

> I've always been more initerested
> in the future than in the past.

### Backslash Escapes

Markdown allows you to use backslash escapes that would otherwise have a special meaning in Markdown.

` \*literal asterisks \* `

\*literal asterisks \*


## Github Flavored Markdown

### @ Mentions

Using the `@` symbol, you can mention a Github user or Github organization.

### Issue references
Any number that refers to an issue or Pull request will automatically be converted into a link.

```
#1
github-flavored-markdown#1
durhc427/all-my-issues#1
```

### Emojis
To see a list of all supported emojis, you can check out [https://www.emoji-cheat-sheet.com](www.emoji-cheat-sheet.com)

```
Github supports emojis!!
:+1: :sparkles: :camel: :tada:
:rocket: :metal: :octocat:

```

:+1: :sparkles: :camel: :tada:
:rocket: :metal: :octocat:


### Task Lists
```
- [X] this task is complete
- [ ] this is an incomplete task
- [X] @mentions, #refs [links](), **formatting**, and <del>tags</tags> are supported
- [X] list syntax is required (any unordered or ordered list supported)


- [X] this task is complete
- [ ] this is an incomplete task
- [x] @mentions, #refs [links](), **formatting**, and <del>tags</tags> are supported
- [X] list syntax is required (any unordered or ordered list supported)
```

### Fenced Code Blocks

```javascript
function test() {
	console.log("look ma', no spaces");
}
```

### Comments


You can write comments in markdown using:

```
[//]: <> (This is a comment)

[comment]: <> (This is another comment)
```

I've written some comments below but you can't see them since my blog uses
markdown! :grin:


[//]: <> (This is a comment)

[comment]: <> (This is another comment)
