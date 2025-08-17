const socials = [
  { name: "github", url: "https://github.com/camerondurham/", icon: "github" },
  { name: "stackoverflow", url: "https://stackoverflow.com/users/4676641/cam", icon: "stack-overflow" },
  { name: "linkedin", url: "https://www.linkedin.com/in/cameron-durham/", icon: "linkedin" },
  { name: "hacker-news", url: "https://news.ycombinator.com/user?id=super_linear", icon: "hacker-news" },
  { name: "spotify", url: "https://open.spotify.com/user/mnakgi5690zc9bqpbyk8z59ma", icon: "spotify" },
  { name: "bluesky", url: "https://bsky.app/profile/u64.bsky.social", icon: "bluesky" },
]

export default function SocialLinks() {
  return (
    <div className="border-t border-gray-200 dark:border-gray-700">
      <div className="flex space-x-4 justify-center py-8 max-w-4xl mx-auto">
        {socials.map((social) => (
          <a
            key={social.name}
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:opacity-70"
            style={{ color: 'var(--text-2)' }}
            title={social.name}
          >
            {social.name}
          </a>
        ))}
      </div>
    </div>
  )
}
