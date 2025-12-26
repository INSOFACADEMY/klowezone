'use client'

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  Mail,
  Lock,
  User,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff
} from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirma tu contraseña';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'El nombre completo es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
          }
        }
      });

      if (error) {
        console.error('Error during signup:', error);
        setErrors({ general: error.message });
        return;
      }

      if (data.user) {
        setSuccess(true);
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setErrors({ general: 'Ocurrió un error inesperado' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-4">
            ¡Registro Exitoso!
          </h1>
          <p className="text-slate-400 mb-8">
            Te hemos enviado un email de confirmación. Revisa tu bandeja de entrada y haz clic en el enlace para activar tu cuenta.
          </p>
          <p className="text-sm text-slate-500">
            Redirigiendo al dashboard...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-20">
      {/* Animated background */}
      <motion.div
        animate={{
          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
        }}
        transition={{
          duration: 8,
          ease: "linear",
          repeat: Infinity,
        }}
        className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-emerald-500/5 to-blue-600/5 bg-[length:400%_400%]"
      />

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/')}
            className="mb-4 text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al inicio
          </Button>

          <motion.div
            animate={{
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
            }}
            transition={{
              duration: 4,
              ease: "linear",
              repeat: Infinity,
            }}
            className="inline-block mb-4"
          >
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-emerald-400 to-blue-400 bg-clip-text text-transparent bg-[length:200%_auto]">
              Klowezone
            </h1>
          </motion.div>

          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 mb-4">
            <Sparkles className="w-4 h-4 mr-2" />
            Prueba gratis por 14 días
          </Badge>

          <h2 className="text-2xl font-semibold text-white mb-2">
            Crea tu cuenta
          </h2>
          <p className="text-slate-400">
            Únete a miles de profesionales que confían en nosotros
          </p>
        </motion.div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="bg-slate-900/60 backdrop-blur-lg border-slate-700/50">
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl text-white text-center">
                Registro
              </CardTitle>
              <CardDescription className="text-center text-slate-400">
                Completa tus datos para comenzar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-slate-300">
                    Nombre completo
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Tu nombre completo"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      className="pl-10 bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500"
                    />
                  </div>
                  {errors.fullName && (
                    <p className="text-sm text-red-400 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.fullName}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="pl-10 bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-red-400 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-300">
                    Contraseña
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 6 caracteres"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="pl-10 pr-10 bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-500 hover:text-slate-400"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-400 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-slate-300">
                    Confirmar contraseña
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Repite tu contraseña"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className="pl-10 pr-10 bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-slate-500 hover:text-slate-400"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-400 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                {/* General Error */}
                {errors.general && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <p className="text-sm text-red-400 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      {errors.general}
                    </p>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-semibold py-3"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Creando cuenta...
                    </div>
                  ) : (
                    'Crear cuenta gratuita'
                  )}
                </Button>

                {/* Terms */}
                <p className="text-xs text-slate-500 text-center">
                  Al registrarte, aceptas nuestros{' '}
                  <a href="#" className="text-emerald-400 hover:text-emerald-300 underline">
                    términos de servicio
                  </a>{' '}
                  y{' '}
                  <a href="#" className="text-emerald-400 hover:text-emerald-300 underline">
                    política de privacidad
                  </a>
                </p>

                {/* Sign In Link */}
                <div className="text-center">
                  <p className="text-slate-400">
                    ¿Ya tienes cuenta?{' '}
                    <button
                      type="button"
                      onClick={() => router.push('/login')}
                      className="text-emerald-400 hover:text-emerald-300 underline"
                    >
                      Inicia sesión
                    </button>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}






