#!/bin/bash

cd build
mkdir forLocal forOnline

cp index.local.html  forLocal/index.html
cp cd-box-cbot-server.js forLocal/
cp static/js/main.*.js forLocal/main.js
cp static/css/main.*.css forLocal/main.css

cp index.online.html  forOnline/index.htm
cp cd-box-cbot-data.js forOnline/
cp cd-box-cbot-server.js forOnline/
cp static/js/main.*.js forOnline/main.js
cp static/css/main.*.css forOnline/main.css