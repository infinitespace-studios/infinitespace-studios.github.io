---
layout: default
title: "Co-operoids"
permalink: /general/co-operoids
tag: monogame game
summary: Co-operative Asteroids, an modern spin on a classic.
---

So its been a while since I did any blog posts here. For the most part
I have been busy with live and family. However I finally managed to carve out some time to do some game development.

[![Co-operoids banner](images/co-operoids.png)]

## What is Co-operoids

So this idea was inspired by the excellent Kenney.NL simple space asset pack and my kids. I have always enjoyed playing console games
with my kids. But I've never really liked the every person for themselves nature of most games out there. Most of my kids fond memories around gaming are playing games such as Lego Star wars or Lego Harry Potter. The goal of these games was never adversarial, but co-operative.

This got me thinking, could I write a classic game which I enjoyed back in the day so I could play it with my kids or grand kids?
Enter Co-operoids! Probably a nice easy place to start, Asteroids is a classic. The gameplay is simple enough for anyone to pickup. In this case adding an additonal player was fairly trivial, but its more than that.

## Game Mechanics

So just shooting asteroids is fair enough, but how to we deal with things like when a player dies? In the lego games you re-spawn infinitely, but that felt a bit off. There needed to be an end game. Some co-op games end if one player dies. But in this case it felt better to only end the game if BOTH players die. This means the other player has a chance to keep going. I also added a mechanic where if they make it to the end of the level, the dead player will respawn. Thus allowing them to continue.

I also decided to add an extra life mechanic. However, it will not behave in the usual way. Typically the player picking up the extra life gets it. But that did not feel like it was in the spirit of the game. So the player most in need of a life gets it, not matter who picks up the extra life. This way you can work together to keep playing. This felt like a nice way to re-enforce the idea that helping each other is the way to win.

[![Co-operoids Gameplay](images/Co-operoids.webm)]

## Conslusion

This was a really enjoyable experience, similar to the game in 4 weeks challenge I took back in 2014. But its been 12 years since then. I've learnt allot. I would say technology has moved on but in this case I was using MonoGame still. The API for that library hasn't really changed since 2014, but that is a good thing. It means the knowledge on how to tackle things from over a decade ago is still relevant today.

The game will be released on [itch.io](https://infinitespace-studios.itch.io/co-operoids).
