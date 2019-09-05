---
layout: posts
classes: wide
title: Helidon Quickstart
date: 2019-07-27
tags: helidon oracle java
---

# Project Helidon

## What is Helidon?

During my internship at Oracle this summer, I have been using a cool open-source framework called Helidon for a few of my projects. Helidon is a web framework for building cloud-ready, containerized applications. What do I mean by these buzzwords? Well, Helidon allows programmers to separate web functionality into different services and simplifies their configuration with built in tools and comes pre-packaged with easy to use network routing and JSON parsing, which helps it work well with other web services. Additionally, the Helidon project has several great guides to help you Dockerize your application, which makes your deployment process much easier.

You can learn more about Helidon on the project's pretty website: [helidon.io](https://helidon.io)
## Getting Started

### Prerequisites

{: notice--info}
This assumes you have the following minimum versions:

- [Java SE 8](https://www.oracle.com/technetwork/java/javase/downloads) or [Open JDK 8](http://jdk.java.net/)
- [Maven 3.5](https://maven.apache.org/download.cgi)

Verify your prerequisites with:

```sh
java -version
mvn --version
```
{: notice--info}
Also, make sure your JAVA_HOME variable is set properly:

```sh
# On Mac
export JAVA_HOME=`/usr/libexec/java_home -v 1.8`

# On Linux
# Use the appropriate path to your JDK
export JAVA_HOME=/usr/lib/jvm/jdk-8
```

### Generate the Project

There are two frameworks, **SE** and **MP**. We'll use the **SE** type since its syntax is easier and clearer to understand what's happening. To try out a sample Helidon application, let's use their Maven archetype:

```sh
mvn archetype:generate -DinteractiveMode=false \
    -DarchetypeGroupId=io.helidon.archetypes \
    -DarchetypeArtifactId=helidon-quickstart-se \
    -DarchetypeVersion=1.1.2 \
    -DgroupId=io.helidon.examples \
    -DartifactId=helidon-quickstart-se \
    -Dpackage=io.helidon.examples.quickstart.se


# Change into the folder you created:
cd helidon-quickstart-se

# Build the application
mvn package

# Run the application
java -jar target/helidon-quickstart-se.jar
```

### Try Out the Quickstart

The quickstart app creates a simple "Hello World" greeting service with some REST functionality. You can use GET requests to recieve a custom message, and PUT requests to change the greeting.

```sh

# Run the app if it's not running already:
java -jar target/helion-quickstart-se.jar

# make a simple GET request to see the default greeting
curl -X GET http://localhost:8080/greet
{"message":"Hello World!"}

# tell the server who you are
curl -X GET http://localhost:8080/greet/Cameron
{"message":"Hello Cameron!"}

```

You can change the custom message with a PUT request containing the new greeting:

```sh
curl -X PUT -H "Content-Type: application/json" \
     -d '{"greeting" : "Hola"}' \
     http://localhost:8080/greet/greeting

# try out the new greeting
curl -X GET http://localhost:8080/greet/Salvador
{"message":"Hola Salvador!"}

```

## The WebServer

Helidon's `WebServer` class provides the application's main entry point and is where you'll define routing for you services.

To make a web server, you'll use the `create( Routing router)` method.

Here's how you'd create and start a web server, from the Helidon docs:

```java
WebServer webServer = WebServer.create(Routing.builder()
    .any(   (req, res)
    -> res.send("I'm a server in one line of Java!"))
    .build()).start().toCompletableFuture()
    .get(10, TimeUnit.SECONDS);

System.out.println(String.format(
"Server started at port %d running at: http://localhost:%d",
webServer.port(), webServer.port()));
```

Isn't that cool? You can create a web server in Java almost as easily as with Node.js!

What this little server does is respond to any type of request, form any path with a message in plain text. The server is bound to a random free port, so we print it out once the server's up.

Let's see what fancy stuff is going on in the quickstart app:

```java
// Main.java
import io.helidon.webserver.WebServer;

    ...

    static WebServer startServer() throws IOException {

        ...

        // Try to start the server. If successful, accept the WebServer
        //  object returned from .start() and print a message
        server.start()
            .thenAccept(ws -> {

                // success!
                System.out.println(
                        "WEB server is up! http://localhost:" + ws.port()
                        + "/greet");

                // similar to Node.js, register the shutdown event with
                //  a function that prints a message

                ws.whenShutdown().thenRun(()
                    -> System.out.println("WEB server is DOWN. Good bye!"));
                })
            .exceptionally(t -> {
                // deal with startup errors with an event-based method
                System.err.println("Startup failed: " + t.getMessage());
                t.printStackTrace(System.err);

                // exceptionally functions have a return type of Void
                // and must return null
                return null;
            });

        ...

    }
```

## Routing

Network routing is handled by the `Routing` class, which is defined and built when you create a web server. The router can be configured to support plain-text, json, and other filetypes when you create it.

Here's a simple example of how you'd create a simple router with json support:

```java
    WebServer server = WebServer.create(Routing.builder()
                                               .register(JsonSupport.create())
                                               .build());
```

As is, this server doesn't do anything since we didn't register any services with it. You need to use the `register(<ENDPOINT>, <SERVICE>)` function. For example:

```java
Routing.builder()
       .register(JsonSupport.create())
       .register("/", waitService)      // all requests are handled by waitService
       .build();
```

or a stupid example:

```java
Routing.builder()
       .register(JsonSupport.create())
       .register("/root", rootService)      // all requests to /root or /root/* are handled by the rootService
       .register("/beer", beerService)
       .register("/float", floatService)
       .build();
```

## Request Handling

When you need to handle HTTP requests, you'll implement the `Service` class and override the `update` function that handles how subpaths are routed. So from the above route, you could define subpaths from `/root` such as `/root/subpath` and `/root/subpath/subpath`, etc.

Here's a simple skeleton service:

```java
public class RootBeerFloatService implements Service {

    @Override
    public void update(Routing.Rules rules) {
        rules.get("/beer", this::getHandler);
    }

    private void getHandler(ServerRequest req,
                            ServerResponse res) {
                // give this one some root beer!!
    }
}
```


