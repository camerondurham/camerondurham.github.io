use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Post {
    pub title: String,
    pub date: String,
    pub content: String,
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
    pub description: Option<String>,
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

pub fn get_posts() -> Vec<Post> {
    vec![
        Post {
            title: "Polestar 2 Notes".to_string(),
            date: "2025-01-01".to_string(),
            content: "My experience and notes on the Polestar 2".to_string(),
        },
        Post {
            title: "Coffee Log".to_string(),
            date: "2025-05-18".to_string(),
            content: "An infrequently updated log of the coffees I've tried and prefer.".to_string(),
        },
    ]
}
