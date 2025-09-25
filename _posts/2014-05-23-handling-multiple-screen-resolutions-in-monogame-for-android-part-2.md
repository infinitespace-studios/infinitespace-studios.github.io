---
layout: default
title: "Handling multiple screen resolutions in MonoGame for Android – Part 2"
date: "2014-05-23"
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
permalink: /general/handling-multiple-screen-resolutions-in-monogame-for-android-part-2/
summary: "Part 2 of scaling input (mouse and touch gestures) to work with virtual resolutions in MonoGame for Android"
---

In my previous [post](http://infinitespace-studios.co.uk/general/handling-multiple-screen-resolutions-in-monogame-for-android-part-1) we looked at how to modify the [ScreenManager](http://create.msdn.com/en-US/education/catalog/sample/game_state_management) class to support multiple resolutions. This works fine but what we also need is a way to scale the inputs from the Mouse or TouchScreen so that they operate at the same virtual resolution as the game does.

We already put in place the following properties in the ScreenManager

```
property Matrix InputScale …..
property Vector2 InputTranslate  …..

```

InputScale is the Inverse of the Scale matrix which will allow use to scale the input from the mouse into the virtual resolution. InputTranslate needs to be used because we sometimes put a letterbox around the gameplay area to center it and the input system needs to take this into account (otherwise you end up clicking above menu items rather than on them).

So we need to update the InputState.cs class which comes as part of the [Game State Management](http://create.msdn.com/en-US/education/catalog/sample/game_state_management) example. First thing we need to do is to add a property to the InputState class for the  ScreenManager.

```
public ScreenManager ScreenManager
{
  get; set;
}

```

and then update the ScreenManager constructor to set the property.

```
input.ScreenManager=this;

```

Now we need to update the InputState.Update method. Find the following line

```
CurrentMouseState = Mouse.GetState();

```

We now need to translate and scale the CurrentMouseState field into the correct virtual resolution. We can do that my accessing the ScreenManager property which we just added, so add the following code.

```
Vector2 _mousePosition = new Vector2(CurrentMouseState.X, CurrentMouseState.Y);
Vector2 p = _mousePosition - ScreenManager.InputTranslate;
p = Vector2.Transform(p, ScreenManager.InputScale);
CurrentMouseState =new MouseState((int)p.X, (int)p.Y, CurrentMouseState.ScrollWheelValue, CurrentMouseState.LeftButton, CurrentMouseState.MiddleButton, CurrentMouseState.RightButton, CurrentMouseState.XButton1, CurrentMouseState.XButton2);

```

This bit of code transforms the current mouse position and then scales it before creating a new MouseState instance with the new position values, but the same values for everything else. If the ScrollWheelValue is being used that might need scaling too.

Next stop is to scale the gestures, in the same Update method there should be the following code

```
Gestures.Clear();
while (TouchPanel.IsGestureAvailable) {
  Gestures.Add(TouchPanel.ReadGesture());
}

```

We need to change this code over to

```
Gestures.Clear();
while (TouchPanel.IsGestureAvailable) {
GestureSample g = TouchPanel.ReadGesture();
Vector2 p1 = Vector2.Transform(g.Position- ScreenManager.InputTranslate, ScreenManager.InputScale);
Vector2 p2 = Vector2.Transform(g.Position2- ScreenManager.InputTranslate, ScreenManager.InputScale);
Vector2 p3 = Vector2.Transform(g.Delta- ScreenManager.InputTranslate, ScreenManager.InputScale);
Vector2 p4 = Vector2.Transform(g.Delta2- ScreenManager.InputTranslate, ScreenManager.InputScale);
g =new GestureSample(g.GestureType, g.Timestamp, p1, p2, p3, p4);
Gestures.Add(g);
}

```

We use similar code to translate and scale each position and delta value from the GestureSample, then again create a new GestureSample with the new values.

That should be all you need to do. This will now scale both mouse and gesture inputs into the virtual resolution.

As before the complete code can be downloaded [here](http://www.infinitespace-studios.co.uk/code/InputState.cs), or you can download the both files [InputState.cs](http://www.infinitespace-studios.co.uk/code/InputState.cs) [ScreenManager.cs](http://www.infinitespace-studios.co.uk/code/ScreenManager.cs)

Update : The MouseGestureType is the InputState is from the CatapultWars sample and can be downloaded [here](http://www.infinitespace-studios.co.uk/code/MouseGestureType.cs)
