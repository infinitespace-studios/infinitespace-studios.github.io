---
layout: default
title: "MonoGame - Scaling your Game using RenderTargets and TouchPanel"
date: "2015-06-22"
categories: 
  - "csharp"
  - "gamedevelopment"
  - "general"
  - "monogame"
tags: 
  - "csharp-2"
  - "gamedev"
  - "monogame"
permalink: /general/monogame-scaling-your-game-using-rendertargets-and-touchpanel/
---

So in one of my previous blog posts we covered how to scale your game for multiple screen resolutions using the matrix parameter in the SpriteBatch. Like all good problems that was just one solution or many, and since then things have moved on a bit. While that technique is still valid, the bits we did about scaling the Touch Points are no longer really necessary. In this post we'll discover how to use the MonoGame Touch panel to get scaled inputs for touch and mouse as well as how to use RenderTargets to scale your game.

### **What is a Render Target?**

Ok so your new to gaming and you have no idea what this "RenderTarget" thing is. So at its simplest a [RenderTarget](https://msdn.microsoft.com/en-us/library/microsoft.xna.framework.graphics.rendertarget2d.aspx) is just a texture, its on the GPU and you can use it just like a texture. The main difference is you can tell the rendering system to draw directly to the RenderTarget, so instead of your graphics being drawn to the screen its drawn to the RenderTarget. Which you can then use as a texture for something else, like a SpriteBatch. Pretty cool eh :)

### Scaling your game

While RenderTargets are really useful for things like Differed Lighting and other shader based things, in our case we just want to use it to render our game. Supporting lots of different screen sizes is a pain, especially when doing 2D stuff, if you are supporting both Mobile and Desktop/Console you will need to support screen resolutions from 320x200 (low end android) to 1080p (HD TV) or bigger.. That is a huge range of screen sizes to make your game look good on. Quite a challenge.

So in our case rather than scaling all the graphics we are going to render our entire scene to a RenderTarget at a fixed resolution in this example 1366x768. Having a fixed resolution means we know EXACTLY how big our "game screen" will be, so we can make sure we have nice margins and make the graphics look great at that resolution. Once we have our scene rendered to the Render Target we can then scale that to it fits the device screen size. We'll introduce letter boxing support so we can keep the correct aspect ratio like we did in the previous blogs.

So lets look at some code.

Creating a Render Target in MonoGame is really easy, we add the following code to the Initialise method of our game

```
scene = new RenderTarget2D(graphics.GraphicsDevice, 1366, 768, false, SurfaceFormat.Color, DepthFormat.None, pp.MultiSampleCount, RenderTargetUsage.DiscardContents);
```

Next step is to actually use the Render Target. We do this in the Draw method

```
GraphicsDevice.SetRenderTarget(scene);
// draw your game
GraphicsDevice.SetRenderTarget (null);
```

As you can see we tell the GraphicsDevice to use our RenderTarget, we draw the game, then tell the GraphicsDevice to not use any RenderTarget. We can how just use a SpriteBatch as normal to draw the RenderTarget to the screen. The following code will just draw the RenderTarget in the top left of the screen without scaling

```
spriteBatch.Being();
spriteBatch.Draw(scene, Vector2.Zero);
spriteBtach.End();
```

However what we really need to do before we draw the RenderTarget is calculate a destination rectangle which will "scale" the RenderTarget so it fits within the confines of the screen, but also maintain its aspect ratio. This last bit is important because if you don't maintain the aspect ratio your graphics will distort.

So first this we need to do is calculate the aspect ratio of the RenderTarget and the Screen

```
float outputAspect = Window.ClientBounds.Width / (float)Window.ClientBounds.Height;
float preferredAspect = 1366 / (float)768;
```

Next we need to decide if we calculate the destination rectangle, but we need to add a "letter boxing" effect. these are black bars at the top and bottom of the screen (or to the left and right) which fill in the missing area so that we maintain aspect ration. Its a bit like watching a Wide Screen movie on an old TV, you get the black bars at the top and bottom. The code to do this is as follows

```
Rectangle dst;
if (outputAspect <= preferredAspect)
{
  // output is taller than it is wider, bars on top/bottom
  int presentHeight = (int)((Window.ClientBounds.Width / preferredAspect) + 0.5f);
  int barHeight = (Window.ClientBounds.Height - presentHeight) / 2;
  dst = new Rectangle(0, barHeight, Window.ClientBounds.Width, presentHeight);
}
else
{
  // output is wider than it is tall, bars left/right
  int presentWidth = (int)((Window.ClientBounds.Height * preferredAspect) + 0.5f);
  int barWidth = (Window.ClientBounds.Width - presentWidth) / 2;
  dst = new Rectangle(barWidth, 0, presentWidth, Window.ClientBounds.Height);
}
```

You can see from the code we calculate how much to offset the rectangle from the top and bottom/left and right of the screen to give the letterbox effect. This value is stored in barHeight/barWidth then used as the Top or Left values for the rectangle. The presentWidth/Height is the height of the destination rectangle. The width/height of the rect will match the ClientBounds depending on whether we are letter boxing at the top/bottom or left/right.

So with the destination rectangle calculated we can now use the following to draw the RenderTarget

```
graphics.GraphicsDevice.Clear(ClearOptions.Target, Color.Black, 1.0f, 0);
spriteBatch.Begin(SpriteSortMode.Immediate, BlendState.Opaque);
spriteBatch.Draw(renderTarget, dst, Color.White);
spriteBatch.End();
```

Note we clear the background black before drawing to get the nice black borders. You can change that colour to anything you like really.

### What about scaling the Input?

By using a fixed size render target we will need to do something about the Touch input. Its no good on a 320x200 screen getting a touch location of 320x200 and passing that into our game world which we think it 1366x760 as it won't be in the right place. Fortunately MonoGame has an excellent solution

```
TouchPanel.DisplayWidth = 1366;
TouchPanel.DispalyHeight = 768;
```

By setting the DisplayWidth/Height on the TouchPanel it will AUTOMATICALLY scale the input for you.. That is just awesome! But wait for it .. it gets even better. You can also easily turn the Mouse input into Touch input which is handy if you're  only interested in left click events.

```
TouchPanel.EnableMouseTouchPoint = true;
```

Now any mouse click on the screen will result in the Touch event. This is great if you want to debug/test with a Desktop app rather than messing about with mobile devices.

### Things to Consider

This is all great but to be honest scaling a 1366x768 texture down for 320x200 will look awful! So you need to be a bit smarter about the RenderTarget size you pick. One solution might be to detect the screen size and scale down the render target but factors of 2 (for example) and use smaller textures. For example at full resolution 1366x768 you use hight res textures (e.g @2x on iOS) but on lower resolution devices you use a RenderTarget of half the size of your normal one and normal sized textures. Obviously you will need to scale your games physics (maybe) and other aspects to take into account the smaller area you have to deal with.. or make use of a 2d matrix camera.

The point being that smaller devices don't always have the same capabilities are larger ones so you need to keep that in mind.

A full "Game1.cs" class with this code is available on gist [here](https://gist.github.com/dellis1972/feaf0d313c6fe05cae34).
