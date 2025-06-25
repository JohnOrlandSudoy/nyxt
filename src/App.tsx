import { useAtom } from "jotai";
import { screenAtom } from "./store/screens";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import {
  Home,
  IntroLoading,
  Outage,
  OutOfMinutes,
  Intro,
  Instructions,
  Conversation,
  FinalScreen,
  Settings,
  Auth,
  Profile,
  Chat,
} from "./screens";
import { useState, useEffect } from "react";

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

  return (
    <main className={`flex h-svh flex-col items-center justify-between bg-black ${isMobile ? 'p-3' : 'gap-3 p-5 sm:gap-4 lg:p-8'}`}>
      {showHeaderFooter && <Header />}
      <div className="flex-1 w-full flex items-center justify-center">
        {renderScreen()}
      </div>
      {showHeaderFooter && <Footer />}
    </main>
  );
}

export default App;