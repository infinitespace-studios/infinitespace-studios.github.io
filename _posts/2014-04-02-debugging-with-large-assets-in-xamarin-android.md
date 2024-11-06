---
title: "Debugging with Large Assets in Xamarin Android"
date: "2014-04-02"
categories: 
  - "android"
  - "csharp"
  - "general"
tags: 
  - "android-2"
  - "csharp-2"
  - "gamedev"
  - "xamarin"
---

So you have a great android project you are working on. It might be a game or an app it doesn't matter, the key thing is you have a ton of Assets you want to include. Not Resources, i.e stuff you find in the resources folder like layout/values etc, but Assets we are talking graphics, sound, music you name it.

If you have more than a few of these assets you are probably already suffering from fairly lengthy build times. Packaging those assets up into the .apk does take some time, unfortunately its just a side effect of how stuff works on android. The problem is these long build times make debugging the app a real issue. Its like going back to the days when you needed to get a coffee while your app builds. There is a way around it.. C# to the rescue :)

What you can do is write an Extension method for the Android.Content.Res.AssetManager which will conditionally look in the Assets in the .apk or get that data from an external file. So we upload all the assets in a zip file to the device and then just run the app with no assets in it what so ever. We get quick build and debug times and we only need to update that zip file if the assets change or stuff gets added.

So I put together this.

```
public static class AssetMgrExt {

	static Java.Util.Zip.ZipFile zip = null;

	public static void Initialize(string data) {
		zip = new Java.Util.Zip.ZipFile (data);
	}

	public static void Close() {
		zip.Close ();
		zip = null;
	}

	public static System.IO.Stream OpenExt(this Android.Content.Res.AssetManager mgr, string filename) {
#if !DEBUG
		return mgr.Open(filename);
#else
		if (zip != null) {
			var entry = zip.GetEntry(filename);
			if (entry == null)
				throw new Exception(string.Format("Could not find {0} in external zip", filename));
			try {
			
			using (var s = zip.GetInputStream(entry)) {
				System.IO.MemoryStream ms = new System.IO.MemoryStream();
				s.CopyTo(ms);
				ms.Position = 0;
				return ms;
			}
			}
			finally {
				entry.Dispose();
			}

		}
		else  {
			throw new InvalidOperationException("Call Initialize first!!");
		}
#endif
	}
}

```

Add it to your project. Call AssetMgrExt.Initialize("/mnt/sdcard/Dowloads/blah.zip") at the start of your app and AssetMgrExt.Close() at the end. Then replace all the calls to Assets.Open with Assets.OpenExt to get the data out (don't forget to free up that memory stream :) ). If you want to get an AssetFileDescriptor (i.e you use Assets.OpenFd) you can write a similar extension and mess about with ParcelFileDescriptor's etc , but for my own purposes this worked out great.

What I tend to do now is never add assets to the project unless its a small project. Instead I use this extension or something similar during the debugging/development process. For release builds I take a release .apk and run a post build task on it to add the assets later, that way I don't have to mess about with different projects or msbuild conditionals. I can just build the .apk in release mode and add the assets later before signing using

```
aapt add your.apk assets/someasset.foo
```

That is if for now. Happy coding!
