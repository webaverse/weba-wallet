# Weba-Wallet - Quick Start Guide

## Introduction

The Weba-Wallet is a secure storage module made specifically for Webaverse Login.
Live: https://webaverse.github.io/weba-wallet/

 ## Before You Begin
 
Before you begin we recommend you read about the basic building blocks that assemble an application:
* Git - [Download & Install Git](https://git-scm.com/downloads). OSX and Linux machines typically have this already installed.


## Quick Install

Once you've installed all basic building blocks, you're just a few steps away from starting to develop your application. To clone and run this repository excute these command using command line:


```bash

# Clone this repository

git clone https://github.com/webaverse/weba-wallet

# Go into the repository

cd weba-wallet/

```


## Running Your Application


There are 4 ways you can run this website on localhost.
```bash

# Pyhton 3

$ python3 -m http.server --cgi 8080

# PHP

$ php -S localhost:8080

# NPM

$ npm i -g serve
$ serve

# HTTP-server

$ http-server
```

Now your website is hosted on 8080

## Development Environment Setup

  
> Preffered tool for development is [VSCode](https://code.visualstudio.com/download)
  
### Directory Structure

```bash

**Root**

├───	index.html <--- Popup view to get Password
├───	script.js <--- Main file, handling encryption, decryption and localStorage etc.
├───	styles.css <--- Popup styles

```

## Login Flow

![App - Wallet Login Flow](https://i.ibb.co/Yfgw5N8/Wallet.jpg)