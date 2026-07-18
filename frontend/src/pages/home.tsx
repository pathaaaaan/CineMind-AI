import { motion } from "framer-motion";
import { ArrowRight, Brain, Database, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "../components/ui/button";

export function HomePage() {
  return (
    <div 
      className="relative -mx-4 -my-8 px-6 py-12 md:px-12 md:py-24 min-h-[calc(100vh-68px)] flex items-center bg-cover bg-center rounded-lg overflow-hidden border border-border"
      style={{
        backgroundImage: `linear-gradient(to right, rgba(0, 0, 0, 0.95) 40%, rgba(0, 0, 0, 0.35) 100%), url('https://image.tmdb.org/t/p/original/vL5LR6WdxWPjLPFRLe133jXWsh5.jpg')`
      }}
    >
      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center relative z-10 w-full">
      <section className="py-10">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-normal sm:text-5xl">CineMind AI</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
            Describe the movie you feel like watching. CineMind retrieves semantically relevant films and explains why each one fits.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/search">
              <Button>
                Start discovering
                <ArrowRight size={16} />
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="secondary">View dashboard</Button>
            </Link>
          </div>
        </motion.div>
      </section>
      <section className="grid gap-3">
        {[
          { icon: Database, title: "Retrieval first", text: "FAISS finds candidates before Gemini writes explanations." },
          { icon: Brain, title: "Semantic matching", text: "MiniLM embeddings understand tone, theme, and storytelling intent." },
          { icon: Sparkles, title: "Grounded explanations", text: "Each recommendation includes themes, genres, and narrative fit." }
        ].map((item) => (
          <div key={item.title} className="rounded-lg border border-border bg-muted p-5 shadow-sm">
            <item.icon className="text-primary" size={22} />
            <h2 className="mt-3 font-semibold">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p>
          </div>
        ))}
      </section>
    </div>
  </div>
  );
}

