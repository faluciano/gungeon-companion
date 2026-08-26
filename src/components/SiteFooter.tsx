import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-line px-5 py-4 text-center text-[0.65rem] text-ink-faint">
      Fan-made companion · Item &amp; synergy data from the Enter the Gungeon
      community wiki. Not affiliated with Dodge Roll or Devolver Digital.
      <br />
      <a
        href="https://ko-fi.com/faluciano"
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-ink"
      >
        Support this project on Ko-fi
      </a>
      {" · "}
      <Link href="/privacy" className="underline hover:text-ink">
        Privacy
      </Link>
    </footer>
  );
}
