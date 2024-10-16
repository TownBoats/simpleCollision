import React, { useEffect, useRef } from 'react';
import { Howl } from 'howler';

const LearnHowl = () => {
  const soundRef = useRef(null);

  useEffect(() => {
    // Initialize the Howl instance
    soundRef.current = new Howl({
      src: [process.env.PUBLIC_URL + '/sounds/collision.wav'], // Replace with your audio file path
      volume: 0.5, // Adjust the volume (0.0 to 1.0)
      onload: () => {
        console.log('Audio loaded successfully');
      },
      onloaderror: (id, error) => {
        console.error('Failed to load audio:', error);
      },
      onplay: () => {
        console.log('Audio playback started');
      },
      onend: () => {
        console.log('Audio playback finished');
      },
    });

    // Clean up when the component unmounts
    return () => {
      if (soundRef.current) {
        soundRef.current.unload();
      }
    };
  }, []);

  const handlePlay = () => {
    if (soundRef.current) {
      soundRef.current.play();
    }
  };

  const handlePause = () => {
    if (soundRef.current) {
      soundRef.current.pause();
    }
  };

  const handleStop = () => {
    if (soundRef.current) {
      soundRef.current.stop();
    }
  };

  return (
    <div>
      <h2>Audio Player Example</h2>
      <button onClick={handlePlay}>Play Sound</button>
      <button onClick={handlePause}>Pause Sound</button>
      <button onClick={handleStop}>Stop Sound</button>
    </div>
  );
};

export default LearnHowl;
