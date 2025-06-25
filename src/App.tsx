import { useAtom } from "jotai";
import { screenAtom } from "./store/screens";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { useState, useEffect, Suspense, lazy } from "react";
import MobileBottomNav from "./components/MobileBottomNav";

// Lazy load main screens with default imports
const Home = lazy(() => import("./screens/Home"));
const IntroLoading = lazy(() => import("./screens/IntroLoading"));
const Outage = lazy(() => import("./screens/Outage"));
const OutOfMinutes = lazy(() => import("./screens/OutOfMinutes"));
const Intro = lazy(() => import("./screens/Intro"));
const Instructions = lazy(() => import("./screens/Instructions"));
const Conversation = lazy(() => import("./screens/Conversation"));
const FinalScreen = lazy(() => import("./screens/FinalScreen"));
const Settings = lazy(() => import("./screens/Settings"));
const Auth = lazy(() => import("./screens/Auth"));
const Profile = lazy(() => import("./screens/Profile"));
const Chat = lazy(() => import("./screens/Chat"));

function App() {
  const [{ currentScreen }] = useAtom(screenAtom);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const renderScreen = () => {
    switch (currentScreen) {
      case "home":
        return <Home />;
      case "introLoading":
        return <IntroLoading />;
      case "outage":
        return <Outage />;
      case "outOfMinutes":
        return <OutOfMinutes />;
      case "intro":
        return <Intro />;
      case "settings":
        return <Settings />;
      case "instructions":
        return <Instructions />;
      case "conversation":
        return <Conversation />;
      case "finalScreen":
        return <FinalScreen />;
      case "auth":
        return <Auth />;
      case "profile":
        return <Profile />;
      case "chat":
        return <Chat />;
      default:
        return <Home />;
    }
  };

  const showHeaderFooter = !["introLoading", "home", "auth", "profile", "chat"].includes(currentScreen);
  const showMobileNav = isMobile && ["home", "profile", "chat", "settings", "instructions"].includes(currentScreen);

  return (
    <main className={`flex h-svh flex-col items-center justify-between bg-black ${isMobile ? 'p-3' : 'gap-3 p-5 sm:gap-4 lg:p-8'}`}>
      {showHeaderFooter && <Header />}
      <div className="flex-1 w-full flex items-center justify-center">
        <Suspense fallback={<div className="text-white text-lg">Loading...</div>}>
          {renderScreen()}
        </Suspense>
      </div>
      {showHeaderFooter && <Footer />}
      {showMobileNav && <MobileBottomNav />}
    </main>
  );
}

export default App;