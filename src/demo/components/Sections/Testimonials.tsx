'use client';

import React from 'react';

const testimonials = [
  {
    name: 'Sarah Müller',
    role: 'Geschäftsführerin',
    content:
      'Die Beratung war ausgezeichnet und sehr persönlich. Ich fühle mich mit meiner Versicherungslösung rundum gut aufgehoben.',
    image: '/testimonials/sarah.jpg',
  },
  {
    name: 'Thomas Weber',
    role: 'Familienvater',
    content:
      'Endlich eine Versicherung, die verständlich kommuniziert und schnell reagiert. Der Online-Chat ist besonders hilfreich.',
    image: '/testimonials/thomas.jpg',
  },
  {
    name: 'Maria Schmidt',
    role: 'Selbstständige',
    content:
      'Die flexible Anpassung meiner Versicherung an meine sich ändernden Bedürfnisse hat mich überzeugt. Top Service!',
    image: '/testimonials/maria.jpg',
  },
];

export default function Testimonials() {
  return (
    <div className="bg-gray-50 py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Was unsere Kunden sagen</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Erfahren Sie, warum unsere Kunden uns vertrauen und sich bei uns sicher fühlen.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white p-8 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-xl">
                    {testimonial.name.charAt(0)}
                  </span>
                </div>
                <div className="ml-4">
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-gray-600 text-sm">{testimonial.role}</div>
                </div>
              </div>
              <p className="text-gray-600 italic">"{testimonial.content}"</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
