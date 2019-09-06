---
title: docker
classes: wide
sidebar:
  nav: "memos"
permalink: /docker/
---

[Commands start here](#Commands)

Compared to Virtual Machines, Docker images take up less disk space but are not as separate from the host OS as a VM. Containers spin up faster and run one process then shutdown, which helps improve their speed.

| virutal machine | docker        |
| :------------:  | :-----:       |
| **apps**        |               |
| **bins/libs**   |               |
| **kernel**      | **app**       |
| **hypervisor**  | **bins/libs** |
| **host OS**     | **host OS**   |
| **server**      | **server**    |

Container: running instance of an image
Image: built from Dockerfile

## Containers

- Dockerfiles build images

- Images contain layers of programs (binaries)
    - For Example:
    - Scratch:
        - Busybox OS:
            - sshd & perl
                - *your app*

- Containers are run from images

- Docker Host:
    - cache stored of previous proxies
    - pull & push diffs from registry (docker hub)
    - client <-> Docker daemon

### Example Dockerfile

```dockerfile
# Stage 1
# base image
FROM node:10.16.0 as build

# set working directory
WORKDIR /app/server

# add `/app/node_modules/.bin` to $PATH
ENV PATH /app/server/node_modules/.bin:$PATH

# install and cache app dependencies
WORKDIR /app/server
COPY package.json /app/server
COPY package-lock.json /app/server
RUN npm install
RUN npm i socket.io

COPY . /app/server
CMD ["npm", "run", "dev"]
```

## Commands

```sh

# check installation versions
docker --version
docker-compose --version
docker-machine --version

# view details on container while running
#   use -a to list all containers running/not running
docker ps

# list docker images
docker image ls

# delete specific image
docker image rm <IMAGENAME>

# delete all existing images
docker image rm $(docker images -a -q)

# stop specific container
docker stop <CONTAINER NAME>

# stop all running containers
docker stop $(docker ps -a -q)

# display logs of a container
docker logs <CONTAINER NAME>

# create image from source code and Dockerfile
docker build <directory>
docker build .

# run docker container interactively
docker run -it <CONTAINER NAME> <WHAT TO RUN>
docker run -it linux-box /bin/bash

# spin up a linux command line
docker run -it ubuntu bash

# connect to an image using the default ports exposed by the image
docker run -it -P <image name>

# discover mapped ports
docker port <image-name>


```
### Cleaning Up

Docker has special commands such as `docker system prune` to delete ALL dangling data. Unused data should be deleted with the `-a` option.

Other commands to clean up are:

- `docker container prune`
- `docker image prune`
- `docker network prune`
- `docker volume prune`

To clear your cache, you can use:

```sh

docker kill $(docker ps -q)
docker rm $(docker ps --filter=status=exited --filter=status=created -q)
docker rmi $(docker images -a -q)

```

### Command Examples

```sh
# run docker image named hello-world on port 80
docker run -p 80:80 hello-world

# run file hello.py in python docker image
docker run --rm -v $(pwd):/src python:3 python /src/hello.py

# run python image in bash shell and copy ./* into image
docker run --rm -it -v $(pwd):/src python:3 /bin/bash

# run python image in python interpreter and copy ./* into image
docker run --rm -it -v $(pwd):/src python:3

```

## Dockerfile

- build on existing images with `FROM <image name>`
- expose ports to outside world with `EXPOSE <port number>`
- copy code from directory with `COPY <src> <target>`


For example, we can build a Python image with this Dockerfile:

```
FROM python:3

RUN pip3 install numpy

```

Then build with: `docker build -t py_numpy_image .`

The `build` command searches for a `Dockerfile` in the current directory and builds the image.


## Docker Compose

Define services in configuration file and spin up automatically rather than in `docker run` commands.

The `docker-compose.yml` file:
- `version`: specify docker-compose syntax to use
- `services`: define source code of each container to use:
    - `build`: relative path to source code
    - `volumes`: map where to copy source code `<src>:<target>`
    - `ports`: map host port to image port

### docker-compose

#### Basic Notes

- `build`: build an image from a Dockerfile
- `image`: use an image in the Docker hub repository

```Dockerfile
version: '3'
services:

  #  SETUP NODE CONTAINER
  server:
    image: maxbartnitski/server:v17
    expose:
      - "4000"
    ports:
      - "4000:4000"
    depends_on:
      - redis
      - backend
    env_file:
      - .env
    environment:
      - REDIS_PASS=bear6metal6server
    command: >
      sh -c "sleep 30s && npm run dev"


  redis:
    image: redis
    ports:
      - "6379:6379"
    expose:
      - "6379"
    command: >
      redis-server --requirepass bear6metal6server

  backend:
    image: maxbartnitski/nosql:v5
    ports:
      - "8080:8080"
    expose:
      - "8080"

```

### Dockerfile


```sh
# run docker compose
docker-compose up

# run docker compose in detached mode
docker-compose up -d

# shutdown from running container
^C

# shutdown detatched containers
docker-compose down
```

## Example Docker Commands

```sh
# start nginx container
docker run \
    --rm \
    -v $(pwd):/usr/share/nginx/html \
    -p 8080:80 \
    nginx:latest

# start container in background
docker run \
    --rm \
    -d \
    -v $(pwd):/usr/share/nginx/html \
    -p 8080:80 \
    nginx:latest

# create a network to allow sharing between container
#   format: docker network create <NETWORK NAME>
docker network create multiple

# create mysql container
#       -e flag creates environment variable
docker run \
    --rm \
    -d \
    --net multiple \
    --name mul_mysql \
    -e MYSQL_ROOT_PASSWORD='root' \
    mysql:5.6

# create (and open terminal into) Node.js container
docker run \
    --rm \
    -it \
    --net multiple \
    --name mul_node \
    node:8 \
    /bin/bash
```

How to build and push an image to a Docker repository:

1. create Dockerfile for your image
2. build and tag the image with your current version
3. push the image to the Docker repository

```sh

# create Dockerfile for your image
echo "FROM: python:3\nRUN: pip install numpy" > Dockerfile

# build and tag image with current version
docker build -t <DOCKER USERNAME>/my-numpy-image:v1 .

# push the image
docker push <DOCKER USERNAME>/my-numpy-image

```

## Tutorial

**"Hello Docker!"**

_Inspiration from_: [Learn Docker in 12 Minutes](https://www.youtube.com/watch?v=YFl2mCHdv24&t=187s)
1. create working folder: `mkdir -p ~/Docker/src`
2. write simple PHP file to display "Hello Docker!"

```php
# in ~/Docker/src/index.php
<?php
echo "Hello Docker!";

```

3. write simple Docker file to use existing PHP image and expose port 80

```
FROM

EXPOSE
```

4. download existing images and build your `hello-world` container

```sh
docker build -t hello-world .
```

5. run your image and connect through port 80

```sh
docker run -p 80:80 hello-world
```

6. test it out! visit `localhost` on a web-browser
7. enable live updates:
    1. press `<C-c>` and/or `docker ps` and `docker stop` the hello-world php image
    2. run this command to update from current folder (**note**: must use full path to your folder and enable Docker to use folder)

```sh
# insert output from pwd in PATH
docker run -p 80:80 -v /path/to/Docker/src/:/var/www/html/ hello-world

# Windows example
docker run -p 80:80 -v 'C:\Users\cdurham\projects\docker\src\':/var/www/html/ hello-world

```

8. edit the `index.php`, save and reload your web-browser to enjoy the updates!

## Deployment

- Digital Ocean: use https://www.digitalocean.com/?refcode=791d593997b2&utm_campaign=Referral_Invite&utm_medium=Referral_Program&utm_source=CopyPaste



### Troubleshooting

In case of: `ERROR: unauthorized: incorrect username or password`:

```sh
docker logout

docker pull <image>
```

Uninstall Docker Desktop from the commandline

```sh
/Applications/Docker.app/Content/MacOS/Docker --uninstall
```

To stop a constantly restarting process, you might need to force stop and remove docker containers:

```sh
docker stop $(docker ps -a -q) && \
docker container rm --force $(docker ps -a -q)
```
