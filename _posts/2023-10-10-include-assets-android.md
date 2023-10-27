---
layout: default
title: "Include Assets in .net Android"
permalink: /general/include-assets-android
tag: .net android dotnet
summary: Learn how to include Android Assets from folders outside of your Project folder.
---

# Include Assets in .net Android

By default .net Android apps will auto include assets from the `Assets` folder
in your project directory. However there are times when you want to include assets
from a directory outside of your project. 

For a normal .net application you would do the following

```xml
<ItemGroup>
    <Content Include="../Resources/**/*">
        <CopyToOutputDirectory>Always</CopyToOutputDirectory>
    </Content>
</ItemGroup>
```

This will not work for .net Android. Assets need to be in a folder called `assets`.
So we need to provide a `Link` element which describes the final path inside the apk.
So instead of the above we can use the following.

```xml
<ItemGroup>
    <AndroidAsset Include="../Resources/**/*">
        <Link>Assets/%(RecursiveDir)%(FileName)%(Extension)</Link>
    </AndroidAsset>
</ItemGroup>
```

This will pick up the files in the `Resources` folder and place them in the `assets`
folder in the final apk.