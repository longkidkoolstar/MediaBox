
import { Link } from "react-router-dom";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background/80 border-t border-border py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4 text-primary">MediaBox</h3>
            <p className="text-muted-foreground">
              Discover and stream your favorite movies, TV shows, and anime all in one place.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="text-foreground/70 hover:text-primary transition-colors">Home</Link></li>
              <li><Link to="/movies" className="text-foreground/70 hover:text-primary transition-colors">Movies</Link></li>
              <li><Link to="/tv" className="text-foreground/70 hover:text-primary transition-colors">TV Shows</Link></li>
              <li><Link to="/anime" className="text-foreground/70 hover:text-primary transition-colors">Anime</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><Link to="/terms" className="text-foreground/70 hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link to="/privacy" className="text-foreground/70 hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link to="/dmca" className="text-foreground/70 hover:text-primary transition-colors">DMCA</Link></li>
              <li><Link to="/contact" className="text-foreground/70 hover:text-primary transition-colors">Contact Us</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {currentYear} MediaBox. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
