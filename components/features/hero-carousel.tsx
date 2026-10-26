"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Search, Store, Briefcase, ShoppingBag, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface CarouselSlide {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  cta: { text: string; href: string };
  icon: React.ReactNode;
  gradient: string;
}

const slides: CarouselSlide[] = [
  {
    id: 1,
    title: "Discover Services",
    subtitle: "Across Nigeria",
    description: "Connect with verified vendors and discover local businesses in your area",
    image: "/hero-bg.jpg",
    cta: { text: "Browse Services", href: "/browse" },
    icon: <Search className="w-6 h-6" />,
    gradient: "from-blue-600/90 via-purple-600/80 to-pink-600/90"
  },
  {
    id: 2,
    title: "Start Your Business",
    subtitle: "Reach Customers",
    description: "List your products and services to reach thousands of potential customers",
    image: "/hero-bg.jpg",
    cta: { text: "Start Selling", href: "/register" },
    icon: <Store className="w-6 h-6" />,
    gradient: "from-green-600/90 via-teal-600/80 to-blue-600/90"
  }
];

export function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, nextSlide]);

  return (
    <section className="relative min-h-[600px] lg:min-h-[700px] flex items-center overflow-hidden" onMouseEnter={() => setIsAutoPlaying(false)} onMouseLeave={() => setIsAutoPlaying(true)}>
      {slides.map((slide, index) => (
        <div key={slide.id} className={cn("absolute inset-0 transition-all duration-700 ease-in-out", index === currentSlide ? "opacity-100 scale-100" : "opacity-0 scale-105 pointer-events-none")}>
          <div className="absolute inset-0 z-0">
            <Image src={slide.image} alt={slide.title} fill priority={index === 0} className="object-cover" sizes="100vw" />
            <div className={cn("absolute inset-0 bg-gradient-to-br transition-all duration-700", slide.gradient)} />
            <div className="absolute inset-0 bg-black/30" />
          </div>
          <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-white/10 border border-white/20 backdrop-blur-md">{slide.icon}<Sparkles className="h-4 w-4 text-yellow-300" /></div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white mb-4 leading-tight">{slide.title}<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300">{slide.subtitle}</span></h1>
              <p className="text-lg sm:text-xl text-gray-100 mb-8 max-w-2xl leading-relaxed">{slide.description}</p>
              <div className="flex flex-col sm:flex-row gap-4"><Link href={slide.cta.href}><Button size="lg" className="h-14 px-8 font-semibold bg-white text-gray-900 hover:bg-gray-100 shadow-xl w-full sm:w-auto">{slide.cta.text}<ChevronRight className="ml-2 h-5 w-5" /></Button></Link><Link href="/register"><Button size="lg" variant="outline" className="h-14 px-8 font-semibold border-2 border-white/80 text-white hover:bg-white/10 w-full sm:w-auto">Sign Up Free</Button></Link></div>
            </div>
          </div>
        </div>
      ))}
      <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 border border-white/20 backdrop-blur-md hover:bg-white/20 transition-all" aria-label="Previous"><ChevronLeft className="h-6 w-6 text-white" /></button>
      <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 border border-white/20 backdrop-blur-md hover:bg-white/20 transition-all" aria-label="Next"><ChevronRight className="h-6 w-6 text-white" /></button>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-3">{slides.map((_, index) => (<button key={index} onClick={() => { setCurrentSlide(index); setIsAutoPlaying(false); }} className={cn("transition-all duration-300 rounded-full", index === currentSlide ? "w-12 h-3 bg-white" : "w-3 h-3 bg-white/50 hover:bg-white/75")} aria-label={`Slide 
const fs = require('fs');
const content = 'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Search, Store, Briefcase, ShoppingBag, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CarouselSlide {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  cta: { text: string; href: string };
  icon: React.ReactNode;
  gradient: string;
}

const slides: CarouselSlide[] = [
  {
    id: 1,
    title: 'Discover Services',
    subtitle: 'Across Nigeria',
    description: 'Connect with verified vendors and discover local businesses in your area',
    image: '/hero-bg.jpg',
    cta: { text: 'Browse Services', href: '/browse' },
    icon: <Search className='w-6 h-6' />,
    gradient: 'from-blue-600/90 via-purple-600/80 to-pink-600/90'
  },
  {
    id: 2,
    title: 'Start Your Business',
    subtitle: 'Reach Customers',
    description: 'List your products and services to reach thousands of potential customers',
    image: '/hero-bg.jpg',
    cta: { text: 'Start Selling', href: '/register' },
    icon: <Store className='w-6 h-6' />,
    gradient: 'from-green-600/90 via-teal-600/80 to-blue-600/90'
  },
  {
    id: 3,
    title: 'Find Opportunities',
    subtitle: 'Grow Your Career',
    description: 'Explore freelance gigs, job listings, and business opportunities',
    image: '/hero-bg.jpg',
    cta: { text: 'View Opportunities', href: '/categories' },
    icon: <Briefcase className='w-6 h-6' />,
    gradient: 'from-orange-600/90 via-red-600/80 to-pink-600/90'
  },
  {
    id: 4,
    title: 'Local Marketplace',
    subtitle: 'Buy & Sell Locally',
    description: 'Browse verified listings from your neighborhood',
    image: '/hero-bg.jpg',
    cta: { text: 'Shop Local', href: '/browse' },
    icon: <ShoppingBag className='w-6 h-6' />,
    gradient: 'from-purple-600/90 via-indigo-600/80 to-blue-600/90'
  }
];

export function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, nextSlide]);

  return (
    <section 
      className='relative min-h-[600px] lg:min-h-[700px] flex items-center overflow-hidden'
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={cn(
            'absolute inset-0 transition-all duration-700 ease-in-out',
            index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'
          )}
        >
          <div className='absolute inset-0 z-0'>
            <Image src={slide.image} alt={slide.title} fill priority={index === 0} className='object-cover' sizes='100vw' />
            <div className={cn('absolute inset-0 bg-gradient-to-br transition-all duration-700', slide.gradient)} />
            <div className='absolute inset-0 bg-black/30' />
          </div>

          <div className='relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center'>
            <div className='max-w-3xl'>
              <div className='inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-white/10 border border-white/20 backdrop-blur-md'>
                {slide.icon}
                <Sparkles className='h-4 w-4 text-yellow-300' />
              </div>

              <h1 className='text-5xl sm:text-6xl lg:text-7xl font-black text-white mb-4 leading-tight'>
                {slide.title}
                <br />
                <span className='text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300'>
                  {slide.subtitle}
                </span>
              </h1>

              <p className='text-lg sm:text-xl text-gray-100 mb-8 max-w-2xl leading-relaxed'>
                {slide.description}
              </p>

              <div className='flex flex-col sm:flex-row gap-4'>
                <Link href={slide.cta.href}>
                  <Button size='lg' className='h-14 px-8 font-semibold bg-white text-gray-900 hover:bg-gray-100 shadow-xl w-full sm:w-auto'>
                    {slide.cta.text}
                    <ChevronRight className='ml-2 h-5 w-5' />
                  </Button>
                </Link>
                <Link href='/register'>
                  <Button size='lg' variant='outline' className='h-14 px-8 font-semibold border-2 border-white/80 text-white hover:bg-white/10 w-full sm:w-auto'>
                    Sign Up Free
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      ))}

      <button onClick={prevSlide} className='absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 border border-white/20 backdrop-blur-md hover:bg-white/20 transition-all' aria-label='Previous'>
        <ChevronLeft className='h-6 w-6 text-white' />
      </button>
      <button onClick={nextSlide} className='absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 border border-white/20 backdrop-blur-md hover:bg-white/20 transition-all' aria-label='Next'>
        <ChevronRight className='h-6 w-6 text-white' />
      </button>

      <div className='absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-3'>
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => { setCurrentSlide(index); setIsAutoPlaying(false); }}
            className={cn('transition-all duration-300 rounded-full', index === currentSlide ? 'w-12 h-3 bg-white' : 'w-3 h-3 bg-white/50 hover:bg-white/75')}
            aria-label={\Slide \${index + 1}\}
          />
        ))}
      </div>

      <div className='absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-950 to-transparent pointer-events-none z-10' />
    </section>
  );
}
;

fs.writeFileSync('components/features/hero-carousel.tsx', content, 'utf8');
console.log('Hero carousel created successfully');
{index + 1}`} />))}</div>
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-950 to-transparent pointer-events-none z-10" />
    </section>
  );
}
