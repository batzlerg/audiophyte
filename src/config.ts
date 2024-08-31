import type { Site, SocialObjects } from "./types";

export const SITE: Site = {
  website: "https://audiophyte.com/", // replace this with your deployed domain
  author: "Graham Batzler",
  profile: "https://github.com/batzlerg/",
  desc: "a blog about technology, sound, ecology, and probably other stuff sometimes.",
  title: "audiophyte",
  ogImage: "astropaper-og.jpg",
  lightAndDarkMode: true,
  postPerIndex: 4,
  postPerPage: 3,
  scheduledPostMargin: 15 * 60 * 1000, // 15 minutes
};

export const LOCALE = {
  lang: "en", // html lang code. Set this empty and default will be "en"
  langTag: ["en-EN"], // BCP 47 Language Tags. Set this empty [] to use the environment default
} as const;

export const LOGO_IMAGE = {
  enable: false,
  svg: true,
  width: 216,
  height: 46,
};

export const SOCIALS: SocialObjects = [
  {
    name: "Github",
    href: "https://github.com/batzlerg/",
    linkTitle: ` ${SITE.title} on Github`,
    active: true,
  },
];
