import Link from "next/link"
import { Logo } from "./logo"
export function Footer() {
  return (
    <footer className="risto-footer">
      <div>
        <Logo />
        <p>La creatività incontra la ristorazione.</p>
      </div>
      <nav aria-label="Collegamenti a fondo pagina">
        <Link href="/video">Crea video</Link>
        <Link href="/#ambiti">I 20 ambiti</Link>
        <Link href="/assets">La tua libreria</Link>
        <Link href="/pricing">Prezzi</Link>
      </nav>
      <p>Studio dedicato alla ristorazione · Anteprima di sviluppo</p>
    </footer>
  )
}
