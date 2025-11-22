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

## Testing

To verify the application is running correctly:

1. Start the development server:
   ```bash
   trunk serve
   ```

2. Test the server with curl:
   ```bash
   # Check the homepage loads (should return HTTP 200)
   curl -I http://127.0.0.1:8080/

   # Check the posts listing page
   curl -I http://127.0.0.1:8080/posts

   # Check individual post pages
   curl -I http://127.0.0.1:8080/posts/coffee
   curl -I http://127.0.0.1:8080/posts/ps2
   ```

3. Open http://127.0.0.1:8080 in your browser to see the site

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
│   │   ├── post_detail.rs # Individual post page
│   │   ├── projects.rs  # Projects listing
│   │   └── photos.rs    # Photos gallery
│   └── data/            # Data models and content
│       └── mod.rs       # Content data structures
├── content/
│   └── posts/           # Markdown post files
│       ├── coffee.md
│       └── ps2.md
├── index.html           # HTML template
├── style.css            # Global styles
├── Cargo.toml           # Rust dependencies
└── Trunk.toml           # Trunk configuration
```

## Adding New Posts

Posts are written as Markdown files in `content/posts/` and loaded at compile time.

### Step 1: Create a Markdown File

Create a new `.md` file in `content/posts/` with TOML frontmatter:

```markdown
+++
title="Your Post Title"
date="2025-01-15"
+++

Your post content here in Markdown format.

### Subheadings work

- Lists work
- **Bold** and *italic* work
- [Links](https://example.com) work

| Tables | Also | Work |
|--------|------|------|
| cell   | cell | cell |
```

### Step 2: Register the Post in Rust

Edit `src/data/mod.rs` to include the new post:

1. Add a new `include_str!()` constant:
   ```rust
   const POST_YOUR_SLUG_RAW: &str = include_str!("../../content/posts/your-post.md");
   ```

2. Add the slug and constant to the `posts_raw` array in `get_posts()`:
   ```rust
   let posts_raw = [
       ("ps2", POST_PS2_RAW),
       ("coffee", POST_COFFEE_RAW),
       ("your-slug", POST_YOUR_SLUG_RAW),  // Add this line
   ];
   ```

### Step 3: Rebuild

The post will be available at `/posts/your-slug` after rebuilding:

```bash
trunk serve
```

### Frontmatter Fields

| Field   | Required | Description                    |
|---------|----------|--------------------------------|
| `title` | Yes      | Display title for the post     |
| `date`  | Yes      | Publication date (YYYY-MM-DD)  |

Posts are automatically sorted by date (newest first).

## Technologies

- **Leptos**: Reactive web framework
- **leptos_router**: Client-side routing
- **leptos_meta**: HTML meta tags management
- **Trunk**: WASM bundler and dev server

## Original Site

This site was previously built with [Zola](https://www.getzola.org/) static site generator. The Zola configuration and content files are still present in the repository for reference.

## License

Personal website content © Cameron Durham
