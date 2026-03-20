---
layout: default
title: "MonoGame - Equirectangular Skybox"
lang: en
permalink: /general/monogame-equirectangular-skybox
tag: monogame game
summary: Want a really nice looking Skybox? Equirectangular is your friend.
---

Want a gorgeous, seamless skybox for your MonoGame project without dealing with six cube-map textures? An equirectangular panorama mapped onto a sphere is the way to go. In this post I'll walk through a complete demo that renders a full-sphere skybox from a single panorama image using a custom HLSL shader. You can grab the full sample project from [GitHub](https://github.com/infinitespace-studios/Blog/tree/main/EquirectangularSkyboxDemo).

## What is a SkyBox?

A skybox is the background that surrounds the player in a 3D game. It gives the illusion of a distant environment — stars, mountains, clouds — without actually modeling any of that geometry. The two most common approaches are:

1. **Cube Map**: Six separate textures (one per face of a cube) stitched together.
2. **Equirectangular Panorama**: A single 2:1 image that wraps around a sphere.

Cube maps are the traditional choice, but they require you to produce and manage six separate images that must line up perfectly at the seams. An equirectangular panorama is a single file and they can be easily created in programes such as [Blender](https://blender.org), or sourced from the internet, such as [spacespheremaps.com](https://www.spacespheremaps.com/).

## What is Equirectangular? Sounds Complicated?

Not really! An equirectangular projection is the same thing you see on a flat world map — longitude maps to the horizontal axis and latitude maps to the vertical axis. The image has a 2:1 aspect ratio. The left and right edges represent the same longitude (they wrap), the top row is the north pole and the bottom row is the south pole.

The math to convert a 3D direction into a UV coordinate on this image is surprisingly simple:

```hlsl
float u = atan2(dir.z, dir.x) / (2.0 * PI) + 0.5;   // longitude → 0..1
float v = acos(dir.y) / PI;                         // latitude  → 0..1
```

That's it. Given any normalised direction from the camera, these two lines give you the texel to sample. No cube-face selection logic, no edge-blending.

### Building a Sphere

The skybox is rendered on the inside of a unit sphere centred at the origin. In the sample we have a `SphereMesh` class which generates this procedurally with configurable longitudinal slices and latitudinal stacks. The default is 32 slices × 16 stacks which gives a smooth-enough sphere without too many triangles. If you wanted to you could use an actual 3D model rather than generate one at runtime.

Only vertex positions are needed — no normals or texture coordinates — because the shader derives the sampling direction directly from the vertex position.

```csharp
_sphere = new SphereMesh(graphicsDevice, slices: 32, stacks: 16);
```

The mesh is built with a top pole vertex, intermediate rings of vertices, and a bottom pole vertex. Indices are generated for a triangle-fan top cap, quad strips in the middle, and a triangle-fan bottom cap. I'm not going to go into the code at this point, it's all in the sample on [GitHub](https://github.com/infinitespace-studios/Blog/tree/main/EquirectangularSkyboxDemo).

### The HLSL Shader

This is where the magic happens. The shader file `EquirectangularSkybox.fx` is intentionally minimal.
The snippets below pretty much cover the most complext parts, the rest of the `.fx` file is boiler plate code.
The sample makes use of `Macros.fxh` which is a header file from MonoGame. It defines a bunch of helper macros such as `SAMPLE_TEXTURE` which make it easier to write effects which work on all of MonoGame's platforms.

```hlsl
// Vertex Shader
VSOutput MainVS(VSInput input)
{
    VSOutput output;
    output.Position = mul(input.Position, RotationProjection);
    // Push to far plane so skybox never occludes scene geometry
    output.Position.z = output.Position.w;
    // The view direction IS the sphere vertex position
    output.ViewDir = normalize(input.Position.xyz);
    return output;
}

// Pixel Shader
float4 MainPS(VSOutput input) : SV_Target0
{
    float3 dir = normalize(input.ViewDir);
    float u = atan2(dir.z, dir.x) / (2.0 * 3.14159265358979) + 0.5;
    float v = acos(dir.y) / 3.14159265358979;
    return SAMPLE_TEXTURE(SkyMap, float2(u, v));
}
```

The `RotationProjection` matrix is the combined rotation-only view matrix multiplied by the projection matrix. Translation gets stripped on the C# side so the camera is always sitting at the centre of the sphere. We could probably zero out the matrix in the shader, but we would be wasting instructions since we'd end up doing it for every vertex. So its best to do it once in the C# code.

Then there's the line `output.Position.z = output.Position.w`, this pushes every skybox pixel to the maximum depth value (1.0), which means any scene geometry you draw afterwards will always render in front of the sky.

Over in the pixel shader, the interpolated view direction is converted to equirectangular UVs and used to sample the panorama texture. That's the same two-line `atan2`/`acos` formula we saw earlier doing all the heavy lifting.

### The Renderer

`EquirectangularSkyboxRenderer` ties everything together. Here's the rendering sequence.

```csharp
public void Draw(Matrix view, Matrix projection)
{
    // Disable depth writes — the sky is infinitely far away
    _gd.DepthStencilState = DepthStencilState.None;
    // Cull counter-clockwise — we're rendering from INSIDE the sphere
    _gd.RasterizerState = RasterizerState.CullCounterClockwise;

    // Strip translation from the view matrix
    Matrix rotationOnly = view;
    rotationOnly.M41 = 0f;
    rotationOnly.M42 = 0f;
    rotationOnly.M43 = 0f;
    rotationOnly.M44 = 1f;

    Matrix rotProj = rotationOnly * projection;

    _effect.Parameters["RotationProjection"].SetValue(rotProj);
    _effect.Parameters["SkyMap"].SetValue(SkyTexture);

    // Draw the sphere mesh
    _gd.SetVertexBuffer(_sphere.VertexBuffer);
    _gd.Indices = _sphere.IndexBuffer;
    foreach (EffectPass pass in _effect.CurrentTechnique.Passes)
    {
        pass.Apply();
        _gd.DrawIndexedPrimitives(PrimitiveType.TriangleList,
            baseVertex: 0, startIndex: 0,
            primitiveCount: _sphere.PrimitiveCount);
    }
}
```

The important bit here is stripping the translation from the view matrix. By zeroing out `M41`, `M42`, and `M43` the camera is always sitting at the centre of the sphere, no matter how far the player has moved in the world. The sky never shifts — exactly what you want.

We also set `DepthStencilState.None` so the skybox doesn't write to the depth buffer. It's infinitely far away, so it shouldn't interfere with any scene geometry. That way everything you draw afterwards will pass the depth test and render in front of the sky.

### The Camera

`QuaternionCamera` builds orientation from yaw and pitch floats using `Quaternion.CreateFromYawPitchRoll`. This avoids gimbal lock and gives smooth first-person mouselook. Each frame the mouse delta is accumulated, pitch is clamped to ±89°, and WASD movement is applied along the camera's local forward and right vectors.

```csharp
// Clamp pitch to avoid flipping
float maxPitch = MathHelper.ToRadians(89f);
Pitch = MathHelper.Clamp(Pitch, -maxPitch, maxPitch);

Quaternion orientation = Quaternion.CreateFromYawPitchRoll(Yaw, Pitch, 0f);
Vector3 forward = Vector3.Transform(-Vector3.UnitZ, orientation);
Vector3 right   = Vector3.Transform( Vector3.UnitX, orientation);
```

### Putting It All Together

When loading we load the Effect, the texture when create an `EquirectangularSkyboxRenderer` instance.
If we want to change the texture we can just assign the new value to `_skybox.SkyTexture`.

```csharp
var skyEffect = Content.Load<Effect>("Effects/EquirectangularSkybox");

// --- Procedural equirectangular sky texture ---------------------
_skyTexture = Content.Load<Texture2D>("Textures/earthlike_planet_close");

// --- Skybox renderer --------------------------------------------
_skybox = new EquirectangularSkyboxRenderer(GraphicsDevice, skyEffect);
_skybox.SkyTexture = _skyTexture;
_skybox.ShowWireframe = false;
```

In `Game1.cs` the draw order is straightforward:

```csharp
protected override void Draw(GameTime gameTime)
{
    GraphicsDevice.Clear(Color.Black);

    // 1. Draw skybox FIRST
    _skybox.Draw(_camera.View, _camera.Projection);

    // 2. Draw scene geometry (it will always appear in front)

    base.Draw(gameTime);
}
```

### Using Your Own Panorama

The demo ships with HDR panorama textures, but you can easily swap in your own. Download a free equirectangular HDRI from [Poly Haven](https://polyhaven.com/hdris) or [NASA SVS](https://svs.gsfc.nasa.gov/4851), convert it to PNG or JPEG, add it to `Content/Textures/`, register it in `Content.mgcb`, and change the `Content.Load<Texture2D>` call in `LoadContent`:

```csharp
_skyTexture = Content.Load<Texture2D>("Textures/MyPanorama");
```

The texture sampler is configured to wrap horizontally and clamp vertically — the exact behaviour needed for equirectangular mapping:

```csharp
private static readonly SamplerState SkyboxSampler = new SamplerState
{
    AddressU = TextureAddressMode.Wrap,   // longitude wraps
    AddressV = TextureAddressMode.Clamp,  // latitude clamps at poles
    Filter   = TextureFilter.Linear,
};
```

## Conclusion

An equirectangular skybox is simpler to set up than a traditional cube map and lets you use any panoramic photo or HDRI directly. The whole technique boils down to: generate a sphere, strip translation from the view matrix, and use two lines of trig in the pixel shader to sample a 2:1 panorama. The full demo project is available on [GitHub](https://github.com/infinitespace-studios/Blog/tree/main/EquirectangularSkyboxDemo) — clone it, swap in your favourite panorama, and you're good to go.
