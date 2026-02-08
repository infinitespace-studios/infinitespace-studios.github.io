---
layout: default
title: "Oh Android you are a fickle creature.."
lang: en
date: "2014-06-05"
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
permalink: /general/oh-android-you-are-a-fickle-creature/
summary: "Fixing Android activity destruction on screen lock by adding ScreenSize to ConfigurationChanges in Xamarin.Android" 
---

So as you may have noticed I've been playing about allot with OpenGL and android recently and I started to see some very weird behaviour. The normal [activity life cycle](http://developer.xamarin.com/Guides/Android/Application_Fundamentals/Activity_Lifecycle/) states that when the lock screen is enabled, the activity will be Paused, then Stopped. This seemed to be the behaviour I saw in the devices I was testing on until I tried a Nexus 4.. On lock it would Pause, Stop then Destroy.. WFT! and it would only do this on the Nexus 4.

This caused me a big problem because the app I was putting together was a game, so if the screen locked in the middle of a game it wouldn't just pickup from where it left it would restart the entire app and loose your progress... Not happy.. So I spent ages looking at my code to try to figure out what was going on and I stumbled across the following property when messing about in my OnDestroy method of the Activity.

```csharp
this.ChangingConfigurations
```

Hmm, what was that property about. Well it turns out this property tells you which configurations changed. When I looked at this when in my OnDestroy method I was it had a value of ScreenSize… Hmm A bit more research lead me to this from the android docs.

> **Caution:** Beginning with Android 3.2 (API level 13), **the "screen size" also changes** when the device switches between portrait and landscape orientation. Thus, if you want to prevent runtime restarts due to orientation change when developing for API level 13 or higher (as declared by the [`minSdkVersion`](http://developer.android.com/guide/topics/manifest/uses-sdk-element.html#min) and[`targetSdkVersion`](http://developer.android.com/guide/topics/manifest/uses-sdk-element.html#target) attributes), you must include the `"screenSize"` value in addition to the`"orientation"` value. That is, you must decalare`android:configChanges="orientation|screenSize"`. However, if your application targets API level 12 or lower, then your activity always handles this configuration change itself (this configuration change does not restart your activity, even when running on an Android 3.2 or higher device).

So now it all makes sense.. When the nexus 4 (Andoid 4.3) was screen locking it was changing the Orientation to Portrait (helpful..not) which I was handling, **but** also raising a screen size config change, which I was not.. hence the OS destroying my activity. Normally when you get a new OpenGL based app in Xamarin.Android you get the following attributes added automagically to your activity.

```csharp
[Activity (Label = "Some app",
#if __ANDROID_11__
  HardwareAccelerated=false,
#endif
  ConfigurationChanges = ConfigChanges.Orientation | ConfigChanges.Keyboard | ConfigChanges.KeyboardHidden,
  MainLauncher = true)]
```

These tell android that you want to handle these changes and not the OS, so the OS doesn't restart you app when this stuff happens. Because of this change in Android 3.2+ we need to add the ScreenSize enumeration as well like so

```csharp
[Activity (Label = "Some app",
#if __ANDROID_11__
  HardwareAccelerated=false,
#endif
  ConfigurationChanges = ConfigChanges.Orientation | ConfigChanges.Keyboard | ConfigChanges.KeyboardHidden | ConfigChanges.ScreenSize,
  MainLauncher = true)]
```

Now our app can be paused and resumed as normal when you lock the screen without it restarting. Yay!
