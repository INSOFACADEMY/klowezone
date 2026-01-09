'use client'

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function DashboardSimplePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);
      setLoading(false);
    };

    getUser();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Dashboard Simple</h1>
        <p className="text-slate-400 mb-4">
          Bienvenido {user?.user_metadata?.full_name || user?.email}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Total Clientes</h3>
            <p className="text-2xl text-emerald-400">0</p>
          </div>
          <div className="bg-slate-900 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Clientes Activos</h3>
            <p className="text-2xl text-blue-400">0</p>
          </div>
          <div className="bg-slate-900 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Nuevos Este Mes</h3>
            <p className="text-2xl text-purple-400">0</p>
          </div>
        </div>
      </div>
    </div>
  );
}

















