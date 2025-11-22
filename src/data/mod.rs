use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Post {
    pub slug: String,
    pub title: String,
    pub date: String,
    pub summary: String,
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
            slug: "ps2".to_string(),
            title: "Polestar 2 Service Issues Documentation".to_string(),
            date: "2025-07-02".to_string(),
            summary: "Service issues documented for 2022 Polestar 2 (Performance + Pilot Package).".to_string(),
            content: r#"Service issues documented for 2022 Polestar 2 (Performance + Pilot Package).

### Issue 1: Front Suspension Noise/Wobble
- **Symptoms:** Knocking/wobble sounds from front wheels at 50+ mph, similar to unbalanced tires
- **Potential Cause:** Foam insulation pad between wheel and tire causing uneven mass distribution
- **Evidence:** [Highway noise video](https://youtu.be/GY7blfG6En8) | [Reddit discussion](https://www.reddit.com/r/Polestar/comments/1anfxk8/fyi_if_you_get_a_tire_wobble/)

### Issue 2: Low-Speed Knocking
- **Symptoms:** Knocking/creaking from front suspension when turning at low speeds
- **Documentation:** NHTSA ID 10244272 | [TSB 10244272 (2023)](https://static.nhtsa.gov/odi/tsbs/2023/MC-10244272-0001.pdf)

### Issue 3: Rear Axle Clicking
- **Symptoms:** Faint clicking from rear axles during 1-pedal deceleration (10-20mph)
- **Affected:** 2021-2022 Polestar 2
- **Evidence:** [Audio example](https://cdn.polestartechhub.com/uploads/6616cd04bfff4d0001bd68af/TJ%2036854_1.m4a)
- **Documentation:** NHTSA ID 10253278 | [TSB 10253278 (2024)](https://static.nhtsa.gov/odi/tsbs/2024/MC-10253278-0001.pdf)

### Resources
- [Polestar 2 Emergency Info](https://github.com/drittich/polestar2-emergency-info)
- [Polestar Tech Info](https://www.loopybunny.co.uk/polestar/)
- [NHTSA safety info for Polestar 2 (all years)](https://www.nhtsa.gov/vehicle/2022/POLESTAR/POLESTAR%252525202/5%25252520HB/AWD)
- [Polestar Performance Software Upgrade](https://www.polestar.com/us/performance-software-upgrade/)"#.to_string(),
        },
        Post {
            slug: "coffee".to_string(),
            title: "Coffee Log".to_string(),
            date: "2025-05-18".to_string(),
            summary: "An infrequently updated log of the coffees I've tried and prefer.".to_string(),
            content: r#"An infrequently updated log of the coffees I've tried and prefer.

Current favorite and the only one I've bought multiple times is Counter Culture's apollo roast. Their beans are consistently high quality and it's honestly a better value than some of the local roaster's beans I've bought.

Here's the Amazon link (not an affiliate link): [https://www.amazon.com/dp/B00RKD7SUU](https://www.amazon.com/dp/B00RKD7SUU)

| Coffee Roaster         | Roast Name                     | Last Updated | Notes |
| ---------------------- | ------------------------------ | ------------ | ----- |
| Roastery of Cave Creek | Cowgirl - Lighter Roast        | 2025-06-02   | Good light roast, somewhat fruity and notes of berries. Relatively cheap at ~$12 from Whole Foods |
| Counter Culture Coffee | Apollo - Coffee from Ethiopia  | 2025-05-18   | Nice light roast with fruity/citrus taste and smells great. On discount for ~$13.40 at Whole Foods |
| Trader Joe's           | Whole Bean Coffee Medium Roast | 2025-05-18   | By far my least favorite. Too dark for a "medium roast" |
| Cult                   | Colombian Dream                | 2025-05-03   | Says it's fruity but tastes slightly burnt. Cheapest at ~$11 at Fry's |
| Cartel                 | El Salvador Miramar            | 2025-04-19   | Light Roast "Washed" - Apple Galette, Walnut, White Grape notes |
| Peixoto                | Brazil Familia Peixoto         | 2025-03-30   | Medium roast with nutty/chocolate hints |
| Press                  | Bloom Light Roast              | 2025-03-30   | Fruity, light roast. So far my favorite |"#.to_string(),
        },
    ]
}

pub fn get_post_by_slug(slug: &str) -> Option<Post> {
    get_posts().into_iter().find(|p| p.slug == slug)
}
