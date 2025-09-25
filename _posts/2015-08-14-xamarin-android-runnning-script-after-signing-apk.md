---
layout: default
title: "Xamarin Android - Running a script after Signing the APK"
date: "2015-08-14"
categories: 
  - "android"
  - "general"
  - "msbuild"
  - "xamarin-2"
tags: 
  - "android-2"
  - "msbuild"
  - "xamarin"
permalink: /general/xamarin-android-runnning-script-after-signing-apk/
summary: How to use MSBuild targets to run custom scripts after signing Android APK packages in Xamarin.Android projects.
---

One of the many requests I see from customers of Xamarin.Android is the ability to "_run a script"_ after the package has been built and signed, or do some process before the build process. Allot of people end up trying to use the CustomCommands which are available in the IDE to do this work, and shy away from getting down and dirty with MSBuild. The thing is, sometimes MSBuild is the only way to get certain things done.

Most people already know about the "SignAndroidPackage" target which is available on Xamarin.Android projects. If not basically you can use this target to create a Signed package, most people would use this on a Continuous Integration (CI) server. You can use it like so

```bash
  msbuild MyProject.csproj /t:SignAndroidPackage
```

Note that this target is ONLY available on the .csproj NOT the .sln but that is ok because MSBuild does its just of resolving projects etc and it should build fine. You can also pass in addition parameters to define your KeyStore etc, more information can be found in the excellent [documentation](http://developer.xamarin.com/guides/android/deployment,_testing,_and_metrics/publishing_an_application/part_2_-_signing_the_android_application_package/#_Signing_the_APK_) on the subject.

Now we want to run a script after this has been done, Custom Commands can't be used as they run at the wrong time in the build process, so what do we do? This is where MSBuild targets come in. What we need to do is add a custom MSBuild target which hooks into the build process After the SignAndroidPackage has run.

First thing to do is open the .csproj of your application in your favourite editor and find the last </Project> element right at the bottom of the file. Next we define a new target just _above_ the </Project> element like so

```xml
<Target Name="AfterAndroidSignPackage" AfterTargets="SignAndroidPackage">
   <Message Text="AfterSignAndroidPackage Target Ran" />
</Target>

```

Save the .csproj and then run the command

```bash
  msbuild MyProject.csproj /t:SignAndroidPackage
```

and you should see the text "AfterSignAndroidPackage Target Ran" in the build output.  If not add a /v:d argument to the command line, which switches the MSBuild output to verbose mode. The key thing here is the Target defines the _"AfterTargets"_ attribute which tells MSBuild when to run this script. In this case after the SignAndroidPackage, there is also a _"BeforeTargets"_ attribute which will run a target.. you guessed it.. before the target(s) listed in the attribute.

Now we have a target that will run after the package has been signed. Next this to do is to get it to run our script, for this we can use the MSBuild [Exec](https://msdn.microsoft.com/en-us/library/x8zx72cd.aspx) task. One thing to note is that its more than likely that some of your developers are running on Mac as well as Windows so we need to make sure that any command we do run will work on both systems.

Fortunately we have a way of conditionally executing targets using the [Condition](https://msdn.microsoft.com/en-us/library/7szfhaft.aspx) attribute. This means we can do something like

```xml
<Exec Condition=" '$(OS)' != 'Unix' " Command="dir" />
<Exec Condition=" '$(OS)' == 'Unix' " Command="ls" />

```

this allows us to run separate commands based on the OS we are running (in this case a directory listing). As you can see we can easily extend this to run a batch file or shell script. So the final target would be

```xml
<Target Name="AfterAndroidSignPackage" AfterTargets="SignAndroidPackage">
  <Exec Condition=" '$(OS)' != 'Unix' " Command="dir" />
  <Exec Condition=" '$(OS)' == 'Unix' " Command="ls" />
</Target>

```

MSBuild targets can also define Inputs and Outputs which will allow the build engine to decide if it needs to run the target at all. That is something that you can read up on if you are interested in learning more, but for now if you just want to "run a script after the apk is built" this is all you need.
