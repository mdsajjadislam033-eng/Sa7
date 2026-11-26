/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-7e5eb42b'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "registerSW.js",
    "revision": "1872c500de691dce40960bb85481de07"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "50564bc4dacee3aa2eafeca59e3e2cb5"
  }, {
    "url": "pwa-512x512.png",
    "revision": "5bbe56ec76ab542e27d4ec2603d92605"
  }, {
    "url": "pwa-192x192.png",
    "revision": "f6cfb8defa08ea53743958f8a9849764"
  }, {
    "url": "index.html",
    "revision": "fc0eac9562a422f3324924e53447b994"
  }, {
    "url": "favicon.png",
    "revision": "4b412839994368e26d95302733e234b3"
  }, {
    "url": "favicon.ico",
    "revision": "780b7de059664ce5231794e5860e6ed7"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "8d8cf0e034f5aceca8ed1b3035618cc5"
  }, {
    "url": "assets/index-C6VDjYzy.js",
    "revision": null
  }, {
    "url": "assets/index-B6H9doaO.css",
    "revision": null
  }, {
    "url": "assets/aistudio/file_00000000453c81fa8a8c1f40fc1d2075_d2aede94.png",
    "revision": null
  }, {
    "url": "assets/aistudio/file_00000000106c8211bd48f93a232ba1ae_237ac49f.png",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "8d8cf0e034f5aceca8ed1b3035618cc5"
  }, {
    "url": "favicon.ico",
    "revision": "780b7de059664ce5231794e5860e6ed7"
  }, {
    "url": "favicon.png",
    "revision": "4b412839994368e26d95302733e234b3"
  }, {
    "url": "pwa-192x192.png",
    "revision": "f6cfb8defa08ea53743958f8a9849764"
  }, {
    "url": "pwa-512x512.png",
    "revision": "5bbe56ec76ab542e27d4ec2603d92605"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "50564bc4dacee3aa2eafeca59e3e2cb5"
  }, {
    "url": "manifest.webmanifest",
    "revision": "6c05d7abfb8260b4fd219b29b58b704c"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));

}));
