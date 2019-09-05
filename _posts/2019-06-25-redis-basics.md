---
layout: posts
classes: wide
title: Redis Basics
date: 2019-06-25
tags: redis web efficiency
---

The name __redis__ comes from __RE__ mote __DI__ ctionary __S__ torage, which is a good description of what redis is: a fast, key-value data structure. Redis is an in-memory data structure storage used for its database, cache, and other features. It supports **atomic operations** on its data structures to ensure multiple clients recieve the same data.

For example, here's a list of Redis data structures and operations:

| data structure | operations                                      |
| :------------: | :-------:                                       |
| string         | appending to string                             |
| hash           | increment a value in hash                         |
| list           | push a string or number to front or back |
| set            | compute set intersection, union, and difference |
| sorted-set     | get member with highest ranking                 |

Persistence is achieved in Redis by dumping the dataset to disk, or appending each command to a log. Persistence can be disabled if you only need a networked, in-memory cache. If you use a Docker image, for example, your redis cache will be preserved.

## Getting Started

### Docker and Redis

**Note for Windows Users:** some of the docker commands require you to prepend `winpty`

Get the latest Docker image of Redis with: `docker pull redis`.

To get started, we'll run it on its default port (port 6379):

`docker run -d -p 6379:6379 --name awesome-redis redis`

We can check that it's running with: `docker ps` and view log output with: `docker logs awesome-redis`.

We'll start start an interactive session inside the container with `-it` to play with the `redis-cli` from the container's shell with `sh`.

`docker exec -it awesome-redis sh`

Inside the container, we'll see a `#` prompt to show you're in the shell and can start the `redis-cli`.

`# redis-cli`

From here, we'll try some basic Redis commands:

```sh
127.0.0.1:6379> ping
PONG
127.0.0.1:6379> set redis_is "awesome"
OK
127.0.0.1:6379> get redis_is
"awesome"
127.0.0.1:6379> set redis_num 42
OK
127.0.0.1:6379> incr redis_num
(integer) 43
127.0.0.1:6379> del redis_num
(integer) 1
127.0.0.1:6379> incr redis_num
(integer) 1
```

### Using Key Value Storage

The simplest way to store data in redis is with single key-value pairs. We already these with `set`, `get`, and `incr`. The commands, as you probably can tell, follow the format:

```
<set> <key> <value>

<get> <key>
```

### Using Lists

Lists can be used somewhat like a double-ended queue with `lpush`, `rpush`, `lpop` and `rpop` operations. These operations follow the format:

```sh
<lpush/rpush> <list-name> <value>

<lpop/rpop> <list-name>
```

```
127.0.0.1:6379> lpush dogs "Corgis"
(integer) 1
127.0.0.1:6379> lpush dogs "Chihuauas"
(integer) 2
127.0.0.1:6379> lpush dogs "Bulldogs"
(integer) 3
127.0.0.1:6379> lrange dogs 0 -1
1) "Bulldogs"
2) "Chihuauas"
3) "Corgis"

```
Here, we use the pop commands to remove from either ends of the list.
```
127.0.0.1:6379> lpop dogs
"Bulldogs"
127.0.0.1:6379> lrange dogs 0 -1
1) "Chihuauas"
2) "Corgis"
127.0.0.1:6379> rpop dogs
"Corgis"
127.0.0.1:6379> lrange dogs 0 -1
1) "Chiuauas"
127.0.0.1:6379>
```

### Using Hash Sets

Hash sets allow the association of multiple fields to a hash key. For example, we'll create a user in the redis-cli using the `hset` command:


```
127.0.0.1:6379> hset user:1 name "Larry Ellison"
(integer) 1
127.0.0.1:6379> hset user:1 email "larry.ellison@oracle.com"
(integer) 1
127.0.0.1:6379> hset user:1 password "hidden"
(integer) 1
127.0.0.1:6379> hgetall user:1
1) "name"
2) "Larry Ellison"
3) "email"
4) "larry.ellison@oracle.com"
5) "password"
6) "hidden"
```

To query a particular value, we can use the `hget` command:
```
127.0.0.1:6379> hget user:1 email
"larry.ellison@oracle.com"
```

### Querying Data

We can retrieve specific commands with the `KEYS '<pattern>'` command. For example, get all keys with the `KEYS '*'`. This command returns a list of matches or an empty set if nothing matched the pattern.

### Atomic Operations

All operations in redis are atomic. Here, we'll use the `set` and `incr` commands here show how redis creates and modifies key-value pairs safely if they don't exist. These commands are atomic, meaning only one user can change the value at a time. To consider the advantage of atomic operations, let's consider another non-atomic method of accessing data:

```sh
set num 42
temp = GET num
temp = temp + 1
set num temp
```
Now if two clients try to increment `num` (which should result in `num += 2`) trying to increment `num`, things could go wrong without atomic operations. Consider:

1. Client A gets the value of `num` = 42
2. Client B gets the value of `num` = 42
3. Client A saves `num` = 43
4. Client B saves `num` = 43

If the clients access the value of `num` before setting the values, then we won't get the correct result.
## Using redis Clients

There are plenty of redis clients for a variety of programming languages. You can check out the full list here: [https://redis.io/clients](https://redis.io/clients)

Here's a simple example using the redis client for Node.js.

To install, we simply run `npm i redis` or `yarn install redis`.

The client's redis API mirrors the `redis-cli` functions. For example, here's how we'd create the Larry Ellison hash set:

```javascript
const redis = require('redis')
const client = redis.createClient()

client.hset('user:1', 'name', 'Larry Ellison', redis.print)
client.hset('user:1', 'email', 'larry.ellison@oracle.com', redis.print)
client.hset('user:1', 'password', 'hidden')

client.hgetall('user:1', (err, reply) => {
    console.log('Reply from HGETALL:', reply);
    client.quit()
}
```
