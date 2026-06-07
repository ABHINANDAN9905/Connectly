
import {
  Heart,
  ExternalLink,
  ArrowUp,
  Home,
  Zap,
  Info,
  MessageSquare,
  HelpCircle,
  Lock,
  FileText,
  Users,
} from "lucide-react";

import { FaGithub, FaLinkedin } from "react-icons/fa";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const quickLinks = [
    { name: "Home", icon: Home, url: "/" },
    { name: "Features", icon: Zap, url: "#" },
    { name: "About Us", icon: Info, url: "#" },
    { name: "Contact", icon: MessageSquare, url: "#" },
  ];

  const resources = [
    { name: "Help Center", icon: HelpCircle, url: "#" },
    { name: "Privacy Policy", icon: Lock, url: "#" },
    { name: "Terms of Service", icon: FileText, url: "#" },
    { name: "Community Guidelines", icon: Users, url: "#" },
  ];

  const socialLinks = [
    {
      name: "GitHub",
      icon: FaGithub,
      url: "https://github.com/ABHINANDAN9905",
      color: "hover:text-gray-300",
    },
    {
      name: "LinkedIn",
      icon: FaLinkedin,
      url: "https://www.linkedin.com/in/abhinandan-yadav-9138b3306/",
      color: "hover:text-blue-400",
    },
  ];

  return (
    <footer
      className="
      bg-base-100
      backdrop-blur-xl
      border-t border-primary/20
      text-base-content/90
      shadow-[0_-10px_40px_rgba(34,197,94,0.08)]
    "
    >
      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          
          {/* Brand Section */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">C</span>
              </div>

              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Connectly
                </h2>

                <p className="text-xs text-primary mt-1">
                  Meet • Chat • Connect
                </p>
              </div>
            </div>

            <p className="text-sm text-base-content/70 leading-relaxed">
              Connectly is a modern real-time communication platform designed to
              help people meet, chat, and build meaningful connections worldwide.
            </p>

            <div className="flex gap-4 mt-5 text-xs">
              <span className="text-green-400">✓ Secure</span>
              <span className="text-blue-400">⚡ Fast</span>
              <span className="text-purple-400">🛡 Reliable</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold text-primary mb-5">
              Quick Links
            </h3>

            <ul className="space-y-3">
              {quickLinks.map((link) => {
                const Icon = link.icon;

                return (
                  <li key={link.name}>
                    <a
                      href={link.url}
                      className="flex items-center gap-2 text-base-content/70 hover:text-primary transition-all duration-300"
                    >
                      <Icon size={16} />
                      {link.name}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-lg font-semibold text-primary mb-5">
              Resources
            </h3>

            <ul className="space-y-3">
              {resources.map((link) => {
                const Icon = link.icon;

                return (
                  <li key={link.name}>
                    <a
                      href={link.url}
                      className="flex items-center gap-2 text-base-content/70 hover:text-primary transition-all duration-300"
                    >
                      <Icon size={16} />
                      {link.name}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold text-primary mb-5">
              Contact Info
            </h3>

            <div className="space-y-3 text-sm text-base-content/70">
              <p>📧 kumarabhinandan1307@gmail.com</p>
              <p>🛠️ abhiyadav99053@gmail.com</p>
              <p>📱 +91 9905335041</p>
            </div>
          </div>

          {/* Social Links */}
          <div>
            <h3 className="text-lg font-semibold text-primary mb-5">
              Connect With Me
            </h3>

            <div className="space-y-4">
              {socialLinks.map((link) => {
                const Icon = link.icon;

                return (
                  <a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-3 text-base-content/70 transition-all duration-300 ${link.color}`}
                  >
                    <Icon size={20} />
                    <span>{link.name}</span>
                    <ExternalLink size={12} />
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-base-300 my-8"></div>

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-5">
          
          <div className="text-center md:text-left">
            <p className="text-sm text-base-content/60">
              © {currentYear} Connectly. All Rights Reserved.
            </p>

            <p className="text-xs text-base-content/40 mt-1">
              Secure • Fast • Reliable
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-base-content/70">
              Designed & Developed with
            </span>

            <Heart
              className="h-4 w-4 text-red-500 animate-pulse"
              fill="currentColor"
            />

            <span className="text-base-content/70">by</span>

            <a
              href="https://www.linkedin.com/in/abhinandan-yadav-9138b3306/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent hover:scale-105 transition-transform"
            >
              Abhinandan Kumar
            </a>
          </div>

          <button
            onClick={scrollToTop}
            className="
            p-3
            rounded-full
            bg-base-200
            hover:bg-primary
            hover:text-white
            transition-all
            duration-300
            hover:scale-110
          "
            aria-label="Scroll to top"
          >
            <ArrowUp size={18} />
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;