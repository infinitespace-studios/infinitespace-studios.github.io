---
layout: default
permalink: /general/handling-multiple-screen-resolutions-in-monogame-for-android-part-1
title: "Handling multiple screen resolutions in MonoGame for Android – Part 1"
date: "2014-05-22"
categories: 
  - "android"
  - "csharp"
  - "gamedevelopment"
  - "general"
  - "monogame"
  - "xamarin-2"
tags: 
  - "android-2"
  - "csharp-2"
  - "gamedev"
  - "monogame"
  - "xamarin"
---

When developing for iOS or Windows Phone you don’t really need to take into account different screen resolutions. Yes the iPhone and iPad do scale things differently but on the iPad you provide some special content which will allow the system to scale you game and still get it to look nice.

On android its a different environment, there are many different devices, with different capabilities not only with screen resolutions but also CPU, memory and graphics chips. In this particular post I’ll cover how to write you game in such a way that it can handle all the different screen resolutions that the android eco-system can throw at you.

One of the nice things about XNA is that its been about a while and when you develop for Xbox Live you need to take into account screen resolutions because everyone has a different sized television. I came across this blog [post](http://www.david-amador.com/2010/03/xna-2d-independent-resolution-rendering/) which outlines a neat solution on handling this particular problem for 2D games. However rather than just bolting this code into a MonoGame android project I decided to update the [ScreenManager](http://create.msdn.com/en-US/education/catalog/sample/game_state_management) class to handle multiple resolutions. For those of you that have not come across the [ScreenManager](http://create.msdn.com/en-US/education/catalog/sample/game_state_management) class , it is used in many of the XNA samples to handle transitions of screens within your game. It also helps you break up you game into "Screen" which make for more maintainable code.

The plan is to add the following functionality to the ScreenManager

1. The ability to set a virtual resolution for the game.This is the resolution that you game is designed to run at, the screen manager will then use this information to scale all the graphics and input so that it works nicely on other resolutions.
2. Expose a Matrix property called Scale which we can use in the SpriteBatch to scale our graphics
3. Expose a Matrix property called InputScale , which is the inverse of the Scale matrix so we can scale the Mouse and Gesture inputs into the virtual resolution.
4. Expose an Vector2 property called InputTranslate  so we can translate our mouse and gesture inputs. This is because as part of the scaling will will make sure the game is always centered, so we will see a boarder around the game to take into account aspect ratio differences.
5. Add a Viewport property which will return the virtual viewport for the game rather than use the GraphicsDevice.Viewport

We need to define a few private fields to store the virtual width/height and a reference to the GraphicsDeviceManager.

```csharp
private int virtualWidth;
private int virtualHeight;
private GraphicsDeviceManager graphicsDeviceManager;
private bool updateMatrix =true;
private Matrix scaleMatrix = Matrix.Identity;

```

Next we add the new properties to the ScreenManager, we should probably have local fields for the these as it will save having to allocate a new Vector2/Viewport/Matrix each time the property is accessed. But for now this will work, we can optimize it later.

```csharp
public Viewport Viewport {
  get{ return new Viewport(0, 0, virtualWidth, virtualHeight);}
}

public Matrix Scale {get;private set;}

public Matrix InputScale {
  get { return Matrix.Invert(Scale); }
}

public Vector2 InputTranslate {
  get { return new Vector2(GraphicsDevice.Viewport.X, GraphicsDevice.Viewport.Y); }
}
```

The constructor needs to be modified to include the virtual Width/Height paramerters and to resolve the GraphicsDeviceManager from the game.

```csharp
public ScreenManager(Game game, int virtualWidth, int virtualHeight):base(game)
{
  // set the Virtual environment up
  this.virtualHeight= virtualHeight;
  this.virtualWidth= virtualWidth;
  this.graphicsDeviceManager=(GraphicsDeviceManager)game.Services.GetService(typeof(IGraphicsDeviceManager));
  // we must set EnabledGestures before we can query for them, but

  // we don't assume the game wants to read them.
  TouchPanel.EnabledGestures= GestureType.None;
}
```

Next is the code to create the Scale matrix. Update the Scale property to look like this. We use the updteMatrix flag to control when to re-generate the scaleMatrix so we don’t have to keep updating it every frame.

```csharp
private Matrix scaleMatrix = Matrix.Identity;
public Matrix Scale { 
  get {
    if(updateMatrix) {
      CreateScaleMatrix();
      updateMatrix =false;
    }
    return scaleMatrix;
  }
}

```

Now implement the CreateScale method, this method will return a Matrix which we wil use to tell the SpriteBatch how to scale the graphics when they finally get drawn.

```csharp
protected void CreateScaleMatrix() {
  scaleMatrix = Matrix.CreateScale((float)GraphicsDevice.Viewport.Width/ virtualWidth, (float)GraphicsDevice.Viewport.Width/ virtualWidth, 1f);
}

```

So what we have done so far is coded up all the properties we need to make this work. There are a few other methods we need to write. These methods will setup the GraphicsDevice viewport and ensure that we clear the backbuffer with a Color.Blank so we get that nice letterbox effect.

First thing to do is to update the Draw method of the ScreenManager to call a new method BeginDraw. This method will setup the Viewports and Clear the backbuffer.

```csharp
public override void Draw(GameTime gameTime) {
  BeginDraw();
  foreach(GameScreen screen in screens)
  {
    if(screen.ScreenState== ScreenState.Hidden)
      continue;
    screen.Draw(gameTime);
  }
}

```

The BeginDraw method calls a bunch of other methods to setup the Viewports. Here is the code

```csharp
protected void FullViewport ()
{ 
	Viewport vp = new Viewport (); 
	vp.X = vp.Y = 0; 
	vp.Width = DeviceManager.PreferredBackBufferWidth;
	vp.Height = DeviceManager.PreferredBackBufferHeight;
	GraphicsDevice.Viewport = vp;   
}

protected float GetVirtualAspectRatio ()
{
	return(float)virtualWidth / (float)virtualHeight;   
}

protected void ResetViewport ()
{
	float targetAspectRatio = GetVirtualAspectRatio ();   
	// figure out the largest area that fits in this resolution at the desired aspect ratio     
	int width = DeviceManager.PreferredBackBufferWidth;   
	int height = (int)(width / targetAspectRatio + .5f);   
	bool changed = false;     
	if (height > DeviceManager.PreferredBackBufferHeight) { 
		height = DeviceManager.PreferredBackBufferHeight;   
		// PillarBox 
		width = (int)(height * targetAspectRatio + .5f);
		changed = true;   
	}     
	// set up the new viewport centered in the backbuffer 
	Viewport viewport = new Viewport ();   
	viewport.X = (DeviceManager.PreferredBackBufferWidth / 2) - (width / 2); 
	viewport.Y = (DeviceManager.PreferredBackBufferHeight / 2) - (height / 2); 
	viewport.Width = width; 
	viewport.Height = height; 
	viewport.MinDepth = 0; 
	viewport.MaxDepth = 1;     	
	if (changed) {
		updateMatrix = true;
	}   
	DeviceManager.GraphicsDevice.Viewport = viewport;   
}

protected void BeginDraw ()
{   
	// Start by reseting viewport 
	FullViewport ();   
	// Clear to Black 
	GraphicsDevice.Clear (Color.Black);   
	// Calculate Proper Viewport according to Aspect Ratio 
	ResetViewport ();   
	// and clear that    
	// This way we are gonna have black bars if aspect ratio requires it and     
	// the clear color on the rest 
	GraphicsDevice.Clear (Color.Black);   
}

```

So first thing we do is reset the Full viewport to the size of the PrefferedBackBufferWidth/Height and then Clear it. Then we reset the viewport to take into account the aspect ratio of the virtual viewport and calculate the virtical/horizontal offsets to center the new viewport and then Clear that just to be sure.That is all the code changes for the ScreenManager. To use it all we need to do is add the extra parameters when we create the new ScreenManager like so

```csharp
screenManager=new ScreenManager (this, 800, 480);

```

You will need to pass in the resolution your game was designed for, in this case 800×480.Then in all the places where we call SpriteBatch.Begin() we need to pass in the screenManager.Scale matrix like so

```csharp
spriteBatch.Begin(SpriteSortMode.Immediate, null, null, null, null, null, ScreenManager.Scale);

```

Note that the SpriteBatch has a number of overloaded Begin methods, you will need to adapt your code if you use things like SamplesState, BlendState, etc. Each of the Game screens should already have a reference to the ScreenManager if you follow the sample code from Microsoft. Also if you make use of GraphicsDevice.Viewport in your game to place objects based on screen size (like ui elements) that will need to be changed to use the ScreenManager.Viewport instead so they are placed within the virtual Viewport. So in the MenuScreen the following call would change from

```csharp
position.X= GraphicsDevice.Viewport.Width/2- menuEntry.GetWidth(this)/2; 

```

to this

```csharp
position.X= ScreenManager.Viewport.Width/2- menuEntry.GetWidth(this)/2;

```

This should be all you need. In the next post we will look at the changes we need to make to the InputState.cs class to get the mouse and gesture inputs scaled as well.You can download a copy of the modified ScreenManager class [here](http://www.infinitespace-studios.co.uk/code/ScreenManager.cs).
