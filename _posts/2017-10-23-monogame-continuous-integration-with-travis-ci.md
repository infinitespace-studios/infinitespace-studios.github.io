---
title: "MonoGame - Continuous Integration with Travis CI."
date: "2017-10-23"
categories: 
  - "general"
  - "monogame"
  - "msbuild"
  - "travis-ci"
tags: 
  - "gamedev"
  - "monogame"
  - "travisci"
---

So you have a game, and you want to get regular builds for people to test. Now you can do a build yourself , but you're not a philistine are you? You want to use Continuous Integration (CI).

### What is Continuous Integration

If you don't know, CI is where a server somewhere builds your projects for you when you commit changes. The idea being you script up the steps you need doing and let the server do all the hard work. I've used this on many occasions. Any time I find myself doing the same job more that twice, I'll think about scripting it or getting a machine to do the job.

Now there are allot of CI systems out there, Team City, Jenkins, TFS to name a few. However this post is going to concentrate on the free offering of Travis CI. The reasons for this are, firstly its free, secondly it offers Mac hosts. Having a Mac host in the cloud for a CI system is quite a unusual thing.

### Setup Travis.

Signing up for travis is quite simple. Head over to [https://travis-ci.org](https://travis-ci.org) and Signup with your Git hub account. It will ask you which repositories it needs access to. The process is really simple. Note that [https://travis-ci.org](https://travis-ci.org) is the open source free offering for projects which are..open source. Travis CI does offer paid for services for close source projects but the setup is pretty much the same.

### Scripting your .travis.yaml

The core of Travis CI is that is looks for a very particular build script, \`.travis.yaml\`. If you have this file in the root of your repo, Travis CI will use it and run the build. It can work without the script, but I prefer to script things since it gives you more control.

`language: csharp solution: VectorRumble.Shared.sln os: - osx env: global: - Configuration=Release`

This snippet tells Travis CI that we are a C# project (this is MonoGame right ;) ). We also define the name of the Solution we are going to build. The next step is to define the operating systems we are running on. In this case osx. We also setup some global variables which can be used later. Note they also support linux, and docker based images. So if they don't have the exact system you want, a docker image might work.

The great thing is that Travis CI will automatically realise that we need Mono installed. Because we are using C# on mac, so that will be taken care off. It will grab the latest stable releases from Xamarin. By default Xcode is installed as well (on osx), so you can use this to build iOS apps too. But we need MonoGame..

So how do we install that? Well we add a new section called "install"

`install: - wget -O MonoGame.pkg "http://teamcity.monogame.net/guestAuth/repository/download/MonoGame_PackageMacAndLinux/.lastSuccessful/MonoGame.pkg?branch_MonoGame=%3Cdefault%3E" - sudo installer -pkg "MonoGame.pkg" -target /`

what this code does is download the latest development branch from the MonoGame CI system. And then install it! Very cool. The end result will be your Mac bot will have all the Pipeline tools an assemblies installed and ready to use. Now if you want to just get the latest stable release you can use the following url.

`http://teamcity.monogame.net/guestAuth/repository/download/MonoGame_PackageMacAndLinux/.lastSuccessful/MonoGame.pkg?branch_MonoGame=%3Cmaster%3E`

Note the "%3E" characters are required. The next step is to build the project. So we add the following.

`script: - nuget restore VectorRumble.Shared.sln - msbuild VectorRumble.Desktop/VectorRumble.Desktop.csproj /p:Configuration=Release /v:d /t:Build`

First thing is to do a Nuget restore. For this project I am using the Remote Effect Pipeline extension from my previous post, so I need to make sure that package is in place. But if you are using MonoGame Nuget package you will need to do this as well. Next step is to build the app, as normal. Rather than building the entire solution I am building a specific project. But if you want to build both iOS, DesktopGL etc you can setup a configuration in the Solution which just builds those projects.

### Thats it!

Not much too it is there. If you have an open source project (or a closed source one) there is absolutely no reason not to setup some sort of Continuous Integration.
