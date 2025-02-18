'use client';

import Hero from '../components/Sections/Hero';
import Features from '../components/Sections/Features';
import Testimonials from '../components/Sections/Testimonials';
import ChatWidget from '../components/Chat/ChatWidget';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main>
        <Hero />
        <Features />
        <Testimonials />
      </main>

      {/* Chat Widget */}
      <ChatWidget />
    </div>
  );
}
