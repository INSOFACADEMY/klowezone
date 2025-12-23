'use client'

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  AlertCircle,
  Sparkles,
  Eye,
  EyeOff
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (error) {
        console.error('Error during login:', error);

        // Mensajes de error más claros
        let errorMessage = 'Error al iniciar sesión';
        switch (error.message) {
          case 'Invalid login credentials':
            errorMessage = 'Email o contraseña incorrectos';
            break;
          case 'Email not confirmed':
            errorMessage = 'Por favor confirma tu email antes de iniciar sesión';
            break;
          case 'Too many requests':
            errorMessage = 'Demasiados intentos. Inténtalo más tarde';
            break;
          default:
            errorMessage = error.message;
        }

        setErrors({ general: errorMessage });
        return;
      }

      // Verificar que tenemos sesión válida antes de redirigir
      if (data.user && data.session) {
        try {
          // Confirmar que la sesión está realmente activa
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

          if (sessionError) {
            setErrors({ general: 'Error al verificar la sesión. Inténtalo de nuevo.' });
            return;
          }

          if (sessionData.session?.user) {
            // Limpiar errores antes de redirigir
            setErrors({});
            // Redirigir solo después de confirmar sesión válida
            router.push('/dashboard');
          } else {
            setErrors({ general: 'Sesión no válida. Inténtalo de nuevo.' });
          }
        } catch (sessionErr) {
          console.error('Error verificando sesión:', sessionErr);
          setErrors({ general: 'Error al establecer la sesión. Inténtalo de nuevo.' });
        }
      } else {
        setErrors({ general: 'Error al iniciar sesión. Verifica tus credenciales.' });
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setErrors({ general: 'Ocurrió un error inesperado. Inténtalo de nuevo.' });
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
          <Link href="/">
            <Button
              variant="ghost"
              size="sm"
              className="mb-4 text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al inicio
            </Button>
          </Link>

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
            Accede a tu cuenta
          </Badge>

          <h2 className="text-2xl font-semibold text-white mb-2">
            Iniciar Sesión
          </h2>
          <p className="text-slate-400">
            Bienvenido de vuelta. Ingresa tus credenciales.
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
                Acceder
              </CardTitle>
              <CardDescription className="text-center text-slate-400">
                Ingresa tus datos para continuar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
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
                      placeholder="Tu contraseña"
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
                      Iniciando sesión...
                    </div>
                  ) : (
                    'Iniciar Sesión'
                  )}
                </Button>

                {/* Forgot Password */}
                <div className="text-center">
                  <button
                    type="button"
                    className="text-sm text-slate-400 hover:text-emerald-400 underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                {/* Sign Up Link */}
                <div className="text-center">
                  <p className="text-slate-400">
                    ¿No tienes cuenta?{' '}
                    <Link
                      href="/signup"
                      className="text-emerald-400 hover:text-emerald-300 underline"
                    >
                      Regístrate gratis
                    </Link>
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
