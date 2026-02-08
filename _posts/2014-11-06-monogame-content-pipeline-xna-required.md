---
layout: default
title: "MonoGame Content Pipeline = XNA !Required"
lang: en
date: "2014-11-06"
categories: 
  - "gamedevelopment"
  - "general"
  - "monogame"
tags: 
  - "gamedev"
  - "monogame"
permalink: /general/monogame-content-pipeline-xna-required/
summary: "MonoGame now has its own content pipeline tooling, eliminating the need to install XNA 4.0 SDK for content processing."
---

Some of you might have heard that [MonoGame](http://monogame.net) now has its own content pipeline tooling, and it works! As a result the need to install the XNA 4.0 SDK is no longer required, unless you want to target Xbox 360 of course.  For those of you looking for documentation on the new tooling you can head over to [here](http://www.monogame.net/documentation/?page=Pipeline) for information on the Pipeline GUI and [here](http://www.monogame.net/documentation/?page=MGCB) for information on the MGCB tool. But I'll give you a basic overview on how this all hangs together.

### MGCB.exe

This is a command line tool used to create .xnb files. It works on Windows and Mac (and Linux for some content AFAIK). On windows at the time of writing you will need to download the latest [unstable](http://teamcity.monogame.net/viewLog.html?buildTypeId=MonoGame_DevelopWin&buildId=lastSuccessful&tab=artifacts&buildBranch=%3Cdefault%3E&guest=1#!ossgocr) release from [here](http://teamcity.monogame.net/viewLog.html?buildTypeId=MonoGame_DevelopWin&buildId=lastSuccessful&tab=artifacts&buildBranch=%3Cdefault%3E&guest=1#!ossgocr) to install the tooling. It installs the tools to

```bash
c:\Program Files (x86)\MSBuild\MonoGame\Tools
```

On a Mac  you will need to get the source and compile this tool yourself. I am working on an add-in for Xamarin Studio which will install this tool for you, if I can figure out how to do it I'll also knock up a .pkg file to install the tooling in the Applications folder too.

Using the tool is very simple you can either pass all your parameters on the command line  like so

```bash
MGCB.exe /outputDir:bin/foo/$(Platform) /intermediateDir:obj/foo/($Platform) /rebuild /platform:iOS /build:Textures\wood.png
```

Note for Mac users you will need to prefix your command with  'mono'.

The other option is to create a .mgcb response file which contains all the required commands.

Now a .mgcb file has some distinct advantages. Firstly its compatible with the Pipeline GUI tooling, secondly it allows you do process a bunch of files at once and still have a nice readable file rather than a HUGE command line. Here is a sample .mgcb file

```bash
# Directories
/outputDir:bin/foo/$(Platform) 
/intermediateDir:obj/foo/$(Platform) 

/rebuild

# Build a texture
/importer:TextureImporter
/processor:TextureProcessor
/processorParam:ColorKeyEnabled=false
/build:Textures\wood.png
/build:Textures\metal.png
/build:Textures\plastic.png
```

You can pass this to MGCB using

```bash
MGCB /platform:Android /@:MyFile.mgcb
```

This will process the file and build your content, again on a Mac prefix the command with 'mono'

Note that in in both cases I passed the /platform parameter and used the $(Platform) macro's in the command line and the response file. This allows me to produce different content per platform. A good example of this is with textures, to get the most out of the iOS platform its best to produce PVRTC compressed textures. MGCB knows which texture compression works best on each platform and will optimise your content accordingly, as a result an .xnb build for iOS won't work on Android. Well it might but only if the GPU on the device supports that texture compression. In reality its best to compile your content for each platform, that said for desktop platforms (Windows, Linux, Mac) you can get away with using the same content as most GPU's on desktop PC's/Mac support DXT texture compression.

Those of you familiar with XNA will have noticed familiar 'processorParam' values in the sample response file above. The great news is that all the various processor parameters on the various processors you had in XNA are also available in MonoGame.

### Pipeline.exe

This tool is just a GUI over the top of MGCB.exe, currently its only available on windows, but it is being ported to Mac and Linux. When you create a new project file it creates an .mgcb file which to totally compatible with the response file mentioned earlier. So you can hand edit it, or use the tooling its up to you. The Pipeline tool is in the early stages of development but its already useful enough to allow you to replace the existing XNA content projects.

I'm not going to go into the details of how to use the Pipeline tool as it's covered pretty well in the [documentation](http://www.monogame.net/documentation/?page=Pipeline). Like the MGCB tool it is included in the latest [unstable](http://teamcity.monogame.net/viewLog.html?buildTypeId=MonoGame_DevelopWin&buildId=lastSuccessful&tab=artifacts&buildBranch=%3Cdefault%3E&guest=1#!ossgocr) installers and can be found in

```bash
c:\Program Files (x86)\MSBuild\MonoGame\Tools
```

It was a conscious decision on the team's part NOT to go down a tightly integrated MSBuild style solution for content processing. At the end of the day a stand alone console app gives the developer allot of flexibility on how they want to integrate content processing into there own build processes (some of you might just want to use Nant, ruby, make or some other build scripting tooling). That said there are some .targets files available for those of you who wish to make use of msbuild.

That said, the other nice thing is the Pipeline GUI tool has an import function (on windows) to import and existing XNA .contentproj file into a .mgcb file. So if you want to upgrade your existing projects to use the new tooling there is an easy route.

### Custom Content Processors

Now one of the fantastic things about the XNA content pipeline was the ability to extend it. The great news is that MonoGame supports that too, in fact the changes are if you have an existing XNA custom content processor (or importer) if you rebuild it against the MonoGame content pipeline assembles which are installed as part of the installer it should "just work". At some point I'm sure templates for both Visual Studio and Xamarin Studio will be available for those of you wanting to create your own processors.

### Things to remember

It is worth remembering that all of the work done on MonoGame is done in spare time and for free! So if there is a feature that doesn't work or hasn't been completed yet please remember that people work on this project because they love doing it they also have day jobs , families and other commitments.

One good example of this is the content processing on a Mac (and Linux), for the most part it will work for Textures, Models, Fonts and Audio (mostly) it will work fine, but there is no installer. Also shaders will NOT work, this is mainly because HLSL is just not supported on a Mac (On a side note the team are abut to embark on a project to support GLSL in the .fx file format which will allow users on a Mac to write their shaders using GLSL but at the time of writing if you use custom shaders you will need to compile those on a windows box).

People might be tempted to start complaining about how 'it doesn't work on a Mac or Linux' and yes the support for those platforms is lagging behind the windows support (mostly due to a lack of contributors on those platforms). But we are working on it so please be patient and if its a feature you really really really want and no one seems to be working on it please feel free to '_go [fork](https://github.com/mono/MonoGame/fork) and contribute'_, just let the team know what you are up to so two people don't end up working on the same thing.
