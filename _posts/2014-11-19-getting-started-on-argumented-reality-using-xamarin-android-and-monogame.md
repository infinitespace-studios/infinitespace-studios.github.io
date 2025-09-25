---
layout: default
title: "Getting Started on Augmented Reality using Xamarin.Android and MonoGame"
date: "2014-11-19"
categories: 
  - "android"
  - "general"
  - "monogame"
  - "xamarin-2"
tags: 
  - "android-2"
  - "argumented-reality"
  - "monogame"
  - "xamarin"
permalink: /general/getting-started-on-argumented-reality-using-xamarin-android-and-monogame/
---

Xamarin recently published a interview with George Banfill from [LinkNode](http://linknode.co.uk) on their Augmented Reality product, you can see the full interview [here](http://blog.xamarin.com/app-spotlight-ventusars-augmented-reality-wind-turbines-with-monogame-video/). Since then I've had a number of requests from people wanting to know how to do this using MonoGame and Xamarin.Android. Believe it or not its simpler than you think to get started.

First thing you need is a class to handle the Camera. Google has done a nice job at giving you a very basic sample of a 'CameraVew' [here](http://developer.android.com/guide/topics/media/camera.html). For those of you not wishing to port that over to C# from Java (yuk) here is the code

```

public class CameraView : SurfaceView, ISurfaceHolderCallback {
        Camera camera;

        public CameraView (Context context, Camera camera) : base(context)
        {
                this.camera = camera;
		Holder.AddCallback(this);
		// deprecated setting, but required on 
                // Android versions prior to 3.0
		Holder.SetType(SurfaceType.PushBuffers);
	}

	public void SurfaceChanged (ISurfaceHolder holder, Android.Graphics.Format format, int width, int height)
	{
		if (Holder.Surface == null){
			// preview surface does not exist
			return;
		}

		try {
			camera.StopPreview();
		} catch (Exception e){
		}
		try {
			camera.SetPreviewDisplay(Holder);
			camera.StartPreview();
		} catch (Exception e){
			Android.Util.Log.Debug ("CameraView", e.ToString ());
		}
	}

	public void SurfaceCreated (ISurfaceHolder holder)
	{
		try {
			camera.SetPreviewDisplay(holder);
			camera.StartPreview();
		} catch (Exception e) {
			Android.Util.Log.Debug ("CameraView", e.ToString ());
		}
	}

	public void SurfaceDestroyed (ISurfaceHolder holder)
	{
	}
}
```

It might not be pretty but it does the job, also it doesn't handle a flipped view so that will need to be added.

The next step is to figure out how to show MonoGame's GameWindow and the Camera View at the same time. Again, that is quite easy we can use a FrameLayout like so.

```

protected override void OnCreate (Bundle bundle)
{
	base.OnCreate (bundle);
	Game1.Activity = this;
	var g = new Game1 ();
	FrameLayout frameLayout = new FrameLayout(this);
	frameLayout.AddView (g.Window);  
	try {
		camera = Camera.Open ();
		cameraView = new CameraView (this, camera);
		frameLayout.AddView (cameraView);
	} catch (Exception e) {
		// oops no camera
		Android.Util.Log.Debug ("CameraView", e.ToString ());
	}
	SetContentView (frameLayout);
	g.Run ();
}
```

This is almost the same as the normal MonoGame android code you get, but instead of just setting the ContentView to the game Window directly we just add that and the CameraView to a frame layout and add that. Note that the **order is important**, the last item will be on the bottom so we want to add the game view first so it is over the top of the camera.

Now this won't work out of the box because there are a couple of other small changes we need. First we need to set the SurfaceFormat of the game Window to Rgba8888, this is because it defaults to a format which does not contain an alpha channel. So if we leave it as is we will not see the camera view underneath the game windows since its opaque. We can change the surface format using

```
g.Window.SurfaceFormat = Android.Graphics.Format.Rgba8888;
```

We need to do that BEFORE we add that to the frameLayout though. Another thing to note not all devices support Rgba8888, not sure what you do in that case...

The next thing is we need to change our normal Clear colour in Game1 from the standard Color.CornflowerBlue to Color.Transparent

```
graphics.GraphicsDevice.Clear (Color.Transparent);
```

With those changes you should be done. Here is a screenshot, note the Xamarin logo in the top left this is drawn using a standard SpriteBatch call :) All the code for this project is available [here](https://github.com/infinitespace-studios/Blog/tree/master/InfiniteSpaceStudios.AR). I've not implemented the iOS version yet as I'm not an "iOS Guy" really, but I will accept pull requests :) [![Screenshot_2014-11-19-05-40-53](images/Screenshot_2014-11-19-05-40-53-300x180.png)](http://www.infinitespace-studios.co.uk/wp-content/uploads/2014/11/Screenshot_2014-11-19-05-40-53-e1416394068418.png)
