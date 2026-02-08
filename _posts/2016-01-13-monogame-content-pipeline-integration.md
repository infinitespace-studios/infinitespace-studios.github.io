---
layout: default
title: "MonoGame - Content Pipeline integration"
lang: en
date: "2016-01-13"
categories: 
  - "content-pipeline"
  - "gamedevelopment"
  - "general"
  - "monogame"
  - "msbuild"
tags: 
  - "content-pipeline"
  - "gamedev"
  - "monogame"
  - "msbuild"
permalink: /general/monogame-content-pipeline-integration/
summary: "How MonoGame's automatic content building system works through MSBuild integration across Windows, Mac, and Linux platforms"
---

In the past it might seem that Windows users of MonoGame get all the cool stuff, and Mac / Linux users are left out in the cold. To be honest for a while that was true, but the great news is that more recently that has begun to change. On going community efforts have resulted in both MacOS and Linux installers which will download and install templates into the Xamarin Studio and MonoDevelop. They also install the Pipeline tool which is a GUI you can use to build your content for your game.

All that was great, but again Windows has something that Mac and Linux developers just didn't have access to. Automatic Content Building, this is where you just include the .mgcb file in your project, set its Build Action to "MonoGameContentReference" and providing you created the project via one of the templates it would "just work". Your .xnb files would appear as if by magic in your Output Directory without all that messy manual linking of .xnbs.

So how does it work.. Well to fully understand we need to dig into MSBuild a bit :) I know recently I've been talking about MSBuild allot but thats because in my day job (@Xamarin) I'm dealing with it ALLOT! So its topical from my point of view ;)

So if you dig into your csproj which was created in Visual Studio via one of the MonoGame templates  you will see a number of things. The first is a **<MonoGamePlatform>** element. This element is used later to tell the MGCB (**M**ono**G**ame **C**ontent **B**uilder) which platform it needs to build for.  Next up is the **<MonoGameContentReference>** element which will contain a link to the .mgcb file.. This again is used later to tell MGCB which files to build. Note that you are not just limited to one of these. If you have multiple assets and different resolutions (e.g @2x stuff for iOS) you can have a separate .mgcb file for those and include that in your project. The system will collect ALL the outputs (just make sure they build into different intermediate directories).

The last piece of this system is the "MonoGame.Content.Builder.targets" file. This is the core of the system and you should be able to see the Import near the bottom of your .csproj. This .targets file is responsible for going through ALL the _MonoGameContentReference_ Items in the csproj and calling MGCB.exe for each of them to build the content, it will also pass

> /platform:$(MonoGamePlatform)

to the .exe to that it will build the assets for the correct platform. This is all done in the BeforeBuild msbuild event, so it will happen before the code is even built, just like the old XNA content references used to do. But this time you don't need to do any fiddling to get this to work on a command line, it will just work. Now calling an .exe on a build in a .targets isn't exactly magic, the magic bit is right here

> `<Target Name="BuildContent" DependsOnTargets="Prepare;RunContentBuilder" Outputs="%(ExtraContent.RecursiveDir)%(ExtraContent.Filename)%(ExtraContent.Extension)"> <CreateItem Include="$(ParentOutputDir)\%(ExtraContent.RecursiveDir)%(ExtraContent.Filename)%(ExtraContent.Extension)" AdditionalMetadata="Link=$(PlatformResourcePrefix)$(ContentRootDirectory)\%(ExtraContent.RecursiveDir)%(ExtraContent.Filename)%(ExtraContent.Extension);CopyToOutputDirectory=PreserveNewest" Condition="'%(ExtraContent.Filename)' != ''"> <Output TaskParameter="Include" ItemName="Content" Condition="'$(MonoGamePlatform)' != 'Android' And '$(MonoGamePlatform)' != 'iOS' And '$(MonoGamePlatform)' != 'MacOSX'" /> <Output TaskParameter="Include" ItemName="BundleResource" Condition="'$(MonoGamePlatform)' == 'MacOSX' Or '$(MonoGamePlatform)' == 'iOS'" /> <Output TaskParameter="Include" ItemName="AndroidAsset" Condition="'$(MonoGamePlatform)' == 'Android'" /> </CreateItem> </Target>`

This part is responsible for adding the resulting .xnb files to the appropriate ItemGroup for the platform that we are targeting. So in the case of a Desktop build like Windows, Linix we use Content. For iOS and Mac we use BundleResource and for Android we use AndroidAsset. Because we are doing this just before the Build process, when those target platforms actually build the content later they will pick up the items we added in addition to any other items that the projects themselves included.

Now the really interesting bit is that code above was not how it originally looked.. The problem with the old code was it didn't work with xbuild, which is what is used on Mac and Linux. So it just wouldn't work. But now the entire .targets file will run quite happily on Mac and Linux and have intact been included in the latest unstable installers. So if you want to try it out go and download the latest development installers and give it a go.

If you have an existing project and you want to upgrade to use the new content pipeline system you will need to do the following

1. Open your Application .csproj in an Editor.
2. In the first _<PropertyGroup>_ section add `<MonoGamePlatform>$(Platform)</MonoGamePlatform>` where $(platform) is the system you are targeting e.g Windows, iOS, Android.
3. Add the following lines right underneath the <MonoGamePlatform /> element `<MonoGameInstallDirectory Condition="'$(OS)' != 'Unix' ">$(MSBuildProgramFiles32)</MonoGameInstallDirectory> <MonoGameInstallDirectory Condition="'$(OS)' == 'Unix' ">$(MSBuildExtensionsPath)</MonoGameInstallDirectory>`
4. Find the <Import/> element for the CSharp (or FSharp) targets and underneath add `<Import Project="$(MSBuildExtensionsPath)\MonoGame\v3.0\MonoGame.Content.Builder.targets" />`

Now providing you have the latest development release this should all work. So if you have an old project go ahead and give it a try, its well worth it :)
