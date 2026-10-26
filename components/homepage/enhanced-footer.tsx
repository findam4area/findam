"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Shield,
  Lock,
  CreditCard,
  ArrowRight,
} from "lucide-react";
import { Logo } from "@/components/shared";
import { NewsletterForm } from "./newsletter-form";

interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

const footerSections: FooterSection[] = [
  {
    title: "Quick Links",
    links: [
      { label: "Browse Listings", href: "/search" },
      { label: "Sell on FindAm", href: "/create" },
      { label: "Premium Plans", href: "/premium" },
      { label: "How It Works", href: "/about" },
    ],
  },
  {
    title: "Categories",
    links: [
      { label: "Electronics", href: "/categories/electronics" },
      { label: "Fashion", href: "/categories/fashion" },
      { label: "Vehicles", href: "/categories/vehicles" },
      { label: "Real Estate", href: "/categories/real-estate" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Center", href: "/help" },
      { label: "Safety Tips", href: "/safety" },
      { label: "Contact Us", href: "/contact" },
      { label: "Report Issue", href: "/report" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Blog", href: "/blog" },
      { label: "Press Kit", href: "/press" },
    ],
  },
];

const socialLinks = [
  {
    name: "Facebook",
    href: "https://facebook.com/findam",
    icon: Facebook,
    color: "from-blue-600 to-blue-500",
  },
  {
    name: "Twitter",
    href: "https://twitter.com/findam",
    icon: Twitter,
    color: "from-sky-500 to-blue-400",
  },
  {
    name: "Instagram",
    href: "https://instagram.com/findam",
    icon: Instagram,
    color: "from-pink-600 via-purple-600 to-orange-500",
  },
  {
    name: "LinkedIn",
    href: "https://linkedin.com/company/findam",
    icon: Linkedin,
    color: "from-blue-700 to-blue-600",
  },
];

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

const linkVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
    },
  },
};

