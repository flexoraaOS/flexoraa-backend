import React from 'react';

const countries = [
  '🇮🇳', '🇬🇧', '🇺🇸', '🇦🇪', '🇨🇦', '🇸🇦',
  '🇩🇪', '🇮🇩', '🇧🇷', '🇦🇺', '🇮🇹', '🇲🇾',
  '🇿🇦', '🇹🇷', '🇨🇳', '🇵🇰', '🇳🇬', '🇧🇩'
];

const TrustedBySection = () => {
  // Duplicate list to make it loop seamlessly
  const extendedCountries = [...countries, ...countries];

  return (
    <section className="bg-black py-16 md:py-24 text-white overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold">
            Trusted by Sales Teams in <span className="text-red-500">25+</span> Countries
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-neutral-400">
            From India to the USA, our OS is the go-to system for growth-focused brands.
          </p>
        </div>

        {/* Marquee Section */}
        <div className="relative mt-12 overflow-hidden">
          <div className="flex w-max animate-marquee space-x-8">
            {extendedCountries.map((flag, index) => (
              <span key={index} className="text-5xl md:text-6xl  emoji-font">{flag}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustedBySection;
