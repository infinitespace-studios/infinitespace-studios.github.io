---
layout: default
title: "MonoGame - Content Pipeline ... Why???"
lang: en
date: "2015-06-29"
categories: 
  - "content-pipeline"
  - "gamedevelopment"
  - "general"
  - "monogame"
tags: 
  - "content-pipeline"
  - "gamedev"
  - "monogame"
permalink: /general/monogame-content-pipeline-why/
summary: "Explains why MonoGame's Content Pipeline is essential for optimizing game assets like textures, audio, shaders, and models for better performance and efficiency."
---

The MonoGame team have been putting allot of effort into a cross platform content pipeline, but given that for the most part we support loading native assets like .png, .mp3, .wav why bother? Well it all boils down to a couple of words.. performance, efficiency. Lets look at an example, graphics are probably the biggest asset a game uses, they are also a major resource hog. Textures will probably take up most of the room in your deployment and will be taking up most of the memory on your device as well.

### **Textures**

So lets say we have a 256x256 32 bit .png texture we are using in our game, we don't want to bother with all this compiling to .xnb rubbish that people do, so we just use the texture as a raw .png file. On disk .png is very impressive in its size, that image probably only takes up 2-5 kb on disk, keeping your application package size down. Great!

Now lets go through what happens when we load this .png from storage on a device (like an iPhone). Firstly its loaded from storage into memory and decompressed/unpacked from its compressed png format into raw bytes. This is done because the GPU on your device doesn't know how to use a png image directly, it can only use certain types of compression. So we unpacked the image into memory, this is 262,144 bytes , 256x256x4 , the x4 is because we have 1 byte per channel Red, Green, Blue and Alpha. Note that 262 KB  is quite a bit bigger than the compressed size. The next thing to do is create a texture for that data, because your device can't compress on the fly (yet) it has to use that data as is. So in creating the texture we used 262kb  of graphics memory on the GPU. That doesn't sound too bad, but if you are using larger textures say 1024x1024 then you are using 4 MB of GPU memory for that one texture. Multiply that over the number of textures in your game and you soon run out of texture memory on the GPU. Then the GPU has to swap that data out into system memory (if it supports that) or throw an error when you try to create textures that won't fit into available memory. So to sum up using

._pngs = smaller package size & higher memory usage & less textures_

Now let look at a texture pre-processed using the content pipeline, because we know we are targeting iOS we know the GPU's on those devices support PVRTC texture compression directly. So lets take our sample .png and compress that using PVRTC, what we end up with is a 32kb file (size depends on the texture,alpha channel etc). Hmm that is allot bigger than the .png on disk but that is not the whole story. The difference is there is no need to unpack/decompress it which saves on load time, also we can create a texture from that data directly so we only use 32kb of texture memory on the GPU not 262kb. That is a massive saving.

`_compress textures = larger package size (maybe) & lower memory usage & more textures_`

Now we just looked at iOS, but the same applies to desktop environments. Most desktop GPU's support DXT texture compression so the content pipeline will produce DXT compressed textures which can be loaded and used directly. The only platform which is a pain is android, because android does not have consistent support for compressed textures at the moment MonoGame has to decompress DXT on the device and use it directly. However even android will be getting compressed texture support. There is currently a piece of work happening where the pipeline tool will automatically pick a texture format to use, so for opaque textures it will use ETC1 (which is supported on all android devices but doesn't support alpha channels) but for textures with a alpha channel it will use RGBA4444 (dithered) but also allow the user to pick from a wide variety of compression options manually such as PVRTC, ATITC, DXT/S3TC, ETC1 and RGBA4444. This will give the developer the choice of what to use/support.

### **Audio**

Now lets look at audio. All the different platforms support different audio formats, if you are handling this yourself you will need to manually convert all your files and include the right ones for each platform. Would a better option be to keep one source file (be it .mp3, .wmv etc) and convert that to a supported format for the target platform at build time? Ok it makes for longer build times, but at least we know the music will work. MonoGame uses [ffmpeg](https://www.ffmpeg.org) to do the heavy lifting when converting between formats as it can pretty much convert any type to any other type which is really cool.

### **Shaders**

This is an area that causes real pain, custom shaders. There are a number of shading languages you can use depending on the platform you are targeting. For OpenGL based systems that is GLSL, for DirectX based systems its HLSL, there is also CG from nvidia. The Effect system in XNA/MonoGame was designed around the HLSL language. It is based around the .fx format which allows a developer to write both vertex and pixel shaders in one place. Historically both GLSL and HLSL have separate vertex and pixel shaders, HLSL until recently compiled and linked these at build time, GLSL does this at runtime. Now without a content pipeline or some form of tooling a developer would need to write two shaders, one for HLSL and one for GLSL. The good news is the MonoGame MGFX.exe tool can create a shader from an .fx format and have that work on GLSL. It does this by using an open source library called [libmojoshader](https://icculus.org/mojoshader/), which does some funky HLSL to GLSL instruction conversion to create OpenGL based shaders but rather than doing that at runtime we do it at build time so we don't need to deploy mojoshader with the OpenGL based games. All this saves you the hassle of having to write and maintain two shaders.

Now the drawback of MGFX is that is only runs on a windows box at the time of writing. This is because it needs the DirectX shader tooling to compile the HLSL before passing it to libmojoshader for conversion (for OpenGL platform targets). There is a plan in place to create a version of the .fx file format which supports GLSL directly so people who want to do custom shaders on a Mac or Linux can do, but this is still undergoing development so for now you need to use a windows box.

### **Models**

For the most part the model support in XNA/MonoGame is pretty good. XNA supports .x, .fbx files for 3D models, MonoGame, thanks to the excellent [assimp](http://assimp.sourceforge.net) project supports a much wider range of models including .3ds. However some of these formats might produce some weirdness at render time, only .fbx has been fully tested. Also note that [assimp](http://assimp.sourceforge.net) does not support the very old format .fbx files which ship with most of the XNA samples, so you'll need to convert those to the new format manually. On nice trick I found was to open the old .fbx in Visual Studio 2012+ and then save it again under a new name. Oddly VS seems to know about .fbx files and will save the model in the new format :).

Now what happens when you use a 3D model is that it is converted by the pipeline into an optimised internal format which will contain the Vertices, Texture Coordinates and Normals. The pipeline will also pull out the textures used in the model and put those through the pipeline too, so you automatically get optimised textures without having to do all of that stuff yourself.

### **Summary**

So hopefully you've got a good idea on why you should use the content pipeline in your games. Using the raw assets is ok when you are putting together a simple demo or proof of concept but sooner or later you will need to start optimising your content. My advice would be to use the Pipeline tooling from the outset so you get used to it.

Information on the Pipeline tool can be found [here](http://www.monogame.net/documentation/?page=Pipeline).

I will be covering in a future post how to produce custom content pipeline extensions for MonoGame which will allow you to optimise your own content or customise/extend existing content processors.

Until then Happy Coding.
