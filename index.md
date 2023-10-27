---
layout: default
title: "Infinitespace Studios"
permalink: /index
---

<ul>
  {% for post in site.posts %}
    <li>
      <a href="{{ post.url }}">{{ post.title }}</a> 
      <p>{{ post.summary }}</p>
    </li>
  {% endfor %}
</ul>