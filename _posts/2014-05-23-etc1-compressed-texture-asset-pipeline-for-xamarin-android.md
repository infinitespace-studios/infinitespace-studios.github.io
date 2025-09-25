---
layout: default
title: "ETC1 Compressed Texture Asset Pipeline for Xamarin.Android"
date: "2014-05-23"
permalink: /general/etc1-compressed-texture-asset-pipeline-for-xamarin-android/
summary: Creating a custom MSBuild task to automatically convert PNG textures to ETC1 compressed format with alpha channel separation during Xamarin.Android builds.
categories: 
  - "android"
  - "csharp"
  - "gamedevelopment"
  - "general"
  - "xamarin-2"
tags: 
  - "android-2"
  - "csharp-2"
  - "gamedev"
  - "xamarin"
---

In my last post we looked at using ETC1 compressed textures on the Xamarin Android platform. In that case we just used the texture and some fancy shader magic to fake transparency. In this article we'll how we can split the alpha channel out to a separate file which we load at run time so we don't have to rely on the colour key.

One of the things that can be a pain is having to pre-process your content to generate compressed textures etc outside of your normal development processes. In this case it would be nice for the artist to give us a .png file and we add it to the project and as part of the build and packaging process we get the required compressed textures in the .apk. XNA did something similar with its content pipeline where all the content was processed during the build into formats optimised for the target platform (xbox, windows etc), [MonoGame](http://monogame.net) also has a similar content pipeline as does many other game development tools. Pre-processing your content is really important, because you don't want to be doing any kind of heavy processing on the device itself. While phones are getting more powerful every year, they still can't match high end PC's or consoles. In this article we'll look and hooking into the power of msbuild and xbuild ([Xamarin's](http://xamarin.com) cross platform version of msbuild) so implement a very simple content processor.

So what we want to do it this, be able to add a .png to our Assets folder in our project and have some magic happen which turns that .png file into a .etc1 compressed texture and save the alpha channel of the .png file to a .alpha file and have those files appear in the .apk. To do this we are going to need a few things

1. A Custom MSBuild Task to split out and convert the files
2. A .targets file in which we can hook into the [Xamarin.Android](http://xamarin.com) build process at the right points to call our custom task.
3. A way of detecting where the etc1tool is installed on the target system.

We'll start with the .targets file. First thing we need to know where in the [Xamarin.Android](http://xamarin.com) build process we need to do our fancy _bate and switch_ of the assets. Turns out after looking into Xamarin.Common.CSharp.targets file the perfect place to hook in is between the **_UpdateAndroidAssets_** target and the **_UpgradeAndroidInterfaceProxies_** target.  At the point where these targets run there is already a list of the assets in the project stored in the  **_@(\_AndroidAssetsDest)_** property, which is perfect for what we need. Getting the location of the **_etc1tool_** is also a bit of a breeze because again [Xamarin](http://xamarin.com) have done the hard work for us, there is a **_$(AndroidSdkDirectory)_** property onto which we just need to append tools/etc1tool in order to run the app. So thats 2) and 3) kinda sorted. Lets look at the code for the custom Task.

```csharp
public class CompressTextures : Task
{
    [Required]
    public ITaskItem[] InputFiles { get; set; }

    [Required]
    public string AndroidSdkDir { get; set; }

    [Output]
    public ITaskItem[] OutputFiles { get; set; }

    public override bool Execute ()
    {
        Log.LogMessage (MessageImportance.Low, "  CompressTextures Task");

        List items = new List ();
        var etc1tool = new Etc1Tool ();
        etc1tool.AndroidSdkDir = AndroidSdkDir;

        foreach (var item in InputFiles) {
            if (item.ItemSpec.Contains(".png")) {
                var etc1file = item.ItemSpec.Replace (".png", ".etc1");
                var alphafile = item.ItemSpec.Replace (".png", ".alpha");
                byte[] data = null;

                using (var bitmap = (Bitmap)Bitmap.FromFile (item.ItemSpec)) {
                    data = new byte[bitmap.Width * bitmap.Height];
                    for (int y = 0; y < bitmap.Height; y++) {
                        for (int x = 0; x < bitmap.Width; x++) {
                            var color = bitmap.GetPixel (x, y);
                            data [(y * bitmap.Width) + x] = color.A;
                        }
                    }
                }
                    
                if (data != null)
                    File.WriteAllBytes (alphafile, data);

                etc1tool.Source = item.ItemSpec;
                etc1tool.Destination = etc1file;
                etc1tool.Execute ();

                items.Add (new TaskItem (etc1file));
                items.Add (new TaskItem (alphafile));

                if (File.Exists (item.ItemSpec)) {
                    try {
                    File.Delete (item.ItemSpec);
                    } catch(IOException ex) {
                        // read only error??
                        Log.LogErrorFromException (ex);
                    }
                }

            } else {
                items.Add (item);
            }

        }
        OutputFiles = items.ToArray ();
        return !Log.HasLoggedErrors;
    }

    public class Etc1Tool {

        public string Source { get; set; }

        public string Destination { get; set; }

        public string AndroidSdkDir { get; set; }

        public void Execute() {

            var tool = Path.Combine (AndroidSdkDir, "tools/etc1tool");

            var process = new System.Diagnostics.Process ();
            process.StartInfo.FileName = tool;
            process.StartInfo.Arguments = string.Format (" {0} --encode -o {1}", Source, Destination);
            process.StartInfo.CreateNoWindow = true;
            process.Start ();
            process.WaitForExit ();
        }
    }
}
```

I'm not going to go into all the in's and out's of writing msbuild tasks, that is what [google](https://www.google.co.uk/#q=how+to+write+a+msbuild+task) and [bing](https://www.bing.com/search?q=How+to+write+an+msbuild+task) are for :). But if you look at the code we have two _**\[Required\]**_ properties , the AndroidSDKDir and the InputFiles. The InputFiles are going to be the list of files we get from **_@(\_AndroidAssetDest)_** and the AndroidSDKDir is obviously the _**$(AndroidSdkDirectory)**_ property. We also have an OutputFiles property which we use to populate a list with our new files once we have converted them. The code in the Execute method itself should be fairly easy to follow. For each of the files we extract the alpha channel and save that to a .alpha file, then call out to the etc1tool to compress the .png file to an .etc1 file, note we also deleted the original file so it does not get included in the final .apk. Don't worry this is a file in the `obj/<Configuration>/assets` directory not the original file we added to the project :).  Now we could make this more robust and make it conditional so it doesn't compress every .png in the assets list , but for now this will do the trick. So with the task code done, the .targets file now looks like this.

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<Project xmlns="http://schemas.microsoft.com/developer/msbuild/2003">
  <UsingTask TaskName="InfiniteSpace.Framework.Build.Tasks.CompressTextures" AssemblyFile="InfiniteSpace.Framework.Build.Tasks.dll"/>

  <Target Name="_CompressAssets" AfterTargets="UpdateAndroidAssets" 
      BeforeTargets="UpdateAndroidInterfaceProxies">
     <CompressTextures InputFiles="@(_AndroidAssetsDest)" AndroidSdkDir="$(AndroidSdkDirectory)">
        <Output TaskParameter="OutputFiles" ItemName="_CompressedTextures"/>
     </CompressTextures>
     <Touch Files="@(_CompressedTextures)" />
  </Target>
</Project>
```

Again this should be fairly easy to follow. The important bits are the **_AfterTargets_** and **_BeforeTargets_** values, this is where we hook into the build process. The next step is to include this target file in our project, we do this by adding the following line just under the Import statement for Xamarin.Android.CSharp.targets (or Novell.MonoDroid.CSharp.targets)

```xml
<Import Project="$PATH$/InfiniteSpace.Framework.Build.Tasks/Infinitespace.Common.targets" />
```

Now the $PATH$ bit depends on where you put the build tasks. For me I just added the project to my solution and used "../InfiniteSpace.Framework.Build.Tasks/Infinitespace.Common.targets", then did a small tweak in the .targets file so it loaded the assembly from the debug folder

```bash
AssemblyFile="./bin/$(Configuration)/InfiniteSpace.Framework.Build.Tasks.dll"
```

This worked for me in Xamarin Studio on the mac, and it sort of worked in Visual Studio on windows. However in both IDE's if you want to change the Task code you need to close and re-load the IDE since the assembly gets loaded during the build process and cannot be overwritten after that.

So with the msbuild task stuff hooked in, you should now be able to add a .png file to your assets folder and have it produce a .etc1 and .alpha for that file in your .apk. After that you can just load the .etc1 and .alpha files as you would any other resource. The [code](https://github.com/infinitespace-studios/Blog/tree/master/Etc1ContentPipeline) for this blog entry includes a sample project so you can see exactly how to load the files and use them for alpha.

As mentioned already the CompressTextures task could be improved. Some ideas might be

- Add the ability to compress other formats (PVRTC, ATITC, S3TC)
- Add the ability to read additional properties from the TaskItem to control if it needs to be compressed or not
- Add support for Resizing to a Power of 2 (POW2) ETC1 only supports POW2 textures I think.. PVRTC certainly only supports POW2.
- Add support for Colour Key, this wouldn't save the .alpha file.
- Add support for compressing the alpha channel to etc1.

I'll leave these ideas with you at the moment, I might look at implementing them myself at some point in the future. I know I mentioned looking at PVRTC , ATITC and S3TC texture support in my last article and I assure you I will get to that soon. In the meantime have fun playing with the code and I hope you find it useful.

The code for this blog entry can be downloaded from [https://github.com/infinitespace-studios/Blog/tree/master/Etc1ContentPipeline](https://github.com/infinitespace-studios/Blog/tree/master/Etc1ContentPipeline).
