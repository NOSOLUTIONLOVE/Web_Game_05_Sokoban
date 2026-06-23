import { SokobanGame } from './components/SokobanGame';
import { Footer } from './components/Footer';
import { BackgroundDecoration } from './components/BackgroundDecoration';

export default function App() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background text-foreground">
      <BackgroundDecoration />
      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-6 px-4 py-8">
        <SokobanGame />
        <Footer />
      </main>
    </div>
  );
}
