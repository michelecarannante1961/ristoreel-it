export type NavLink = {
  href: string
  label: string
  match: (path: string) => boolean
}
export function navLinks(): NavLink[] {
  return [
    { href: "/", label: "Esplora", match: (path) => path === "/" },
    {
      href: "/video",
      label: "Studio video",
      match: (path) => path.startsWith("/video"),
    },
    {
      href: "/image",
      label: "Fotogrammi",
      match: (path) => path.startsWith("/image"),
    },
    {
      href: "/assets",
      label: "La mia libreria",
      match: (path) =>
        path.startsWith("/assets") || path.startsWith("/projects"),
    },
    {
      href: "/effects",
      label: "Stili e regia",
      match: (path) => path.startsWith("/effects"),
    },
    {
      href: "/pricing",
      label: "Prezzi",
      match: (path) => path.startsWith("/pricing"),
    },
  ]
}
