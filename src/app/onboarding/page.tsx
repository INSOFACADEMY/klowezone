'use client'

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/lib/supabase";
import {
  getUserProfile,
  createUserProfile,
  updateUserProfile,
  completeOnboarding,
  UserProfile,
  BUSINESS_TYPES,
  LOCATIONS,
  CURRENCIES,
  TEAM_SIZES,
  PRIMARY_GOALS
} from "@/lib/user-profiles";
import {
  ArrowRight,
  ArrowLeft,
  Building2,
  MapPin,
  Users,
  Target,
  CheckCircle,
  Sparkles,
  Briefcase,
  Globe,
  DollarSign,
  UserCheck
} from "lucide-react";

interface OnboardingData {
  business_type: UserProfile['business_type'];
  business_name: string;
  location: UserProfile['location'];
  currency: UserProfile['currency'];
  team_size: UserProfile['team_size'];
  primary_goals: string[];
}

const steps = [
  {
    id: 1,
    title: "Tipo de Negocio",
    description: "¿Qué tipo de actividad realizas?",
    icon: Building2
  },
  {
    id: 2,
    title: "Información Básica",
    description: "Cuéntanos sobre tu negocio",
    icon: Briefcase
  },
  {
    id: 3,
    title: "Ubicación y Equipo",
    description: "Dónde operas y con quién",
    icon: MapPin
  },
  {
    id: 4,
    title: "Objetivos Principales",
    description: "Qué quieres lograr con Klowezone",
    icon: Target
  }
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);

  const [formData, setFormData] = useState<OnboardingData>({
    business_type: 'Otro',
    business_name: '',
    location: 'México',
    currency: 'MXN',
    team_size: 'Solo yo',
    primary_goals: ['Gestión de Clientes', 'Gestión de Proyectos']
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const checkAuthAndOnboarding = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
          router.push('/login');
          return;
        }

        setUser(user);

        // Check if onboarding is already completed
        const profile = await getUserProfile();
        if (profile?.onboarding_completed) {
          router.push('/dashboard');
          return;
        }

        // Load existing profile data if available
        if (profile) {
          setFormData({
            business_type: profile.business_type,
            business_name: profile.business_name,
            location: profile.location,
            currency: profile.currency,
            team_size: profile.team_size,
            primary_goals: profile.primary_goals
          });
        }

        setLoading(false);
      } catch (error) {
        console.error('Error checking auth:', error);
        router.push('/login');
      }
    };

    checkAuthAndOnboarding();
  }, [router]);

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.business_type) {
          newErrors.business_type = 'Selecciona un tipo de negocio';
        }
        break;
      case 2:
        if (!formData.business_name.trim()) {
          newErrors.business_name = 'El nombre del negocio es obligatorio';
        }
        break;
      case 3:
        if (!formData.location) {
          newErrors.location = 'Selecciona una ubicación';
        }
        if (!formData.team_size) {
          newErrors.team_size = 'Selecciona el tamaño del equipo';
        }
        break;
      case 4:
        if (formData.primary_goals.length === 0) {
          newErrors.primary_goals = 'Selecciona al menos un objetivo';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validateStep(currentStep)) return;

    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding
      await handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      // Save profile data
      const profileData = {
        business_type: formData.business_type,
        business_name: formData.business_name,
        location: formData.location,
        currency: formData.currency,
        team_size: formData.team_size,
        primary_goals: formData.primary_goals,
        onboarding_completed: true
      };

      console.log('Guardando perfil de negocio:', profileData);
      const success = await createUserProfile(profileData);

      if (success) {
        console.log('Perfil guardado exitosamente, redirigiendo al dashboard...');
        // Pequeño delay para asegurar que los datos se propaguen
        setTimeout(() => {
          router.push('/dashboard');
        }, 500);
      } else {
        console.error('Error al guardar el perfil');
        setErrors({ general: 'Error al guardar la configuración. Inténtalo de nuevo.' });
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
      setErrors({ general: 'Error inesperado. Inténtalo de nuevo.' });
    } finally {
      setSaving(false);
    }
  };

  const handleGoalToggle = (goal: string) => {
    setFormData(prev => ({
      ...prev,
      primary_goals: prev.primary_goals.includes(goal)
        ? prev.primary_goals.filter(g => g !== goal)
        : [...prev.primary_goals, goal]
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  const currentStepData = steps[currentStep - 1];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-emerald-400 mr-3" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
              Bienvenido a Klowezone
            </h1>
          </div>
          <p className="text-slate-400 text-lg">
            Vamos a configurar tu espacio de trabajo en solo {steps.length} pasos
          </p>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex justify-center items-center space-x-4 mb-4">
            {steps.map((step) => {
              const IconComponent = step.icon;
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    step.id <= currentStep
                      ? 'bg-gradient-to-r from-blue-500 to-emerald-500 text-white'
                      : 'bg-slate-800 text-slate-500'
                  }`}>
                    {step.id < currentStep ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <IconComponent className="w-5 h-5" />
                    )}
                  </div>
                  {step.id < steps.length && (
                    <div className={`w-12 h-0.5 mx-2 ${
                      step.id < currentStep ? 'bg-gradient-to-r from-blue-500 to-emerald-500' : 'bg-slate-700'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-2">{currentStepData.title}</h2>
            <p className="text-slate-400">{currentStepData.description}</p>
          </div>
        </motion.div>

        {/* Form Content */}
        <div className="max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50 rounded-2xl p-8">
                <CardContent className="p-0">
                  {currentStep === 1 && (
                    <div className="space-y-6">
                      <div>
                        <Label className="text-lg font-medium text-white mb-4 block">
                          ¿Qué tipo de actividad realizas?
                        </Label>
                        <Select
                          value={formData.business_type}
                          onValueChange={(value: UserProfile['business_type']) =>
                            setFormData(prev => ({ ...prev, business_type: value }))
                          }
                        >
                          <SelectTrigger className="w-full bg-slate-800/50 border-slate-600 text-white h-12">
                            <SelectValue placeholder="Selecciona tu tipo de negocio" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-600">
                            {BUSINESS_TYPES.map((type) => (
                              <SelectItem key={type} value={type} className="text-white hover:bg-slate-700">
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.business_type && (
                          <p className="text-red-400 text-sm mt-2">{errors.business_type}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div className="space-y-6">
                      <div>
                        <Label htmlFor="business_name" className="text-lg font-medium text-white mb-4 block">
                          Nombre de tu negocio o empresa
                        </Label>
                        <Input
                          id="business_name"
                          type="text"
                          value={formData.business_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
                          placeholder="Ej: Mi Empresa S.A. de C.V."
                          className="w-full bg-slate-800/50 border-slate-600 text-white h-12 text-lg"
                        />
                        {errors.business_name && (
                          <p className="text-red-400 text-sm mt-2">{errors.business_name}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {currentStep === 3 && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label className="text-lg font-medium text-white mb-4 block">
                            Ubicación principal
                          </Label>
                          <Select
                            value={formData.location}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, location: value }))}
                          >
                            <SelectTrigger className="w-full bg-slate-800/50 border-slate-600 text-white h-12">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-600">
                              {LOCATIONS.map((location) => (
                                <SelectItem key={location} value={location} className="text-white hover:bg-slate-700">
                                  {location}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors.location && (
                            <p className="text-red-400 text-sm mt-2">{errors.location}</p>
                          )}
                        </div>

                        <div>
                          <Label className="text-lg font-medium text-white mb-4 block">
                            Moneda principal
                          </Label>
                          <Select
                            value={formData.currency}
                            onValueChange={(value: UserProfile['currency']) =>
                              setFormData(prev => ({ ...prev, currency: value }))
                            }
                          >
                            <SelectTrigger className="w-full bg-slate-800/50 border-slate-600 text-white h-12">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-600">
                              {CURRENCIES.map((currency) => (
                                <SelectItem key={currency.value} value={currency.value} className="text-white hover:bg-slate-700">
                                  {currency.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label className="text-lg font-medium text-white mb-4 block">
                          Tamaño del equipo
                        </Label>
                        <Select
                          value={formData.team_size}
                          onValueChange={(value: UserProfile['team_size']) =>
                            setFormData(prev => ({ ...prev, team_size: value }))
                          }
                        >
                          <SelectTrigger className="w-full bg-slate-800/50 border-slate-600 text-white h-12">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-600">
                            {TEAM_SIZES.map((size) => (
                              <SelectItem key={size} value={size} className="text-white hover:bg-slate-700">
                                {size}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.team_size && (
                          <p className="text-red-400 text-sm mt-2">{errors.team_size}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {currentStep === 4 && (
                    <div className="space-y-6">
                      <div>
                        <Label className="text-lg font-medium text-white mb-4 block">
                          ¿Qué quieres lograr con Klowezone?
                        </Label>
                        <p className="text-slate-400 mb-6">
                          Selecciona todos los objetivos que apliquen a tu negocio
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {PRIMARY_GOALS.map((goal) => (
                            <div key={goal} className="flex items-center space-x-3">
                              <Checkbox
                                id={goal}
                                checked={formData.primary_goals.includes(goal)}
                                onCheckedChange={() => handleGoalToggle(goal)}
                                className="border-slate-600 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                              />
                              <Label
                                htmlFor={goal}
                                className="text-white cursor-pointer flex-1"
                              >
                                {goal}
                              </Label>
                            </div>
                          ))}
                        </div>
                        {errors.primary_goals && (
                          <p className="text-red-400 text-sm mt-4">{errors.primary_goals}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {errors.general && (
                    <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <p className="text-red-400">{errors.general}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex justify-between items-center mt-8"
          >
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Anterior
            </Button>

            <Button
              onClick={handleNext}
              disabled={saving}
              className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 px-8 py-3 text-lg"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Guardando...
                </>
              ) : currentStep === steps.length ? (
                <>
                  Comenzar
                  <CheckCircle className="w-4 h-4 ml-2" />
                </>
              ) : (
                <>
                  Siguiente
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
