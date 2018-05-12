# Coordibot

[![Build Status](https://travis-ci.org/jcperez/coordibot.svg?branch=master)](https://travis-ci.org/jcperez/coordibot)

Coordibot is a AWS Lex based conversational bot written in Typescript that uses AWS Lambda functions to provide Google Calendar information back to callers.

## Application Overview

![Overview](./img/overview.jpg)

The application is an AWS Lex based bot, that interacts with a set of AWS Lambda functions.

## Setup

Clone the repository, and install the dependencies by running

```
$ npm install
```

The command-line TypeScript compiler can be installed as a Node.js package.

```
$ npm install -g typescript
```


Compile the Typescript application

```
$ tsc
```

### Environment variables

Setup the following environment variables

| Environment variable  | Description   |
|-----------------------|---------------|
| INTERVIEWERS          |               |
| GOOGLE_CONFIG         |               |
