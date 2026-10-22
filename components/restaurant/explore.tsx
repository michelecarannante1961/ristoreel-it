"use client"

/* eslint-disable @next/next/no-img-element */
import Link from "next/link"
import { useMemo, useState } from "react"
import {
  ArrowDown,
  ArrowUpRight,
  Clapperboard,
  Film,
  LayoutGrid,
  Search,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react"
import { RESTAURANT_AREAS } from "@/lib/restaurant/catalog"
import { PURPOSES } from "@/lib/restaurant/brief"

const inspirations = [
  {
    area: "menu",
    title: "Il piatto diventa protagonista.",
    subtitle: "Racconta il tuo menù",
    image: "piatto",
    video: "/media/ristorazione/ambito-01.mp4",
    badge: "REEL IN MOVIMENTO",
    large: true,
    idea: "Un primo piano del nostro piatto del giorno appena impiattato, vapore naturale e luce calda. La camera si avvicina lentamente al piatto sul pass.",
  },
  {
    area: "cucina",
    title: "Dietro ogni servizio.",
    subtitle: "Il lavoro della tua brigata",
    image: "cucina",
    video: "/media/ristorazione/ambito-03.mp4",
    badge: "DIETRO LE QUINTE",
    large: false,
    idea: "Lo chef e la brigata preparano la mise en place prima del servizio: mani al lavoro, ingredienti freschi, cucina ordinata.",
  },
  {
    area: "food-cost",
    title: "Valore in ogni ingrediente.",
    subtitle: "Food cost e redditività dei piatti",
    image: "ingredienti",
    video: "/media/ristorazione/ambito-02.mp4",
    badge: "FOOD COST & RESA",
    large: false,
    idea: "Selezione degli ingredienti freschi, controllo delle porzioni e impiattamento preciso per valorizzare la resa e la qualità di ogni ricetta.",
  },
]

function studioHref(area: string, purpose: string, idea?: string) {
  const params = new URLSearchParams({ ambito: area, obiettivo: purpose })
  if (idea) params.set("idea", idea)
  return `/video?${params}`
}

export function RestaurantExplore() {
  const [query, setQuery] = useState("")
  const [purpose, setPurpose] = useState<keyof typeof PURPOSES>("promozione")
  const [expanded, setExpanded] = useState<string | null>(null)
  const areas = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("it")
    return RESTAURANT_AREAS.filter((area) =>
      `${area.title} ${area.topics.join(" ")}`
        .toLocaleLowerCase("it")
        .includes(needle)
    )
  }, [query])
  return (
    <div className="risto-shell">
      <aside className="risto-rail" aria-label="Studio ristorazione">
        <p className="risto-eyebrow">IL TUO STUDIO</p>
        <Link href="/" className="risto-rail-active">
          <LayoutGrid size={17} /> Esplora
        </Link>
        <Link href="/video">
          <Clapperboard size={17} /> Crea video <ArrowUpRight size={14} />
        </Link>
        <Link href="/assets">
          <Film size={17} /> La tua libreria
        </Link>
        <div className="risto-rail-divider" />
        <p className="risto-eyebrow">IL TUO MONDO</p>
        <a href="#ambiti">
          <UtensilsCrossed size={17} /> Ambiti{" "}
          <span className="risto-count">20</span>
        </a>
        <a href="#come-funziona">
          <Sparkles size={17} /> Come funziona
        </a>
        <div className="risto-rail-note">
          <span className="risto-status-dot" /> Pensato per chi vive
          <br />
          la ristorazione, ogni giorno.
        </div>
      </aside>
      <div className="risto-main">
        <section className="risto-intro" aria-labelledby="ristovideo-title">
          <div>
            <p className="risto-eyebrow">
              <span className="risto-status-dot" /> LA CREATIVITÀ, AL TUO TAVOLO
            </p>
            <h1 id="ristovideo-title">
              Il tuo ristorante.
              <br />
              <span>Storie da far vedere.</span>
            </h1>
            <p className="risto-lead">
              Piatti, persone, esperienze. Crea video per raccontare il tuo
              locale,
              <br className="hidden md:block" /> formare la brigata e dare
              valore al tuo lavoro.
            </p>
          </div>
          <Link href="/video" className="risto-primary">
            Crea il tuo primo video <ArrowUpRight size={18} />
          </Link>
        </section>
        <section
          className="risto-showcase"
          aria-label="Idee per il tuo prossimo video"
        >
          {inspirations.map((item) => (
            <Link
              key={item.area}
              href={studioHref(item.area, purpose, item.idea)}
              className={`risto-story ${item.large ? "risto-story-large" : ""}`}
            >
              {item.video ? (
                <video
                  src={item.video}
                  poster={`/media/ristorazione/${item.image}.jpg`}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  aria-label={item.subtitle}
                />
              ) : (
                <img
                  src={`/media/ristorazione/${item.image}.jpg`}
                  alt={item.subtitle}
                  fetchPriority={item.large ? "high" : "auto"}
                />
              )}
              <div className="risto-story-shade" />
              <span className="risto-story-badge">{item.badge}</span>
              <span className="risto-story-arrow">
                <ArrowUpRight size={20} />
              </span>
              <div className="risto-story-copy">
                <p>{item.subtitle}</p>
                <h2>{item.title}</h2>
                <span>
                  Parti da questa idea <ArrowUpRight size={14} />
                </span>
              </div>
            </Link>
          ))}
        </section>
        <p className="risto-photo-note">
          Fotografie di ispirazione. I video vengono generati a partire dal tuo
          progetto.
        </p>
        <section className="risto-tools" aria-label="Strumenti di creazione">
          <div>
            <span className="risto-tool-icon">
              <Clapperboard size={22} />
            </span>
            <div>
              <h2>Uno studio. Più possibilità.</h2>
              <p>Testo, fotografie o una clip del tuo ristorante.</p>
            </div>
          </div>
          <div className="risto-tool-links">
            <Link href="/video?tab=create">
              Crea video <ArrowUpRight size={14} />
            </Link>
            <Link href="/video?tab=edit">
              Modifica una clip <ArrowUpRight size={14} />
            </Link>
            <Link href="/video?tab=motion">
              Controlla il movimento <ArrowUpRight size={14} />
            </Link>
          </div>
        </section>
        <section
          id="ambiti"
          className="risto-areas"
          aria-labelledby="ambiti-title"
        >
          <div className="risto-section-heading">
            <div>
              <p className="risto-eyebrow">DALLA CUCINA ALL’IMPRESA</p>
              <h2 id="ambiti-title">20 ambiti. Il tuo, da raccontare.</h2>
              <p>Ogni percorso parla la lingua del tuo lavoro.</p>
            </div>
            <a href="#catalogo">
              Esplora i percorsi <ArrowDown size={16} />
            </a>
          </div>
          <div className="risto-catalog-controls">
            <div
              className="risto-purpose-tabs"
              role="group"
              aria-label="Scopo del video"
            >
              {Object.entries(PURPOSES).map(([id, label]) => (
                <button
                  type="button"
                  key={id}
                  aria-pressed={purpose === id}
                  onClick={() => setPurpose(id as keyof typeof PURPOSES)}
                >
                  {label}
                </button>
              ))}
            </div>
            <label className="risto-search">
              <Search size={17} />
              <input
                aria-label="Cerca un ambito o un argomento"
                placeholder="Cerca un argomento…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
          </div>
          <p className="risto-result-count" aria-live="polite">
            {areas.length} percorsi ·{" "}
            {areas.reduce((count, area) => count + area.topics.length, 0)}{" "}
            argomenti
          </p>
          <div id="catalogo" className="risto-area-grid">
            {areas.map((area) => (
              <article className="risto-area" key={area.id}>
                <Link
                  className="risto-area-cover"
                  href={studioHref(area.id, purpose)}
                >
                  {area.video ? (
                    <video
                      src={area.video}
                      poster={area.cover}
                      autoPlay
                      loop
                      muted
                      playsInline
                      preload="metadata"
                    />
                  ) : (
                    <img src={area.cover} alt="" loading="lazy" />
                  )}
                  <span>{String(area.number).padStart(2, "0")}</span>
                  <span className="risto-area-go">
                    <ArrowUpRight size={18} />
                  </span>
                </Link>
                <div className="risto-area-body">
                  <p>{area.topics.length} argomenti</p>
                  <h3>
                    <Link href={studioHref(area.id, purpose)}>
                      {area.title}
                    </Link>
                  </h3>
                  <p className="risto-area-preview">
                    {area.topics.slice(0, 2).join(" · ")}
                  </p>
                  <button
                    type="button"
                    aria-expanded={expanded === area.id}
                    aria-controls={`topics-${area.id}`}
                    onClick={() =>
                      setExpanded(expanded === area.id ? null : area.id)
                    }
                  >
                    {expanded === area.id
                      ? "Chiudi argomenti −"
                      : "Tutti gli argomenti +"}
                  </button>
                  {expanded === area.id ? (
                    <ul id={`topics-${area.id}`} className="risto-topic-list">
                      {area.topics.map((topic) => (
                        <li key={topic}>
                          <Link
                            href={`${studioHref(area.id, purpose)}&argomento=${encodeURIComponent(topic)}`}
                          >
                            {topic} <ArrowUpRight size={12} />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
          {!areas.length ? (
            <div className="risto-empty">
              <h3>Nessun percorso trovato</h3>
              <p>Prova con “menù”, “servizio”, “allergeni” o “prenotazioni”.</p>
              <button type="button" onClick={() => setQuery("")}>
                Mostra tutti i percorsi
              </button>
            </div>
          ) : null}
        </section>
        <section id="come-funziona" className="risto-process">
          <div>
            <p className="risto-eyebrow">DALL’IDEA ALLA SCENA</p>
            <h2>
              Il tuo lavoro è già una storia.
              <br />
              Dagli un’inquadratura.
            </h2>
          </div>
          <ol>
            <li>
              <span>01</span>
              <h3>Scegli il tuo percorso</h3>
              <p>Un ambito, un argomento e l’obiettivo del video.</p>
            </li>
            <li>
              <span>02</span>
              <h3>Porta la tua identità</h3>
              <p>Descrivi la scena e aggiungi foto o clip del locale.</p>
            </li>
            <li>
              <span>03</span>
              <h3>Controlla e genera</h3>
              <p>
                Scegli modello e formato, verifica il preventivo e avvia la
                creazione.
              </p>
            </li>
          </ol>
        </section>
      </div>
    </div>
  )
}
