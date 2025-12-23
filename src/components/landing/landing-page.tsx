'use client'

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Users,
  Zap,
  Shield,
  Clock,
  CheckCircle,
  Star,
  ArrowRight,
  Menu,
  X,
  Sparkles,
  TrendingUp,
  Target,
  Workflow
} from "lucide-react";

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const fadeInUpVariants = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const navItems = [
    { name: "Inicio", href: "#home" },
    { name: "Características", href: "#features" },
    { name: "Precios", href: "#pricing" },
    { name: "Contacto", href: "#contact" }
  ];

  const features = [
    {
      icon: BarChart3,
      title: "Gestión de Proyectos",
      description: "Organiza y controla todos tus proyectos con herramientas avanzadas de seguimiento y control de tiempos.",
      color: "from-blue-500 to-cyan-500",
      size: "col-span-1 row-span-1"
    },
    {
      icon: Users,
      title: "CRM Inteligente",
      description: "Gestiona tus relaciones con clientes de forma efectiva con IA integrada y análisis predictivo.",
      color: "from-emerald-500 to-teal-500",
      size: "col-span-1 row-span-2"
    },
    {
      icon: Zap,
      title: "Automatizaciones",
      description: "Optimiza tus procesos con flujos de trabajo automatizados y notificaciones inteligentes.",
      color: "from-purple-500 to-pink-500",
      size: "col-span-1 row-span-1"
    }
  ];

  const pricingPlans = [
    {
      name: "Essential",
      price: "$39",
      period: "/mes",
      description: "Perfecto para comenzar",
      features: [
        "Hasta 10 proyectos activos",
        "CRM básico (100 contactos)",
        "Reportes mensuales",
        "Soporte por email",
        "5GB de almacenamiento"
      ],
      popular: false,
      buttonText: "Comenzar Gratis",
      buttonVariant: "outline" as const
    },
    {
      name: "Pro",
      price: "$89",
      period: "/mes",
      description: "Para equipos profesionales",
      features: [
        "Proyectos ilimitados",
        "CRM avanzado (1000 contactos)",
        "Reportes en tiempo real",
        "Soporte prioritario",
        "25GB de almacenamiento",
        "API completa",
        "Integraciones avanzadas"
      ],
      popular: true,
      buttonText: "Comenzar Ahora",
      buttonVariant: "default" as const
    },
    {
      name: "Business",
      price: "$199",
      period: "/mes",
      description: "Para empresas en crecimiento",
      features: [
        "Todo lo de Pro",
        "Contactos ilimitados",
        "Almacenamiento ilimitado",
        "Soporte 24/7",
        "Implementación dedicada",
        "Seguridad empresarial",
        "SLA garantizado"
      ],
      popular: false,
      buttonText: "Contactar Ventas",
      buttonVariant: "outline" as const
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      {/* Navbar */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-slate-900/80 backdrop-blur-lg border-b border-slate-800/50'
            : 'bg-transparent'
        }`}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <motion.div
              className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent"
              whileHover={{ scale: 1.05 }}
            >
              Klowezone
            </motion.div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-slate-300 hover:text-emerald-400 transition-colors duration-200"
                >
                  {item.name}
                </a>
              ))}
              <Button className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700">
                Comenzar Gratis
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-slate-300"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden mt-4 pb-4 border-t border-slate-800 pt-4"
              >
                <div className="flex flex-col space-y-4">
                  {navItems.map((item) => (
                    <a
                      key={item.name}
                      href={item.href}
                      className="text-slate-300 hover:text-emerald-400 transition-colors duration-200"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.name}
                    </a>
                  ))}
                  <Button className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 w-full">
                    Comenzar Gratis
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section id="home" className="relative min-h-screen flex items-center justify-center px-4 pt-20 overflow-hidden">
        <motion.div
          style={{ y }}
          className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-slate-900 to-emerald-600/10"
        />
        {/* Animated gradient background */}
        <motion.div
          animate={{
            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
          }}
          transition={{
            duration: 8,
            ease: "linear",
            repeat: Infinity,
          }}
          className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-emerald-500/20 to-blue-600/20 bg-[length:400%_400%]"
        />

        <div className="container mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-8"
          >
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 mb-4">
              <Sparkles className="w-4 h-4 mr-2" />
              Nueva versión disponible
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6"
          >
            <motion.span
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{
                duration: 4,
                ease: "linear",
                repeat: Infinity,
              }}
              className="bg-gradient-to-r from-blue-600 via-emerald-500 to-blue-600 bg-clip-text text-transparent bg-[length:200%_auto]"
            >
              Klowezone
            </motion.span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed"
          >
            El CRM más avanzado para profesionales. Gestiona proyectos, clientes y automatiza
            procesos con una plataforma que se adapta a tu crecimiento.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link href="/signup">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl hover:shadow-blue-500/25 transition-all duration-300 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-emerald-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                  <Star className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform relative z-10" />
                  Comenzar Gratis
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform relative z-10" />
                </Button>
              </Link>
            </motion.div>
            <Button
              size="lg"
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-800 px-8 py-4 text-lg"
            >
              Ver Demo
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="flex justify-center items-center text-slate-400"
          >
            <CheckCircle className="w-5 h-5 mr-2 text-emerald-400" />
            <span>14 días gratis • Sin tarjeta de crédito • Configuración en minutos</span>
          </motion.div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section id="features" className="py-20 px-4 bg-slate-900/50">
        <div className="container mx-auto">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2
              variants={fadeInUpVariants}
              className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent"
            >
              Características Potentes
            </motion.h2>
            <motion.p
              variants={fadeInUpVariants}
              className="text-xl text-slate-400 max-w-2xl mx-auto"
            >
              Todo lo que necesitas para gestionar tu negocio de manera profesional
            </motion.p>
          </motion.div>

          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto h-[600px] md:h-[400px]"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                variants={fadeInUpVariants}
                whileHover={{ y: -5 }}
                className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${feature.color} p-1 ${feature.size}`}
              >
                <Card className="bg-slate-900 border-0 h-full">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-xl text-white group-hover:text-emerald-400 transition-colors">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-slate-400 text-base leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4">
        <div className="container mx-auto">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2
              variants={fadeInUpVariants}
              className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent"
            >
              Planes Flexibles
            </motion.h2>
            <motion.p
              variants={fadeInUpVariants}
              className="text-xl text-slate-400 max-w-2xl mx-auto"
            >
              Elige el plan perfecto para tu negocio. Todos incluyen soporte completo.
            </motion.p>
          </motion.div>

          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto"
          >
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={plan.name}
                variants={fadeInUpVariants}
                className={`relative ${plan.popular ? 'scale-105' : ''}`}
                animate={plan.popular ? {
                  boxShadow: [
                    "0 0 0 0 rgba(16, 185, 129, 0.4)",
                    "0 0 0 4px rgba(16, 185, 129, 0)",
                    "0 0 0 0 rgba(16, 185, 129, 0.4)"
                  ]
                } : {}}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-1">
                      Más Popular
                    </Badge>
                  </div>
                )}

                <Card className={`relative overflow-hidden backdrop-blur-lg border ${
                  plan.popular
                    ? 'bg-slate-900/60 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                    : 'bg-slate-900/40 border-slate-700/50'
                }`}>
                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl text-white">{plan.name}</CardTitle>
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-white">{plan.price}</span>
                      <span className="text-slate-400">{plan.period}</span>
                    </div>
                    <CardDescription className="text-slate-400 mt-2">
                      {plan.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center text-slate-300">
                          <CheckCircle className="w-5 h-5 text-emerald-400 mr-3 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button
                      className={`w-full ${
                        plan.popular
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600'
                          : 'border-slate-600 text-slate-300 hover:bg-slate-800'
                      }`}
                      variant={plan.buttonVariant}
                    >
                      {plan.buttonText}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-900/20 to-emerald-900/20">
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="container mx-auto text-center"
        >
          <motion.h2
            variants={fadeInUpVariants}
            className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent"
          >
            ¿Listo para revolucionar tu negocio?
          </motion.h2>
          <motion.p
            variants={fadeInUpVariants}
            className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto"
          >
            Únete a miles de profesionales que ya confían en Klowezone para gestionar sus proyectos y clientes.
          </motion.p>
          <motion.div
            variants={fadeInUpVariants}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white px-12 py-4 text-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group"
            >
              <TrendingUp className="w-6 h-6 mr-3 group-hover:rotate-12 transition-transform" />
              Comenzar Mi Prueba Gratuita
              <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-slate-950 border-t border-slate-800">
        <div className="container mx-auto">
          <div className="text-center">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent mb-4">
              Klowezone
            </div>
            <p className="text-slate-400 mb-6">
              El CRM que impulsa el éxito de tu negocio
            </p>
            <div className="flex justify-center space-x-6 text-slate-400">
              <a href="#" className="hover:text-emerald-400 transition-colors">Política de Privacidad</a>
              <a href="#" className="hover:text-emerald-400 transition-colors">Términos de Servicio</a>
              <a href="#" className="hover:text-emerald-400 transition-colors">Contacto</a>
            </div>
            <div className="mt-8 pt-8 border-t border-slate-800 text-slate-500 text-sm">
              © 2024 Klowezone. Todos los derechos reservados.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
