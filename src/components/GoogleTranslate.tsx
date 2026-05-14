"use client";

import { useEffect, useState } from "react";

// Add typescript declaration for google object
declare global {
  interface Window {
    google: any;
    googleTranslateElementInit: () => void;
  }
}

export function GoogleTranslate() {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  useEffect(() => {
    // Check if script is already present
    if (document.getElementById("google-translate-script")) {
      setIsScriptLoaded(true);
      return;
    }

    // Define initialization function
    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        {
          pageLanguage: "en",
          includedLanguages: "en,hi,bn,te,mr", // English, Hindi, Bengali, Telugu, Marathi
          autoDisplay: false,
        },
        "google_translate_element"
      );
    };

    // Inject the script
    const script = document.createElement("script");
    script.id = "google-translate-script";
    script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);
    
    setIsScriptLoaded(true);

    return () => {
      // Cleanup is usually not required for this widget, but good practice if needed
      // delete window.googleTranslateElementInit;
    };
  }, []);

  return (
    <div 
      id="google_translate_element" 
      style={{ display: "none" }} // We hide the default UI
      aria-hidden="true"
    />
  );
}