export function EnhancedFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer id="footer" className="relative bg-gradient-to-b from-gray-900 to-black border-t border-gray-800/50 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
            opacity: [0.03, 0.05, 0.03],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-naija-green/10 to-transparent rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
            opacity: [0.03, 0.05, 0.03],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-neon-cyan/10 to-transparent rounded-full blur-3xl"
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Main Footer Content */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-6 mb-12"
        >
          {/* Brand and Newsletter Column - Takes 2 columns on large screens */}
          <motion.div variants={itemVariants} className="sm:col-span-2 lg:col-span-2">
            <motion.div
              className="mb-4"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Logo variant="compact" />
            </motion.div>
            <motion.p
              variants={itemVariants}
              className="text-gray-400 mb-6 max-w-md leading-relaxed"
            >
              Nigeria&apos;s most trusted youth marketplace. Buy, sell, and
              discover amazing deals with AI-powered protection and verified
              sellers.
            </motion.p>

            {/* Newsletter Signup */}
            <motion.div variants={itemVariants} className="mb-6">
              <h3 className="text-white font-semibold mb-3 text-lg flex items-center gap-2">
                Stay Updated
                <motion.span
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  ✨
                </motion.span>
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                Get the latest deals and updates delivered to your inbox.
              </p>
              <NewsletterForm />
            </motion.div>

            {/* Social Media Links */}
            <motion.div variants={itemVariants}>
              <h3 className="text-white font-semibold mb-3 text-sm">
                Follow Us
              </h3>
              <div className="flex items-center gap-3">
                {socialLinks.map((social, index) => {
                  const Icon = social.icon;
                  return (
                    <motion.a
                      key={social.name}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-11 h-11 rounded-full bg-gradient-to-br ${social.color} flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-naija-green focus:ring-offset-2 focus:ring-offset-gray-900 min-w-[44px] min-h-[44px]`}
                      aria-label={`Follow us on ${social.name}`}
                      initial={{ opacity: 0, scale: 0 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1, type: "spring", stiffness: 200 }}
                      whileHover={{ scale: 1.15, rotate: 5 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Icon className="h-5 w-5 text-white" aria-hidden="true" />
                    </motion.a>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>

          {/* Footer Link Columns */}
          {footerSections.map((section, sectionIndex) => (
            <motion.div
              key={section.title}
              variants={itemVariants}
              className="min-w-0"
            >
              <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
                {section.title}
              </h3>
              <motion.ul
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="space-y-3"
              >
                {section.links.map((link, linkIndex) => (
                  <motion.li
                    key={link.href}
                    variants={linkVariants}
                    custom={linkIndex}
                  >
                    {link.external ? (
                      <motion.a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-naija-green transition-colors text-sm py-1 focus:outline-none focus:text-naija-green focus:underline min-h-[44px] flex items-center group"
                        whileHover={{ x: 5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <ArrowRight className="w-0 h-4 mr-0 opacity-0 group-hover:w-4 group-hover:mr-2 group-hover:opacity-100 transition-all duration-200" />
                        {link.label}
                      </motion.a>
                    ) : (
                      <Link href={link.href}>
                        <motion.span
                          className="text-gray-400 hover:text-naija-green transition-colors text-sm py-1 focus:outline-none focus:text-naija-green focus:underline min-h-[44px] flex items-center group"
                          whileHover={{ x: 5 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <ArrowRight className="w-0 h-4 mr-0 opacity-0 group-hover:w-4 group-hover:mr-2 group-hover:opacity-100 transition-all duration-200" />
                          {link.label}
                        </motion.span>
                      </Link>
                    )}
                  </motion.li>
                ))}
              </motion.ul>
            </motion.div>
          ))}
        </motion.div>

        {/* Payment Methods and Security Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="border-t border-gray-800/50 pt-8 mb-8"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Payment Methods */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-3 text-center md:text-left">
                Secure Payments
              </h3>
              <div className="flex items-center gap-4 flex-wrap justify-center md:justify-start">
                <motion.div
                  className="flex items-center gap-2 bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-2"
                  whileHover={{ scale: 1.05, borderColor: "#00C853" }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <CreditCard className="h-5 w-5 text-naija-green" aria-hidden="true" />
                  <span className="text-white font-semibold text-sm">
                    Paystack
                  </span>
                </motion.div>
                <motion.div
                  className="flex items-center gap-2 bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-2"
                  whileHover={{ scale: 1.05, borderColor: "#00D9FF" }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Lock className="h-5 w-5 text-neon-cyan" aria-hidden="true" />
                  <span className="text-white font-semibold text-sm">
                    SSL Secure
                  </span>
                </motion.div>
              </div>
            </motion.div>

            {/* Security Badges */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-3 text-center md:text-right">
                Trust & Safety
              </h3>
              <div className="flex items-center gap-4 flex-wrap justify-center md:justify-end">
                <motion.div
                  className="flex items-center gap-2 bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-2"
                  whileHover={{ scale: 1.05, borderColor: "#00C853" }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Shield className="h-5 w-5 text-naija-green" aria-hidden="true" />
                  <span className="text-white font-semibold text-sm">
                    AI ScamShield
                  </span>
                </motion.div>
                <motion.div
                  className="flex items-center gap-2 bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-2"
                  whileHover={{ scale: 1.05, borderColor: "#9D4EDD" }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Lock className="h-5 w-5 text-neon-purple" aria-hidden="true" />
                  <span className="text-white font-semibold text-sm">
                    Verified Sellers
                  </span>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Bottom Bar - Copyright and Legal Links */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="border-t border-gray-800/50 pt-8"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <motion.p
              className="text-gray-400 text-sm text-center md:text-left"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              © {currentYear} FindAm. Made with{" "}
              <motion.span
                className="text-naija-green inline-block"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
              >
                💚
              </motion.span>{" "}
              in Nigeria. All rights reserved.
            </motion.p>
            <motion.div
              className="flex items-center gap-6 text-sm text-gray-400 flex-wrap justify-center"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              {[
                { label: "Privacy", href: "/privacy" },
                { label: "Terms", href: "/terms" },
                { label: "Cookies", href: "/cookies" },
                { label: "Accessibility", href: "/accessibility" },
              ].map((link, index) => (
                <Link key={link.href} href={link.href}>
                  <motion.span
                    className="hover:text-naija-green transition-colors focus:outline-none focus:text-naija-green focus:underline cursor-pointer"
                    whileHover={{ scale: 1.05, y: -2 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    {link.label}
                  </motion.span>
                </Link>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
