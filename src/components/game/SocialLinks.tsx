import {
  FaDiscord,
  FaReddit,
  FaYoutube,
  FaTwitch,
  FaXTwitter,
} from "react-icons/fa6";
import type { SocialLinks as SocialLinksType } from "@/types";

interface Props {
  socialLinks: SocialLinksType;
  glowColor: string;
}

const btnClass =
  "flex items-center justify-center w-7 h-7 rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition-colors";

export function SocialLinks({ socialLinks }: Props) {
  const { twitter, discord, reddit, youtube, twitch } = socialLinks;

  if (!twitter && !discord && !reddit && !youtube && !twitch) return null;

  return (
    <div className="flex items-center gap-1.5">
      {twitter && (
        <a
          href={twitter}
          target="_blank"
          rel="noopener noreferrer"
          className={btnClass}
          aria-label="X / Twitter"
        >
          <FaXTwitter />
        </a>
      )}
      {discord && (
        <a
          href={discord}
          target="_blank"
          rel="noopener noreferrer"
          className={btnClass}
          aria-label="Discord"
        >
          <FaDiscord />
        </a>
      )}
      {reddit && (
        <a
          href={reddit}
          target="_blank"
          rel="noopener noreferrer"
          className={btnClass}
          aria-label="Reddit"
        >
          <FaReddit />
        </a>
      )}
      {youtube && (
        <a
          href={youtube}
          target="_blank"
          rel="noopener noreferrer"
          className={btnClass}
          aria-label="YouTube"
        >
          <FaYoutube />
        </a>
      )}
      {twitch && (
        <a
          href={twitch}
          target="_blank"
          rel="noopener noreferrer"
          className={btnClass}
          aria-label="Twitch"
        >
          <FaTwitch />
        </a>
      )}
    </div>
  );
}
