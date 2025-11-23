use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Post {
    pub slug: String,
    pub title: String,
    pub date: String,
    pub summary: String,
    pub content: String,
}

/// Parse a markdown file with TOML frontmatter (+++...+++ delimiters)
/// Returns (title, date, content)
fn parse_markdown_with_frontmatter(raw: &str) -> (String, String, String) {
    let mut title = String::new();
    let mut date = String::new();
    let content: String;

    // Check for TOML frontmatter (starts with +++)
    if raw.starts_with("+++") {
        // Find the closing +++
        if let Some(end_idx) = raw[3..].find("+++") {
            let frontmatter = &raw[3..3 + end_idx];
            content = raw[3 + end_idx + 3..].trim().to_string();

            // Parse simple TOML key="value" pairs
            for line in frontmatter.lines() {
                let line = line.trim();
                if let Some(rest) = line.strip_prefix("title=") {
                    title = rest.trim().trim_matches('"').to_string();
                } else if let Some(rest) = line.strip_prefix("date=") {
                    date = rest.trim().trim_matches('"').to_string();
                }
            }
        } else {
            content = raw.to_string();
        }
    } else {
        content = raw.to_string();
    }

    (title, date, content)
}

/// Generate a summary from the first paragraph of content
fn generate_summary(content: &str) -> String {
    content
        .lines()
        .find(|line| !line.trim().is_empty())
        .unwrap_or("")
        .chars()
        .take(150)
        .collect::<String>()
        + if content.len() > 150 { "..." } else { "" }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Project {
    pub title: String,
    pub date: String,
    pub description: String,
    pub weight: i32,
    pub link_to: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Photo {
    pub title: String,
    pub description: String,
    pub image_url: String,
    pub link_to: String,
    pub weight: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MenuItem {
    pub name: String,
    pub url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Social {
    pub name: String,
    pub url: String,
    pub icon: String,
}

pub fn get_menu_items() -> Vec<MenuItem> {
    vec![
        MenuItem {
            name: "/codecanvas".to_string(),
            url: "/codecanvas".to_string(),
        },
        MenuItem {
            name: "/photos".to_string(),
            url: "/photos".to_string(),
        },
        MenuItem {
            name: "/projects".to_string(),
            url: "/projects".to_string(),
        },
        MenuItem {
            name: "/posts".to_string(),
            url: "/posts".to_string(),
        },
    ]
}

pub fn get_socials() -> Vec<Social> {
    vec![
        Social {
            name: "github".to_string(),
            url: "https://github.com/camerondurham/".to_string(),
            icon: "github".to_string(),
        },
        Social {
            name: "stackoverflow".to_string(),
            url: "https://stackoverflow.com/users/4676641/cam".to_string(),
            icon: "stack-overflow".to_string(),
        },
        Social {
            name: "linkedin".to_string(),
            url: "https://www.linkedin.com/in/cameron-durham/".to_string(),
            icon: "linkedin".to_string(),
        },
        Social {
            name: "hacker-news".to_string(),
            url: "https://news.ycombinator.com/user?id=super_linear".to_string(),
            icon: "hacker-news".to_string(),
        },
        Social {
            name: "spotify".to_string(),
            url: "https://open.spotify.com/user/mnakgi5690zc9bqpbyk8z59ma".to_string(),
            icon: "spotify".to_string(),
        },
        Social {
            name: "bluesky".to_string(),
            url: "https://bsky.app/profile/u64.bsky.social".to_string(),
            icon: "bluesky".to_string(),
        },
    ]
}

pub fn get_projects() -> Vec<Project> {
    vec![
        Project {
            title: "ch".to_string(),
            date: "2021-01-01".to_string(),
            description: "Docker config and shell manager for using containers as ad-hoc dev environments".to_string(),
            weight: 1,
            link_to: Some("https://github.com/camerondurham/ch".to_string()),
        },
        Project {
            title: "CS350 Docker".to_string(),
            date: "2020-01-01".to_string(),
            description: "Containerized development environment for USC CS104".to_string(),
            weight: 2,
            link_to: Some("https://github.com/csci104/docker".to_string()),
        },
        Project {
            title: "CFS-RS".to_string(),
            date: "2020-01-01".to_string(),
            description: "Completely Fair Scheduler implementation in Rust".to_string(),
            weight: 3,
            link_to: Some("https://github.com/camerondurham/cfs-rs".to_string()),
        },
        Project {
            title: "Runner".to_string(),
            date: "2020-01-01".to_string(),
            description: "Code execution engine with Docker".to_string(),
            weight: 4,
            link_to: Some("https://github.com/camerondurham/runner".to_string()),
        },
        Project {
            title: "Stack Overflow Client".to_string(),
            date: "2020-01-01".to_string(),
            description: "CLI client for Stack Overflow".to_string(),
            weight: 5,
            link_to: Some("https://github.com/camerondurham/stack-overflow-client".to_string()),
        },
    ]
}

/// Static post content loaded at compile time from markdown files
const POST_PS2_RAW: &str = include_str!("../../content/posts/ps2.md");
const POST_COFFEE_RAW: &str = include_str!("../../content/posts/coffee.md");

pub fn get_posts() -> Vec<Post> {
    // Parse each post from its markdown file
    let posts_raw = [
        ("ps2", POST_PS2_RAW),
        ("coffee", POST_COFFEE_RAW),
    ];

    let mut posts: Vec<Post> = posts_raw
        .iter()
        .map(|(slug, raw)| {
            let (title, date, content) = parse_markdown_with_frontmatter(raw);
            let summary = generate_summary(&content);
            Post {
                slug: slug.to_string(),
                title,
                date,
                summary,
                content,
            }
        })
        .collect();

    // Sort by date descending (newest first)
    posts.sort_by(|a, b| b.date.cmp(&a.date));
    posts
}

pub fn get_post_by_slug(slug: &str) -> Option<Post> {
    get_posts().into_iter().find(|p| p.slug == slug)
}

pub fn get_photos() -> Vec<Photo> {
    let mut photos = vec![
        Photo {
            title: "Twilight Epiphany".to_string(),
            description: "James Turrell Twilight Epiphany at Rice University (shared under Unsplash License)".to_string(),
            image_url: "https://images.unsplash.com/photo-1600047050118-8671c626b333?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80".to_string(),
            link_to: "https://unsplash.com/photos/E57BNhGGaGA".to_string(),
            weight: 1,
        },
        Photo {
            title: "sphere".to_string(),
            description: "Still life tests (shared under Unsplash License)".to_string(),
            image_url: "https://images.unsplash.com/photo-1607166291450-6956e8ad1719?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1471&q=80".to_string(),
            link_to: "https://unsplash.com/photos/mRoO9w08evU".to_string(),
            weight: 1,
        },
        Photo {
            title: "still 1".to_string(),
            description: "blue acryllic sphere (shared under Unsplash License)".to_string(),
            image_url: "https://images.unsplash.com/photo-1607166291254-0b493edab3e4?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D".to_string(),
            link_to: "https://unsplash.com/photos/black-ball-on-blue-sky-c9WkEaPBqLI".to_string(),
            weight: 2,
        },
        Photo {
            title: "still 4".to_string(),
            description: "Acryllic Monolith (shared under Unsplash License)".to_string(),
            image_url: "https://images.unsplash.com/photo-1628405242556-ed887753ff35?q=80&w=1429&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D".to_string(),
            link_to: "https://unsplash.com/photos/black-and-gray-box-on-white-surface-mBmKi1MHsn8".to_string(),
            weight: 2,
        },
        Photo {
            title: "still 2".to_string(),
            description: "3D printed grid photographed for Parsons Photo BFA Sophomore Thesis".to_string(),
            image_url: "/photos/still-2.jpg".to_string(),
            link_to: "https://unsplash.com/@cmrnrd".to_string(),
            weight: 3,
        },
        Photo {
            title: "still 3".to_string(),
            description: "3D printed pyramid for Parsons Photo BFA Sophomore Thesis".to_string(),
            image_url: "/photos/still-3.jpg".to_string(),
            link_to: "https://unsplash.com/@cmrnrd".to_string(),
            weight: 3,
        },
        Photo {
            title: "landscape 1".to_string(),
            description: "Cliffs of Moher, Ireland".to_string(),
            image_url: "https://images.unsplash.com/photo-1600307736977-f8ef93ab19f3?q=80&w=1587&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&fit=crop".to_string(),
            link_to: "https://unsplash.com/photos/gray-rocky-mountain-with-green-grass-5Fw46YFc03s".to_string(),
            weight: 4,
        },
        Photo {
            title: "architecture 1".to_string(),
            description: "Manhattan Office Space (shared under Unsplash License)".to_string(),
            image_url: "https://images.unsplash.com/photo-1703537804519-ccc1aa0f212d?q=80&w=1587&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D".to_string(),
            link_to: "https://unsplash.com/photos/a-very-tall-building-lit-up-at-night-sLtoWdA1PWc".to_string(),
            weight: 5,
        },
    ];
    photos.sort_by_key(|p| p.weight);
    photos
}
