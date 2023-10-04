layout: page
title: "Welcome"
permalink: /

<ul>
  {% for post in site.posts %}
    <li>
      <a href="{{ post.url }}">{{ post.title }}</a>
    </li>
  {% endfor %}
</ul>

<ul>
  {% for page in site.pages %}
    <li>
      <a href="{{ post.url }}">{{ page.title }}</a>
    </li>
  {% endfor %}
</ul>