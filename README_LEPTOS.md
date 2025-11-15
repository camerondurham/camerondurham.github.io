# Cameron Durham's Personal Site - Leptos Rewrite

This is a rewrite of my personal website using [Leptos](https://leptos.dev/), a full-stack web framework for Rust.

## Prerequisites

- [Rust](https://www.rust-lang.org/tools/install) (latest stable)
- WASM target for Rust
  ```bash
  rustup target add wasm32-unknown-unknown
  ```
- [Trunk](https://trunkrs.dev/) - WASM web application bundler
  ```bash
  cargo install trunk
  ```
- [wasm-bindgen-cli](https://rustwasm.github.io/wasm-bindgen/)
  ```bash
  cargo install wasm-bindgen-cli
  ```

**Quick setup** - Install all dependencies:
```bash
rustup target add wasm32-unknown-unknown
cargo install trunk wasm-bindgen-cli
```

## Development

To run the development server:

```bash
trunk serve --open
```

This will:
- Build the WASM application
- Start a local development server at http://127.0.0.1:8080
- Watch for file changes and automatically rebuild

## Building for Production

To build the optimized production bundle:

```bash
trunk build --release
```

The output will be in the `dist/` directory.

## Deployment

For GitHub Pages deployment:

1. Build the production bundle:
   ```bash
   trunk build --release
   ```

2. The `dist/` directory contains all the static files needed for deployment.

## Project Structure

```
├── src/
│   ├── lib.rs           # Main library entry point
│   ├── app.rs           # Root app component
│   ├── components/      # Reusable components
│   │   └── nav.rs       # Navigation component
│   ├── pages/           # Page components
│   │   ├── home.rs      # Home/About page
│   │   ├── posts.rs     # Posts listing
│   │   ├── projects.rs  # Projects listing
│   │   └── photos.rs    # Photos gallery
│   └── data/            # Data models and content
│       └── mod.rs       # Content data structures
├── index.html           # HTML template
├── style.css            # Global styles
├── Cargo.toml           # Rust dependencies
└── Trunk.toml           # Trunk configuration
```

## Technologies

- **Leptos**: Reactive web framework
- **leptos_router**: Client-side routing
- **leptos_meta**: HTML meta tags management
- **Trunk**: WASM bundler and dev server

## Original Site

This site was previously built with [Zola](https://www.getzola.org/) static site generator. The Zola configuration and content files are still present in the repository for reference.

## License

Personal website content © Cameron Durham
