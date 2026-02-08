---
layout: default
title: "Infinitespace Studios"
lang: en
permalink: /index
---

<ul class="post-list">
  {% for post in site.posts %}
    <li class="post-item">
      <a href="{{ post.url }}">
        <h2>{{ post.title }}</h2>
        {% if post.summary %}
          <p class="post-summary">{{ post.summary }}</p>
        {% endif %}
        <p class="post-meta">{{ post.date | date: "%B %d, %Y" }}</p>
      </a>
    </li>
  {% endfor %}
</ul>