import React from 'react';

export interface FeatureGridProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  columnsMd?: number;
  className?: string;
  Header?: string;
  Description?: string;
}

export function FeatureGrid<T>({
  data,
  renderItem,
  columnsMd = 4,
  className = '',
  // FIX 1: Prop names now correctly match the interface (Header, Description).
  Header,
  Description
}: FeatureGridProps<T>) {

  // FIX 2: This mapping ensures TailwindCSS can detect the full class names at build time.
  // This is the correct way to handle dynamic classes.
  const columnClasses: { [key: number]: string } = {
    1: 'md:grid-cols-1',
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
    5: 'md:grid-cols-5',
    6: 'md:grid-cols-6',
  };

  const gridClass = columnClasses[columnsMd] || 'md:grid-cols-4'; // Fallback to 4 columns

  return (
    <section className={`bg-background py-20 px-4 ${className}`}>
      {/* Conditionally render the header section only if Header or Description is provided */}
      {(Header || Description) && (
        <div className="text-center mb-12 md:mb-16">
          {/* FIX 3: Replaced hardcoded text with props and removed typo. */}
          {Header && <h2 className="text-3xl md:text-4xl font-bold font-headline text-foreground">{Header}</h2>}
          {Description && <p className="mt-2 text-muted-foreground max-w-2xl mx-auto text-lg">{Description}</p>}
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div
          // FIX 4: The grid classes are now simpler and correctly apply the dynamic column count.
          className={`grid grid-cols-1 sm:grid-cols-2 gap-9 ${gridClass}`}
        >
          {data.map((item, idx) => (
            <React.Fragment key={idx}>
              {renderItem(item, idx)}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}