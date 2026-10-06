# Obby Ragdoll WebGL

Unity WebGL launcher prepared for static hosting.

The build files are intentionally stored uncompressed as `Build/or.wasm` and `Build/or.data`. This avoids the Brotli `Content-Encoding` header problem that can occur when `.br` files are served directly from GitHub/jsDelivr.

Open `index.html` through an HTTP(S) web host. Do not launch it with a `file://` URL.
