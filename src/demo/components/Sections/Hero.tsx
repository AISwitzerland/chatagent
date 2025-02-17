'use client';

import React from 'react';

export default function Hero() {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-3xl">
          <h1 className="text-5xl font-bold mb-6">
            Ihre Sicherheit ist unsere Priorität
          </h1>
          <p className="text-xl mb-8">
            Swiss Insurance AG - Ihr vertrauenswürdiger Partner für alle Versicherungsfragen. 
            Profitieren Sie von unserer jahrelangen Erfahrung und massgeschneiderten Lösungen.
          </p>
          <div className="space-x-4">
            <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
              Beratung anfordern
            </button>
            <button className="border-2 border-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors">
              Mehr erfahren
            </button>
          </div>
          
          <div className="mt-12 grid grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">50+</div>
              <div className="text-blue-100">Jahre Erfahrung</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">100k+</div>
              <div className="text-blue-100">Zufriedene Kunden</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">24/7</div>
              <div className="text-blue-100">Support</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 