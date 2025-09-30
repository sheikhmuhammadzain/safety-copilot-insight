import { useState, useEffect, useRef } from "react";

interface TypewriterProps {
  words: string[];
  className?: string;
  typingSpeed?: number;
  deletingSpeed?: number;
  delayBetweenWords?: number;
}

export function Typewriter({
  words,
  className = "",
  typingSpeed = 80,
  deletingSpeed = 50,
  delayBetweenWords = 2000,
}: TypewriterProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [charIndex, setCharIndex] = useState(0);
  const animationRef = useRef<number>();

  useEffect(() => {
    const currentWord = words[currentWordIndex];

    if (isPaused) {
      const pauseTimer = setTimeout(() => {
        setIsPaused(false);
        setIsDeleting(true);
      }, delayBetweenWords);
      return () => clearTimeout(pauseTimer);
    }

    if (!isDeleting && currentText === currentWord) {
      setIsPaused(true);
      return;
    }

    if (isDeleting && currentText === "") {
      setIsDeleting(false);
      setCurrentWordIndex((prev) => (prev + 1) % words.length);
      setCharIndex(0);
      return;
    }

    // Variable speed based on character position for more natural feel
    const getSpeed = () => {
      if (isDeleting) {
        return deletingSpeed + Math.random() * 20; // Slight randomness
      } else {
        // Faster at start, slower at end for natural typing
        const progress = currentText.length / currentWord.length;
        const baseSpeed = typingSpeed;
        const variance = Math.random() * 30; // Human-like variance
        return baseSpeed + variance - (progress * 20);
      }
    };

    const timeout = setTimeout(
      () => {
        setCurrentText((prev) => {
          if (isDeleting) {
            return currentWord.substring(0, prev.length - 1);
          } else {
            return currentWord.substring(0, prev.length + 1);
          }
        });
        setCharIndex((prev) => (isDeleting ? prev - 1 : prev + 1));
      },
      getSpeed()
    );

    return () => clearTimeout(timeout);
  }, [currentText, isDeleting, isPaused, currentWordIndex, words, typingSpeed, deletingSpeed, delayBetweenWords, charIndex]);

  return (
    <span className="inline-block">
      <span 
        className={`${className} inline-block transition-all duration-75 ease-out`}
        style={{
          transform: `translateY(${isDeleting ? '1px' : '0px'})`,
        }}
      >
        {currentText}
      </span>
      <span 
        className="inline-block w-[3px] h-[0.9em] bg-primary ml-1 align-middle animate-[blink_1s_ease-in-out_infinite]"
        style={{
          animation: isPaused ? 'blink 0.7s ease-in-out infinite' : 'none',
          opacity: isPaused ? 1 : 0.9,
        }}
      />
      <style>{`
        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0.2; }
        }
      `}</style>
    </span>
  );
}
